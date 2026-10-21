import { describe, expect, it } from "vitest";
import { validarUfCep } from "./camposUsuario";

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
    expect(validarUfCep({ cep: "9590" })).toEqual({ cep: "O CEP tem 8 dígitos." });
  });

  it("recusa UF com uma letra só", () => {
    expect(validarUfCep({ estado: "R" })).toEqual({
      estado: "Use a sigla do estado, com 2 letras (ex.: RS).",
    });
  });
});
