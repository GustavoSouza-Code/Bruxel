import { describe, expect, it } from "vitest";
import { validarNomeCategoria } from "./nomeCategoria";

describe("validarNomeCategoria", () => {
  it("recusa nome vazio ou só com espaços", () => {
    expect(validarNomeCategoria("")).not.toBeNull();
    expect(validarNomeCategoria("   ")).not.toBeNull();
  });

  it("recusa nome com mais de 80 caracteres", () => {
    expect(validarNomeCategoria("a".repeat(81))).not.toBeNull();
  });

  it("aceita nome válido", () => {
    expect(validarNomeCategoria("Filtros")).toBeNull();
    expect(validarNomeCategoria("a".repeat(80))).toBeNull();
  });
});
