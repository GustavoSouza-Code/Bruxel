import { useCallback, useEffect, useRef, useState } from "react";
import { mensagemDeErro } from "../../api/cliente";
import {
  buscarAReceber,
  buscarKpis,
  buscarReceitaMensal,
  buscarReceitaPorCategoria,
} from "../../api/dashboard";
import { useAutenticacao } from "../../contexto/useAutenticacao";

interface Resultado<T> {
  chave: string;
  dados: T | null;
  erro: string | null;
}

/**
 * Busca genérica dos números do painel. Refaz a busca quando muda o token, as
 * `deps` de quem chamou ou ao chamar `recarregar`. Enquanto a resposta nova não
 * chega, `dados` segue com o último valor e `carregando` fica true.
 */
export function useBusca<T>(buscar: (token: string) => Promise<T>, deps: unknown[]) {
  const { token } = useAutenticacao();
  const [tentativa, setTentativa] = useState(0);
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);

  // a função de busca muda a cada render; guardada aqui, o efeito só depende da chave
  const buscarRef = useRef(buscar);
  useEffect(() => {
    buscarRef.current = buscar;
  });

  const chave = `${token ?? ""}|${tentativa}|${JSON.stringify(deps)}`;

  useEffect(() => {
    if (!token) return;
    // se a tela fechar (ou os parâmetros mudarem) antes da resposta, ela é ignorada
    let cancelado = false;

    buscarRef
      .current(token)
      .then((dados) => {
        if (!cancelado) setResultado({ chave, dados, erro: null });
      })
      .catch((falha: unknown) => {
        if (!cancelado) {
          setResultado((atual) => ({ chave, dados: atual?.dados ?? null, erro: mensagemDeErro(falha) }));
        }
      });

    return () => {
      cancelado = true;
    };
  }, [token, chave]);

  const recarregar = useCallback(() => setTentativa((atual) => atual + 1), []);

  return {
    dados: resultado?.dados ?? null,
    carregando: resultado?.chave !== chave,
    erro: resultado?.chave === chave ? resultado.erro : null,
    recarregar,
  };
}

export function useKpis() {
  return useBusca(buscarKpis, []);
}

export function useReceitaMensal(meses: number) {
  return useBusca((token) => buscarReceitaMensal(token, meses), [meses]);
}

export function useReceitaPorCategoria() {
  return useBusca(buscarReceitaPorCategoria, []);
}

export function useAReceber() {
  return useBusca(buscarAReceber, []);
}
