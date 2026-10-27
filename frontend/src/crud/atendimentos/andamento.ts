import type { Atendimento, StatusAtendimento } from "../../tipos/atendimento";

/** O que o painel pode fazer com um atendimento; cada uma vira um botão na OS. */
export type AcaoAtendimento = "confirmar" | "recusar" | "iniciar" | "cancelar" | "concluir" | "marcar-pago";

export const MENSAGEM_CLIENTE_MIN = 10;
export const MENSAGEM_CLIENTE_MAX = 500;

/** Pra onde cada ação de andamento leva o atendimento (o PATCH /status recebe esse status). */
export const STATUS_DA_ACAO: Record<Exclude<AcaoAtendimento, "marcar-pago">, StatusAtendimento> = {
  confirmar: "agendado",
  recusar: "recusado",
  iniciar: "em-andamento",
  cancelar: "cancelado",
  concluir: "concluido",
};

/** As ações que valem pro status atual (a tela só mostra essas). */
export function acoesDoStatus(atendimento: Atendimento): AcaoAtendimento[] {
  switch (atendimento.status) {
    case "aguardando":
      return ["confirmar", "recusar"];
    case "agendado":
      return ["iniciar", "cancelar"];
    case "em-andamento":
      return ["concluir"];
    case "concluido":
      return atendimento.pagoEm ? [] : ["marcar-pago"];
    default:
      // recusado e cancelado já terminaram
      return [];
  }
}

/** null se a mensagem serve; senão, o texto do erro. */
export function validarMensagemCliente(texto: string): string | null {
  return texto.trim().length >= MENSAGEM_CLIENTE_MIN
    ? null
    : "Escreva a mensagem pro cliente (pelo menos 10 caracteres).";
}

/** A OS (observações, produtos, mão de obra) só muda em andamento ou concluída sem pagamento. */
export function osEditavel(atendimento: Atendimento) {
  return (
    atendimento.status === "em-andamento" ||
    (atendimento.status === "concluido" && atendimento.pagoEm === null)
  );
}
