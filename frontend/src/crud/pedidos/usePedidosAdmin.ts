import { useEffect, useState } from "react";
import { mensagemDeErro } from "../../api/cliente";
import { alterarStatusPedido, listarPedidos } from "../../api/pedidos";
import { useAutenticacao } from "../../contexto/useAutenticacao";
import { comNomeDoCliente } from "./filtrarPedidos";
import type { StatusAlteravel } from "../../tipos/pedido";
import type { PedidoComCliente } from "./filtrarPedidos";

/**
 * Todos os pedidos da loja, pro painel (GET /orders como administrador), já
 * com o nome de quem comprou (vem no próprio GET /orders). `alterarStatus`
 * muda o status pelo PATCH /orders/:id/status e atualiza o pedido na lista; se a
 * API recusar, lança o erro pra quem chamou mostrar (não mexe em `erro`).
 * Usado em /admin/pedidos, /admin/pagamentos e na home do painel.
 */
export function usePedidosAdmin() {
  const { token } = useAutenticacao();
  const [pedidos, setPedidos] = useState<PedidoComCliente[]>([]);
  // começa true porque a busca dispara assim que a tela abre
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // muda a cada "Tentar novamente", pra o efeito rodar de novo
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!token) return;
    // se a tela fechar antes da resposta chegar, o resultado é ignorado
    let cancelado = false;

    listarPedidos(token)
      .then((lista) => {
        if (!cancelado) setPedidos(comNomeDoCliente(lista));
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

  async function alterarStatus(id: string, status: StatusAlteravel): Promise<PedidoComCliente> {
    const atualizado = comNomeDoCliente([await alterarStatusPedido(token ?? "", id, status)])[0];
    setPedidos((atuais) => atuais.map((pedido) => (pedido.id === id ? atualizado : pedido)));
    return atualizado;
  }

  return { pedidos, carregando, erro, recarregar, alterarStatus };
}
