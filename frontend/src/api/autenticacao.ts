import { requisicao } from "./cliente";
import type { UsuarioSessao } from "../tipos/usuario";

/** Resposta do POST /auth/login. */
export interface RespostaLogin {
  mensagem: string;
  /** JWT (vale 5 dias); vai no header Authorization das rotas protegidas */
  token: string;
  user: UsuarioSessao;
}

/**
 * Faz login na API. Quem guarda o token e o usuário é o ContextoAutenticacao
 * (use o entrar() dele nas telas, não esta função direto).
 */
export function fazerLogin(email: string, senha: string) {
  return requisicao<RespostaLogin>("/auth/login", { metodo: "POST", corpo: { email, senha } });
}
