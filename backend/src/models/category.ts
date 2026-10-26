// tipos usados no CRUD de categorias

// categoria como vem do banco
export interface Category {
    id: string;
    nome: string;
}

// entrada do cadastro
export interface CreateCategoryDTO {
    nome: string;
}

// a atualização aceita apenas o nome
export type UpdateCategoryDTO = Partial<Pick<Category, "nome">>;
