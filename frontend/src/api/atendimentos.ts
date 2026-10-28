import { requisicao } from "./cliente";
import { paraDataIso } from "../crud/atendimentos/datasAtendimento";
import type {
  Atendimento,
  ContatoAtendimento,
  DadosSolicitacao,
  StatusAtendimento,
  TipoServico,
} from "../tipos/atendimento";

/** Status como o banco guarda (enum `status_agendamento`). */
export type StatusAtendimentoApi =
  | "DISPONIVEL"
  | "AGUARDANDO"
  | "AGENDADO"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "CANCELADO"
  | "RECUSADO";

/** Tipo de serviço como o banco guarda (enum `tipo_servico`). */
export type TipoServicoApi = "LIMPEZA" | "BOMBA_FILTRO" | "VAZAMENTO" | "INSTALACAO" | "OUTRO";

/**
 * Atendimento como o backend devolve: nomes do banco, decimais em string e o
 * cliente, o técnico e os itens já juntados. Pra conta de cliente, a resposta
 * vem sem observacoes_tecnico, valor_mao_de_obra e pago_em, mas com valor_total.
 */
export interface AtendimentoApi {
  id: string;
  data_hora: string;
  status: StatusAtendimentoApi;
  usuario_id: string | null;
  tecnico_id: string | null;
  tipo: TipoServicoApi | null;
  descricao: string | null;
  foto_url: string | null;
  nome_cliente: string | null;
  aberto_na_loja: boolean;
  telefone: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  mensagem_cliente: string | null;
  observacoes_tecnico?: string | null;
  valor_mao_de_obra?: string | number | null;
  valor_total?: string | number | null;
  pago_em?: string | null;
  criado_em: string;
  atualizado_em: string;
  cliente: { id: string; nome: string } | null;
  tecnico: { id: string; nome: string } | null;
  itens: {
    id: string;
    appointment_id: string;
    produto_id: string;
    quantidade: number;
    preco_unitario: string | number;
    products: { id: string; nome: string };
  }[];
}

// os dois lados de cada enum; o front usa minúsculas com hífen porque viram classe CSS
const TIPOS: Record<TipoServicoApi, TipoServico> = {
  LIMPEZA: "limpeza",
  BOMBA_FILTRO: "bomba-filtro",
  VAZAMENTO: "vazamento",
  INSTALACAO: "instalacao",
  OUTRO: "outro",
};

const STATUS: Record<Exclude<StatusAtendimentoApi, "DISPONIVEL">, StatusAtendimento> = {
  AGUARDANDO: "aguardando",
  AGENDADO: "agendado",
  EM_ANDAMENTO: "em-andamento",
  CONCLUIDO: "concluido",
  CANCELADO: "cancelado",
  RECUSADO: "recusado",
};

/** O valor do banco pra cada status do front (o PATCH /status recebe esse). */
export function statusParaApi(status: StatusAtendimento): StatusAtendimentoApi {
  const par = Object.entries(STATUS).find(([, valor]) => valor === status);
  return par![0] as StatusAtendimentoApi;
}

function tipoParaApi(tipo: TipoServico): TipoServicoApi {
  const par = Object.entries(TIPOS).find(([, valor]) => valor === tipo);
  return par![0] as TipoServicoApi;
}

// "hh:mm" no fuso de quem está usando
function paraHorario(data: Date) {
  return `${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`;
}

/** Converte o atendimento da API pro formato das telas. */
export function paraAtendimento(bruto: AtendimentoApi): Atendimento {
  const visita = new Date(bruto.data_hora);
  const valor = bruto.valor_mao_de_obra;
  return {
    id: bruto.id,
    // pedidos de antes da OS não têm tipo; "DISPONIVEL" é um status antigo, tratado como aguardando
    tipo: bruto.tipo ? TIPOS[bruto.tipo] : "outro",
    status: bruto.status === "DISPONIVEL" ? "aguardando" : STATUS[bruto.status],
    descricao: bruto.descricao ?? "",
    fotoUrl: bruto.foto_url,
    cliente: bruto.cliente ?? { id: null, nome: bruto.nome_cliente ?? "Cliente sem cadastro" },
    abertoNaLoja: bruto.aberto_na_loja,
    tecnico: bruto.tecnico,
    data: paraDataIso(visita),
    horario: paraHorario(visita),
    contato: {
      telefone: bruto.telefone ?? "",
      rua: bruto.rua ?? "",
      numero: bruto.numero ?? "",
      bairro: bruto.bairro ?? "",
      cidade: bruto.cidade ?? "",
      estado: bruto.estado ?? "",
      cep: bruto.cep ?? "",
    },
    criadoEm: bruto.criado_em,
    mensagemCliente: bruto.mensagem_cliente,
    observacoesTecnico: bruto.observacoes_tecnico ?? "",
    produtosUsados: bruto.itens.map((item) => ({
      produtoId: item.produto_id,
      nome: item.products.nome,
      precoUnitario: Number(item.preco_unitario),
      quantidade: item.quantidade,
    })),
    valorMaoDeObra: valor === null || valor === undefined ? null : Number(valor),
    valorTotal:
      bruto.valor_total === null || bruto.valor_total === undefined ? null : Number(bruto.valor_total),
    pagoEm: bruto.pago_em ?? null,
  };
}

