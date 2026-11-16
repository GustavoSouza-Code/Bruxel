/** Tipos que o backend aceita (o multer confere o mesmo). */
export const TIPOS_IMAGEM_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;

/** Limite do backend; foto de celular passa disso, por isso a gente reduz antes de enviar. */
export const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

const LADO_MAXIMO = 1600;
const TAMANHO_PARA_REDUZIR = 1024 * 1024;
const MSG_TAMANHO = "A imagem deve ter no máximo 5 MB.";

/** Só recusa pelo tipo: o tamanho a gente resolve reduzindo a foto. */
export function validarArquivoImagem(arquivo: { type: string; size: number }): string | null {
  const aceito = (TIPOS_IMAGEM_ACEITOS as readonly string[]).includes(arquivo.type);
  return aceito ? null : "Envie uma imagem JPG, PNG ou WebP.";
}

/** Cabe a imagem em maximo x maximo mantendo a proporção; nunca aumenta. */
export function medidasReduzidas(largura: number, altura: number, maximo = LADO_MAXIMO) {
  const escala = Math.min(1, maximo / Math.max(largura, altura));
  return {
    largura: Math.max(1, Math.round(largura * escala)),
    altura: Math.max(1, Math.round(altura * escala)),
  };
}

/** Reduz se algum lado passa de 1600 px ou se o arquivo passa de 1 MB. */
export function precisaReduzir(arquivo: { size: number }, largura: number, altura: number): boolean {
  return Math.max(largura, altura) > LADO_MAXIMO || arquivo.size > TAMANHO_PARA_REDUZIR;
}

/** Ordem de tentativa no canvas.toBlob: WebP primeiro, depois o formato que mantém a transparência (PNG) ou JPEG. */
export function formatosDeSaida(tipoOriginal: string): string[] {
  return ["image/webp", tipoOriginal === "image/png" ? "image/png" : "image/jpeg"];
}

const EXTENSOES: Record<string, string> = {
  "image/webp": ".webp",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

function toBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, 0.85));
}

/**
 * Prepara a foto para o upload: reduz para no máximo 1600 px e converte para WebP quando dá.
 * Se o navegador não conseguir ler a imagem, envia o original (desde que caiba em 5 MB).
 * Lança Error com a mensagem pronta pra tela.
 */
export async function prepararImagem(arquivo: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(arquivo);
  } catch {
    if (arquivo.size <= TAMANHO_MAXIMO_IMAGEM) return arquivo;
    throw new Error(MSG_TAMANHO);
  }

  try {
    if (!precisaReduzir(arquivo, bitmap.width, bitmap.height)) return arquivo;

    const { largura, altura } = medidasReduzidas(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, largura, altura);

    // o Safari devolve PNG quando pedimos WebP, então confere o tipo que veio de fato
    for (const tipo of formatosDeSaida(arquivo.type)) {
      const blob = await toBlob(canvas, tipo);
      if (!blob || blob.type !== tipo) continue;
      if (blob.size > TAMANHO_MAXIMO_IMAGEM) throw new Error(MSG_TAMANHO);
      const base = arquivo.name.replace(/\.[^.]+$/, "");
      return new File([blob], base + EXTENSOES[tipo], { type: blob.type });
    }
    // nenhum formato funcionou: manda o original se couber
    if (arquivo.size <= TAMANHO_MAXIMO_IMAGEM) return arquivo;
    throw new Error(MSG_TAMANHO);
  } finally {
    bitmap.close();
  }
}
