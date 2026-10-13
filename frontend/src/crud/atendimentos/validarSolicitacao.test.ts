import { describe, expect, it } from "vitest";
import {
  DESCRICAO_MAX,
  MAX_FOTOS,
  MAX_TAMANHO_FOTO,
  validarFotos,
  validarSolicitacao,
} from "./validarSolicitacao";
import type { RascunhoSolicitacao } from "./validarSolicitacao";
import type { Ocupacao } from "../../tipos/tecnico";
import { SEM_PREFERENCIA } from "./agenda";

// 12/10/2026, uma segunda-feira (no Date o mês começa em 0)
const HOJE = new Date(2026, 9, 12);

function rascunho(mudancas: Partial<RascunhoSolicitacao> = {}): RascunhoSolicitacao {
  return {
    tipo: "bomba-filtro",
    descricao: "A bomba não desliga e está vazando pelo filtro.",
    tecnico: SEM_PREFERENCIA,
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
    expect(validarSolicitacao(rascunho(), HOJE, [])).toEqual({});
  });

  it("exige o tipo de serviço", () => {
    expect(validarSolicitacao(rascunho({ tipo: null }), HOJE, []).tipo).toBe("Escolha o tipo de serviço.");
  });

  it("descrição precisa de 10 caracteres, sem contar os espaços das pontas", () => {
    expect(validarSolicitacao(rascunho({ descricao: "    vaza     " }), HOJE, []).descricao).toBe(
      "Descreva o problema com pelo menos 10 caracteres."
    );
    expect(validarSolicitacao(rascunho({ descricao: "1234567890" }), HOJE, []).descricao).toBeUndefined();
  });

  it("descrição acima do limite é recusada", () => {
    expect(
      validarSolicitacao(rascunho({ descricao: "a".repeat(DESCRICAO_MAX + 1) }), HOJE, []).descricao
    ).toBe("A descrição pode ter até 1000 caracteres.");
  });

  it("exige o dia", () => {
    expect(validarSolicitacao(rascunho({ data: "" }), HOJE, []).data).toBe("Escolha o dia.");
  });

  it("só aceita um dia da faixa (amanhã em diante, sem domingo, até 14 dias)", () => {
    const erro = "Escolha um dia da lista.";
    expect(validarSolicitacao(rascunho({ data: "2026-10-12" }), HOJE, []).data).toBe(erro); // hoje
    expect(validarSolicitacao(rascunho({ data: "2026-10-18" }), HOJE, []).data).toBe(erro); // domingo
    expect(validarSolicitacao(rascunho({ data: "2026-10-27" }), HOJE, []).data).toBe(erro); // depois de 14 dias
    expect(validarSolicitacao(rascunho({ data: "2026-10-13" }), HOJE, []).data).toBeUndefined();
  });

  it("exige o horário", () => {
    expect(validarSolicitacao(rascunho({ horario: null }), HOJE, []).horario).toBe("Escolha um horário.");
  });

  it("horário que o dia não oferece é recusado", () => {
    // 24/10 é sábado: só tem 08:00 e 10:00
    expect(
      validarSolicitacao(rascunho({ data: "2026-10-24", horario: "15:30" }), HOJE, []).horario
    ).toBe("Escolha um horário da lista.");
  });

  it("atendente que não existe é recusado", () => {
    expect(validarSolicitacao(rascunho({ tecnico: "fulano" }), HOJE, []).tecnico).toBe("Escolha o atendente.");
  });

  it("horário que o atendente escolhido não tem livre é recusado", () => {
    const erro = "Esse horário acabou de ser ocupado. Escolha outro.";
    // o Carlos tem compromisso fixo toda terça às 10:00 (20/10 é terça)
    expect(
      validarSolicitacao(rascunho({ tecnico: "carlos", horario: "10:00" }), HOJE, []).horario
    ).toBe(erro);
    // o Rafael já tem um pedido nesse horário
    const ocupacoes: Ocupacao[] = [{ tecnicoId: "rafael", data: "2026-10-20", horario: "13:30" }];
    expect(validarSolicitacao(rascunho({ tecnico: "rafael" }), HOJE, ocupacoes).horario).toBe(erro);
  });

  it("sem preferência só recusa quando todos os atendentes estão ocupados", () => {
    const doisOcupados: Ocupacao[] = [
      { tecnicoId: "carlos", data: "2026-10-20", horario: "13:30" },
      { tecnicoId: "marcos", data: "2026-10-20", horario: "13:30" },
    ];
    expect(validarSolicitacao(rascunho(), HOJE, doisOcupados).horario).toBeUndefined();
    const todosOcupados: Ocupacao[] = [
      ...doisOcupados,
      { tecnicoId: "rafael", data: "2026-10-20", horario: "13:30" },
    ];
    expect(validarSolicitacao(rascunho(), HOJE, todosOcupados).horario).toBe(
      "Esse horário acabou de ser ocupado. Escolha outro."
    );
  });

  it("inclui os erros do contato", () => {
    const semRua = rascunho({ contato: { ...rascunho().contato, rua: "" } });
    expect(validarSolicitacao(semRua, HOJE, [])).toEqual({ rua: "Informe a rua." });
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
