import { describe, expect, it } from "vitest";
import type { Aviso } from "../../../contexto/useAvisos";
import { MAX_AVISOS, duracaoDoAviso, empilharAviso } from "./filaAvisos";

function aviso(id: number): Aviso {
  return { id, tipo: "sucesso", mensagem: `Aviso ${id}` };
}

describe("empilharAviso", () => {
  it("põe o novo no fim", () => {
    expect(empilharAviso([aviso(1)], aviso(2))).toEqual([aviso(1), aviso(2)]);
  });

  it("guarda só os 3 mais novos", () => {
    expect(MAX_AVISOS).toBe(3);
    expect(empilharAviso([aviso(1), aviso(2), aviso(3)], aviso(4))).toEqual([aviso(2), aviso(3), aviso(4)]);
  });
});

describe("duracaoDoAviso", () => {
  it("dá 4s pra sucesso e info e 6s pra erro", () => {
    expect(duracaoDoAviso("sucesso")).toBe(4000);
    expect(duracaoDoAviso("info")).toBe(4000);
    expect(duracaoDoAviso("erro")).toBe(6000);
  });
});
