/**
 * Quando cada OS foi cobrada, guardado só no navegador de quem cobrou (o
 * backend ainda não tem onde guardar isso; ver o recado no spec). id da OS →
 * data e hora em ISO.
 */
export const CHAVE_COBRANCAS = "bruxel:cobrancas";

/** Lê o que está salvo; conteúdo quebrado vira {} e valor que não é texto é descartado. */
export function lerCobrancas(texto: string | null): Record<string, string> {
  if (!texto) return {};
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    return {};
  }
  if (typeof dados !== "object" || dados === null || Array.isArray(dados)) return {};
  return Object.fromEntries(
    Object.entries(dados).filter((par): par is [string, string] => typeof par[1] === "string")
  );
}

/** Um mapa novo com a cobrança da OS registrada em `quando` (a anterior é trocada). */
export function registrarCobranca(mapa: Record<string, string>, id: string, quando: Date): Record<string, string> {
  return { ...mapa, [id]: quando.toISOString() };
}
