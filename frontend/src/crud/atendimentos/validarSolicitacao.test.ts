import { describe, expect, it } from "vitest";
import { DESCRICAO_MAX, FOTO_URL_MAX, validarFotoUrl, validarSolicitacao } from "./validarSolicitacao";
import type { RascunhoSolicitacao } from "./validarSolicitacao";

// 12/10/2026, uma segunda-feira (no Date o mês começa em 0)
const HOJE = new Date(2026, 9, 12);

function rascunho(mudancas: Partial<RascunhoSolicitacao> = {}): RascunhoSolicitacao {
  return {
    tipo: "bomba-filtro",
    descricao: "A bomba não desliga e está vazando pelo filtro.",
    fotoUrl: "",
    data: "2026-10-20",
    horario: "13:30",
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

  it("exige o dia", () => {
    expect(validarSolicitacao(rascunho({ data: "" }), HOJE).data).toBe("Escolha o dia.");
  });

  it("só aceita um dia da faixa (amanhã em diante, sem domingo, até 14 dias)", () => {
    const erro = "Escolha um dia da lista.";
    expect(validarSolicitacao(rascunho({ data: "2026-10-12" }), HOJE).data).toBe(erro); // hoje
    expect(validarSolicitacao(rascunho({ data: "2026-10-18" }), HOJE).data).toBe(erro); // domingo
    expect(validarSolicitacao(rascunho({ data: "2026-10-27" }), HOJE).data).toBe(erro); // depois de 14 dias
    expect(validarSolicitacao(rascunho({ data: "2026-10-13" }), HOJE).data).toBeUndefined();
  });

  it("exige o horário", () => {
    expect(validarSolicitacao(rascunho({ horario: null }), HOJE).horario).toBe("Escolha um horário.");
  });

  it("horário que o dia não oferece é recusado", () => {
    // 24/10 é sábado: só tem 08:00 e 10:00
    expect(
      validarSolicitacao(rascunho({ data: "2026-10-24", horario: "15:30" }), HOJE).horario
    ).toBe("Escolha um horário da lista.");
  });

  it("link de foto inválido aparece no campo da foto", () => {
    expect(validarSolicitacao(rascunho({ fotoUrl: "foto.png" }), HOJE).fotoUrl).toBe(
      "Cole um link que comece com http:// ou https://."
    );
  });

  it("inclui os erros do contato", () => {
    const semRua = rascunho({ contato: { ...rascunho().contato, rua: "" } });
    expect(validarSolicitacao(semRua, HOJE)).toEqual({ rua: "Informe a rua." });
  });
});

describe("validarFotoUrl", () => {
  it("a foto é opcional", () => {
    expect(validarFotoUrl("")).toBeNull();
    expect(validarFotoUrl("   ")).toBeNull();
  });

  it("aceita link http ou https", () => {
    expect(validarFotoUrl("https://exemplo.com/foto.jpg")).toBeNull();
    expect(validarFotoUrl("http://exemplo.com/foto.jpg")).toBeNull();
  });

  it("recusa texto que não é link", () => {
    expect(validarFotoUrl("minha foto")).toBe("Cole um link que comece com http:// ou https://.");
    expect(validarFotoUrl("ftp://exemplo.com/a.jpg")).toBe("Cole um link que comece com http:// ou https://.");
  });

  it("recusa link acima do limite do banco", () => {
    expect(validarFotoUrl(`https://x.com/${"a".repeat(FOTO_URL_MAX)}`)).toBe(
      `O link pode ter até ${FOTO_URL_MAX} caracteres.`
    );
  });
});
