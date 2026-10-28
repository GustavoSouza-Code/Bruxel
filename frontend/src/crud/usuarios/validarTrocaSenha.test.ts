import { describe, expect, it } from "vitest";
import { validarTrocaSenha } from "./validarTrocaSenha";

describe("validarTrocaSenha", () => {
  it("pede os três campos quando estão vazios", () => {
    expect(validarTrocaSenha({ atual: "", nova: "", confirmacao: "" })).toEqual({
      atual: "Informe a senha atual.",
      nova: "Informe a nova senha.",
      confirmacao: "Confirme a nova senha.",
    });
  });

  it("barra a nova senha com menos de 8 caracteres", () => {
    expect(validarTrocaSenha({ atual: "senha-antiga", nova: "1234567", confirmacao: "1234567" })).toEqual({
      nova: "A nova senha precisa ter pelo menos 8 caracteres.",
    });
  });

  it("barra a nova senha igual à atual", () => {
    expect(validarTrocaSenha({ atual: "senha-igual", nova: "senha-igual", confirmacao: "senha-igual" })).toEqual({
      nova: "A nova senha precisa ser diferente da atual.",
    });
  });

  it("barra a confirmação diferente", () => {
    expect(validarTrocaSenha({ atual: "senha-antiga", nova: "senha-nova-1", confirmacao: "senha-nova-2" })).toEqual({
      confirmacao: "As senhas não conferem.",
    });
  });

  it("tudo certo devolve sem erros", () => {
    expect(validarTrocaSenha({ atual: "senha-antiga", nova: "senha-nova-1", confirmacao: "senha-nova-1" })).toEqual({});
  });
});
