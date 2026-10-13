/**
 * Atendimento (visita técnica) que o cliente pede pela tela /solicitar-atendimento.
 * Ainda não existe no backend: os nomes seguem o que o front precisa e devem ser
 * alinhados com a tabela `appointments` quando a API ficar pronta.
 */

/** Tipo de serviço escolhido no bloco 1 do formulário. */
export type TipoServico = "limpeza" | "bomba-filtro" | "vazamento" | "instalacao" | "outro";

/** Início de um bloco de visita de 2h na agenda do atendente. */
export type HorarioVisita = "08:00" | "10:00" | "13:30" | "15:30";

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

/** De quem é o atendimento. */
export interface ClienteDoAtendimento {
  /** id da conta do cliente; null = cliente sem cadastro (atendido no balcão da loja) */
  id: string | null;
  nome: string;
}

export interface Atendimento {
  /** ex.: "AT-2026-0003" */
  id: string;
  tipo: TipoServico;
  descricao: string;
  /** URLs das fotos pra exibir (por enquanto blob:, criadas no navegador) */
  fotos: string[];
  /** id do atendente (dados/tecnicos.ts); o "Sem preferência" já vira um atendente de verdade no envio */
  tecnicoId: string;
  /** dia da visita, "aaaa-mm-dd" */
  data: string;
  /** início do bloco de 2h da visita */
  horario: HorarioVisita;
  contato: ContatoAtendimento;
  status: StatusAtendimento;
  /** data e hora do envio, em ISO */
  criadoEm: string;
}

/** O que o formulário envia; id, status e criadoEm quem define é o contexto. */
export type DadosSolicitacao = Omit<Atendimento, "id" | "status" | "criadoEm">;
