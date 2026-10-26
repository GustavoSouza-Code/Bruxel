/**
 * Atendimento (visita técnica) que o cliente pede pela tela /solicitar-atendimento,
 * e a Ordem de Serviço que a gestão preenche. Vem da tabela `appointments` pela
 * API; a conversão do formato do banco fica em api/atendimentos.ts.
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
  /** id da conta do cliente; null = pedido antigo sem conta (o backend ainda não abre pedido sem cadastro) */
  id: string | null;
  nome: string;
}

/** Técnico responsável pela visita, quando o backend tem um definido. */
export interface TecnicoDoAtendimento {
  id: string;
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
  /** UUID do banco; na tela aparece curto (ver codigoAtendimento) */
  id: string;
  tipo: TipoServico;
  descricao: string;
  /** link da foto do problema; null = sem foto */
  fotoUrl: string | null;
  /** de quem é o pedido: quem pediu pelo site, ou o cliente que a loja escolheu */
  cliente: ClienteDoAtendimento;
  /** true quando um administrador abriu o pedido pela loja (balcão) */
  abertoNaLoja: boolean;
  /** null = a gestão ainda não definiu quem vai */
  tecnico: TecnicoDoAtendimento | null;
  /** dia da visita, "aaaa-mm-dd", no fuso de quem está usando */
  data: string;
  /** hora da visita, "hh:mm" (normalmente o início de um bloco de HorarioVisita) */
  horario: string;
  contato: ContatoAtendimento;
  status: StatusAtendimento;
  /** data e hora do envio, em ISO */
  criadoEm: string;
  /** texto que o cliente vê quando o pedido é recusado ou cancelado; null = sem mensagem */
  mensagemCliente: string | null;
  /** o que o técnico anotou na OS (diagnóstico, peças, reparos); o cliente recebe "" */
  observacoesTecnico: string;
  produtosUsados: ProdutoUsado[];
  /** valor do serviço em reais, sem os produtos; null = ainda não informado (ou conta de cliente) */
  valorMaoDeObra: number | null;
  /** data e hora do pagamento, em ISO; null = a pagar (ou conta de cliente) */
  pagoEm: string | null;
}

/**
 * O que o formulário envia. O resto (id, status, datas, OS) quem define é o backend.
 */
export interface DadosSolicitacao {
  tipo: TipoServico;
  descricao: string;
  /** link da foto; null = sem foto */
  fotoUrl: string | null;
  /** conta do cliente quando um administrador abre pela loja; null = o pedido é de quem está logado */
  clienteId: string | null;
  /** "aaaa-mm-dd" */
  data: string;
  horario: HorarioVisita;
  contato: ContatoAtendimento;
}
