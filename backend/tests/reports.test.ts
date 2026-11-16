// testes realizados nos relatórios (service e exportação em CSV e PDF)

import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportsRepository } from "../src/repository/reportsRepository";
import { ReportsService } from "../src/service/reportsService";
import { gerarCsv } from "../src/utils/exportaCsv";
import { gerarPdf } from "../src/utils/exportaPdf";
import { formatarMoeda } from "../src/utils/formataRelatorio";
import type { Relatorio } from "../src/models/report";

const ID = "3f2a9c1b-0000-4000-8000-000000000001";

// função que cria um pedido como o banco devolve
function criaPedido(status: string, valorTotal: string) {
    return {
        id: ID,
        status,
        forma_pagamento: "PIX",
        valor_total: valorTotal,
        criado_em: new Date("2026-11-10T15:30:00Z"),
        users: { nome: "Ana Souza" },
    };
}

// função que cria uma OS como o banco devolve
function criaAtendimento(status: string, maoDeObra: string | null, pagoEm: Date | null) {
    return {
        id: ID,
        status,
        tipo: "LIMPEZA",
        data_hora: new Date("2026-11-05T13:00:00Z"),
        valor_mao_de_obra: maoDeObra,
        pago_em: pagoEm,
        cliente: { nome: "Carlos Lima" },
        nome_cliente: null,
        itens: [{ quantidade: 2, preco_unitario: "21.50" }],
    };
}

describe("ReportsService.pedidos", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("lista os cancelados, mas não soma o valor deles no total", async () => {
        vi.spyOn(ReportsRepository.prototype, "getPedidos").mockResolvedValue([
            criaPedido("PAGO", "100.50"),
            criaPedido("CANCELADO", "999.00"),
        ] as never);

        const relatorio = await new ReportsService().pedidos({});

        expect(relatorio.linhas).toHaveLength(2);
        expect(relatorio.totais).toEqual([{ rotulo: "Total vendido (sem cancelados)", centavos: 10050 }]);
        expect(relatorio.linhas[0]).toEqual(["3F2A9C1B", "10/11/2026 12:30", "Ana Souza", "Pix", "Pago", 10050]);
    });

    it("inclui o dia final inteiro no filtro de período", async () => {
        const espiao = vi.spyOn(ReportsRepository.prototype, "getPedidos").mockResolvedValue([]);

        const relatorio = await new ReportsService().pedidos({ inicio: "2026-11-01", fim: "2026-11-30" });

        const filtros = espiao.mock.calls[0][0];
        expect(filtros.inicio?.toISOString()).toBe("2026-11-01T03:00:00.000Z");
        expect(filtros.fimExclusivo?.toISOString()).toBe("2026-12-01T03:00:00.000Z");
        expect(relatorio.periodo).toBe("01/11/2026 a 30/11/2026");
    });

    it.each([
        [{ inicio: "01/11/2026" }, "formato errado"],
        [{ inicio: "2026-02-31" }, "dia que não existe"],
        [{ inicio: "2026-11-10", fim: "2026-11-01" }, "início depois do fim"],
        [{ status: "QUALQUER" }, "situação desconhecida"],
    ])("recusa filtro inválido: %j (%s)", async (filtros) => {
        const tentativa = new ReportsService().pedidos(filtros);

        await expect(tentativa).rejects.toMatchObject({ statusCode: 400 });
    });

    it("recusa quando o período passa do limite de linhas", async () => {
        vi.spyOn(ReportsRepository.prototype, "getPedidos").mockResolvedValue(
            Array.from({ length: 5001 }, () => criaPedido("PAGO", "10.00")) as never
        );

        const tentativa = new ReportsService().pedidos({});

        await expect(tentativa).rejects.toMatchObject({ statusCode: 400 });
    });
});

