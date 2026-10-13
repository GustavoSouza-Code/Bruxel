/**
 * Deixa o texto pronto pra comparar na busca: minúsculo e sem acento
 * ("Válvula" vira "valvula"). O NFD separa a letra do acento, e o replace
 * apaga os acentos que sobraram soltos.
 */
export function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** true se o termo aparece no alvo, sem ligar pra acento e maiúsculas; termo vazio combina com tudo. */
export function contemTexto(alvo: string | null | undefined, termo: string) {
  const termoNormalizado = normalizarTexto(termo.trim());
  if (!termoNormalizado) return true;
  return normalizarTexto(alvo ?? "").includes(termoNormalizado);
}
