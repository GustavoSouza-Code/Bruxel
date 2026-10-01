import {CreateProductDTO, UpdateProductDTO} from "../models/products";
import {ProductsRepository} from "../repository/productsRepository";
import {validarCamposObrigatorios, regraValidacao} from "../utils/validaObrigatorios";
import {AppError} from "../errors/AppError";

// array de regras
const regrasCriarProduto: regraValidacao[] = [
    {campo: 'categoria_id', mensagem: 'Adicione uma categoria ao produto. '},
    {campo: 'nome', mensagem: 'Adicione um nome ao produto.'},
    {campo: 'codigo', mensagem: 'Adicione um código ao produto.'},
    {campo: 'preco', mensagem: 'Adicione um preço ao produto.'},
]

// camada service de produtos, com regras de negócio e validações necessárias

export class ProductsService {
    private productsRepository = new ProductsRepository();

    async create(product: CreateProductDTO) {
        const validacao = validarCamposObrigatorios(product ?? {}, regrasCriarProduto);
        if (validacao.length > 0) {
            throw new AppError(400, "Dados inválidos.", validacao);
        }

        const dados: CreateProductDTO = {
            categoria_id: String(product.categoria_id),
            nome: String(product.nome).trim(),
            codigo: String(product.codigo).trim(),
            preco: product.preco,
        };
        this.validarPreco(dados.preco);

        const produtoExiste = await this.productsRepository.getByCodigo(dados.codigo);
        if (produtoExiste) {
            throw new AppError(409, "Um produto com esse código já existe.");
        }

        return await this.productsRepository.create(dados);
    }

    async getAll() {
        return await this.productsRepository.getAll();
    }

    async getById(id: string) {
        const produto = await this.productsRepository.getById(id);
        if (!produto) {
            throw new AppError(404, "Produto não encontrado");
        }
        return produto;
    }

    async update(id: string, data: UpdateProductDTO) {
        const permitidos = ["categoria_id", "codigo", "nome", "descricao", "preco", "estoque", "url_imagem", "ativo"] as const;
        const dados: Record<string, unknown> = {};
        for (const campo of permitidos) {
            if (data[campo] !== undefined) dados[campo] = data[campo];
        }
        if (dados.preco !== undefined) this.validarPreco(dados.preco);
        if (dados.estoque !== undefined && (!Number.isInteger(dados.estoque) || (dados.estoque as number) < 0)) {
            throw new AppError(400, "O estoque deve ser um inteiro maior ou igual a zero.");
        }

        await this.getById(id);
        return await this.productsRepository.update(id, data);
    }

    async delete(id: string) {
        await this.getById(id);
        return await this.productsRepository.delete(id);
    }

    private validarPreco(preco: unknown) {
        if (typeof preco !== "number" || !Number.isFinite(preco) || preco <= 0) {
            throw new AppError(400, "O preço deve ser um número maior que zero.");
        }
    }

}


