import { CategoriesRepository } from "../repository/categoriesRepository";

// camada service de categorias, com as regras de leitura usadas pelo catálogo
export class CategoriesService {
    private categoriesRepository = new CategoriesRepository();

    // leitura usada pelo catálogo e pelo cadastro de produtos
    async getAll() {
        return this.categoriesRepository.getAll();
    }
}
