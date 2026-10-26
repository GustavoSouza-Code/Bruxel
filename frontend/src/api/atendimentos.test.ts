import { describe, expect, it } from "vitest";
import { paraAtendimento, paraCorpoAtendimento, type AtendimentoApi } from "./atendimentos";
import type { DadosSolicitacao } from "../tipos/atendimento";

// datas montadas no fuso de quem roda o teste, igual à tela
const VISITA = new Date(2026, 9, 28, 13, 30).toISOString();

const bruto: AtendimentoApi = {
  id: "3f2a9c1b-0000-4000-8000-000000000001",
  data_hora: VISITA,
  status: "EM_ANDAMENTO",
  usuario_id: "u1",
  tecnico_id: null,
  tipo: "BOMBA_FILTRO",
  descricao: "A bomba faz barulho e não liga.",
  foto_url: "https://exemplo.com/foto.jpg",
  nome_cliente: null,
  aberto_na_loja: false,
  telefone: "51998765432",
  rua: "Rua das Flores",
  numero: "120",
  bairro: null,
  cidade: "Lajeado",
  estado: "RS",
  cep: null,
  mensagem_cliente: null,
  observacoes_tecnico: "Troquei o capacitor.",
  valor_mao_de_obra: "150.00",
  pago_em: null,
  criado_em: "2026-10-26T13:00:00.000Z",
  atualizado_em: "2026-10-26T13:00:00.000Z",
  cliente: { id: "u1", nome: "Ana Souza" },
  tecnico: null,
  itens: [
    {
      id: "i1",
      appointment_id: "3f2a9c1b-0000-4000-8000-000000000001",
      produto_id: "p1",
      quantidade: 2,
      preco_unitario: "21.50",
      products: { id: "p1", nome: "Hidrofloc 1L" },
    },
  ],
};

describe("paraAtendimento", () => {
  it("converte status e tipo do banco pros valores do front", () => {
    const atendimento = paraAtendimento(bruto);
    expect(atendimento.status).toBe("em-andamento");
    expect(atendimento.tipo).toBe("bomba-filtro");
  });

  it("separa data_hora em dia e horário no fuso local", () => {
    const atendimento = paraAtendimento(bruto);
    expect(atendimento.data).toBe("2026-10-28");
    expect(atendimento.horario).toBe("13:30");
  });

  it("troca null do contato por texto vazio", () => {
    const { contato } = paraAtendimento(bruto);
    expect(contato.bairro).toBe("");
    expect(contato.cep).toBe("");
    expect(contato.rua).toBe("Rua das Flores");
  });

  it("converte a OS: itens viram produtos usados e decimais viram número", () => {
    const atendimento = paraAtendimento(bruto);
    expect(atendimento.produtosUsados).toEqual([
      { produtoId: "p1", nome: "Hidrofloc 1L", precoUnitario: 21.5, quantidade: 2 },
    ]);
    expect(atendimento.valorMaoDeObra).toBe(150);
    expect(atendimento.observacoesTecnico).toBe("Troquei o capacitor.");
    expect(atendimento.fotoUrl).toBe("https://exemplo.com/foto.jpg");
  });

  it("aceita a resposta do cliente, que vem sem os campos internos da gestão", () => {
    const resposta = { ...bruto } as Partial<AtendimentoApi>;
    delete resposta.observacoes_tecnico;
    delete resposta.valor_mao_de_obra;
    delete resposta.pago_em;
    const atendimento = paraAtendimento(resposta as AtendimentoApi);
    expect(atendimento.observacoesTecnico).toBe("");
    expect(atendimento.valorMaoDeObra).toBeNull();
    expect(atendimento.pagoEm).toBeNull();
  });

  it("usa o nome_cliente quando o pedido não tem conta", () => {
    const atendimento = paraAtendimento({ ...bruto, usuario_id: null, cliente: null, nome_cliente: "Seu Jorge" });
    expect(atendimento.cliente).toEqual({ id: null, nome: "Seu Jorge" });
  });

  it("mantém o técnico quando o backend manda", () => {
    const atendimento = paraAtendimento({ ...bruto, tecnico_id: "t1", tecnico: { id: "t1", nome: "Carlos" } });
    expect(atendimento.tecnico).toEqual({ id: "t1", nome: "Carlos" });
  });

  it("pedido antigo sem tipo vira \"outro\"", () => {
    expect(paraAtendimento({ ...bruto, tipo: null }).tipo).toBe("outro");
  });
});

describe("paraCorpoAtendimento", () => {
  const dados: DadosSolicitacao = {
    tipo: "vazamento",
    descricao: "  Está vazando perto da escada.  ",
    fotoUrl: null,
    clienteId: null,
    data: "2026-10-28",
    horario: "13:30",
    contato: {
      telefone: "51998765432",
      rua: "Rua das Flores",
      numero: "120",
      bairro: "",
      cidade: "Lajeado",
      estado: "rs",
      cep: "95900-000",
    },
  };

  it("monta o corpo do POST com o tipo do banco e a data em ISO", () => {
    const corpo = paraCorpoAtendimento(dados);
    expect(corpo.tipo).toBe("VAZAMENTO");
    expect(corpo.data_hora).toBe(VISITA);
    expect(corpo.descricao).toBe("Está vazando perto da escada.");
  });

  it("limpa o contato: vazio vira null, UF maiúscula e CEP só com dígitos", () => {
    const corpo = paraCorpoAtendimento(dados);
    expect(corpo.bairro).toBeNull();
    expect(corpo.estado).toBe("RS");
    expect(corpo.cep).toBe("95900000");
  });

  it("só manda usuario_id e foto_url quando existem", () => {
    const semExtras = paraCorpoAtendimento(dados);
    expect("usuario_id" in semExtras).toBe(false);
    expect("foto_url" in semExtras).toBe(false);

    const comExtras = paraCorpoAtendimento({ ...dados, clienteId: "u9", fotoUrl: " https://x/y.jpg " });
    expect(comExtras.usuario_id).toBe("u9");
    expect(comExtras.foto_url).toBe("https://x/y.jpg");
  });
});
