/**
 * Atendimento (visita técnica) que o cliente pede pela tela /solicitar-atendimento.
 * Ainda não existe no backend: os nomes seguem o que o front precisa e devem ser
 * alinhados com a tabela `appointments` quando a API ficar pronta.
 */

/** Tipo de serviço escolhido no bloco 1 do formulário. */
export type TipoServico = "limpeza" | "bomba-filtro" | "vazamento" | "instalacao" | "outro";

/** Turno preferido pra visita. */
export type PeriodoAtendimento = "manha" | "tarde";

/** Situação do atendimento; também vira o sufixo da classe CSS da etiqueta de status. */
export type StatusAtendimento = "aguardando" | "agendado" | "em-andamento" | "concluido" | "cancelado";

/** Onde fazer o serviço e como falar com o cliente; os nomes são os mesmos de `Usuario`. */
export interface ContatoAtendimento {
  telefone: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  /** sigla com 2 letras, ex.: "RS" */
  estado: string;
  /** só dígitos (8 caracteres) */
  cep: string;
}

export interface Atendimento {
  /** ex.: "AT-2026-0003" */
  id: string;
  tipo: TipoServico;
  descricao: string;
  /** URLs das fotos pra exibir (por enquanto blob:, criadas no navegador) */
  fotos: string[];
  /** "aaaa-mm-dd", o mesmo formato do <input type="date"> */
  dataPreferida: string;
  periodo: PeriodoAtendimento;
  contato: ContatoAtendimento;
  status: StatusAtendimento;
  /** data e hora do envio, em ISO */
  criadoEm: string;
}

/** O que o formulário envia; id, status e criadoEm quem define é o contexto. */
export type DadosSolicitacao = Omit<Atendimento, "id" | "status" | "criadoEm">;
