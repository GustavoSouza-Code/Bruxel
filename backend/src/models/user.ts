// cria o objeto usuário e seus atributos

// padroniza o estado de um usuário
export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN"
}

// define o esqueleto do usuário
export interface User {
    id: string;
    nome: string;
    email: string;
    senha: string;
    cpf: string;
    phone?: string;
    rua?: string;
    cidade?: string;
    bairro?: string;
    estado?: string;
    cep?: string;
    role: UserRole;
    criado_em: Date | string;
    atualizado_em: Date | string;
}
// objeto de esqueleto para create
export interface CreateUserDTO {
    nome: string;
    email: string;
    senha: string;
    cpf: string;
}

export interface UpdateUserDTO {
    nome?: string
    email?: string
    senha?: string
    phone?: string
    rua?: string
    cidade?: string
    bairro?: string
    estado?: string;
    cep?: string;
}

// objeto bruto para login
export interface LoginDTO {
    email: string;
    senha: string;
}