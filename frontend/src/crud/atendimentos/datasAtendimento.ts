/**
 * Data no formato "aaaa-mm-dd", no fuso do navegador (o toISOString usaria UTC e,
 * à noite no Brasil, já daria o dia seguinte).
 */
export function paraDataIso(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** "2026-10-20" → "20/10/2026". */
export function formatarData(dataIso: string) {
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** "2026-10-13T17:35:00.000Z" → "13/10/2026 às 14:35", no relógio de quem está usando. */
export function formatarDataHora(iso: string) {
  const data = new Date(iso);
  const hora = `${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`;
  return `${formatarData(paraDataIso(data))} às ${hora}`;
}
