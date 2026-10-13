import type { ContatoAtendimento, HorarioVisita, TipoServico } from "../../tipos/atendimento";
import type { Ocupacao } from "../../tipos/tecnico";
import { TECNICOS } from "../../dados/tecnicos";
import { validarContato } from "./contatoAtendimento";
import type { ErrosContato } from "./contatoAtendimento";
import { SEM_PREFERENCIA, diasDaAgenda, horarioEstaLivre, horariosDoDia } from "./agenda";

/** Limites da descrição do problema (o textarea usa o máximo no maxLength). */
export const DESCRICAO_MIN = 10;
export const DESCRICAO_MAX = 1000;

/** Limites das fotos do problema. */
export const MAX_FOTOS = 5;
export const MAX_TAMANHO_FOTO = 5 * 1024 * 1024; // 5 MB, em bytes

/**
 * O formulário enquanto a pessoa preenche: o tipo e o horário começam sem
 * escolha (null), o dia começa vazio ("") e o atendente começa em "Sem preferência".
 */
export interface RascunhoSolicitacao {
  tipo: TipoServico | null;
  descricao: string;
  /** id do atendente, ou SEM_PREFERENCIA */
  tecnico: string;
  /** "aaaa-mm-dd"; "" = ainda não escolheu */
  data: string;
  horario: HorarioVisita | null;
  contato: ContatoAtendimento;
}

/** Uma mensagem por campo com problema; a página mostra cada uma no bloco do campo. */
export type ErrosSolicitacao = ErrosContato &
  Partial<Record<"tipo" | "descricao" | "tecnico" | "data" | "horario", string>>;

/**
 * Confere o rascunho e devolve os erros por campo. Objeto vazio = pode enviar.
 * `hoje` vem de fora pra os testes não dependerem do relógio; `ocupacoes` são os
 * horários já tomados na agenda dos atendentes.
 */
export function validarSolicitacao(
  rascunho: RascunhoSolicitacao,
  hoje: Date,
  ocupacoes: Ocupacao[]
): ErrosSolicitacao {
  const erros: ErrosSolicitacao = { ...validarContato(rascunho.contato) };

  if (!rascunho.tipo) erros.tipo = "Escolha o tipo de serviço.";

  const descricao = rascunho.descricao.trim();
  if (descricao.length < DESCRICAO_MIN) {
    erros.descricao = `Descreva o problema com pelo menos ${DESCRICAO_MIN} caracteres.`;
  } else if (descricao.length > DESCRICAO_MAX) {
    erros.descricao = `A descrição pode ter até ${DESCRICAO_MAX} caracteres.`;
  }

  // a tela só oferece "Sem preferência" ou um dos atendentes; qualquer outro valor é dado inválido
  if (rascunho.tecnico !== SEM_PREFERENCIA && !TECNICOS.some((tecnico) => tecnico.id === rascunho.tecnico)) {
    erros.tecnico = "Escolha o atendente.";
  }

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
  } else if (
    rascunho.data &&
    !horarioEstaLivre(rascunho.tecnico, rascunho.data, rascunho.horario, ocupacoes)
  ) {
    // outro pedido pode ter pego o horário enquanto a pessoa preenchia o resto
    erros.horario = "Esse horário acabou de ser ocupado. Escolha outro.";
  }

  return erros;
}

/** Resultado do validarFotos: as fotos que entram e, se alguma ficou de fora, o porquê. */
export interface ResultadoFotos {
  aceitas: File[];
  erro: string | null;
}

/**
 * Filtra os arquivos escolhidos no input: só imagens, de até 5 MB, sem passar
 * de MAX_FOTOS contando as que já estão no formulário (`quantidadeAtual`).
 */
export function validarFotos(quantidadeAtual: number, arquivos: File[]): ResultadoFotos {
  const motivos: string[] = [];

  const imagens = arquivos.filter((arquivo) => arquivo.type.startsWith("image/"));
  if (imagens.length < arquivos.length) motivos.push("Só dá pra enviar imagens.");

  const leves = imagens.filter((arquivo) => arquivo.size <= MAX_TAMANHO_FOTO);
  if (leves.length < imagens.length) motivos.push("Cada foto pode ter até 5 MB.");

  const vagas = Math.max(0, MAX_FOTOS - quantidadeAtual);
  const aceitas = leves.slice(0, vagas);
  if (aceitas.length < leves.length) motivos.push(`Você pode enviar até ${MAX_FOTOS} fotos.`);

  return { aceitas, erro: motivos.length > 0 ? motivos.join(" ") : null };
}
