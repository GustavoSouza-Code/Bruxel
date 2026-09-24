// padroniza o estado de um usuário
export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN"
}

// define o esqueleto do usuário
export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    cpf: string;
    phone?: string;
    rua?: string;
    cidade?: string;
    bairro?: string;
    role: UserRole;
}
// objeto de esqueleto para create
export interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
    cpf: string
}
// objeto bruto para login
export interface LoginDTO {
    email: string;
    password: string;
}