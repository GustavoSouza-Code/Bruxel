import type { ContatoAtendimento, HorarioVisita, TipoServico } from "../../tipos/atendimento";
import { validarContato } from "./contatoAtendimento";
import type { ErrosContato } from "./contatoAtendimento";
import { diasDaAgenda, horariosDoDia } from "./agenda";

/** Limites da descrição do problema (o textarea usa o máximo no maxLength). */
export const DESCRICAO_MIN = 10;
export const DESCRICAO_MAX = 1000;

/** Tamanho máximo do link da foto (o mesmo do backend). */
export const FOTO_URL_MAX = 2000;

/**
 * O formulário enquanto a pessoa preenche: o tipo e o horário começam sem
 * escolha (null), e o dia e o link da foto começam vazios ("").
 */
export interface RascunhoSolicitacao {
  tipo: TipoServico | null;
  descricao: string;
  /** link da foto do problema; "" = sem foto */
  fotoUrl: string;
  /** "aaaa-mm-dd"; "" = ainda não escolheu */
  data: string;
  horario: HorarioVisita | null;
  contato: ContatoAtendimento;
}

/** Uma mensagem por campo com problema; a página mostra cada uma no bloco do campo. */
export type ErrosSolicitacao = ErrosContato &
  Partial<Record<"tipo" | "descricao" | "fotoUrl" | "data" | "horario", string>>;

/**
 * Confere o rascunho e devolve os erros por campo. Objeto vazio = pode enviar.
 * `hoje` vem de fora pra os testes não dependerem do relógio.
 */
export function validarSolicitacao(rascunho: RascunhoSolicitacao, hoje: Date): ErrosSolicitacao {
  const erros: ErrosSolicitacao = { ...validarContato(rascunho.contato) };

  if (!rascunho.tipo) erros.tipo = "Escolha o tipo de serviço.";

  const descricao = rascunho.descricao.trim();
  if (descricao.length < DESCRICAO_MIN) {
    erros.descricao = `Descreva o problema com pelo menos ${DESCRICAO_MIN} caracteres.`;
  } else if (descricao.length > DESCRICAO_MAX) {
    erros.descricao = `A descrição pode ter até ${DESCRICAO_MAX} caracteres.`;
  }

  const erroFoto = validarFotoUrl(rascunho.fotoUrl);
  if (erroFoto) erros.fotoUrl = erroFoto;

  if (!rascunho.data) {
    erros.data = "Escolha o dia.";
  } else if (!diasDaAgenda(hoje).includes(rascunho.data)) {
    erros.data = "Escolha um dia da lista.";
  }

  if (!rascunho.horario) {
    erros.horario = "Escolha um horário.";
  } else if (rascunho.data && !horariosDoDia(rascunho.data).includes(rascunho.horario)) {
    // ex.: 15:30 num sábado, que só tem horários de manhã
    erros.horario = "Escolha um horário da lista.";
  }

  return erros;
}

/**
 * O link da foto é opcional; preenchido, precisa ser http(s) e caber no banco.
 * (O upload de arquivo espera o servidor da VM; até lá a foto vai por link.)
 */
export function validarFotoUrl(texto: string): string | null {
  const link = texto.trim();
  if (!link) return null;
  if (!/^https?:\/\/\S+$/i.test(link)) return "Cole um link que comece com http:// ou https://.";
  if (link.length > FOTO_URL_MAX) return `O link pode ter até ${FOTO_URL_MAX} caracteres.`;
  return null;
}
