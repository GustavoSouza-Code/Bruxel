// testes realizados no dashboard da gestão

import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardRepository } from "../src/repository/dashboardRepository";
import { DashboardService } from "../src/service/dashboardService";

describe("DashboardService.kpis", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    // função que simula as consultas do repository com os valores da receita
    function simulaRepositorio(atual: number, anterior: number) {
        vi.spyOn(DashboardRepository.prototype, "receitaDoMes").mockResolvedValue({ atual, anterior });
        vi.spyOn(DashboardRepository.prototype, "aReceberPorFaixa").mockResolvedValue([
            { faixa: "em_dia", quantidade: 2, total: 300 },
            { faixa: "mes", quantidade: 1, total: 150.5 },
        ]);
        vi.spyOn(DashboardRepository.prototype, "contagensOperacionais").mockResolvedValue({
            os_aguardando: 3,
            estoque_baixo: 4,
        });
    }

    // variação em relação ao mês anterior e soma do que ainda não foi pago
    it("calcula a variação sobre o mês anterior e soma o que está a receber", async () => {
        simulaRepositorio(1500, 1000);

        const resultado = await new DashboardService().kpis();

        expect(resultado.variacaoPercentual).toBe(50);
        expect(resultado.aReceber).toEqual({ total: 450.5, quantidade: 3, atrasadas: 1 });
        expect(resultado.osAguardando).toBe(3);
        expect(resultado.produtosEstoqueBaixo).toBe(4);
    });

    // sem receita no mês anterior não há base para o cálculo, então a variação é nula
    it("devolve variação nula quando o mês anterior não teve receita", async () => {
        simulaRepositorio(800, 0);

        const resultado = await new DashboardService().kpis();

        expect(resultado.variacaoPercentual).toBeNull();
    });
});

describe("DashboardService.receitaMensal", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("usa 6 meses quando o parâmetro não vem", async () => {
        const espiao = vi.spyOn(DashboardRepository.prototype, "receitaMensal").mockResolvedValue([]);

        await new DashboardService().receitaMensal(undefined);

        expect(espiao).toHaveBeenCalledWith(6);
    });

    // só inteiros de 1 a 12 são aceitos no parâmetro meses
    it.each(["0", "13", "abc", "2.5", ""])("recusa meses inválido: %s", async (meses) => {
        const tentativa = new DashboardService().receitaMensal(meses);

        await expect(tentativa).rejects.toMatchObject({ statusCode: 400 });
    });
});

describe("DashboardService.aReceber", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    // o front desenha as três faixas sempre, então o service completa as que o banco não devolveu
    it("sempre devolve as três faixas, mesmo sem OS em aberto", async () => {
        vi.spyOn(DashboardRepository.prototype, "aReceberPorFaixa").mockResolvedValue([]);
        vi.spyOn(DashboardRepository.prototype, "aReceberMaisAntigas").mockResolvedValue([]);

        const resultado = await new DashboardService().aReceber();

        expect(resultado.faixas.map((faixa) => faixa.faixa)).toEqual(["em_dia", "semana", "mes"]);
        expect(resultado.faixas.every((faixa) => faixa.quantidade === 0 && faixa.total === 0)).toBe(true);
    });
});