// texto vazio vira null: o backend grava null em vez de ""
function textoOuNull(texto: string) {
  const limpo = texto.trim();
  return limpo ? limpo : null;
}

function contatoParaApi(contato: ContatoAtendimento) {
  return {
    telefone: textoOuNull(contato.telefone),
    rua: textoOuNull(contato.rua),
    numero: textoOuNull(contato.numero),
    bairro: textoOuNull(contato.bairro),
    cidade: textoOuNull(contato.cidade),
    estado: textoOuNull(contato.estado)?.toUpperCase() ?? null,
    cep: textoOuNull(contato.cep.replace(/\D/g, "")),
  };
}

/** Corpo do POST /appointments. `usuario_id` só vai quando um admin abre pra outro cliente. */
export function paraCorpoAtendimento(dados: DadosSolicitacao) {
  const [ano, mes, dia] = dados.data.split("-").map(Number);
  const [hora, minuto] = dados.horario.split(":").map(Number);
  const fotoUrl = dados.fotoUrl?.trim();
  return {
    tipo: tipoParaApi(dados.tipo),
    descricao: dados.descricao.trim(),
    // o dia e a hora escolhidos são do relógio local; o toISOString leva pro UTC que o banco guarda
    data_hora: new Date(ano, mes - 1, dia, hora, minuto).toISOString(),
    ...contatoParaApi(dados.contato),
    ...(dados.clienteId ? { usuario_id: dados.clienteId } : {}),
    ...(fotoUrl ? { foto_url: fotoUrl } : {}),
  };
}

/** Lista os atendimentos: o admin recebe todos, o cliente só os dele (o backend filtra). */
export async function listarAtendimentos(token: string): Promise<Atendimento[]> {
  const brutos = await requisicao<AtendimentoApi[]>("/appointments", { token });
  return brutos.map(paraAtendimento);
}

export async function buscarAtendimento(token: string, id: string): Promise<Atendimento> {
  return paraAtendimento(await requisicao<AtendimentoApi>(`/appointments/${id}`, { token }));
}

export async function criarAtendimento(token: string, dados: DadosSolicitacao): Promise<Atendimento> {
  const criado = await requisicao<AtendimentoApi>("/appointments", {
    metodo: "POST",
    corpo: paraCorpoAtendimento(dados),
    token,
  });
  return paraAtendimento(criado);
}

/**
 * Muda o andamento (confirmar, recusar, iniciar, cancelar, concluir). Recusar e
 * cancelar exigem a mensagem pro cliente; concluir dá baixa no estoque dos produtos da OS.
 */
export async function mudarStatusAtendimento(
  token: string,
  id: string,
  status: StatusAtendimento,
  mensagemCliente?: string
): Promise<Atendimento> {
  const atualizado = await requisicao<AtendimentoApi>(`/appointments/${id}/status`, {
    metodo: "PATCH",
    corpo: {
      status: statusParaApi(status),
      ...(mensagemCliente !== undefined ? { mensagem_cliente: mensagemCliente.trim() } : {}),
    },
    token,
  });
  return paraAtendimento(atualizado);
}

/** O que dá pra mandar no PUT da OS; campo ausente não muda. */
export interface CamposOs {
  observacoesTecnico?: string;
  valorMaoDeObra?: number | null;
  produtosUsados?: { produtoId: string; quantidade: number }[];
}

/** Grava a OS (observações, mão de obra e a lista inteira de produtos usados). */
export async function salvarOs(token: string, id: string, campos: CamposOs): Promise<Atendimento> {
  const corpo: Record<string, unknown> = {};
  if (campos.observacoesTecnico !== undefined) corpo.observacoes_tecnico = textoOuNull(campos.observacoesTecnico);
  if (campos.valorMaoDeObra !== undefined) corpo.valor_mao_de_obra = campos.valorMaoDeObra;
  if (campos.produtosUsados !== undefined) {
    corpo.itens = campos.produtosUsados.map((produto) => ({
      produto_id: produto.produtoId,
      quantidade: produto.quantidade,
    }));
  }
  const atualizado = await requisicao<AtendimentoApi>(`/appointments/${id}/os`, { metodo: "PUT", corpo, token });
  return paraAtendimento(atualizado);
}

/** Registra o pagamento de uma OS concluída. */
export async function marcarAtendimentoPago(token: string, id: string): Promise<Atendimento> {
  const atualizado = await requisicao<AtendimentoApi>(`/appointments/${id}/pagamento`, { metodo: "PATCH", token });
  return paraAtendimento(atualizado);
}
