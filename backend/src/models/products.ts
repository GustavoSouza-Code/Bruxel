// tipos usados no CRUD de produtos

// produto como vem do banco
export interface Product {
    id: string;
    categoria_id: string;
    codigo: string;
    nome: string;
    descricao?: string | null;
    preco: number;
    estoque: number;
    url_imagem: string | null;
    ativo: boolean;
    criado_em: Date | string;
    atualizado_em: Date | string;
}

// o POST aceita os campos básicos e, opcionalmente, os demais. O frontend
// atual manda só os quatro primeiros e completa o resto num PUT; os dois
// formatos continuam funcionando.
export interface CreateProductDTO {
    categoria_id: string;
    nome: string;
    codigo: string;
    preco: number;
    descricao?: string | null;
    estoque?: number;
    url_imagem?: string | null;
    ativo?: boolean;
}

// o PUT só altera os campos de produto; id e datas ficam de fora de propósito
export type UpdateProductDTO = Partial<
    Pick<Product, "categoria_id" | "codigo" | "nome" | "descricao" | "preco" | "estoque" | "url_imagem" | "ativo">
>;
