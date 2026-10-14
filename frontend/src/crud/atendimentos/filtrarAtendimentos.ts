import type { Atendimento } from "../../tipos/atendimento";
import { contemTexto } from "../busca";

/** Os chips da lista: um por status, "encerrados" (recusado + cancelado) e "todos". */
export type FiltroStatus = "aguardando" | "agendado" | "em-andamento" | "concluido" | "encerrados" | "todos";

/** "" = qualquer; só os concluídos têm pagamento. */
export type FiltroPagamento = "" | "a-pagar" | "pago";

export type OrdemAtendimento = "visita" | "visita-desc";

/** O que está escolhido na busca, nos chips e no painel de filtros da lista de atendimentos. */
export interface FiltrosAtendimento {
  busca: string;
  status: FiltroStatus;
  /** id do atendente (dados/tecnicos.ts); "" = qualquer */
  tecnico: string;
  pagamento: FiltroPagamento;
  ordem: OrdemAtendimento;
}

// a lista abre no que precisa de decisão: os pedidos aguardando confirmação
export const FILTROS_ATENDIMENTO_INICIAIS: FiltrosAtendimento = {
  busca: "",
  status: "aguardando",
  tecnico: "",
  pagamento: "",
  ordem: "visita",
};

function encerrado(atendimento: Atendimento) {
  return atendimento.status === "recusado" || atendimento.status === "cancelado";
}

function combinaComStatus(atendimento: Atendimento, status: FiltroStatus) {
  if (status === "todos") return true;
  if (status === "encerrados") return encerrado(atendimento);
  return atendimento.status === status;
}

function combinaComBusca(atendimento: Atendimento, busca: string) {
  return (
    contemTexto(atendimento.cliente.nome, busca) ||
    contemTexto(atendimento.id, busca) ||
    contemTexto(atendimento.contato.bairro, busca)
  );
}

function combinaComPagamento(atendimento: Atendimento, pagamento: FiltroPagamento) {
  if (!pagamento) return true;
  if (atendimento.status !== "concluido") return false;
  return pagamento === "pago" ? atendimento.pagoEm !== null : atendimento.pagoEm === null;
}

// "2026-10-21 13:30": no formato aaaa-mm-dd hh:mm, a ordem do texto é a ordem do tempo
function momentoDaVisita(atendimento: Atendimento) {
  return `${atendimento.data} ${atendimento.horario}`;
}

/** Aplica os filtros e a ordenação; devolve uma lista nova (não altera a original). */
export function filtrarAtendimentos(atendimentos: Atendimento[], filtros: FiltrosAtendimento) {
  const sentido = filtros.ordem === "visita-desc" ? -1 : 1;
  return atendimentos
    .filter(
      (atendimento) =>
        combinaComStatus(atendimento, filtros.status) &&
        combinaComBusca(atendimento, filtros.busca) &&
        (!filtros.tecnico || atendimento.tecnicoId === filtros.tecnico) &&
        combinaComPagamento(atendimento, filtros.pagamento)
    )
    .sort((a, b) => sentido * momentoDaVisita(a).localeCompare(momentoDaVisita(b)));
}

/** Quantos atendimentos cada chip mostra (os números dos chips e do card do painel). */
export function contarPorStatus(atendimentos: Atendimento[]): Record<FiltroStatus, number> {
  const contagem: Record<FiltroStatus, number> = {
    aguardando: 0,
    agendado: 0,
    "em-andamento": 0,
    concluido: 0,
    encerrados: 0,
    todos: atendimentos.length,
  };
  for (const atendimento of atendimentos) {
    if (encerrado(atendimento)) contagem.encerrados += 1;
    else contagem[atendimento.status as Exclude<FiltroStatus, "encerrados" | "todos">] += 1;
  }
  return contagem;
}

/**
 * Quantos filtros do painel estão em uso (o número do botão "Filtros (n)").
 * A busca e o chip de status ficam de fora porque já aparecem na tela.
 */
export function contarFiltrosAtivosAtendimento(filtros: FiltrosAtendimento) {
  return [
    filtros.tecnico !== "",
    filtros.pagamento !== "",
    filtros.ordem !== FILTROS_ATENDIMENTO_INICIAIS.ordem,
  ].filter(Boolean).length;
}
