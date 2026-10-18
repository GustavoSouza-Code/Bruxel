import { describe, expect, it } from "vitest";
import type { Categoria } from "../../tipos/produto";
import { nomeDaCategoria } from "./categorias";

const CATEGORIAS: Categoria[] = [
  { id: "c1", nome: "Tratamento da água" },
  { id: "c2", nome: "Limpeza da Piscina" },
];

describe("nomeDaCategoria", () => {
  it("acha pelo id", () => {
    expect(nomeDaCategoria(CATEGORIAS, "c2")).toBe("Limpeza da Piscina");
  });

  it('devolve "" quando não acha', () => {
    expect(nomeDaCategoria(CATEGORIAS, "nada")).toBe("");
  });
});
