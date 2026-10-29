import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { Modal } from "../../../componentes/ui/Modal/Modal";
import { BarraBusca } from "../../../componentes/ui/BarraBusca/BarraBusca";
import { PainelFiltros } from "../../../componentes/ui/PainelFiltros/PainelFiltros";
import { AlternarVisualizacao } from "../../../componentes/ui/AlternarVisualizacao/AlternarVisualizacao";
import { usePedidosAdmin } from "../../../crud/pedidos/usePedidosAdmin";
import {
  FILTROS_PEDIDO_INICIAIS,
  contarFiltrosAtivosPedido,
  filtrarPedidos,
} from "../../../crud/pedidos/filtrarPedidos";
import type { FiltrosPedido, OrdemPedido, PedidoComCliente } from "../../../crud/pedidos/filtrarPedidos";
import { FORMA_PAGAMENTO_LABELS, codigoPedido } from "../../../crud/pedidos/opcoesPedido";
import { formatarReais } from "../../../crud/atendimentos/valorOs";
import { formatarDataHora } from "../../../crud/atendimentos/datasAtendimento";
import { useCarregarMais } from "../../../hooks/useCarregarMais";
import { useModoVisualizacao } from "../../../hooks/useModoVisualizacao";
import type { FormaPagamento } from "../../../tipos/pedido";
import { DetalhePedido } from "./componentes/DetalhePedido/DetalhePedido";
import { SeloStatusPedido } from "./componentes/SeloStatusPedido/SeloStatusPedido";
import "../lista-admin.css";
import "./pedidos.css";

const ORDENS: { valor: OrdemPedido; rotulo: string }[] = [
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "antigos", rotulo: "Mais antigos" },
  { valor: "maior-valor", rotulo: "Maior valor" },
];

// quantos itens aparecem de cada vez (a lista compacta cabe mais na tela)
const POR_VEZ = { cards: 12, lista: 20 };

const ID_PAINEL = "filtros-pedidos";

// "2× Hidrofloc 1L, 1× Escova"
function resumoDosItens(pedido: PedidoComCliente) {
  return pedido.itens.map((item) => `${item.quantidade}× ${item.nome}`).join(", ");
}

/**
 * Pedidos da loja virtual no painel (rota "/admin/pedidos"): todas as compras
 * (GET /orders), com o nome de quem comprou, busca, filtros e a lista em cards
 * ou compacta. Clicar abre o detalhe num modal. Só leitura: mudar o status do
 * pedido depende de uma rota nova no backend (ver o recado no spec).
 */
