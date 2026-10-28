import type { Atendimento, StatusAtendimento, TipoServico } from "../../tipos/atendimento";

// texto de cada tipo de serviço; a ordem das chaves é a ordem dos cards no formulário
export const TIPO_SERVICO_LABELS: Record<TipoServico, string> = {
  limpeza: "Limpeza e manutenção",
  "bomba-filtro": "Bomba e filtro",
  vazamento: "Vazamento",
  instalacao: "Instalação",
  outro: "Outro",
};

export const TIPOS_SERVICO = Object.keys(TIPO_SERVICO_LABELS) as TipoServico[];

// texto da etiqueta de cada status (aba "Atendimentos" do /perfil e painel admin)
export const STATUS_LABELS: Record<StatusAtendimento, string> = {
  aguardando: "Aguardando confirmação",
  agendado: "Agendado",
  "em-andamento": "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  recusado: "Recusado",
};

/**
 * Código curto do atendimento pra tela e pro WhatsApp: o id é um UUID e os 8
 * primeiros caracteres já bastam pra achar o pedido. A tela põe o "#" na frente.
 */
export function codigoAtendimento(id: string) {
  return id.slice(0, 8).toUpperCase();
}

/**
 * O cliente só vê o total da OS quando o serviço já começou ou terminou: antes
 * disso (ou cancelada/recusada) o backend manda R$ 0,00, que não diz nada.
 */
export function totalVisivelParaCliente(atendimento: Pick<Atendimento, "status" | "valorTotal">) {
  return atendimento.valorTotal !== null && (atendimento.status === "em-andamento" || atendimento.status === "concluido");
}
