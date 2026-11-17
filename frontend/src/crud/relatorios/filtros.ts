import { dataLocalIso } from "../../api/relatorios";
import type { TipoRelatorio } from "../../api/relatorios";

/** Filtros da tela de relatórios; "" quer dizer "todos" (ou "sem filtro"). */
export interface FiltrosRelatorio {
  inicio: string;
  fim: string;
  status: string;
  pagamento: "" | "pago" | "a-receber";
}

/** Opção de um select de status: `valor` vai pro back, `rotulo` aparece na tela. */
export interface OpcaoStatus {
  valor: string;
  rotulo: string;
}

/** Período inicial: do 1º dia do mês até hoje, em data local. */
export function periodoPadrao(hoje: Date): { inicio: string; fim: string } {
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return { inicio: dataLocalIso(primeiroDia), fim: dataLocalIso(hoje) };
}

/**
 * Monta a query do relatório (sem "?" e sem campos vazios).
 * `pagamento` só existe em atendimentos; com "a-receber" o status vira CONCLUIDO.
 */
export function montarQueryRelatorio(tipo: TipoRelatorio, filtros: FiltrosRelatorio): string {
  const params = new URLSearchParams();

  if (filtros.inicio) params.set("inicio", filtros.inicio);
  if (filtros.fim) params.set("fim", filtros.fim);

  if (tipo === "atendimentos") {
    const aReceber = filtros.pagamento === "a-receber";
    const status = aReceber ? "CONCLUIDO" : filtros.status;
    if (status) params.set("status", status);
    if (filtros.pagamento) params.set("pagamento", filtros.pagamento);
  } else if (filtros.status) {
    params.set("status", filtros.status);
  }

  return params.toString();
}

/** Opções de status por tipo, com "Todas" primeiro. Rótulos iguais aos do reportsService do back. */
export const OPCOES_STATUS: Record<TipoRelatorio, OpcaoStatus[]> = {
  pedidos: [
    { valor: "", rotulo: "Todas" },
    { valor: "PENDENTE", rotulo: "Pendente" },
    { valor: "PAGO", rotulo: "Pago" },
    { valor: "ENVIADO", rotulo: "Enviado" },
    { valor: "ENTREGUE", rotulo: "Entregue" },
    { valor: "CANCELADO", rotulo: "Cancelado" },
  ],
  atendimentos: [
    { valor: "", rotulo: "Todas" },
    { valor: "DISPONIVEL", rotulo: "Disponível" },
    { valor: "AGUARDANDO", rotulo: "Aguardando confirmação" },
    { valor: "AGENDADO", rotulo: "Agendado" },
    { valor: "EM_ANDAMENTO", rotulo: "Em andamento" },
    { valor: "CONCLUIDO", rotulo: "Concluído" },
    { valor: "CANCELADO", rotulo: "Cancelado" },
    { valor: "RECUSADO", rotulo: "Recusado" },
  ],
};
