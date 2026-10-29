import { Link, useLocation, useParams } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { MensagemPagina } from "../../../componentes/ui/MensagemPagina/MensagemPagina";
import { IconeCheck } from "../../../componentes/ui/Icones/Icones";
import { usePedidos } from "../../../crud/pedidos/usePedidos";
import {
  FORMA_PAGAMENTO_LABELS,
  STATUS_PEDIDO_LABELS,
  codigoPedido,
  pedidoRecebido,
} from "../../../crud/pedidos/opcoesPedido";
import { formatarReais } from "../../../crud/atendimentos/valorOs";
import { formatarDataHora } from "../../../crud/atendimentos/datasAtendimento";
import type { Pedido } from "../../../tipos/pedido";
import "./pedido.css";

/**
 * Confirmação da compra (rota "/pedido/:id", só pra quem está logado). O
 * carrinho manda o pedido recém-criado pelo state do navigate; se a página for
 * recarregada (ou aberta por link), o pedido vem de GET /orders, que só traz
 * os da própria conta: o de outra pessoa cai em "Pedido não encontrado".
 */
export function PaginaPedido() {
  const { id } = useParams();
  const location = useLocation();
  const doCarrinho = (location.state as { pedido?: Pedido } | null)?.pedido;
  const { pedidos, carregando, erro, recarregar } = usePedidos();

  // o do state só vale se for o mesmo pedido do endereço
  const pedido = doCarrinho?.id === id ? doCarrinho : pedidos.find((p) => p.id === id);

  if (!pedido && !carregando && !erro) {
    return (
      <>
        <Cabecalho />
        <MensagemPagina titulo="Pedido não encontrado" texto="Esse pedido não está na sua conta.">
          <Link to="/perfil" state={{ aba: "compras" }} className="pagina-pedido__botao">
            Ver minhas compras
          </Link>
        </MensagemPagina>
        <Rodape />
      </>
    );
  }

  return (
    <>
      <Cabecalho />

      <section className="pagina-pedido">
        <Container className="pagina-pedido__interno">
          {!pedido && carregando && <p className="pagina-pedido__estado">Carregando pedido…</p>}

          {!pedido && erro && (
            <div className="pagina-pedido__estado" role="alert">
              <p>{erro}</p>
              <button type="button" className="pagina-pedido__botao pagina-pedido__botao--contorno" onClick={recarregar}>
                Tentar novamente
              </button>
            </div>
          )}

          {pedido && <ResumoDoPedido pedido={pedido} />}
        </Container>
      </section>

      <Rodape />
    </>
  );
}

function ResumoDoPedido({ pedido }: { pedido: Pedido }) {
  const forma = FORMA_PAGAMENTO_LABELS[pedido.formaPagamento];

  return (
    <>
      <h1 className="pagina-pedido__titulo">Pedido recebido</h1>
      <p className="pagina-pedido__meta">
        Pedido #{codigoPedido(pedido.id)} · {formatarDataHora(pedido.criadoEm)}
      </p>

      {/* desde a simulação de pagamento do backend, a compra já nasce paga */}
      {pedidoRecebido(pedido.status) ? (
        <p className="pagina-pedido__pagamento pagina-pedido__pagamento--confirmado">
          <IconeCheck />
          Pagamento confirmado · {forma}
        </p>
      ) : (
        <p className="pagina-pedido__pagamento">
          {STATUS_PEDIDO_LABELS[pedido.status]} · {forma}
        </p>
      )}

      <div className="pagina-pedido__resumo">
        <h2>Itens</h2>
        <ul className="pagina-pedido__itens">
          {pedido.itens.map((item) => (
            <li key={item.produtoId} className="pagina-pedido__item">
              <span>
                {item.quantidade}× {item.nome}
                <small>{formatarReais(item.precoUnitario)} cada</small>
              </span>
              <strong>{formatarReais(item.precoUnitario * item.quantidade)}</strong>
            </li>
          ))}
        </ul>
        <div className="pagina-pedido__total">
          <span>Total</span>
          <span>{formatarReais(pedido.valorTotal)}</span>
        </div>

        <h2>Entregar em</h2>
        <p className="pagina-pedido__endereco">{pedido.enderecoEntrega}</p>
      </div>

      <div className="pagina-pedido__acoes">
        <Link to="/perfil" state={{ aba: "compras" }} className="pagina-pedido__botao">
          Ver minhas compras
        </Link>
        <Link to="/loja" className="pagina-pedido__botao pagina-pedido__botao--contorno">
          Continuar comprando
        </Link>
      </div>
    </>
  );
}

export default PaginaPedido;
