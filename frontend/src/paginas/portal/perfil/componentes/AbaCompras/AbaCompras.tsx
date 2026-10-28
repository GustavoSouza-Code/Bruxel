import { Link } from "react-router-dom";
import { usePedidos } from "../../../../../crud/pedidos/usePedidos";
import { formatarReais } from "../../../../../crud/atendimentos/valorOs";
import type { FormaPagamento, StatusPedido } from "../../../../../tipos/pedido";
import "./AbaCompras.css";

// texto de cada status do banco, mostrado na etiqueta do pedido
const STATUS_LABELS: Record<StatusPedido, string> = {
  PENDENTE: "Aguardando pagamento",
  PAGO: "Pago",
  ENVIADO: "A caminho",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  PIX: "Pix",
  CARTAO_CREDITO: "Cartão de crédito",
  BOLETO: "Boleto",
};

interface AbaComprasProps {
  /** aviso de sucesso que o carrinho manda pelo state do navigate; null = sem aviso */
  mensagem: string | null;
}

/**
 * Aba "Compras" do /perfil: os pedidos feitos pelo carrinho, vindos do banco.
 * Usa as classes de card do perfil.css, porque só aparece dentro do /perfil.
 */
export function AbaCompras({ mensagem }: AbaComprasProps) {
  const { pedidos, carregando, erro, recarregar } = usePedidos();

  return (
    <>
      <div className="pagina-perfil__cabecalho-conteudo">
        <h2>Compras</h2>
      </div>

      {mensagem && (
        <p className="aba-compras__aviso" role="status">
          {mensagem}
        </p>
      )}

      {carregando ? (
        <p className="pagina-perfil__vazio">Carregando suas compras…</p>
      ) : erro ? (
        <div className="pagina-perfil__falha">
          <p className="pagina-perfil__erro" role="alert">
            {erro}
          </p>
          <button type="button" className="pagina-perfil__cancelar" onClick={recarregar}>
            Tentar novamente
          </button>
        </div>
      ) : pedidos.length === 0 ? (
        <p className="pagina-perfil__vazio">
          Você ainda não fez nenhuma compra. <Link to="/loja">Conheça a loja virtual.</Link>
        </p>
      ) : (
        <ul className="pagina-perfil__pedidos aba-compras__lista">
          {pedidos.map((pedido) => {
            const unidades = pedido.itens.reduce((soma, item) => soma + item.quantidade, 0);
            return (
              <li key={pedido.id} className="pagina-perfil__card pagina-perfil__pedido">
                <div className="pagina-perfil__pedido-principal">
                  {/* o id é um UUID; os 8 primeiros caracteres bastam pra identificar na tela */}
                  <strong>Pedido #{pedido.id.slice(0, 8).toUpperCase()}</strong>
                  <span>
                    {new Date(pedido.criadoEm).toLocaleDateString("pt-BR")} · {unidades}{" "}
                    {unidades === 1 ? "item" : "itens"} · {FORMA_PAGAMENTO_LABELS[pedido.formaPagamento]}
                  </span>
                  <span className="aba-compras__produtos">
                    {pedido.itens.map((item) => `${item.quantidade}× ${item.nome}`).join(", ")}
                  </span>
                  {pedido.itens.length > 0 && (
                    <details className="aba-compras__detalhes">
                      <summary>Ver produtos e preços</summary>
                      <ul className="aba-compras__detalhes-lista">
                        {pedido.itens.map((item) => (
                          <li key={item.produtoId} className="aba-compras__detalhes-item">
                            <span>
                              {item.quantidade}× {item.nome}
                            </span>
                            <span>
                              {formatarReais(item.precoUnitario)} cada · Subtotal:{" "}
                              <strong>{formatarReais(item.precoUnitario * item.quantidade)}</strong>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
                <span className={`pagina-perfil__status pagina-perfil__status--${pedido.status.toLowerCase()}`}>
                  {STATUS_LABELS[pedido.status]}
                </span>
                <strong className="pagina-perfil__pedido-total">{formatarReais(pedido.valorTotal)}</strong>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default AbaCompras;
