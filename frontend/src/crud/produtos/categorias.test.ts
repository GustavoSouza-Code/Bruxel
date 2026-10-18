import { describe, expect, it } from "vitest";
import type { Categoria } from "../../tipos/produto";
import { nomeDaCategoria, opcoesDeCategoria } from "./categorias";

const LISTA: Categoria[] = [
  { id: "c1", nome: "Tratamento da água" },
  { id: "c2", nome: "Limpeza da Piscina" },
];

describe("nomeDaCategoria", () => {
  it("acha pelo id", () => {
    expect(nomeDaCategoria(LISTA, "c2")).toBe("Limpeza da Piscina");
  });

  it('devolve "" quando não acha', () => {
    expect(nomeDaCategoria(LISTA, "nada")).toBe("");
  });
});

describe("opcoesDeCategoria", () => {
  it("mantém a lista quando o id atual já está nela", () => {
    expect(opcoesDeCategoria(LISTA, "c1")).toBe(LISTA);
  });

  it('cria uma opção "Categoria atual" quando o id não está na lista (ex.: lista vazia)', () => {
    expect(opcoesDeCategoria([], "c9")).toEqual([{ id: "c9", nome: "Categoria atual" }]);
  });

  it("mantém a lista quando não há id atual", () => {
    expect(opcoesDeCategoria(LISTA, "")).toBe(LISTA);
    expect(opcoesDeCategoria(LISTA)).toBe(LISTA);
  });
});
