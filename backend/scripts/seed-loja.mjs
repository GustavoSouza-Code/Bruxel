import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import bcrypt from "bcrypt";
import pg from "pg";

const EXTENSOES = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const SENHA_MIN = 8;
const CUSTO_BCRYPT = 10;
const PUBLIC_PATH = "/api/uploads/produtos";

export function carregarCatalogo(arquivo) {
    return JSON.parse(fs.readFileSync(arquivo, "utf8"));
}

export function validarCatalogo(itens) {
    const vistos = new Set();
    for (const item of itens) {
        const id = item.codigo ?? "(sem codigo)";
        if (!item.codigo || item.codigo.length > 160) throw new Error(`codigo invalido: ${id}`);
        if (vistos.has(item.codigo)) throw new Error(`codigo repetido: ${id}`);
        vistos.add(item.codigo);
        if (!item.nome || item.nome.length > 150) throw new Error(`nome invalido (1 a 150 caracteres): ${id}`);
        if (!item.categoria) throw new Error(`categoria ausente: ${id}`);
        if (!/^\d+(\.\d{1,2})?$/.test(String(item.preco)) || Number(item.preco) <= 0) {
            throw new Error(`preco invalido: ${id}`);
        }
        if (!Number.isInteger(item.estoque) || item.estoque < 0) throw new Error(`estoque invalido: ${id}`);
    }
}

function acharImagem(dirImagens, codigo) {
    for (const ext of EXTENSOES) {
        const caminho = path.join(dirImagens, `${codigo}${ext}`);
        if (fs.existsSync(caminho)) return { caminho, arquivo: `${codigo}${ext}` };
    }
    return null;
}

export async function importarCatalogo(client, itens, { dirImagens, uploadDir }) {
    validarCatalogo(itens);
    const destino = path.join(uploadDir, "produtos");
    fs.mkdirSync(destino, { recursive: true });

    const { rows: categorias } = await client.query("SELECT id, nome FROM categories");
    const idPorNome = new Map(categorias.map((c) => [c.nome, c.id]));
    for (const item of itens) {
        if (!idPorNome.has(item.categoria)) {
            throw new Error(`categoria inexistente "${item.categoria}" no produto ${item.codigo}`);
        }
    }

    const resultado = { criados: 0, atualizados: 0, semImagem: [] };
    await client.query("BEGIN");
    try {
        for (const item of itens) {
            const imagem = acharImagem(dirImagens, item.codigo);
            let url = null;
            if (imagem) {
                fs.copyFileSync(imagem.caminho, path.join(destino, imagem.arquivo));
                url = `${PUBLIC_PATH}/${imagem.arquivo}`;
            } else {
                resultado.semImagem.push(item.codigo);
            }
            const { rows } = await client.query(
                `INSERT INTO products (categoria_id, codigo, nome, descricao, preco, estoque, url_imagem, ativo)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                 ON CONFLICT (codigo) DO UPDATE SET
                    categoria_id = EXCLUDED.categoria_id,
                    nome = EXCLUDED.nome,
                    descricao = EXCLUDED.descricao,
                    preco = EXCLUDED.preco,
                    estoque = EXCLUDED.estoque,
                    url_imagem = COALESCE(EXCLUDED.url_imagem, products.url_imagem),
                    atualizado_em = now()
                 RETURNING (xmax = 0) AS inserido`,
                [idPorNome.get(item.categoria), item.codigo, item.nome, item.descricao ?? null, item.preco, item.estoque, url],
            );
            if (rows[0].inserido) resultado.criados += 1;
            else resultado.atualizados += 1;
        }
        await client.query("COMMIT");
    } catch (erro) {
        await client.query("ROLLBACK");
        throw erro;
    }
    return resultado;
}

function validarUsuario(u) {
    const id = u.email ?? "(sem email)";
    if (!u.nome || u.nome.length > 150) throw new Error(`nome invalido: ${id}`);
    if (!u.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)) throw new Error(`email invalido: ${id}`);
    if (!/^\d{11}$/.test(u.cpf ?? "")) throw new Error(`cpf invalido (11 digitos): ${id}`);
    if (u.senha !== undefined && String(u.senha).length < SENHA_MIN) {
        throw new Error(`senha curta (minimo ${SENHA_MIN}): ${id}`);
    }
    if (u.perfil !== undefined && !["CLIENTE", "ADMINISTRADOR"].includes(u.perfil)) {
        throw new Error(`perfil invalido: ${id}`);
    }
}

function gerarSenha() {
    return crypto.randomBytes(12).toString("base64url");
}

export async function importarUsuarios(client, usuarios) {
    usuarios.forEach(validarUsuario);
    const resultado = { criados: [], existentes: [] };
    await client.query("BEGIN");
    try {
        for (const u of usuarios) {
            const { rows: ja } = await client.query("SELECT 1 FROM users WHERE email = $1", [u.email]);
            if (ja.length > 0) {
                resultado.existentes.push(u.email);
                continue;
            }
            const senha = u.senha ?? gerarSenha();
            const hash = await bcrypt.hash(senha, CUSTO_BCRYPT);
            await client.query(
                `INSERT INTO users (nome, email, senha, cpf, telefone, rua, numero, bairro, cidade, estado, cep, perfil)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    u.nome, u.email, hash, u.cpf, u.telefone ?? null, u.rua ?? null, u.numero ?? null,
                    u.bairro ?? null, u.cidade ?? null, u.estado ?? null, u.cep ?? null, u.perfil ?? "CLIENTE",
                ],
            );
            resultado.criados.push({ email: u.email, senha, perfil: u.perfil ?? "CLIENTE", gerada: u.senha === undefined });
        }
        await client.query("COMMIT");
    } catch (erro) {
        await client.query("ROLLBACK");
        throw erro;
    }
    return resultado;
}

async function principal() {
    const aqui = path.dirname(fileURLToPath(import.meta.url));
    const pastaSeed = process.env.SEED_DIR ?? path.resolve(aqui, "../seed");
    const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
    const argUsuarios = process.argv.indexOf("--usuarios");
    const arquivoUsuarios = argUsuarios > -1 ? process.argv[argUsuarios + 1] : null;
    const semProdutos = process.argv.includes("--so-usuarios");

    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL nao definida");
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        if (!semProdutos) {
            const itens = carregarCatalogo(path.join(pastaSeed, "catalogo.json"));
            const r = await importarCatalogo(client, itens, {
                dirImagens: path.join(pastaSeed, "imagens"),
                uploadDir,
            });
            console.log(`produtos: ${r.criados} criados, ${r.atualizados} atualizados`);
            if (r.semImagem.length > 0) {
                console.log(`sem imagem (${r.semImagem.length}): ${r.semImagem.join(", ")}`);
            }
        }
        if (arquivoUsuarios) {
            const usuarios = JSON.parse(fs.readFileSync(arquivoUsuarios, "utf8"));
            const r = await importarUsuarios(client, usuarios);
            console.log(`usuarios: ${r.criados.length} criados, ${r.existentes.length} ja existiam`);
            for (const u of r.criados) {
                console.log(`  ${u.email}  perfil=${u.perfil}  senha=${u.senha}${u.gerada ? "  (gerada, anote agora)" : ""}`);
            }
        }
    } finally {
        await client.end();
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    principal().catch((erro) => {
        console.error(`erro: ${erro.message}`);
        process.exit(1);
    });
}
