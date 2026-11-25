import { afterEach, describe, expect, it, vi } from "vitest";
import {
  enviarImagemAtendimento,
  listarHorariosOcupados,
  paraAtendimento,
  paraCorpoAtendimento,
  type AtendimentoApi,
} from "./atendimentos";
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
    expect(atendimento.valorTotal).toBeNull();
    expect(atendimento.pagoEm).toBeNull();
  });

  it("converte o total que o backend manda para o cliente", () => {
    const atendimento = paraAtendimento({ ...bruto, valor_total: "193.00" });
    expect(atendimento.valorTotal).toBe(193);
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

describe("listarHorariosOcupados", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("busca o dia no fuso local e devolve hh:mm sem repetir", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            horarios: [
              new Date(2026, 9, 20, 8, 30).toISOString(),
              new Date(2026, 9, 20, 8, 30).toISOString(),
              new Date(2026, 9, 20, 13, 30).toISOString(),
            ],
          }),
      })
    );

    const horarios = await listarHorariosOcupados("t", "2026-10-20");

    expect(horarios).toEqual(["08:30", "13:30"]);
    const [endereco] = vi.mocked(fetch).mock.calls[0];
    const url = new URL(String(endereco));
    expect(url.pathname.endsWith("/appointments/horarios-ocupados")).toBe(true);
    expect(url.searchParams.get("inicio")).toBe(new Date(2026, 9, 20).toISOString());
    expect(url.searchParams.get("fim")).toBe(new Date(2026, 9, 21).toISOString());
  });
});

describe("enviarImagemAtendimento", () => {  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("faz POST /appointments/images com o campo imagem e devolve a url", async () => {
    const url = "http://h/api/uploads/atendimentos/11111111-1111-4111-8111-111111111111.png";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve({ foto_url: url }) }),
    );

    const resultado = await enviarImagemAtendimento("t", new Blob(["x"]), "problema.png");

    expect(resultado).toBe(url);
    const [endereco, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(endereco).endsWith("/appointments/images")).toBe(true);
    expect(init?.method).toBe("POST");
    const arquivo = (init?.body as FormData).get("imagem") as File;
    expect(arquivo).toBeInstanceOf(File);
    expect(arquivo.name).toBe("problema.png");
  });
});
