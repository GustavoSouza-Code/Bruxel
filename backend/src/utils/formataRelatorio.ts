const FUSO = "America/Sao_Paulo";

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

// monta "dd/mm/aaaa hh:mm" no horário de Brasília, sem depender da vírgula que o Intl coloca entre data e hora
export function formatarDataHora(data: Date): string {
    const partes = Object.fromEntries(formatadorDataHora.formatToParts(data).map((parte) => [parte.type, parte.value]));
    return `${partes.day}/${partes.month}/${partes.year} ${partes.hour}:${partes.minute}`;
}

// "dd/mm/aaaa" no horário de Brasília
export function formatarData(data: Date): string {
    return formatadorData.format(data);
}

// "1234,56": número puro com vírgula, para a planilha conseguir somar
export function formatarDecimal(centavos: number): string {
    return (centavos / 100).toFixed(2).replace(".", ",");
}

// "R$ 1.234,56": montado à mão para não variar conforme o ICU do Node
export function formatarMoeda(centavos: number): string {
    const [inteiro, decimais] = formatarDecimal(centavos).split(",");
    return `R$ ${inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimais}`;
}
