import type { Atendimento, StatusAtendimento } from "../../tipos/atendimento";

/** O que o painel pode fazer com um atendimento; cada uma vira um botão na OS. */
export type AcaoAtendimento = "confirmar" | "recusar" | "iniciar" | "cancelar" | "concluir" | "marcar-pago";

export const MENSAGEM_CLIENTE_MIN = 10;
export const MENSAGEM_CLIENTE_MAX = 500;

/** Os campos da OS que o técnico preenche. */
export type CamposOs = Partial<Pick<Atendimento, "observacoesTecnico" | "produtosUsados" | "valorMaoDeObra">>;

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

// a tela só oferece as ações do acoesDoStatus; chegar aqui com outro status é bug
function exigirStatus(atendimento: Atendimento, esperado: StatusAtendimento, acao: string) {
  if (atendimento.status !== esperado) {
    throw new Error(`Não dá pra ${acao} o atendimento ${atendimento.id} com status "${atendimento.status}".`);
  }
}

function exigirMensagem(mensagem: string) {
  const problema = validarMensagemCliente(mensagem);
  if (problema) throw new Error(problema);
}

export function confirmar(atendimento: Atendimento): Atendimento {
  exigirStatus(atendimento, "aguardando", "confirmar");
  return { ...atendimento, status: "agendado" };
}

export function recusar(atendimento: Atendimento, mensagem: string): Atendimento {
  exigirStatus(atendimento, "aguardando", "recusar");
  exigirMensagem(mensagem);
  return { ...atendimento, status: "recusado", mensagemCliente: mensagem.trim() };
}

export function iniciar(atendimento: Atendimento): Atendimento {
  exigirStatus(atendimento, "agendado", "iniciar");
  return { ...atendimento, status: "em-andamento" };
}

export function cancelar(atendimento: Atendimento, mensagem: string): Atendimento {
  exigirStatus(atendimento, "agendado", "cancelar");
  exigirMensagem(mensagem);
  return { ...atendimento, status: "cancelado", mensagemCliente: mensagem.trim() };
}

export function concluir(atendimento: Atendimento): Atendimento {
  exigirStatus(atendimento, "em-andamento", "concluir");
  return { ...atendimento, status: "concluido" };
}

/** `agora` vem de fora pra a função continuar pura (o contexto usa ela dentro do setState). */
export function marcarPago(atendimento: Atendimento, agora: Date): Atendimento {
  exigirStatus(atendimento, "concluido", "marcar como pago");
  if (atendimento.pagoEm) throw new Error(`O atendimento ${atendimento.id} já está pago.`);
  return { ...atendimento, pagoEm: agora.toISOString() };
}

/** A OS (observações, produtos, mão de obra) só muda em andamento ou concluída sem pagamento. */
export function osEditavel(atendimento: Atendimento) {
  return (
    atendimento.status === "em-andamento" ||
    (atendimento.status === "concluido" && atendimento.pagoEm === null)
  );
}

export function atualizarOs(atendimento: Atendimento, campos: CamposOs): Atendimento {
  if (!osEditavel(atendimento)) {
    throw new Error(`A OS do atendimento ${atendimento.id} está fechada.`);
  }
  return { ...atendimento, ...campos };
}
