import type { UsuarioSessao } from "../tipos/usuario";

/** O que fica salvo no localStorage enquanto a pessoa está logada. */
export interface Sessao {
  token: string;
  usuario: UsuarioSessao;
}

// o prefixo evita colidir com outras coisas salvas no mesmo endereço (localhost:5173)
const CHAVE_SESSAO = "bruxel:sessao";

/**
 * Lê a sessão salva. Devolve null (e apaga o que estiver salvo) se não houver
 * nada, se o conteúdo estiver corrompido ou se o token já expirou.
 */
export function lerSessao(): Sessao | null {
  try {
    const salvo = localStorage.getItem(CHAVE_SESSAO);
    if (!salvo) return null;
    const sessao = JSON.parse(salvo) as Sessao;
    if (!sessao.token || !sessao.usuario || tokenExpirado(sessao.token)) {
      apagarSessao();
      return null;
    }
    return sessao;
  } catch {
    // JSON quebrado ou token que não dá pra decodificar: começa deslogado
    apagarSessao();
    return null;
  }
}

export function salvarSessao(sessao: Sessao) {
  try {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  } catch {
    // navegador bloqueando o localStorage: a sessão vale só até recarregar a página
  }
}

export function apagarSessao() {
  try {
    localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // sem localStorage não há o que apagar
  }
}

/**
 * Confere o `exp` (validade, em segundos) do JWT. O token tem 3 partes
 * separadas por "."; a do meio é o payload em base64url. Aqui só lemos o
 * payload, sem conferir a assinatura: quem garante que o token é válido de
 * verdade é o backend, em cada requisição.
 */
function tokenExpirado(token: string) {
  const payload = token.split(".")[1];
  if (!payload) return true;
  // base64url usa - e _ no lugar de + e /; o atob só entende base64 normal
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const { exp } = JSON.parse(atob(base64)) as { exp?: number };
  return typeof exp !== "number" || exp * 1000 <= Date.now();
}
