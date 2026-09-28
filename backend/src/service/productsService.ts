import {CreateProductDTO, UpdateProductDTO} from "../models/products";
import {productsRepository} from "../repository/productsRepository";
import {validarCamposObrigatorios, regraValidacao} from "../utils/validaObrigatorios";

// array de regras
const regrasCriarProduto: regraValidacao[] = [
    {campo: 'categoria_id', mensagem: 'Adicione uma categoria ao produto. '},
    {campo: 'nome', mensagem: 'Adicione um nome ao produto.'},
    {campo: 'codigo', mensagem: 'Adicione um código ao produto.'},
    {campo: 'preco', mensagem: 'Adicione um preço ao produto.'},
]

// camada service de produtos, com regras de negócio e validações necessárias

export class ProductsService {
    private productsRepository = new productsRepository();

    async create(product: CreateProductDTO) {

        const categoria_id = product.categoria_id;
        const nome = product.nome;
        const codigo = product.codigo;
        const preco = product.preco;

        const validacao = validarCamposObrigatorios(product, regrasCriarProduto)

        if (validacao.length > 0) {
            throw new Error(JSON.stringify(validacao));
        }

        if (product.preco < 0) {
            throw new Error("O preço do produto deve ser maior do que zero.");
        }

        const produtoExiste = await this.productsRepository.getByCodigo(product.codigo)
        if (produtoExiste) {
            throw new Error("Um produto com esse código já existe.");
        }

        const novoProduto = await this.productsRepository.create(product);
        return novoProduto;
    }

    async getAll() {
        return await this.productsRepository.getAll();
    }

    async getById(id: string) {
        const produto = await this.productsRepository.getById(id);
        if (!produto) {
            throw new Error("Produto não encontrado");
        }
        return produto;
    }

    async update(id: string, data: UpdateProductDTO) {
        await this.getById(id);
        return await this.productsRepository.update(id, data);
    }

    async delete(id: string) {
        await this.getById(id);
        return await this.productsRepository.delete(id);
    }
}
