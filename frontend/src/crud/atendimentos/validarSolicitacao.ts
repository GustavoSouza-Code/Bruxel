import type { ContatoAtendimento, TipoServico } from "../../tipos/atendimento";
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
  /** "hh:mm"; null = ainda não escolheu */
  horario: string | null;
  contato: ContatoAtendimento;
}

/** Regras que mudam quando quem está abrindo é o administrador. */
export interface OpcoesValidacao {
  /** admin: qualquer data e horário, sem ficar limitado à grade de 30 min */
  horarioLivre?: boolean;
}

/** Uma mensagem por campo com problema; a página mostra cada uma no bloco do campo. */
export type ErrosSolicitacao = ErrosContato &
  Partial<Record<"tipo" | "descricao" | "fotoUrl" | "data" | "horario", string>>;

/**
 * Confere o rascunho e devolve os erros por campo. Objeto vazio = pode enviar.
 * `hoje` vem de fora pra os testes não dependerem do relógio.
 */
export function validarSolicitacao(
  rascunho: RascunhoSolicitacao,
  hoje: Date,
  opcoes: OpcoesValidacao = {}
): ErrosSolicitacao {
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
  } else if (opcoes.horarioLivre) {
    if (!dataIsoValida(rascunho.data)) erros.data = "Informe uma data válida.";
  } else if (!diasDaAgenda(hoje).includes(rascunho.data)) {
    erros.data = "Escolha um dia da lista.";
  }

  if (!rascunho.horario) {
    erros.horario = "Escolha um horário.";
  } else if (opcoes.horarioLivre) {
    if (!HORARIO_HHMM.test(rascunho.horario)) erros.horario = "Informe um horário válido (hh:mm).";
  } else if (rascunho.data && !(horariosDoDia(rascunho.data) as string[]).includes(rascunho.horario)) {
    // ex.: 15:30 num sábado, que só tem horários de manhã
    erros.horario = "Escolha um horário da lista.";
  }

  return erros;
}

// "aaaa-mm-dd" que existe de verdade no calendário
function dataIsoValida(data: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const [ano, mes, dia] = data.split("-").map(Number);
  const convertida = new Date(ano, mes - 1, dia);
  return (
    convertida.getFullYear() === ano &&
    convertida.getMonth() === mes - 1 &&
    convertida.getDate() === dia
  );
}

// horário de 00:00 a 23:59, com os dois dígitos
const HORARIO_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

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
