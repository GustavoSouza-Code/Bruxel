import PDFDocument from "pdfkit";
import { Relatorio } from "../models/report";
import { formatarMoeda } from "./formataRelatorio";

const MARGEM = 40;
const ALTURA_LINHA = 20;
const COR_TEXTO = "#1f2933";
const COR_CABECALHO = "#e5eef5";
const COR_ZEBRA = "#f6f9fb";

// desenha o relatório em A4 paisagem e devolve o arquivo pronto; as páginas novas repetem o cabeçalho da tabela
export function gerarPdf(relatorio: Relatorio): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: MARGEM });
        const partes: Buffer[] = [];

        doc.on("data", (parte: Buffer) => partes.push(parte));
        doc.on("end", () => resolve(Buffer.concat(partes)));
        doc.on("error", reject);

        const larguraUtil = doc.page.width - MARGEM * 2;
        const somaPesos = relatorio.colunas.reduce((soma, coluna) => soma + coluna.peso, 0);
        const larguras = relatorio.colunas.map((coluna) => (coluna.peso / somaPesos) * larguraUtil);
        const limiteInferior = () => doc.page.height - MARGEM - ALTURA_LINHA;

        // escreve uma linha da tabela, com texto cortado quando passa da largura da coluna
        const desenharLinha = (y: number, textos: string[], opcoes: { negrito: boolean; fundo?: string }) => {
            if (opcoes.fundo) {
                doc.rect(MARGEM, y, larguraUtil, ALTURA_LINHA).fill(opcoes.fundo);
            }

            doc.fillColor(COR_TEXTO).font(opcoes.negrito ? "Helvetica-Bold" : "Helvetica").fontSize(9);

            let x = MARGEM;
            textos.forEach((texto, indice) => {
                const alinhamento = relatorio.colunas[indice].tipo === "moeda" ? "right" : "left";
                doc.text(texto, x + 4, y + 6, { width: larguras[indice] - 8, height: 10, ellipsis: true, align: alinhamento });
                x += larguras[indice];
            });
        };

        const desenharCabecalho = (y: number) =>
            desenharLinha(y, relatorio.colunas.map((coluna) => coluna.titulo), { negrito: true, fundo: COR_CABECALHO });

        doc.fillColor(COR_TEXTO).font("Helvetica-Bold").fontSize(16).text("Bruxel Piscinas", MARGEM, MARGEM);
        doc.font("Helvetica-Bold").fontSize(12).text(relatorio.titulo);
        doc.font("Helvetica").fontSize(9).text(`Período: ${relatorio.periodo}`);
        doc.text(`Gerado em ${relatorio.geradoEm}`);

        let y = doc.y + 14;
        desenharCabecalho(y);
        y += ALTURA_LINHA;

        relatorio.linhas.forEach((linha, indice) => {
            if (y > limiteInferior()) {
                doc.addPage();
                y = MARGEM;
                desenharCabecalho(y);
                y += ALTURA_LINHA;
            }

            const textos = linha.map((celula, coluna) =>
                relatorio.colunas[coluna].tipo === "moeda" ? formatarMoeda(Number(celula)) : String(celula)
            );
            desenharLinha(y, textos, { negrito: false, fundo: indice % 2 === 1 ? COR_ZEBRA : undefined });
            y += ALTURA_LINHA;
        });

        if (relatorio.linhas.length === 0) {
            doc.fillColor(COR_TEXTO).font("Helvetica").fontSize(10).text("Nenhum registro encontrado para os filtros informados.", MARGEM, y + 8);
            y += ALTURA_LINHA * 2;
        }

        y += 12;
        relatorio.totais.forEach((total) => {
            if (y > limiteInferior()) {
                doc.addPage();
                y = MARGEM;
            }
            doc.fillColor(COR_TEXTO).font("Helvetica-Bold").fontSize(10);
            doc.text(`${total.rotulo}: ${formatarMoeda(total.centavos)}`, MARGEM, y, { width: larguraUtil, lineBreak: false });
            y += ALTURA_LINHA;
        });

        doc.end();
    });
}
