import { CreateOrderDTO, DadosPedido, ItemPedidoComPreco, ItemPedidoDTO } from "../models/order";
import { OrdersRepository } from "../repository/ordersRepository";
import { ProductsRepository } from "../repository/productsRepository";
import { AppError } from "../errors/AppError";
import { ehUuid } from "../utils/validacoes";
import { forma_pagamento } from "../generated/prisma/enums";

const FORMAS_PAGAMENTO = Object.values(forma_pagamento) as readonly string[];
const MAXIMO_DE_ITENS = 100;

// limite da coluna NUMERIC(10,2) usada em valor_total
const TOTAL_MAXIMO_CENTAVOS = 9999999999;

// camada service de pedidos: valida a compra e manda o repository baixar o estoque
export class OrdersService {
    private ordersRepository = new OrdersRepository();
    private productsRepository = new ProductsRepository();

    // criação: valida a entrada e monta o pedido com os dados do banco
    async create(usuarioId: string, dados: CreateOrderDTO) {
        const corpo = (dados ?? {}) as CreateOrderDTO;
        const itens = this.validarItens(corpo.itens);
        const formaPagamento = this.validarFormaPagamento(corpo.forma_pagamento);
        const enderecoEntrega = this.validarEndereco(corpo.endereco_entrega);

        const produtos = await this.productsRepository.getByIds(itens.map((item) => item.produto_id));
        const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));

        let totalCentavos = 0;

        // confere disponibilidade e copia o preço atual de cada produto
        const itensComPreco: ItemPedidoComPreco[] = itens.map((item) => {
            const produto = produtosPorId.get(item.produto_id);
            if (!produto) {
                throw new AppError(404, `Produto não encontrado: ${item.produto_id}.`);
            }
            if (!produto.ativo) {
                throw new AppError(409, `Produto indisponível: ${produto.nome}.`);
            }
            if (produto.estoque < item.quantidade) {
                throw new AppError(
                    409,
                    `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}.`
                );
            }

            // preço copiado do banco, em centavos, para não acumular erro de ponto flutuante
            const precoCentavos = Math.round(Number(produto.preco) * 100);
            totalCentavos += precoCentavos * item.quantidade;

            if (totalCentavos > TOTAL_MAXIMO_CENTAVOS) {
                throw new AppError(400, "O valor total do pedido é muito alto.");
            }

            return {
                produto_id: produto.id,
                quantidade: item.quantidade,
                preco_unitario: (precoCentavos / 100).toFixed(2),
            };
        });

        const dadosPedido: DadosPedido = {
            forma_pagamento: formaPagamento,
            endereco_entrega: enderecoEntrega,
        };

        return this.ordersRepository.create(
            usuarioId,
            dadosPedido,
            itensComPreco,
            (totalCentavos / 100).toFixed(2)
        );
    }

    // listagem conforme o perfil de quem está logado
    async getAll(usuarioId: string, ehAdmin: boolean) {
        return ehAdmin
            ? this.ordersRepository.getAll()
            : this.ordersRepository.getAllByUsuario(usuarioId);
    }

    // validações dos dados recebidos no corpo da compra
    private validarItens(itens: unknown): ItemPedidoDTO[] {
        if (!Array.isArray(itens) || itens.length === 0) {
            throw new AppError(400, "Adicione pelo menos um produto ao pedido.");
        }
        if (itens.length > MAXIMO_DE_ITENS) {
            throw new AppError(400, "O pedido tem produtos demais.");
        }

        const vistos = new Set<string>();

        return itens.map((item, indice) => {
            const numero = indice + 1;
            if (!item || typeof item !== "object") {
                throw new AppError(400, `Item ${numero} inválido.`);
            }

            const { produto_id, quantidade } = item as Record<string, unknown>;

            if (typeof produto_id !== "string" || !ehUuid(produto_id)) {
                throw new AppError(400, `Produto inválido no item ${numero}.`);
            }
            if (typeof quantidade !== "number" || !Number.isInteger(quantidade) || quantidade < 1) {
                throw new AppError(400, `Quantidade inválida no item ${numero}.`);
            }
            if (vistos.has(produto_id)) {
                throw new AppError(400, "O mesmo produto foi informado mais de uma vez no pedido.");
            }

            vistos.add(produto_id);
            return { produto_id, quantidade };
        });
    }

    private validarFormaPagamento(valor: unknown): forma_pagamento {
        if (typeof valor !== "string" || !FORMAS_PAGAMENTO.includes(valor)) {
            throw new AppError(400, "Forma de pagamento inválida. Use PIX, CARTAO_CREDITO ou BOLETO.");
        }
        return valor as forma_pagamento;
    }

    private validarEndereco(valor: unknown): string {
        if (typeof valor !== "string" || valor.trim() === "") {
            throw new AppError(400, "Informe o endereço de entrega.");
        }

        const endereco = valor.trim();
        if (endereco.length > 500) {
            throw new AppError(400, "O endereço de entrega deve ter no máximo 500 caracteres.");
        }
        return endereco;
    }
}
