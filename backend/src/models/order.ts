import { forma_pagamento } from "../generated/prisma/enums";

// contratos usados no fluxo de compra

// item enviado pelo cliente no corpo do pedido
export interface ItemPedidoDTO {
    produto_id: string;
    quantidade: number;
}

// entrada da criação de pedido
export interface CreateOrderDTO {
    itens: ItemPedidoDTO[];
    forma_pagamento: forma_pagamento;
    endereco_entrega: string;
}

// o preço é copiado do banco no momento da compra, nunca vem do cliente
export interface ItemPedidoComPreco {
    produto_id: string;
    quantidade: number;
    preco_unitario: string;
}

// dados que o repository grava na tabela orders
export interface DadosPedido {
    forma_pagamento: forma_pagamento;
    endereco_entrega: string;
}
