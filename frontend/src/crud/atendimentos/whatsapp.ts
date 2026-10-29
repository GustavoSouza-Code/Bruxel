import type { Atendimento } from "../../tipos/atendimento";
import { TIPO_SERVICO_LABELS, codigoAtendimento } from "./opcoesAtendimento";
import { formatarReais, totalOs } from "./valorOs";

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? "";
}

// só os dígitos com DDD (10 ou 11), sem o 55 do Brasil; null se não for um telefone assim
function digitosComDdd(telefone: string): string | null {
  let digitos = telefone.replace(/\D/g, "");
  // telefone salvo com o código do Brasil na frente
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }
  return digitos.length === 10 || digitos.length === 11 ? digitos : null;
}

/**
 * Link que abre o WhatsApp com o número do cliente e o texto já escrito; quem
 * envia é o atendente. null se o telefone não tem DDD + número (10 ou 11 dígitos).
 */
export function linkWhatsApp(telefone: string, texto: string): string | null {
  const digitos = digitosComDdd(telefone);
  if (!digitos) return null;
  return `https://wa.me/55${digitos}?text=${encodeURIComponent(texto)}`;
}

/** "51998765432" → "(51) 99876-5432"; o que não é telefone com DDD volta como veio. */
export function formatarTelefone(telefone: string) {
  const digitos = digitosComDdd(telefone);
  if (!digitos) return telefone;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, -4)}-${digitos.slice(-4)}`;
}

/** Abertura da conversa a partir do cartão do cliente na OS. */
export function textoSaudacao(atendimento: Pick<Atendimento, "id" | "cliente">) {
  return `Olá, ${primeiroNome(atendimento.cliente.nome)}! Aqui é da Bruxel Piscinas, sobre o seu pedido de atendimento #${codigoAtendimento(atendimento.id)}.`;
}

/** Endereço da página onde o cliente vê a OS (precisa estar logado; o login devolve pra cá). */
export function linkOsCliente(id: string, origem: string) {
  return `${origem}/minha-conta/atendimentos/${id}`;
}

/**
 * Texto padrão da cobrança de uma OS atrasada, com o link pra o cliente ver a
 * OS. O admin pode editar antes de mandar (ver CaixaCobranca).
 */
export function textoCobranca(
  atendimento: Pick<Atendimento, "id" | "cliente" | "tipo" | "data" | "produtosUsados" | "valorMaoDeObra">,
  linkOs: string
) {
  const [, mes, dia] = atendimento.data.split("-");
  return (
    `Olá, ${primeiroNome(atendimento.cliente.nome)}! Aqui é da Bruxel Piscinas. ` +
    `O pagamento da ordem de serviço #${codigoAtendimento(atendimento.id)} ` +
    `(${TIPO_SERVICO_LABELS[atendimento.tipo]}, visita em ${dia}/${mes}), ` +
    `no valor de ${formatarReais(totalOs(atendimento))}, ainda está em aberto. ` +
    `Você pode ver a OS aqui: ${linkOs}\n` +
    "Qualquer dúvida, é só responder esta mensagem."
  );
}

/** A mensagem da recusa ou do cancelamento, pronta pra mandar no WhatsApp. */
export function textoMensagemCliente(atendimento: Pick<Atendimento, "id" | "cliente" | "mensagemCliente">) {
  return `Olá, ${primeiroNome(atendimento.cliente.nome)}! Sobre o seu pedido de atendimento #${codigoAtendimento(atendimento.id)} na Bruxel Piscinas: ${atendimento.mensagemCliente ?? ""}`;
}
