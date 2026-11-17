import { describe, expect, it } from "vitest";
import { formatarCentavos, reaisCurtos, textoVariacao } from "./textos";

describe("textoVariacao", () => {
  it("alta, queda e neutro", () => {
    expect(textoVariacao(12.4, "outubro")).toEqual({ texto: "▲ 12% vs outubro", tom: "alta" });
    expect(textoVariacao(-3, "outubro")).toEqual({ texto: "▼ 3% vs outubro", tom: "queda" });
    expect(textoVariacao(0, "outubro")).toEqual({ texto: "0% vs outubro", tom: "neutro" });
    expect(textoVariacao(0.3, "outubro")).toEqual({ texto: "0% vs outubro", tom: "neutro" });
  });

  it("null explica a falta de receita", () => {
    expect(textoVariacao(null, "outubro")).toEqual({
      texto: "sem receita em outubro",
      tom: "neutro",
    });
  });
});

describe("reaisCurtos", () => {
  it("abrevia milhares", () => {
    expect(reaisCurtos(5900)).toBe("R$ 5,9 mil");
    expect(reaisCurtos(6000)).toBe("R$ 6 mil");
    expect(reaisCurtos(950)).toBe("R$ 950");
    expect(reaisCurtos(0)).toBe("R$ 0");
  });
});

describe("formatarCentavos", () => {
  it("converte centavos em reais", () => {
    expect(formatarCentavos(12345)).toBe("R$ 123,45");
  });
});
