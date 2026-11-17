import { describe, expect, it } from "vitest";
import { escalaBarras, fatiasRosca, rotuloMes } from "./graficos";
import { reaisCurtos } from "./textos";

describe("rotuloMes", () => {
  it("abrevia e escreve por extenso", () => {
    expect(rotuloMes("2026-11")).toBe("nov");
    expect(rotuloMes("2026-11", true)).toBe("novembro");
    expect(rotuloMes("2026-01")).toBe("jan");
    expect(rotuloMes("2026-03", true)).toBe("março");
  });
});

describe("escalaBarras", () => {
  it("arredonda o máximo para um valor redondo", () => {
    const e = escalaBarras([{ mes: "2026-10", loja: 5000, servicos: 3420 }]);
    expect(e.maximo).toBe(10000);
    expect(e.marcas).toEqual([0, 2500, 5000, 7500, 10000]);
  });

  it("usa passos redondos: 5000 vira 0, 2000, 4000, 6000", () => {
    const e = escalaBarras([{ mes: "2026-10", loja: 3000, servicos: 2000 }]);
    expect(e.marcas).toEqual([0, 2000, 4000, 6000]);
    expect(e.maximo).toBe(6000);
  });

  it("todas as marcas aparecem exatas no eixo (sem arredondar)", () => {
    for (const maior of [5000, 1000, 3097.5, 8420]) {
      const { marcas } = escalaBarras([{ mes: "2026-10", loja: maior, servicos: 0 }]);
      for (const m of marcas) {
        const texto = reaisCurtos(m);
        const lido = texto.endsWith("mil")
          ? Number(texto.replace("R$ ", "").replace(" mil", "").replace(",", ".")) * 1000
          : Number(texto.replace("R$ ", ""));
        expect(lido).toBe(m);
      }
    }
  });

  it("com tudo zero devolve só o zero", () => {
    expect(escalaBarras([{ mes: "2026-10", loja: 0, servicos: 0 }])).toEqual({
      maximo: 0,
      marcas: [0],
    });
    expect(escalaBarras([])).toEqual({ maximo: 0, marcas: [0] });
  });
});

describe("fatiasRosca", () => {
  it("agrupa o excedente em Outras", () => {
    const linhas = [100, 90, 80, 70, 60, 50, 40].map((value, i) => ({
      label: `c${i}`,
      value,
    }));
    const fatias = fatiasRosca(linhas);
    expect(fatias).toHaveLength(5);
    expect(fatias[4].label).toBe("Outras");
    expect(fatias[4].value).toBe(150);
    expect(fatias[4].cor).toBe("#b8b8c4");
    expect(fatias[0].cor).toBe("var(--color-primary)");
  });

  it("com 5 categorias não agrupa e as cores são distintas", () => {
    const fatias = fatiasRosca(
      [5, 4, 3, 2, 1].map((value, i) => ({ label: `c${i}`, value })),
    );
    expect(fatias).toHaveLength(5);
    expect(fatias.some((f) => f.label === "Outras")).toBe(false);
    expect(new Set(fatias.map((f) => f.cor)).size).toBe(5);
    expect(fatias[4].cor).toBe("#d8d9f5");
  });

  it("ignora valores não positivos e ordena", () => {
    const fatias = fatiasRosca([
      { label: "a", value: 0 },
      { label: "b", value: 10 },
      { label: "c", value: 30 },
    ]);
    expect(fatias.map((f) => f.label)).toEqual(["c", "b"]);
  });

  it("percentuais inteiros somam 100", () => {
    const fatias = fatiasRosca([
      { label: "a", value: 1 },
      { label: "b", value: 1 },
      { label: "c", value: 1 },
    ]);
    expect(fatias.reduce((s, f) => s + f.percentual, 0)).toBe(100);
  });

  it("lista vazia dá nenhuma fatia", () => {
    expect(fatiasRosca([])).toEqual([]);
  });
});
