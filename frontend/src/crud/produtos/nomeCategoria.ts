export const TAMANHO_MAXIMO_NOME_CATEGORIA = 80;

/** Valida o nome digitado: devolve a mensagem de erro ou null se estiver ok. */
export function validarNomeCategoria(nome: string): string | null {
  const limpo = nome.trim();
  if (!limpo) return "Informe o nome da categoria.";
  if (limpo.length > TAMANHO_MAXIMO_NOME_CATEGORIA) {
    return `O nome pode ter no máximo ${TAMANHO_MAXIMO_NOME_CATEGORIA} caracteres.`;
  }
  return null;
}
