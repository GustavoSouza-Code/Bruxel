import { startTransition, useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { fazerLogin } from "../api/autenticacao";
import { ContextoAutenticacao } from "./useAutenticacao";
import type { ValorContextoAutenticacao } from "./useAutenticacao";
import { apagarSessao, lerSessao, salvarSessao } from "./sessao";
import type { Sessao } from "./sessao";
import type { UsuarioSessao } from "../tipos/usuario";

/**
 * Guarda quem está logado e disponibiliza pra árvore inteira (Cabecalho,
 * RotaAdmin, páginas). Precisa envolver o app — ver App.tsx.
 *
 * A sessão também vai pro localStorage, então recarregar a página não desloga.
 */
export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  // a função inicial roda só na primeira renderização: o app já nasce com a sessão
  // salva, sem um instante "deslogado" que faria o RotaAdmin mandar pro /entrar
  const [sessao, setSessao] = useState<Sessao | null>(() => lerSessao());

  // useCallback mantém a mesma função entre renderizações; o useUsuarios usa o
  // sair() como dependência de um useEffect e não pode buscar a lista de novo à toa
  const entrar = useCallback(async (email: string, senha: string) => {
    // o cadastro salva o e-mail em minúsculas, então o login compara do mesmo jeito
    const { token, user } = await fazerLogin(email.trim().toLowerCase(), senha);
    const nova: Sessao = { token, usuario: user };
    salvarSessao(nova);
    setSessao(nova);
    return user;
  }, []);

  const sair = useCallback(() => {
    apagarSessao();
    // o React Router troca de página dentro de um startTransition; sem isto, quem faz
    // sair() + navigate("/") numa página protegida renderizaria "deslogado" ainda na
    // página antiga, e o RotaLogado/RotaAdmin mandaria pro /entrar em vez de ir pro "/"
    startTransition(() => setSessao(null));
  }, []);

  // o Cabecalho lê o nome daqui, então editar o perfil precisa refletir na sessão também
  const atualizarDadosSessao = useCallback((usuario: UsuarioSessao) => {
    setSessao((atual) => {
      if (!atual) return atual;
      const nova: Sessao = { token: atual.token, usuario };
      salvarSessao(nova);
      return nova;
    });
  }, []);

  // useMemo: só cria um objeto novo quando a sessão muda, pra não re-renderizar à toa quem usa o contexto
  const valor = useMemo<ValorContextoAutenticacao>(
    () => ({
      usuario: sessao?.usuario ?? null,
      token: sessao?.token ?? null,
      estaLogado: sessao !== null,
      ehAdmin: sessao?.usuario.perfil === "ADMINISTRADOR",
      entrar,
      sair,
      atualizarDadosSessao,
    }),
    [sessao, entrar, sair, atualizarDadosSessao]
  );

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>;
}
