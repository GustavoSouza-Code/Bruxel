// tipos usados no cadastro, login e atualização de usuários

import { perfil_usuario } from "../generated/prisma/enums";

// usuário como vem do banco (a senha só é usada no login)
export interface User {
    id: string;
    nome: string;
    email: string;
    senha: string;
    cpf: string;
    telefone?: string | null;
    rua?: string | null;
    numero?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
    perfil: perfil_usuario;
    criado_em: Date | string;
    atualizado_em: Date | string;
}

// dados do usuário disponíveis em req.usuario depois do verificaToken
export type UsuarioAutenticado = Pick<User, "id" | "nome" | "email" | "perfil">;

// entrada do cadastro
export interface CreateUserDTO {
    nome: string;
    email: string;
    senha: string;
    cpf: string;
}

// campos aceitos na atualização; senhaAtual só confirma a troca da própria senha
export interface UpdateUserDTO {
    nome?: string;
    email?: string;
    senha?: string;
    senhaAtual?: string;
    telefone?: string | null;
    rua?: string | null;
    numero?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
}

// entrada do login
export interface LoginDTO {
    email: string;
    senha: string;
}
