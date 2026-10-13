import type { PeriodoAtendimento, StatusAtendimento, TipoServico } from "../../tipos/atendimento";

// texto de cada tipo de serviço; a ordem das chaves é a ordem dos cards no formulário
export const TIPO_SERVICO_LABELS: Record<TipoServico, string> = {
  limpeza: "Limpeza e manutenção",
  "bomba-filtro": "Bomba e filtro",
  vazamento: "Vazamento",
  instalacao: "Instalação",
  outro: "Outro",
};

export const TIPOS_SERVICO = Object.keys(TIPO_SERVICO_LABELS) as TipoServico[];

export const PERIODO_LABELS: Record<PeriodoAtendimento, string> = {
  manha: "Manhã",
  tarde: "Tarde",
};

export const PERIODOS = Object.keys(PERIODO_LABELS) as PeriodoAtendimento[];

// texto da etiqueta de cada status na aba "Atendimentos" do /perfil
export const STATUS_LABELS: Record<StatusAtendimento, string> = {
  aguardando: "Aguardando confirmação",
  agendado: "Agendado",
  "em-andamento": "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};
