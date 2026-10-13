import type { ContatoAtendimento, PeriodoAtendimento, TipoServico } from "../../tipos/atendimento";
import { validarContato } from "./contatoAtendimento";
import type { ErrosContato } from "./contatoAtendimento";
import { dataMinima } from "./datasAtendimento";

/** Limites da descrição do problema (o textarea usa o máximo no maxLength). */
export const DESCRICAO_MIN = 10;
export const DESCRICAO_MAX = 1000;

/** Limites das fotos do problema. */
export const MAX_FOTOS = 5;
export const MAX_TAMANHO_FOTO = 5 * 1024 * 1024; // 5 MB, em bytes

/**
 * O formulário enquanto a pessoa preenche: tipo e período começam sem
 * escolha (null) e a data começa vazia ("").
 */
export interface RascunhoSolicitacao {
  tipo: TipoServico | null;
  descricao: string;
  dataPreferida: string;
  periodo: PeriodoAtendimento | null;
  contato: ContatoAtendimento;
}

/** Uma mensagem por campo com problema; a página mostra cada uma no bloco do campo. */
export type ErrosSolicitacao = ErrosContato &
  Partial<Record<"tipo" | "descricao" | "dataPreferida" | "periodo", string>>;

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

  if (!rascunho.dataPreferida) {
    erros.dataPreferida = "Escolha uma data.";
  } else if (rascunho.dataPreferida < dataMinima(hoje)) {
    // datas "aaaa-mm-dd" em ordem alfabética também estão em ordem de calendário
    erros.dataPreferida = "Escolha uma data a partir de amanhã.";
  }

  if (!rascunho.periodo) erros.periodo = "Escolha manhã ou tarde.";

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
