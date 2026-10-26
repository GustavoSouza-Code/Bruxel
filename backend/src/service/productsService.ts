import { CreateProductDTO, UpdateProductDTO } from "../models/products";
import { ProductsRepository } from "../repository/productsRepository";
import { CategoriesRepository } from "../repository/categoriesRepository";
import { RegraValidacao, validarCamposObrigatorios } from "../utils/validaObrigatorios";
import { AppError } from "../errors/AppError";
import { ehUuid } from "../utils/validacoes";

// campos obrigatórios do cadastro
const regrasCriarProduto: RegraValidacao[] = [
    { campo: "categoria_id", mensagem: "Adicione uma categoria ao produto." },
    { campo: "nome", mensagem: "Adicione um nome ao produto." },
    { campo: "codigo", mensagem: "Adicione um código ao produto." },
    { campo: "preco", mensagem: "Adicione um preço ao produto." },
];

// limite da coluna NUMERIC(10,2) do banco
const PRECO_MAXIMO = 99999999.99;

// camada service de produtos, com regras de negócio e validações necessárias
export class ProductsService {
    private productsRepository = new ProductsRepository();
    private categoriesRepository = new CategoriesRepository();

    // cadastro: valida e normaliza os campos antes de gravar
    async create(product: CreateProductDTO) {
        const validacao = validarCamposObrigatorios(product ?? {}, regrasCriarProduto);
        if (validacao.length > 0) {
            throw new AppError(400, "Dados inválidos.", validacao);
        }

        const dados = await this.montarDados(product);

        // os campos obrigatórios já foram conferidos acima
        return this.productsRepository.create(dados as CreateProductDTO);
    }

    // leitura do catálogo e busca por id
    async getAll() {
        return this.productsRepository.getAll();
    }

    async getById(id: string) {
        // id fora do formato UUID faria o banco lançar erro (500); aqui já responde 404
        if (!ehUuid(id)) {
            throw new AppError(404, "Produto não encontrado");
        }

        const produto = await this.productsRepository.getById(id);
        if (!produto) {
            throw new AppError(404, "Produto não encontrado");
        }
        return produto;
    }

    // atualização: só os campos enviados entram no update
    async update(id: string, data: UpdateProductDTO) {
        await this.getById(id);

        const dados = await this.montarDados(data ?? {}, id);
        return this.productsRepository.update(id, dados);
    }

    // exclusão: confirma que o produto existe antes de apagar
    async delete(id: string) {
        await this.getById(id);
        return this.productsRepository.delete(id);
    }

    // valida e normaliza os campos presentes, no cadastro e na atualização
    private async montarDados(corpo: UpdateProductDTO, idAtual?: string): Promise<UpdateProductDTO> {
        const dados: UpdateProductDTO = {};

        if (corpo.categoria_id !== undefined) {
            dados.categoria_id = await this.validarCategoria(corpo.categoria_id);
        }
        if (corpo.nome !== undefined) {
            dados.nome = this.validarTexto(corpo.nome, "nome", "nome", 150);
        }
        if (corpo.codigo !== undefined) {
            const codigo = this.validarTexto(corpo.codigo, "codigo", "código", 160);
            const existente = await this.productsRepository.getByCodigo(codigo);
            if (existente && existente.id !== idAtual) {
                throw new AppError(409, "Um produto com esse código já existe.");
            }
            dados.codigo = codigo;
        }
        if (corpo.preco !== undefined) {
            dados.preco = this.validarPreco(corpo.preco);
        }
        if (corpo.descricao !== undefined) {
            dados.descricao = this.validarTextoOpcional(corpo.descricao, "descricao", "descrição");
        }
        if (corpo.estoque !== undefined) {
            dados.estoque = this.validarEstoque(corpo.estoque);
        }
        if (corpo.url_imagem !== undefined) {
            dados.url_imagem = this.validarTextoOpcional(corpo.url_imagem, "url_imagem", "URL da imagem");
        }
        if (corpo.ativo !== undefined) {
            dados.ativo = this.validarAtivo(corpo.ativo);
        }

        return dados;
    }

    private async validarCategoria(valor: unknown): Promise<string> {
        if (typeof valor !== "string" || !ehUuid(valor)) {
            throw this.erroCampo("categoria_id", "Categoria inválida.");
        }

        const categoria = await this.categoriesRepository.getById(valor);
        if (!categoria) {
            throw this.erroCampo("categoria_id", "Categoria não encontrada.");
        }
        return valor;
    }

    private validarTexto(valor: unknown, campo: string, rotulo: string, maximo: number): string {
        if (typeof valor !== "string") {
            throw this.erroCampo(campo, `O ${rotulo} é obrigatório.`);
        }

        const texto = valor.trim();
        if (texto === "") {
            throw this.erroCampo(campo, `O ${rotulo} é obrigatório.`);
        }
        if (texto.length > maximo) {
            throw this.erroCampo(campo, `O ${rotulo} deve ter no máximo ${maximo} caracteres.`);
        }
        return texto;
    }

    private validarTextoOpcional(valor: unknown, campo: string, rotulo: string): string | null {
        if (valor === null) return null;
        if (typeof valor !== "string") {
            throw this.erroCampo(campo, `O ${rotulo} deve ser um texto.`);
        }

        const texto = valor.trim();
        return texto === "" ? null : texto;
    }

    private validarPreco(valor: unknown): number {
        if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
            throw this.erroCampo("preco", "O preço deve ser um número maior que zero.");
        }

        // o banco guarda duas casas decimais
        const preco = Math.round(valor * 100) / 100;
        if (preco <= 0) {
            throw this.erroCampo("preco", "O preço deve ser um número maior que zero.");
        }
        if (preco > PRECO_MAXIMO) {
            throw this.erroCampo("preco", "O preço máximo é R$ 99.999.999,99.");
        }
        return preco;
    }

    private validarEstoque(valor: unknown): number {
        if (typeof valor !== "number" || !Number.isInteger(valor) || valor < 0) {
            throw this.erroCampo("estoque", "O estoque deve ser um inteiro maior ou igual a zero.");
        }
        return valor;
    }

    private validarAtivo(valor: unknown): boolean {
        if (typeof valor !== "boolean") {
            throw this.erroCampo("ativo", "O campo ativo deve ser verdadeiro ou falso.");
        }
        return valor;
    }

    private erroCampo(campo: string, mensagem: string): AppError {
        return new AppError(400, mensagem, [{ campo, mensagem }]);
    }
}
