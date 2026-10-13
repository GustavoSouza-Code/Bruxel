import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ATENDIMENTOS_EXEMPLO } from "../dados/atendimentos";
import { novoAtendimento } from "../crud/atendimentos/novoAtendimento";
import { ocupacoesDosAtendimentos } from "../crud/atendimentos/agenda";
import { ContextoAtendimentos } from "./useAtendimentos";
import { useAutenticacao } from "./useAutenticacao";
import type { ValorContextoAtendimentos } from "./useAtendimentos";
import type { Atendimento, DadosSolicitacao } from "../tipos/atendimento";

/**
 * Guarda os atendimentos que o cliente pediu e disponibiliza pro formulário
 * (/solicitar-atendimento) e pra aba "Atendimentos" do /perfil. Precisa envolver
 * o app — ver App.tsx.
 *
 * Cada conta vê os próprios pedidos (pelo id do usuário logado) e os exemplos.
 * A agenda dos atendentes é uma só, então os horários ocupados juntam os pedidos
 * de todas as contas. Tudo vive só na memória: recarregar a página volta aos exemplos.
 * TODO: trocar pelas rotas de appointments quando o backend tiver (ele devolve só
 * os atendimentos do próprio usuário e confere os conflitos de horário).
 */
export function ProvedorAtendimentos({ children }: { children: ReactNode }) {
  // pedidos novos de cada conta, pelo id do usuário logado (os exemplos ficam de fora)
  const [novosPorUsuario, setNovosPorUsuario] = useState<Record<string, Atendimento[]>>({});
  const { usuario } = useAutenticacao();
  const idUsuario = usuario?.id ?? null;

  // a lista da conta: os pedidos dela (mais novo primeiro) e depois os exemplos
  const atendimentos = useMemo(
    () => [...((idUsuario ? novosPorUsuario[idUsuario] : undefined) ?? []), ...ATENDIMENTOS_EXEMPLO],
    [idUsuario, novosPorUsuario]
  );

  // um horário pedido por qualquer conta fica ocupado pra todas
  const ocupacoes = useMemo(
    () => ocupacoesDosAtendimentos([...Object.values(novosPorUsuario).flat(), ...ATENDIMENTOS_EXEMPLO]),
    [novosPorUsuario]
  );

  const solicitarAtendimento = useCallback(
    (dados: DadosSolicitacao) => {
      // sem ninguém logado não há de quem guardar (a rota do formulário já exige login)
      if (!idUsuario) return;
      // a data do envio é pega aqui fora: a função do setState deve ser pura (o StrictMode chama ela 2 vezes)
      const agora = new Date();
      setNovosPorUsuario((atual) => {
        const proprios = atual[idUsuario] ?? [];
        // a numeração conta os exemplos também, que são os primeiros da lista
        const novo = novoAtendimento(dados, proprios.length + ATENDIMENTOS_EXEMPLO.length, agora);
        return { ...atual, [idUsuario]: [novo, ...proprios] };
      });
    },
    [idUsuario]
  );

  // useMemo: só cria um objeto novo quando algo muda, pra não re-renderizar à toa quem usa o contexto
  const valor = useMemo<ValorContextoAtendimentos>(
    () => ({ atendimentos, ocupacoes, solicitarAtendimento }),
    [atendimentos, ocupacoes, solicitarAtendimento]
  );

  return <ContextoAtendimentos.Provider value={valor}>{children}</ContextoAtendimentos.Provider>;
}

export default ProvedorAtendimentos;
