import fs from "node:fs";
import path from "node:path";

// Em produção, UPLOAD_DIR pode apontar para um volume fora do código.
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
export const PRODUCT_IMAGES_DIR = path.join(UPLOAD_DIR, "produtos");
export const APPOINTMENT_IMAGES_DIR = path.join(UPLOAD_DIR, "atendimentos");

// caminho público servido pela API; passa pelo proxy /api já configurado no deploy
export const UPLOAD_PUBLIC_PATH = "/api/uploads";

// as imagens novas precisam existir antes de o multer gravar
fs.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });
fs.mkdirSync(APPOINTMENT_IMAGES_DIR, { recursive: true });

function urlDaImagemEm(pasta: string, nomeArquivo: string, origem: string): string {
    const base = (process.env.PUBLIC_BASE_URL || origem).replace(/\/+$/, "");
    return `${base}${UPLOAD_PUBLIC_PATH}/${pasta}/${nomeArquivo}`;
}

export function urlDaImagem(nomeArquivo: string, origem: string): string {
    return urlDaImagemEm("produtos", nomeArquivo, origem);
}

export function urlDaImagemAtendimento(nomeArquivo: string, origem: string): string {
    return urlDaImagemEm("atendimentos", nomeArquivo, origem);
}

const NOME_ARQUIVO_ATENDIMENTO =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpe?g|png|webp|gif)$/i;
const PASTA_PUBLICA_ATENDIMENTOS = `${UPLOAD_PUBLIC_PATH}/atendimentos/`;

// extrai só o nome quando a URL realmente aponta para a pasta de atendimentos
function nomeArquivoDeImagemAtendimento(valor: string): string | null {
    try {
        const caminho = new URL(valor, "http://local").pathname;
        const inicio = caminho.indexOf(PASTA_PUBLICA_ATENDIMENTOS);
        if (inicio === -1) return null;

        const nome = caminho.slice(inicio + PASTA_PUBLICA_ATENDIMENTOS.length);
        return NOME_ARQUIVO_ATENDIMENTO.test(nome) ? nome : null;
    } catch {
        return null;
    }
}

// a OS só aceita imagens que vieram do próprio upload de atendimentos
export function ehUrlDeImagemAtendimento(valor: string): boolean {
    return nomeArquivoDeImagemAtendimento(valor) !== null;
}

export async function removerImagemAtendimento(valor: string | null): Promise<void> {
    if (!valor) return;

    const nome = nomeArquivoDeImagemAtendimento(valor);
    if (!nome) return;

    await fs.promises.rm(path.join(APPOINTMENT_IMAGES_DIR, nome), { force: true }).catch((erro) => {
        console.error(`Erro ao remover imagem do atendimento: ${nome}`, erro);
    });
}
