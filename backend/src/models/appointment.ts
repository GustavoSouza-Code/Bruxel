import { status_agendamento, tipo_servico } from "../generated/prisma/enums";

// contratos usados no fluxo da Ordem de Serviço

// dados que o cliente envia ao pedir um atendimento
export interface CreateAppointmentDTO {
    tipo: tipo_servico;
    descricao: string;
    data_hora: string;
    // cliente escolhido pelo administrador; ausente quando o próprio usuário abre a OS
    usuario_id?: string | null;
    tecnico_id?: string | null;
    foto_url?: string | null;
    telefone?: string | null;
    rua?: string | null;
    numero?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
}

// dados que o repository grava na tabela appointments
export interface DadosCriacaoAtendimento {
    usuario_id: string;
    tipo: tipo_servico;
    descricao: string;
    data_hora: Date;
    tecnico_id: string | null;
    foto_url: string | null;
    aberto_na_loja: boolean;
    telefone: string | null;
    rua: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
}

// filtros da listagem; o cliente sempre é limitado aos próprios pedidos
export interface FiltrosAtendimento {
    status?: status_agendamento;
    tecnico_id?: string;
}

// mudança de situação feita pela gestão
export interface UpdateAppointmentStatusDTO {
    status: status_agendamento;
    mensagem_cliente?: string | null;
}

// item da OS enviado pelo painel
export interface ItemOsDTO {
    produto_id: string;
    quantidade: number;
}

// item já com o preço do banco, como será gravado em appointment_items
export interface ItemOsComPreco {
    produto_id: string;
    quantidade: number;
    preco_unitario: string;
}

// dados da OS que o técnico preenche
export interface UpdateAppointmentOsDTO {
    observacoes_tecnico?: string | null;
    valor_mao_de_obra?: number | null;
    itens?: ItemOsDTO[];
}
