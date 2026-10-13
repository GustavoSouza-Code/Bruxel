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
export type StatusAtendimento =
  | "aguardando"
  | "agendado"
  | "em-andamento"
  | "concluido"
  | "cancelado"
  | "recusado";

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

/** Produto da loja usado no serviço; nome e preço ficam guardados como eram na hora. */
export interface ProdutoUsado {
  produtoId: string;
  nome: string;
  /** preço da loja na hora em que foi lançado na OS, em reais */
  precoUnitario: number;
  quantidade: number;
}

export interface Atendimento {
  /** ex.: "AT-2026-0003" */
  id: string;
  tipo: TipoServico;
  descricao: string;
  /** URLs das fotos pra exibir (por enquanto blob:, criadas no navegador) */
  fotos: string[];
  /** de quem é o pedido: quem pediu pelo site, ou o cliente que a loja escolheu */
  cliente: ClienteDoAtendimento;
  /** true quando um administrador abriu o pedido pela loja (balcão) */
  abertoNaLoja: boolean;
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
  /** texto que o cliente vê quando o pedido é recusado ou cancelado; null = sem mensagem */
  mensagemCliente: string | null;
  /** o que o técnico anotou na OS (diagnóstico, peças, reparos) */
  observacoesTecnico: string;
  produtosUsados: ProdutoUsado[];
  /** valor do serviço em reais, sem os produtos; null = ainda não informado */
  valorMaoDeObra: number | null;
  /** data e hora do pagamento, em ISO; null = a pagar */
  pagoEm: string | null;
}

/** Campos que só a gestão (painel) preenche; o pedido nasce com eles vazios. */
type CamposDaGestao = "mensagemCliente" | "observacoesTecnico" | "produtosUsados" | "valorMaoDeObra" | "pagoEm";

/** O que o formulário envia; id, status, criadoEm e os campos da gestão quem define é o contexto. */
export type DadosSolicitacao = Omit<Atendimento, "id" | "status" | "criadoEm" | CamposDaGestao>;
