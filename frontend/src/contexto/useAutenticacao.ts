import { createContext, useContext } from "react";
import type { UsuarioSessao } from "../tipos/usuario";

/** Tudo que os componentes conseguem ler e usar da sessão via useAutenticacao(). */
export interface ValorContextoAutenticacao {
  /** usuário logado; null = ninguém logado */
  usuario: UsuarioSessao | null;
  /** JWT enviado nas rotas protegidas da API; null = ninguém logado */
  token: string | null;
  estaLogado: boolean;
  ehAdmin: boolean;
  /** faz login na API e guarda a sessão; se der errado, a promessa rejeita com um ErroApi */
  entrar: (email: string, senha: string) => Promise<UsuarioSessao>;
  /** encerra a sessão (quem chama decide pra onde navegar depois) */
  sair: () => void;
}

// começa como null pra useAutenticacao() conseguir detectar o uso fora do ProvedorAutenticacao.
// Fica neste arquivo (e não no ContextoAutenticacao.tsx) porque o Fast Refresh do Vite
// pede que arquivos de componente exportem só componentes
export const ContextoAutenticacao = createContext<ValorContextoAutenticacao | null>(null);

/**
 * Atalho pra acessar a sessão: `const { usuario, entrar, sair } = useAutenticacao()`.
 * Lança erro se for usado fora do ProvedorAutenticacao.
 */
export function useAutenticacao() {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) {
    throw new Error("useAutenticacao deve ser usado dentro de um ProvedorAutenticacao");
  }
  return contexto;
}
