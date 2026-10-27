import { useEffect, useState } from "react";
import type { Pedido } from "../../tipos/pedido";
import { mensagemDeErro } from "../../api/cliente";
import { listarPedidos } from "../../api/pedidos";
import { useAutenticacao } from "../../contexto/useAutenticacao";

/**
 * Busca as compras de quem está logado (GET /orders; o backend já devolve só
 * as da conta, do mais novo pro mais antigo). `recarregar` refaz a busca
 * depois de uma falha.
 */
export function usePedidos() {
  const { token } = useAutenticacao();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  // começa true porque a busca dispara assim que a aba abre
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // muda a cada "Tentar novamente", pra o efeito rodar de novo
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!token) return;
    // se a aba fechar antes da resposta chegar, o resultado é ignorado
    let cancelado = false;

    listarPedidos(token)
      .then((lista) => {
        if (!cancelado) setPedidos(lista);
      })
      .catch((falha: unknown) => {
        if (!cancelado) setErro(mensagemDeErro(falha));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [token, tentativa]);

  function recarregar() {
    setCarregando(true);
    setErro(null);
    setTentativa((atual) => atual + 1);
  }

  return { pedidos, carregando, erro, recarregar };
}
