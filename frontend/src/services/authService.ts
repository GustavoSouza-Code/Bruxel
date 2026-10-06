import { apiRequest } from "./api";

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    nome: string;
  };
}

/** Chamadas de autenticação — ver backend/src/routes/authRoutes.ts */
export const authService = {
  login: (payload: LoginPayload) =>
    apiRequest<LoginResponse>("/auth/login", { method: "POST", body: payload }),
};
