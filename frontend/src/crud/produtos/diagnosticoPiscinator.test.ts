import { describe, expect, it } from "vitest";
import { diagnosticoPorPontuacao } from "./diagnosticoPiscinator";

describe("diagnosticoPorPontuacao", () => {
  it.each([
    [0, "bom"],
    [1, "leve"],
    [2, "leve"],
    [3, "moderado"],
    [4, "moderado"],
    [5, "grave"],
    [8, "grave"],
  ])("%i respostas Sim = nível %s", (pontuacao, nivel) => {
    expect(diagnosticoPorPontuacao(pontuacao).nivel).toBe(nivel);
  });

  it("todo nível tem título e descrição", () => {
    for (const pontuacao of [0, 1, 3, 5]) {
      const d = diagnosticoPorPontuacao(pontuacao);
      expect(d.titulo).not.toBe("");
      expect(d.descricao).not.toBe("");
    }
  });
});
