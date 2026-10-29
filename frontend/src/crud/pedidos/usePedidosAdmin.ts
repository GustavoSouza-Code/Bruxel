import { useEffect, useState } from "react";
import { mensagemDeErro } from "../../api/cliente";
import { listarPedidos } from "../../api/pedidos";
import { listarUsuarios } from "../../api/usuarios";
import { useAutenticacao } from "../../contexto/useAutenticacao";
import { comNomeDoCliente } from "./filtrarPedidos";
import type { PedidoComCliente } from "./filtrarPedidos";

/**
 * Todos os pedidos da loja, pro painel (GET /orders como administrador), já
 * com o nome de quem comprou: o backend só manda o usuario_id, então os nomes
 * vêm de GET /users. Usado em /admin/pedidos, /admin/pagamentos e na home do painel.
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

    Promise.all([listarPedidos(token), listarUsuarios(token)])
      .then(([lista, usuarios]) => {
        if (!cancelado) setPedidos(comNomeDoCliente(lista, usuarios));
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