describe("ReportsService.atendimentos", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("soma mão de obra e produtos e separa o recebido do a receber", async () => {
        vi.spyOn(ReportsRepository.prototype, "getAtendimentos").mockResolvedValue([
            criaAtendimento("CONCLUIDO", "150.00", new Date("2026-11-06T15:00:00Z")),
            criaAtendimento("CONCLUIDO", "100.00", null),
            criaAtendimento("AGUARDANDO", null, null),
        ] as never);

        const relatorio = await new ReportsService().atendimentos({});

        expect(relatorio.totais).toEqual([
            { rotulo: "Recebido", centavos: 19300 },
            { rotulo: "A receber (OS concluídas sem pagamento)", centavos: 14300 },
        ]);
        expect(relatorio.linhas[1][6]).toBe("A receber");
        expect(relatorio.linhas[2][6]).toBe("-");
    });

    it("fixa a situação em concluído quando o filtro é a-receber", async () => {
        const espiao = vi.spyOn(ReportsRepository.prototype, "getAtendimentos").mockResolvedValue([]);

        await new ReportsService().atendimentos({ pagamento: "a-receber" });

        expect(espiao.mock.calls[0][0]).toMatchObject({ status: "CONCLUIDO", pagamento: "a-receber" });
    });

    it("recusa a-receber combinado com outra situação", async () => {
        const tentativa = new ReportsService().atendimentos({ pagamento: "a-receber", status: "AGENDADO" });

        await expect(tentativa).rejects.toMatchObject({ statusCode: 400 });
    });
});

describe("ReportsService.validarFormato", () => {
    it("usa json quando o formato não vem e recusa o que não existe", () => {
        const service = new ReportsService();

        expect(service.validarFormato(undefined)).toBe("json");
        expect(service.validarFormato("pdf")).toBe("pdf");
        expect(() => service.validarFormato("xml")).toThrowError("Formato inválido. Use json, csv ou pdf.");
    });
});

// relatório pequeno reaproveitado nos testes de exportação
function criaRelatorio(linhas: Relatorio["linhas"]): Relatorio {
    return {
        titulo: "Relatório de teste",
        periodo: "Todo o período",
        geradoEm: "16/11/2026 10:00",
        colunas: [
            { titulo: "Cliente", tipo: "texto", peso: 3 },
            { titulo: "Total", tipo: "moeda", peso: 1 },
        ],
        linhas,
        totais: [{ rotulo: "Total", centavos: 123456 }],
    };
}

describe("gerarCsv", () => {
    it("começa com BOM, separa por ponto e vírgula e escreve a moeda como número", () => {
        const csv = gerarCsv(criaRelatorio([["Ana", 123456]]));

        expect(csv.startsWith("﻿")).toBe(true);
        expect(csv).toContain('"Cliente";"Total"\r\n"Ana";1234,56\r\n');
        expect(csv).toContain('\r\n\r\n"Total";1234,56');
    });

    it("dobra as aspas e impede que o texto vire fórmula na planilha", () => {
        const csv = gerarCsv(criaRelatorio([['Maria "Mari" Dias', 100], ["=HYPERLINK(1)", 100]]));

        expect(csv).toContain('"Maria ""Mari"" Dias";1,00');
        expect(csv).toContain(`"'=HYPERLINK(1)";1,00`);
    });
});

describe("gerarPdf", () => {
    it("gera um PDF válido, com várias páginas quando a tabela é grande", async () => {
        const linhas = Array.from({ length: 80 }, (_, i) => [`Cliente ${i}`, 1000 + i]);

        const pdf = await gerarPdf(criaRelatorio(linhas));

        expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
        expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)!.length).toBeGreaterThan(1);
    });

    it("gera o PDF mesmo sem linhas", async () => {
        const pdf = await gerarPdf(criaRelatorio([]));

        expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    });
});

describe("formatarMoeda", () => {
    it("usa ponto nos milhares e vírgula nos centavos", () => {
        expect(formatarMoeda(123456789)).toBe("R$ 1.234.567,89");
        expect(formatarMoeda(5)).toBe("R$ 0,05");
    });
});
