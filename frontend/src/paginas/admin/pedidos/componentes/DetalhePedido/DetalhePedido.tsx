import type { PedidoComCliente } from "../../../../../crud/pedidos/filtrarPedidos";
import { FORMA_PAGAMENTO_LABELS } from "../../../../../crud/pedidos/opcoesPedido";
import { formatarReais } from "../../../../../crud/atendimentos/valorOs";
import { formatarDataHora } from "../../../../../crud/atendimentos/datasAtendimento";
import { SeloStatusPedido } from "../SeloStatusPedido/SeloStatusPedido";
import "./DetalhePedido.css";

/**
 * O pedido inteiro, pra abrir num Modal: quem comprou, quando, como pagou, os
 * itens com o preço da hora da compra e o endereço de entrega. Só leitura.
 */
export function DetalhePedido({ pedido }: { pedido: PedidoComCliente }) {
  return (
    <div className="detalhe-pedido">
      <dl className="detalhe-pedido__dados">
        <div>
          <dt>Cliente</dt>
          <dd>{pedido.cliente}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{formatarDataHora(pedido.criadoEm)}</dd>
        </div>
        <div>
          <dt>Pagamento</dt>
          <dd>{FORMA_PAGAMENTO_LABELS[pedido.formaPagamento]}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>
            <SeloStatusPedido status={pedido.status} />
          </dd>
        </div>
      </dl>

      <table className="detalhe-pedido__itens">
        <thead>
          <tr>
            <th scope="col">Produto</th>
            <th scope="col" className="detalhe-pedido__numero">
              Qtd.
            </th>
            <th scope="col" className="detalhe-pedido__numero">
              Unitário
            </th>
            <th scope="col" className="detalhe-pedido__numero">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {pedido.itens.map((item) => (
            <tr key={item.produtoId}>
              <td>{item.nome}</td>
              <td className="detalhe-pedido__numero">{item.quantidade}</td>
              <td className="detalhe-pedido__numero">{formatarReais(item.precoUnitario)}</td>
              <td className="detalhe-pedido__numero">{formatarReais(item.precoUnitario * item.quantidade)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3}>
              Total
            </th>
            <td className="detalhe-pedido__numero">{formatarReais(pedido.valorTotal)}</td>
          </tr>
        </tfoot>
      </table>

      <h3 className="detalhe-pedido__subtitulo">Entregar em</h3>
      <p className="detalhe-pedido__endereco">{pedido.enderecoEntrega}</p>
    </div>
  );
}

export default DetalhePedido;
