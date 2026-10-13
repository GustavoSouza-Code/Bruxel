import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ATENDIMENTOS_EXEMPLO } from "../dados/atendimentos";
import { novoAtendimento } from "../crud/atendimentos/novoAtendimento";
import { ContextoAtendimentos } from "./useAtendimentos";
import { useAutenticacao } from "./useAutenticacao";
import type { ValorContextoAtendimentos } from "./useAtendimentos";
import type { Atendimento, DadosSolicitacao } from "../tipos/atendimento";

/**
 * Guarda os atendimentos que o cliente pediu e disponibiliza pro formulário
 * (/solicitar-atendimento) e pra aba "Atendimentos" do /perfil. Precisa envolver
 * o app — ver App.tsx.
 *
 * Os dados ficam separados por conta (pelo id do usuário logado), mas vivem só na
 * memória: recarregar a página volta aos exemplos.
 * TODO: trocar pelas rotas de appointments quando o backend tiver (ele devolve só
 * os atendimentos do próprio usuário logado).
 */
export function ProvedorAtendimentos({ children }: { children: ReactNode }) {
  // atendimentos pedidos por cada conta, pelo id do usuário logado; uma conta que
  // ainda não pediu nada vê os exemplos
  const [porUsuario, setPorUsuario] = useState<Record<string, Atendimento[]>>({});
  const { usuario } = useAutenticacao();
  const idUsuario = usuario?.id ?? null;

  const atendimentos = (idUsuario ? porUsuario[idUsuario] : undefined) ?? ATENDIMENTOS_EXEMPLO;

  const solicitarAtendimento = useCallback(
    (dados: DadosSolicitacao) => {
      // sem ninguém logado não há de quem guardar (a rota do formulário já exige login)
      if (!idUsuario) return;
      // a data do envio é pega aqui fora: a função do setState deve ser pura (o StrictMode chama ela 2 vezes)
      const agora = new Date();
      setPorUsuario((atual) => {
        const lista = atual[idUsuario] ?? ATENDIMENTOS_EXEMPLO;
        // o mais novo entra no topo da lista dessa conta
        return { ...atual, [idUsuario]: [novoAtendimento(dados, lista.length, agora), ...lista] };
      });
    },
    [idUsuario]
  );

  // useMemo: só cria um objeto novo quando a lista muda, pra não re-renderizar à toa quem usa o contexto
  const valor = useMemo<ValorContextoAtendimentos>(
    () => ({ atendimentos, solicitarAtendimento }),
    [atendimentos, solicitarAtendimento]
  );

  return <ContextoAtendimentos.Provider value={valor}>{children}</ContextoAtendimentos.Provider>;
}

export default ProvedorAtendimentos;
