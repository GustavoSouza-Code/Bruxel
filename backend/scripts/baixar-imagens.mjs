import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const API = "https://api.openverse.org/v1";
const LICENCAS_OK = new Set(["cc0", "pdm", "by", "by-sa"]);
const LARGURA_MIN = 600;
const EXTENSAO_POR_TIPO = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
const EXTENSOES = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export function escolherCandidato(resultados) {
    return (
        resultados.find((r) => LICENCAS_OK.has(r.license) && (r.width ?? 0) >= LARGURA_MIN) ?? null
    );
}

function nomeLicenca(r) {
    const base = r.license === "cc0" ? "CC0" : r.license === "pdm" ? "Dominio publico" : `CC ${r.license.toUpperCase()}`;
    return r.license_version && !["cc0", "pdm"].includes(r.license) ? `${base} ${r.license_version}` : base;
}

function jaTemImagem(destino, codigo) {
    return EXTENSOES.some((ext) => fs.existsSync(path.join(destino, `${codigo}${ext}`)));
}

async function comRetry(fn, { tentativas = 4, esperaRetryMs = 15000 } = {}) {
    for (let i = 1; ; i++) {
        const resposta = await fn();
        if (resposta.status !== 429 && resposta.status < 500) return resposta;
        if (i >= tentativas) return resposta;
        await dormir(esperaRetryMs * i);
    }
}

export async function baixarImagens(itens, { destino, fetchFn = fetch, pausaMs = 1500, esperaRetryMs = 15000, token } = {}) {
    fs.mkdirSync(destino, { recursive: true });
    const cabecalhos = { "User-Agent": "bruxel-seed/1.0 (projeto academico Univates)" };
    if (token) cabecalhos.Authorization = `Bearer ${token}`;
    const resultado = { baixadas: [], puladas: [], falhas: [] };
    const creditos = [];

    for (const item of itens) {
        if (jaTemImagem(destino, item.codigo)) {
            resultado.puladas.push(item.codigo);
            continue;
        }
        try {
            const termo = encodeURIComponent(item.imagem_busca ?? item.nome);
            const busca = await comRetry(
                () => fetchFn(`${API}/images/?q=${termo}&license=cc0,pdm,by,by-sa&mature=false&page_size=20`, { headers: cabecalhos }),
                { esperaRetryMs },
            );
            if (!busca.ok) throw new Error(`busca HTTP ${busca.status}`);
            const candidato = escolherCandidato((await busca.json()).results ?? []);
            if (!candidato) {
                resultado.falhas.push(item.codigo);
                continue;
            }
            await dormir(pausaMs);
            const img = await comRetry(() => fetchFn(`${API}/images/${candidato.id}/thumb/`, { headers: cabecalhos }), { esperaRetryMs });
            if (!img.ok) throw new Error(`thumb HTTP ${img.status}`);
            const tipo = (img.headers.get("content-type") ?? "").split(";")[0].trim();
            const ext = EXTENSAO_POR_TIPO[tipo];
            if (!ext) throw new Error(`tipo de imagem inesperado: ${tipo}`);
            fs.writeFileSync(path.join(destino, `${item.codigo}${ext}`), Buffer.from(await img.arrayBuffer()));
            creditos.push(
                `- ${item.codigo}${ext}: "${candidato.title ?? "sem titulo"}" por ${candidato.creator ?? "autor desconhecido"}, ${nomeLicenca(candidato)}${candidato.foreign_landing_url ? `, ${candidato.foreign_landing_url}` : ""}`,
            );
            resultado.baixadas.push(item.codigo);
        } catch (erro) {
            console.error(`falhou ${item.codigo}: ${erro.message}`);
            resultado.falhas.push(item.codigo);
        }
        await dormir(pausaMs);
    }

    if (creditos.length > 0) {
        const arquivo = path.join(destino, "CREDITOS.md");
        const cabecalho = fs.existsSync(arquivo) ? "" : "# Creditos das imagens (Openverse)\n\n";
        fs.appendFileSync(arquivo, `${cabecalho}${creditos.join("\n")}\n`);
    }
    return resultado;
}

async function principal() {
    const aqui = path.dirname(fileURLToPath(import.meta.url));
    const pastaSeed = process.env.SEED_DIR ?? path.resolve(aqui, "../seed");
    const itens = JSON.parse(fs.readFileSync(path.join(pastaSeed, "catalogo.json"), "utf8"));
    const r = await baixarImagens(itens, {
        destino: path.join(pastaSeed, "imagens"),
        token: process.env.OPENVERSE_TOKEN,
    });
    console.log(`baixadas: ${r.baixadas.length}, ja existiam: ${r.puladas.length}, falhas: ${r.falhas.length}`);
    if (r.falhas.length > 0) console.log(`sem imagem automatica (coloque o arquivo manualmente): ${r.falhas.join(", ")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    principal().catch((erro) => {
        console.error(`erro: ${erro.message}`);
        process.exit(1);
    });
}
