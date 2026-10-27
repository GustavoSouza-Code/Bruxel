import { describe, expect, it } from "vitest";
import { validarEndereco, validarUfCep } from "./camposUsuario";

describe("validarUfCep", () => {
  it("aceita UF e CEP vazios ou nulos", () => {
    expect(validarUfCep({ estado: "", cep: "" })).toEqual({});
    expect(validarUfCep({ estado: null, cep: null })).toEqual({});
    expect(validarUfCep({})).toEqual({});
  });

  it("aceita UF com 2 letras e CEP com 8 dígitos", () => {
    expect(validarUfCep({ estado: "RS", cep: "95900000" })).toEqual({});
  });

  it("aceita CEP colado com hífen", () => {
    expect(validarUfCep({ cep: "95900-000" })).toEqual({});
  });

  it("recusa CEP incompleto", () => {
    expect(validarUfCep({ cep: "9590" })).toEqual({ cep: "O CEP deve ter 8 dígitos." });
  });

  it("recusa UF com uma letra só", () => {
    expect(validarUfCep({ estado: "R" })).toEqual({ estado: "A UF deve ter 2 letras (ex.: RS)." });
  });
});

describe("validarEndereco", () => {
  it("aceita CEP de 8 dígitos e UF de 2 letras", () => {
    expect(validarEndereco({ cep: "95900000", estado: "RS" })).toBeNull();
  });

  it("aceita campos vazios ou ausentes (viram null no banco)", () => {
    expect(validarEndereco({})).toBeNull();
    expect(validarEndereco({ cep: "", estado: "  " })).toBeNull();
  });

  it("recusa CEP incompleto", () => {
    expect(validarEndereco({ cep: "95900" })).toBe("O CEP deve ter 8 dígitos.");
  });

  it("recusa UF com 1 ou 3 letras", () => {
    expect(validarEndereco({ estado: "R" })).toBe("A UF deve ter 2 letras (ex.: RS).");
    expect(validarEndereco({ estado: "RSX" })).toBe("A UF deve ter 2 letras (ex.: RS).");
  });
});