export function PaginaAdminPedidos() {
  const { pedidos, carregando, erro, recarregar } = usePedidosAdmin();
  const prontos = !carregando && !erro;
  const [filtros, setFiltros] = useState<FiltrosPedido>(FILTROS_PEDIDO_INICIAIS);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [modo, setModo] = useModoVisualizacao("admin-pedidos");
  // o pedido aberto fica na URL (?pedido=<id>): o "voltar" do navegador fecha o modal
  const [parametros, setParametros] = useSearchParams();
  const aberto = pedidos.find((pedido) => pedido.id === parametros.get("pedido")) ?? null;

  const filtrados = useMemo(() => filtrarPedidos(pedidos, filtros), [pedidos, filtros]);
  // a chave muda com os filtros e o modo: aí a lista volta a mostrar só o começo
  const { visiveis, temMais, carregarMais } = useCarregarMais(filtrados, JSON.stringify(filtros) + modo, POR_VEZ[modo]);

  function atualizarFiltro<K extends keyof FiltrosPedido>(campo: K, valor: FiltrosPedido[K]) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  }

  // "Limpar filtros" do painel: zera o painel e mantém a busca, que a pessoa vê na tela
  function limparFiltros() {
    setFiltros((atuais) => ({ ...FILTROS_PEDIDO_INICIAIS, busca: atuais.busca }));
  }

  const contador =
    filtrados.length === pedidos.length
      ? `${pedidos.length} ${pedidos.length === 1 ? "pedido" : "pedidos"}`
      : `${filtrados.length} de ${pedidos.length} pedidos`;

  return (
    <>
      <NavAdmin />

      <section className="pagina-admin-pedidos">
        <Container>
          <div className="lista-admin__topo">
            <h1 className="lista-admin__titulo">Pedidos</h1>
          </div>

          <BarraBusca
            valor={filtros.busca}
            onMudar={(valor) => atualizarFiltro("busca", valor)}
            placeholder="Buscar por cliente, número ou produto"
            rotulo="Buscar pedidos"
            filtrosAbertos={filtrosAbertos}
            onAlternarFiltros={() => setFiltrosAbertos((atual) => !atual)}
            qtdFiltrosAtivos={contarFiltrosAtivosPedido(filtros)}
            idPainel={ID_PAINEL}
          />

          <PainelFiltros id={ID_PAINEL} aberto={filtrosAbertos} onLimpar={limparFiltros}>
            <label>
              Forma de pagamento
              <select
                value={filtros.forma}
                onChange={(e) => atualizarFiltro("forma", e.target.value as "" | FormaPagamento)}
              >
                <option value="">Qualquer</option>
                {(Object.keys(FORMA_PAGAMENTO_LABELS) as FormaPagamento[]).map((forma) => (
                  <option key={forma} value={forma}>
                    {FORMA_PAGAMENTO_LABELS[forma]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ordenar por
              <select value={filtros.ordem} onChange={(e) => atualizarFiltro("ordem", e.target.value as OrdemPedido)}>
                {ORDENS.map((ordem) => (
                  <option key={ordem.valor} value={ordem.valor}>
                    {ordem.rotulo}
                  </option>
                ))}
              </select>
            </label>
          </PainelFiltros>

          <div className="lista-admin__linha-chips pagina-admin-pedidos__linha-modo">
            {/* aria-live: leitores de tela anunciam o novo total quando um filtro muda */}
            <p className="lista-admin__contador" aria-live="polite">
              {prontos && contador}
            </p>
            <AlternarVisualizacao modo={modo} onMudar={setModo} />
          </div>

          {carregando && <p className="lista-admin__vazio">Carregando pedidos…</p>}

          {!carregando && erro && (
            <div className="lista-admin__aviso" role="alert">
              <span>{erro}</span>
              <button type="button" className="lista-admin__botao lista-admin__botao--contorno" onClick={recarregar}>
                Tentar novamente
              </button>
            </div>
          )}

          {prontos && filtrados.length === 0 && (
            <div className="lista-admin__vazio">
              <p>{pedidos.length === 0 ? "Nenhum pedido feito na loja ainda." : "Nenhum pedido com esses filtros."}</p>
              {pedidos.length > 0 && (
                <button
                  type="button"
                  className="lista-admin__botao lista-admin__botao--contorno"
                  onClick={() => setFiltros(FILTROS_PEDIDO_INICIAIS)}
                >
                  Ver todos os pedidos
                </button>
              )}
            </div>
          )}

          {prontos && filtrados.length > 0 && modo === "cards" && (
            <ul className="lista-admin__grade">
              {visiveis.map((pedido) => (
                <li key={pedido.id}>
                  <button
                    type="button"
                    className="lista-admin__card pagina-admin-pedidos__card"
                    onClick={() => setParametros({ pedido: pedido.id })}
                  >
                    <span className="lista-admin__card-titulo">
                      #{codigoPedido(pedido.id)} · {formatarDataHora(pedido.criadoEm)}
                    </span>
                    <span className="lista-admin__card-corpo">
                      <span className="lista-admin__card-detalhe pagina-admin-pedidos__cliente">{pedido.cliente}</span>
                      <span className="lista-admin__card-detalhe">{resumoDosItens(pedido)}</span>
                      <span className="lista-admin__card-detalhe">
                        {FORMA_PAGAMENTO_LABELS[pedido.formaPagamento]} ·{" "}
                        <strong className="pagina-admin-pedidos__valor">{formatarReais(pedido.valorTotal)}</strong>
                      </span>
                    </span>
                    <div className="pagina-admin-pedidos__selos">
                      <SeloStatusPedido status={pedido.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {prontos && filtrados.length > 0 && modo === "lista" && (
            <ul className="lista-admin__compacta pagina-admin-pedidos__compacta">
              {/* títulos das colunas; aria-hidden porque cada linha já é lida inteira */}
              <li className="lista-admin__linha lista-admin__linha--titulos" aria-hidden="true">
                <span>Cliente</span>
                <span className="lista-admin__so-largo">Pedido</span>
                <span className="lista-admin__so-largo">Data</span>
                <span className="pagina-admin-pedidos__valor">Total</span>
                <span className="lista-admin__so-largo">Status</span>
              </li>
              {visiveis.map((pedido) => (
                <li key={pedido.id}>
                  <button
                    type="button"
                    className="lista-admin__linha pagina-admin-pedidos__linha"
                    onClick={() => setParametros({ pedido: pedido.id })}
                  >
                    <span title={pedido.cliente}>{pedido.cliente}</span>
                    <span className="lista-admin__so-largo">#{codigoPedido(pedido.id)}</span>
                    <span className="lista-admin__so-largo">{formatarDataHora(pedido.criadoEm)}</span>
                    <span className="pagina-admin-pedidos__valor">{formatarReais(pedido.valorTotal)}</span>
                    <div className="lista-admin__so-largo">
                      <SeloStatusPedido status={pedido.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {prontos && temMais && (
            <div className="lista-admin__carregar-mais">
              <button type="button" className="lista-admin__botao lista-admin__botao--contorno" onClick={carregarMais}>
                Carregar mais ({filtrados.length - visiveis.length} restantes)
              </button>
            </div>
          )}
        </Container>
      </section>

      {aberto && (
        <Modal titulo={`Pedido #${codigoPedido(aberto.id)}`} onFechar={() => setParametros({})} largo>
          <DetalhePedido pedido={aberto} />
        </Modal>
      )}
    </>
  );
}

export default PaginaAdminPedidos;
