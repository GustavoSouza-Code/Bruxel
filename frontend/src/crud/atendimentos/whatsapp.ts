import type { Atendimento } from "../../tipos/atendimento";
import { codigoAtendimento } from "./opcoesAtendimento";

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? "";
}

/**
 * Link que abre o WhatsApp com o número do cliente e o texto já escrito; quem
 * envia é o atendente. null se o telefone não tem DDD + número (10 ou 11 dígitos).
 */
export function linkWhatsApp(telefone: string, texto: string): string | null {
  let digitos = telefone.replace(/\D/g, "");
  // telefone salvo com o código do Brasil na frente
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }
  if (digitos.length !== 10 && digitos.length !== 11) return null;
  return `https://wa.me/55${digitos}?text=${encodeURIComponent(texto)}`;
}

/** Abertura da conversa a partir do cartão do cliente na OS. */
export function textoSaudacao(atendimento: Pick<Atendimento, "id" | "cliente">) {
  return `Olá, ${primeiroNome(atendimento.cliente.nome)}! Aqui é da Bruxel Piscinas, sobre o seu pedido de atendimento #${codigoAtendimento(atendimento.id)}.`;
}

/** A mensagem da recusa ou do cancelamento, pronta pra mandar no WhatsApp. */
export function textoMensagemCliente(atendimento: Pick<Atendimento, "id" | "cliente" | "mensagemCliente">) {
  return `Olá, ${primeiroNome(atendimento.cliente.nome)}! Sobre o seu pedido de atendimento #${codigoAtendimento(atendimento.id)} na Bruxel Piscinas: ${atendimento.mensagemCliente ?? ""}`;
}
