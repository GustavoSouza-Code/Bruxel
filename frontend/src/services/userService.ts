import { apiRequest } from "./api";

/** Igual ao CreateUserDTO do backend (backend/src/models/user.ts) */
export interface CreateUserPayload {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
}

/**
 * Campos aceitos na atualização (backend/src/service/userService.ts ->
 * `permitidos`). Repare que o backend usa `telefone`/`numero`, não
 * `phone` como o `UpdateUserDTO` do modelo sugere — segue o que o
 * repository realmente aceita.
 */
export interface UpdateUserPayload {
  nome?: string;
  email?: string;
  senha?: string;
  telefone?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

/**
 * Usuário como o backend devolve (backend/src/repository/userRepository.ts
 * -> camposPublicosUsuario). A senha nunca vem nessa resposta.
 */
export interface ApiUser {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  perfil: "CLIENTE" | "ADMINISTRADOR";
  criado_em: string;
  atualizado_em: string;
}

/**
 * Funções de acesso à API de usuários (backend/src/routes/userRoutes.ts).
 * getAll/getById/update/delete exigem token de administrador — passe o
 * token obtido no login (ver context/AuthContext).
 */
export const userService = {
  create: (payload: CreateUserPayload) =>
    apiRequest<ApiUser>("/users", { method: "POST", body: payload }),

  getAll: (token: string) => apiRequest<ApiUser[]>("/users", { token }),

  getById: (id: string, token: string) =>
    apiRequest<ApiUser>(`/users/${id}`, { token }),

  update: (id: string, payload: UpdateUserPayload, token: string) =>
    apiRequest<ApiUser>(`/users/${id}`, { method: "PUT", body: payload, token }),

  delete: (id: string, token: string) =>
    apiRequest<ApiUser>(`/users/${id}`, { method: "DELETE", token }),
};
