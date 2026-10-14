import { describe, expect, it } from "vitest";
import type { DadosSolicitacao } from "../../tipos/atendimento";
import { novoAtendimento } from "./novoAtendimento";

const DADOS: DadosSolicitacao = {
  tipo: "vazamento",
  descricao: "Está vazando água perto da escada.",
  fotos: ["blob:foto-1"],
  tecnicoId: "rafael",
  data: "2026-10-20",
  horario: "13:30",
  cliente: { id: "u1", nome: "Ana Souza" },
  abertoNaLoja: false,
  contato: {
    telefone: "51999990000",
    rua: "Rua Bento Gonçalves",
    numero: "850",
    bairro: "Centro",
    cidade: "Lajeado",
    estado: "RS",
    cep: "95900000",
  },
};

const AGORA = new Date(2026, 9, 12, 14, 35);

describe("novoAtendimento", () => {
  it("numera em sequência, com o ano do envio", () => {
    expect(novoAtendimento(DADOS, 0, AGORA).id).toBe("AT-2026-0001");
    expect(novoAtendimento(DADOS, 2, AGORA).id).toBe("AT-2026-0003");
  });

  it("começa aguardando confirmação, com a data do envio e os dados do formulário", () => {
    expect(novoAtendimento(DADOS, 2, AGORA)).toEqual({
      ...DADOS,
      id: "AT-2026-0003",
      status: "aguardando",
      criadoEm: AGORA.toISOString(),
    });
  });
});
