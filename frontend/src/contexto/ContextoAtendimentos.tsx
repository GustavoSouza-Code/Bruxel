import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ATENDIMENTOS_EXEMPLO } from "../dados/atendimentos";
import { novoAtendimento } from "../crud/atendimentos/novoAtendimento";
import { ocupacoesDosAtendimentos } from "../crud/atendimentos/agenda";
import { ContextoAtendimentos } from "./useAtendimentos";
import { useAutenticacao } from "./useAutenticacao";
import type { ValorContextoAtendimentos } from "./useAtendimentos";
import type { Atendimento, DadosSolicitacao } from "../tipos/atendimento";

// os exemplos aparecem pra toda conta, pra aba "Atendimentos" não abrir vazia
const IDS_EXEMPLO = new Set(ATENDIMENTOS_EXEMPLO.map((atendimento) => atendimento.id));

/**
 * Guarda os atendimentos e disponibiliza pro formulário (/solicitar-atendimento),
 * pra aba "Atendimentos" do /perfil e pro painel (/admin/atendimentos). Precisa
 * envolver o app — ver App.tsx.
 *
 * É uma lista só, com os pedidos de todas as contas, os de balcão (cliente sem
 * cadastro) e os exemplos. Cada conta vê os próprios pedidos e os exemplos; o
 * painel vê todos e muda o status deles. A agenda dos atendentes é uma só, então
 * os horários ocupados juntam todos os pedidos. Tudo vive só na memória:
 * recarregar a página volta aos exemplos.
 * TODO: trocar pelas rotas de appointments quando o backend tiver (ver o recado
 * pro backend em docs/superpowers/specs/2026-10-13-gestao-atendimentos-design.md).
 */
export function ProvedorAtendimentos({ children }: { children: ReactNode }) {
  // do mais novo pro mais antigo; a função inicial copia os exemplos pra eles também poderem mudar de status
  const [todosAtendimentos, setTodosAtendimentos] = useState<Atendimento[]>(() => [...ATENDIMENTOS_EXEMPLO]);
  const { usuario } = useAutenticacao();
  const idUsuario = usuario?.id ?? null;

  // a lista da conta: os pedidos em que ela é o cliente (inclusive os abertos pela loja) e os exemplos
  const atendimentos = useMemo(
    () =>
      todosAtendimentos.filter(
        (atendimento) =>
          (idUsuario !== null && atendimento.cliente.id === idUsuario) || IDS_EXEMPLO.has(atendimento.id)
      ),
    [idUsuario, todosAtendimentos]
  );

  // um horário pedido por qualquer conta fica ocupado pra todas
  const ocupacoes = useMemo(() => ocupacoesDosAtendimentos(todosAtendimentos), [todosAtendimentos]);

  const solicitarAtendimento = useCallback((dados: DadosSolicitacao) => {
    // a data do envio é pega aqui fora: a função do setState deve ser pura (o StrictMode chama ela 2 vezes)
    const agora = new Date();
    // numeração única entre todas as contas (como seria no banco), contando os exemplos
    setTodosAtendimentos((atual) => [novoAtendimento(dados, atual.length, agora), ...atual]);
  }, []);

  const atualizarAtendimento = useCallback(
    (id: string, transformar: (atual: Atendimento) => Atendimento) => {
      setTodosAtendimentos((atual) =>
        atual.map((atendimento) => (atendimento.id === id ? transformar(atendimento) : atendimento))
      );
    },
    []
  );

  // useMemo: só cria um objeto novo quando algo muda, pra não re-renderizar à toa quem usa o contexto
  const valor = useMemo<ValorContextoAtendimentos>(
    () => ({ atendimentos, todosAtendimentos, ocupacoes, solicitarAtendimento, atualizarAtendimento }),
    [atendimentos, todosAtendimentos, ocupacoes, solicitarAtendimento, atualizarAtendimento]
  );

  return <ContextoAtendimentos.Provider value={valor}>{children}</ContextoAtendimentos.Provider>;
}

export default ProvedorAtendimentos;
