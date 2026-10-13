import { requisicao } from "./cliente";
import type { Usuario } from "../tipos/usuario";

/** O que o cadastro envia (POST /users). O perfil o banco define sozinho (CLIENTE). */
export interface DadosNovoUsuario {
  nome: string;
  email: string;
  /** só dígitos, igual ao banco */
  cpf: string;
  senha: string;
}

/** Campos que o PUT /users/:id aceita; o backend ignora o resto (inclusive o CPF). */
export type CamposAtualizacaoUsuario = Partial<
  Pick<Usuario, "nome" | "email" | "telefone" | "rua" | "numero" | "bairro" | "cidade" | "estado" | "cep">
>;

/** Lista todos os usuários (só administrador). */
export function listarUsuarios(token: string) {
  return requisicao<Usuario[]>("/users", { token });
}

/**
 * Busca um usuário pelo id. Hoje a rota é só de administrador; o perfil
 * (/perfil) usa ela com o id de quem está logado, e o backend ainda precisa
 * liberar o acesso pro próprio usuário.
 */
export function buscarUsuario(token: string, id: string) {
  return requisicao<Usuario>(`/users/${id}`, { token });
}

// o cadastro é público (não manda token): é assim que um visitante cria a conta
export function criarUsuario(dados: DadosNovoUsuario) {
  return requisicao<Usuario>("/users", { metodo: "POST", corpo: dados });
}

/**
 * Altera só os campos enviados e devolve o usuário atualizado. Hoje é só de
 * administrador; o perfil também usa, à espera de o backend liberar pro próprio usuário.
 */
export function atualizarUsuario(token: string, id: string, campos: CamposAtualizacaoUsuario) {
  return requisicao<Usuario>(`/users/${id}`, { metodo: "PUT", corpo: campos, token });
}

/** Apaga o usuário e devolve os dados dele (só administrador). */
export function excluirUsuario(token: string, id: string) {
  return requisicao<Usuario>(`/users/${id}`, { metodo: "DELETE", token });
}
