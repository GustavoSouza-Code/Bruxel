import { CreateCategoryDTO, UpdateCategoryDTO } from "../models/category";
import { CategoriesRepository } from "../repository/categoriesRepository";
import { RegraValidacao, validarCamposObrigatorios } from "../utils/validaObrigatorios";
import { AppError } from "../errors/AppError";
import { ehUuid } from "../utils/validacoes";

// a tabela categories guarda o nome em VARCHAR(80)
const TAMANHO_MAXIMO_NOME = 80;

const regrasCriarCategoria: RegraValidacao[] = [
    { campo: "nome", mensagem: "O nome da categoria é obrigatório." },
];

// camada service de categorias, com as regras usadas pelo catálogo e pelo CRUD
export class CategoriesService {
    private categoriesRepository = new CategoriesRepository();

    // cadastro de categoria (rota protegida por admin)
    async create(categoria: CreateCategoryDTO) {
        const corpo = (categoria ?? {}) as CreateCategoryDTO;
        const validacao = validarCamposObrigatorios(corpo, regrasCriarCategoria);
        if (validacao.length > 0) {
            throw new AppError(400, "Dados inválidos.", validacao);
        }

        const nome = this.validarNome(corpo.nome);
        await this.validarNomeUnico(nome);

        return this.categoriesRepository.create({ nome });
    }

    // leitura usada pelo catálogo e pelo cadastro de produtos
    async getAll() {
        return this.categoriesRepository.getAll();
    }

    async getById(id: string) {
        if (!ehUuid(id)) {
            throw new AppError(404, "Categoria não encontrada.");
        }

        const categoria = await this.categoriesRepository.getById(id);
        if (!categoria) {
            throw new AppError(404, "Categoria não encontrada.");
        }
        return categoria;
    }

    // atualização: confere a existência e o nome antes de gravar
    async update(id: string, data: UpdateCategoryDTO) {
        await this.getById(id);

        const corpo = (data ?? {}) as UpdateCategoryDTO;
        const validacao = validarCamposObrigatorios(corpo, regrasCriarCategoria);
        if (validacao.length > 0) {
            throw new AppError(400, "Dados inválidos.", validacao);
        }

        const nome = this.validarNome(corpo.nome);
        await this.validarNomeUnico(nome, id);

        return this.categoriesRepository.update(id, { nome });
    }

    // exclusão: não permite apagar categoria com produtos vinculados
    async delete(id: string) {
        const categoria = await this.getById(id);
        const produtos = await this.categoriesRepository.countProducts(categoria.id);
        if (produtos > 0) {
            throw new AppError(409, "Não é possível excluir uma categoria vinculada a produtos.");
        }

        return this.categoriesRepository.delete(id);
    }

    private validarNome(valor: unknown): string {
        if (typeof valor !== "string") {
            throw this.erroCampo("nome", "O nome da categoria deve ser um texto.");
        }

        const nome = valor.trim();
        if (nome.length > TAMANHO_MAXIMO_NOME) {
            throw this.erroCampo("nome", `O nome da categoria deve ter no máximo ${TAMANHO_MAXIMO_NOME} caracteres.`);
        }
        return nome;
    }

    private async validarNomeUnico(nome: string, idAtual?: string) {
        const existente = await this.categoriesRepository.getByNome(nome);
        if (existente && existente.id !== idAtual) {
            throw new AppError(409, "Já existe uma categoria com esse nome.");
        }
    }

    private erroCampo(campo: string, mensagem: string): AppError {
        return new AppError(400, mensagem, [{ campo, mensagem }]);
    }
}
