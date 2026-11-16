import { CelulaRelatorio, Relatorio } from "../models/report";
import { formatarDecimal } from "./formataRelatorio";

// o Excel em português separa as colunas por ponto e vírgula
const SEPARADOR = ";";

// o BOM faz o Excel abrir o arquivo em UTF-8 e manter os acentos
const BOM = "﻿";

// texto que começa assim vira fórmula na planilha; o apóstrofo impede a execução
const INICIO_DE_FORMULA = /^[=+\-@\t\r]/;

// protege o texto digitado por clientes e dobra as aspas, como manda o formato CSV
function escapar(texto: string): string {
    const seguro = INICIO_DE_FORMULA.test(texto) ? `'${texto}` : texto;
    return `"${seguro.replace(/"/g, '""')}"`;
}

// moeda sai como número puro; o resto sai como texto entre aspas
function formatarCelula(celula: CelulaRelatorio, moeda: boolean): string {
    return moeda ? formatarDecimal(Number(celula)) : escapar(String(celula));
}

// transforma o relatório em CSV: cabeçalho, linhas e, depois de uma linha em branco, os totais
export function gerarCsv(relatorio: Relatorio): string {
    const cabecalho = relatorio.colunas.map((coluna) => escapar(coluna.titulo)).join(SEPARADOR);

    const linhas = relatorio.linhas.map((linha) =>
        linha.map((celula, indice) => formatarCelula(celula, relatorio.colunas[indice].tipo === "moeda")).join(SEPARADOR)
    );

    const totais = relatorio.totais.map((total) => `${escapar(total.rotulo)}${SEPARADOR}${formatarDecimal(total.centavos)}`);

    const blocos = [cabecalho, ...linhas, ...(totais.length > 0 ? ["", ...totais] : [])];
    return BOM + blocos.join("\r\n") + "\r\n";
}
