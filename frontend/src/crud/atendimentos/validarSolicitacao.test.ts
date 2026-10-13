import { describe, expect, it } from "vitest";
import {
  DESCRICAO_MAX,
  MAX_FOTOS,
  MAX_TAMANHO_FOTO,
  validarFotos,
  validarSolicitacao,
} from "./validarSolicitacao";
import type { RascunhoSolicitacao } from "./validarSolicitacao";

// 12/10/2026 (no Date o mês começa em 0)
const HOJE = new Date(2026, 9, 12);

function rascunho(mudancas: Partial<RascunhoSolicitacao> = {}): RascunhoSolicitacao {
  return {
    tipo: "bomba-filtro",
    descricao: "A bomba não desliga e está vazando pelo filtro.",
    dataPreferida: "2026-10-20",
    periodo: "manha",
    contato: {
      telefone: "51999990000",
      rua: "Rua Bento Gonçalves",
      numero: "850",
      bairro: "Centro",
      cidade: "Lajeado",
      estado: "RS",
      cep: "95900000",
    },
    ...mudancas,
  };
}

describe("validarSolicitacao", () => {
  it("rascunho completo pode ser enviado", () => {
    expect(validarSolicitacao(rascunho(), HOJE)).toEqual({});
  });

  it("exige o tipo de serviço", () => {
    expect(validarSolicitacao(rascunho({ tipo: null }), HOJE).tipo).toBe("Escolha o tipo de serviço.");
  });

  it("descrição precisa de 10 caracteres, sem contar os espaços das pontas", () => {
    expect(validarSolicitacao(rascunho({ descricao: "    vaza     " }), HOJE).descricao).toBe(
      "Descreva o problema com pelo menos 10 caracteres."
    );
    expect(validarSolicitacao(rascunho({ descricao: "1234567890" }), HOJE).descricao).toBeUndefined();
  });

  it("descrição acima do limite é recusada", () => {
    expect(
      validarSolicitacao(rascunho({ descricao: "a".repeat(DESCRICAO_MAX + 1) }), HOJE).descricao
    ).toBe("A descrição pode ter até 1000 caracteres.");
  });

  it("exige a data", () => {
    expect(validarSolicitacao(rascunho({ dataPreferida: "" }), HOJE).dataPreferida).toBe(
      "Escolha uma data."
    );
  });

  it("só aceita data a partir de amanhã", () => {
    const erro = "Escolha uma data a partir de amanhã.";
    expect(validarSolicitacao(rascunho({ dataPreferida: "2026-10-12" }), HOJE).dataPreferida).toBe(erro);
    expect(validarSolicitacao(rascunho({ dataPreferida: "2026-09-30" }), HOJE).dataPreferida).toBe(erro);
    expect(
      validarSolicitacao(rascunho({ dataPreferida: "2026-10-13" }), HOJE).dataPreferida
    ).toBeUndefined();
  });

  it("exige o período", () => {
    expect(validarSolicitacao(rascunho({ periodo: null }), HOJE).periodo).toBe("Escolha manhã ou tarde.");
  });

  it("inclui os erros do contato", () => {
    const semRua = rascunho({ contato: { ...rascunho().contato, rua: "" } });
    expect(validarSolicitacao(semRua, HOJE)).toEqual({ rua: "Informe a rua." });
  });
});

describe("validarFotos", () => {
  const imagem = (nome = "foto.png") => new File(["x"], nome, { type: "image/png" });

  it("aceita imagens dentro do limite", () => {
    const fotos = [imagem("a.png"), imagem("b.png")];
    expect(validarFotos(0, fotos)).toEqual({ aceitas: fotos, erro: null });
  });

  it("recusa o que não é imagem", () => {
    const pdf = new File(["x"], "orcamento.pdf", { type: "application/pdf" });
    expect(validarFotos(0, [pdf])).toEqual({ aceitas: [], erro: "Só dá pra enviar imagens." });
  });

  it("recusa foto acima de 5 MB", () => {
    const grande = new File([new Uint8Array(MAX_TAMANHO_FOTO + 1)], "grande.png", { type: "image/png" });
    expect(validarFotos(0, [grande])).toEqual({ aceitas: [], erro: "Cada foto pode ter até 5 MB." });
  });

  it("não passa do máximo de fotos, contando as que já estão no formulário", () => {
    const primeira = imagem("a.png");
    const segunda = imagem("b.png");
    expect(validarFotos(MAX_FOTOS - 1, [primeira, segunda])).toEqual({
      aceitas: [primeira],
      erro: "Você pode enviar até 5 fotos.",
    });
  });

  it("junta os motivos quando há mais de um problema", () => {
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    expect(validarFotos(MAX_FOTOS, [pdf, imagem()]).erro).toBe(
      "Só dá pra enviar imagens. Você pode enviar até 5 fotos."
    );
  });
});
