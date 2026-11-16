import { useEffect, useRef, useState } from "react";
import { ErroApi, mensagemDeErro } from "../../../../../api/cliente";
import { useAvisos } from "../../../../../contexto/useAvisos";
import type { PedidoComCliente } from "../../../../../crud/pedidos/filtrarPedidos";
import { codigoPedido, podeCancelar, proximoPasso } from "../../../../../crud/pedidos/opcoesPedido";
import type { StatusAlteravel } from "../../../../../tipos/pedido";
import "../../../lista-admin.css";
import "./AcoesPedido.css";

interface Props {
  pedido: PedidoComCliente;
  onAlterar: (status: StatusAlteravel) => Promise<unknown>;
  onRecarregar: () => void;
  /** true enquanto a lista recarrega: o status mostrado pode estar velho, então trava os botões */
  carregando?: boolean;
}

/**
 * Rodapé do detalhe do pedido: o botão do próximo passo (enviar ou entregar) e o
 * "Cancelar pedido", que pede confirmação. Se o status mudou em outro lugar, o
 * backend responde 409 e aparece o "Atualizar pedidos". Não renderiza nada quando
 * o pedido já foi entregue ou cancelado.
 */
export function AcoesPedido({ pedido, onAlterar, onRecarregar, carregando = false }: Props) {
  const { avisar } = useAvisos();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<{ mensagem: string; conflito: boolean } | null>(null);
  // ao entregar ou cancelar o componente passa a devolver null, mas continua montado;
  // a ref evita mexer no estado depois que o modal fecha
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const passo = proximoPasso(pedido.status);
  const cancelavel = podeCancelar(pedido.status);
  if (!passo && !cancelavel) return null;

  async function executar(status: StatusAlteravel, aviso: string) {
    if (salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      await onAlterar(status);
      avisar({ tipo: "sucesso", mensagem: aviso });
    } catch (falha) {
      if (montado.current) {
        setErro({ mensagem: mensagemDeErro(falha), conflito: falha instanceof ErroApi && falha.status === 409 });
      }
    } finally {
      if (montado.current) setSalvando(false);
    }
  }

  // recarregar mantém o modal aberto: sem limpar aqui, o aviso de conflito ficaria na tela
  function atualizar() {
    setErro(null);
    onRecarregar();
  }

  function cancelar() {
    const codigo = codigoPedido(pedido.id);
    if (!window.confirm(`Cancelar o pedido #${codigo}? Os itens voltam para o estoque e não dá para desfazer.`)) return;
    void executar("CANCELADO", "Pedido cancelado.");
  }

  return (
    <div className="acoes-pedido">
      {erro && (
        <div className="acoes-pedido__erro" role="alert">
          <span>{erro.mensagem}</span>
          {erro.conflito && (
            <button type="button" className="lista-admin__botao lista-admin__botao--contorno" onClick={atualizar}>
              Atualizar pedidos
            </button>
          )}
        </div>
      )}
      <div className="acoes-pedido__botoes">
        {passo && (
          <button
            type="button"
            className="lista-admin__botao acoes-pedido__principal"
            disabled={salvando || carregando}
            onClick={() => void executar(passo.status, passo.aviso)}
          >
            {salvando ? "Salvando…" : passo.rotulo}
          </button>
        )}
        {cancelavel && (
          <button type="button" className="acoes-pedido__cancelar" disabled={salvando || carregando} onClick={cancelar}>
            Cancelar pedido
          </button>
        )}
      </div>
    </div>
  );
}

export default AcoesPedido;
