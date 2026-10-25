import { describe, expect, it } from "vitest";
import { validarEndereco } from "./camposUsuario";

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
