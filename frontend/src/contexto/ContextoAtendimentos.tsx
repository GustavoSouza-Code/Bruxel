import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ATENDIMENTOS_EXEMPLO } from "../dados/atendimentos";
import { novoAtendimento } from "../crud/atendimentos/novoAtendimento";
import { ContextoAtendimentos } from "./useAtendimentos";
import type { ValorContextoAtendimentos } from "./useAtendimentos";
import type { Atendimento, DadosSolicitacao } from "../tipos/atendimento";

/**
 * Guarda os atendimentos que o cliente pediu e disponibiliza pro formulário
 * (/solicitar-atendimento) e pra aba "Atendimentos" do /perfil. Precisa envolver
 * o app — ver App.tsx.
 *
 * Vive só na memória (recarregar a página volta aos exemplos) e ainda não separa
 * por usuário. TODO: trocar pelas rotas de appointments quando o backend tiver.
 */
export function ProvedorAtendimentos({ children }: { children: ReactNode }) {
  // a função inicial copia os exemplos, pra não alterar o ATENDIMENTOS_EXEMPLO
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(() => [...ATENDIMENTOS_EXEMPLO]);

  const solicitarAtendimento = useCallback((dados: DadosSolicitacao) => {
    // o mais novo entra no topo da lista
    setAtendimentos((atuais) => [novoAtendimento(dados, atuais.length, new Date()), ...atuais]);
  }, []);

  // useMemo: só cria um objeto novo quando a lista muda, pra não re-renderizar à toa quem usa o contexto
  const valor = useMemo<ValorContextoAtendimentos>(
    () => ({ atendimentos, solicitarAtendimento }),
    [atendimentos, solicitarAtendimento]
  );

  return <ContextoAtendimentos.Provider value={valor}>{children}</ContextoAtendimentos.Provider>;
}

export default ProvedorAtendimentos;
