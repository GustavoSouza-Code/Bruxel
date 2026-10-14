import type { Atendimento, DadosSolicitacao } from "../../tipos/atendimento";

/**
 * Monta o atendimento que o contexto guarda a partir do que o formulário enviou:
 * número em sequência com o ano (AT-2026-0003), status inicial "aguardando" e
 * a data do envio.
 * TODO: com a API, o id e o criadoEm vêm do backend.
 */
export function novoAtendimento(
  dados: DadosSolicitacao,
  quantidadeAtual: number,
  agora: Date
): Atendimento {
  const sequencia = String(quantidadeAtual + 1).padStart(4, "0");
  return {
    ...dados,
    id: `AT-${agora.getFullYear()}-${sequencia}`,
    status: "aguardando",
    criadoEm: agora.toISOString(),
  };
}
