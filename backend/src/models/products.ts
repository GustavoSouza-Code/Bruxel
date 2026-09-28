// cria o objeto produto e seus atributos

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

export interface CreateProductDTO {
    categoria_id: string;
    nome: string;
    codigo: string;
    preco: number;
}

export interface UpdateProductDTO {
    categoria_id: string;
    codigo: string;
    nome: string;
    descricao?: string | null;
    preco: number;
    estoque: number;
    url_imagem: string | null;
    ativo: boolean;
}