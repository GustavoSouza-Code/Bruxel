import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { Modal } from "../../../componentes/ui/Modal/Modal";
import { ChipsFiltro } from "../../../componentes/ui/ChipsFiltro/ChipsFiltro";
import { IconeBusca } from "../../../componentes/ui/Icones/Icones";
import { marcarAtendimentoPago } from "../../../api/atendimentos";
import { mensagemDeErro } from "../../../api/cliente";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { useAvisos } from "../../../contexto/useAvisos";
import { useAtendimentos } from "../../../crud/atendimentos/useAtendimentos";
import { formatarReais, perguntaPagamento } from "../../../crud/atendimentos/valorOs";
import { usePedidosAdmin } from "../../../crud/pedidos/usePedidosAdmin";
import { FORMA_PAGAMENTO_LABELS, codigoPedido } from "../../../crud/pedidos/opcoesPedido";
import { contarPorSituacao, filtrarLancamentos, lancamentosDePagamento } from "../../../crud/pagamentos/lancamentos";
import type { FiltroSituacao, Lancamento } from "../../../crud/pagamentos/lancamentos";
import { DetalhePedido } from "../pedidos/componentes/DetalhePedido/DetalhePedido";
// o campo de busca usa o visual da BarraBusca (aqui sem o botão de filtros, que esta tela não tem)
import "../../../componentes/ui/BarraBusca/BarraBusca.css";
import "../atendimentos/componentes/SeloStatusAtendimento/SeloStatusAtendimento.css";
import "../lista-admin.css";
import "./pagamentos.css";

const ROTULOS: Record<FiltroSituacao, string> = {
  "a-receber": "A receber",
  recebido: "Recebidos",
  todos: "Todos",
};

// ISO → "27/10", no relógio de quem usa
function diaMes(iso: string) {
  const data = new Date(iso);
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Gestão de pagamentos do painel (rota "/admin/pagamentos"): o que falta
 * receber e o que já entrou, juntando as OS concluídas (GET /appointments) e
 * os pedidos da loja (GET /orders). A OS a receber se marca como paga aqui
 * mesmo; o pedido só aparece, porque já nasce pago (simulação do backend).
 */
export function PaginaAdminPagamentos() {
  const { token } = useAutenticacao();
  const { avisar } = useAvisos();
  const atend = useAtendimentos();
  const ped = usePedidosAdmin();
  const [situacao, setSituacao] = useState<FiltroSituacao>("a-receber");
  const [busca, setBusca] = useState("");
  // id da OS sendo marcada como paga (o botão dela mostra "Registrando…")
  const [pagando, setPagando] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [pedidoAberto, setPedidoAberto] = useState<string | null>(null);

  const lancamentos = useMemo(
    () => lancamentosDePagamento(atend.atendimentos, ped.pedidos),
    [atend.atendimentos, ped.pedidos]
  );
  const visiveis = useMemo(() => filtrarLancamentos(lancamentos, { situacao, busca }), [lancamentos, situacao, busca]);
  const contagem = contarPorSituacao(lancamentos);
  const opcoes = (Object.keys(ROTULOS) as FiltroSituacao[]).map((valor) => ({
    valor,
    rotulo: `${ROTULOS[valor]} (${contagem[valor]})`,
  }));

  const erro = atend.erro ?? ped.erro;
  // o "Carregando" só aparece na primeira vez; ao recarregar depois de um pagamento, a lista fica na tela
  const carregandoPrimeiraVez = (atend.carregando || ped.carregando) && lancamentos.length === 0;
  const prontos = !erro && !carregandoPrimeiraVez;
  const pedido = ped.pedidos.find((p) => p.id === pedidoAberto) ?? null;

  function recarregar() {
    if (atend.erro) atend.recarregar();
    if (ped.erro) ped.recarregar();
  }

  async function marcarPago(lancamento: Lancamento) {
    if (!token || !window.confirm(perguntaPagamento(lancamento.valor))) return;
    setPagando(lancamento.id);
    setErroAcao(null);
    try {
      await marcarAtendimentoPago(token, lancamento.id);
      avisar({ tipo: "sucesso", mensagem: `Pagamento de ${formatarReais(lancamento.valor)} registrado.` });
      atend.recarregar();
    } catch (falha) {
      setErroAcao(mensagemDeErro(falha));
    } finally {
      setPagando(null);
    }
  }

  return (
    <>
      <NavAdmin />

      <section className="pagina-admin-pagamentos">
        <Container>
          <div className="lista-admin__topo">
            <h1 className="lista-admin__titulo">Gestão de pagamentos</h1>
            <p className="pagina-admin-pagamentos__nota">Pedidos já entram pagos (simulação).</p>
          </div>

          <div className="barra-busca">
            <div className="barra-busca__campo">
              <IconeBusca />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por cliente ou código"
                aria-label="Buscar pagamentos"
              />
            </div>
          </div>

          <div className="lista-admin__linha-chips">
            <ChipsFiltro opcoes={opcoes} selecionado={situacao} onSelecionar={setSituacao} rotulo="Situação" />
          </div>

          {erroAcao && (
            <div className="lista-admin__aviso" role="alert">
              <span>{erroAcao}</span>
            </div>
          )}

          {carregandoPrimeiraVez && !erro && <p className="lista-admin__vazio">Carregando pagamentos…</p>}

          {erro && (
            <div className="lista-admin__aviso" role="alert">
              <span>{erro}</span>
              <button type="button" className="lista-admin__botao lista-admin__botao--contorno" onClick={recarregar}>
                Tentar novamente
              </button>
            </div>
          )}

          {prontos && visiveis.length === 0 && (
            <p className="lista-admin__vazio">
              {situacao === "a-receber" && !busca ? "Nada a receber." : "Nenhum pagamento por aqui."}
            </p>
          )}

          {prontos && visiveis.length > 0 && (
            <ul className="lista-admin__compacta pagina-admin-pagamentos__lista">
              {/* títulos das colunas; aria-hidden porque cada linha já é lida inteira */}
              <li className="lista-admin__linha lista-admin__linha--titulos" aria-hidden="true">
                <span className="lista-admin__so-largo">Tipo</span>
                <span className="lista-admin__so-largo">Código</span>
                <span>Cliente</span>
                <span>Data</span>
                <span className="pagina-admin-pagamentos__valor">Valor</span>
                <span className="lista-admin__so-largo">Situação</span>
                <span />
              </li>
              {visiveis.map((lancamento) => (
                <li key={lancamento.id} className="lista-admin__linha pagina-admin-pagamentos__linha">
                  <span className="lista-admin__so-largo">{lancamento.origem === "os" ? "OS" : "Pedido"}</span>
                  <span className="lista-admin__so-largo">#{lancamento.codigo}</span>
                  <span className="pagina-admin-pagamentos__cliente" title={lancamento.cliente}>
                    {lancamento.cliente}
                  </span>
                  <span className="pagina-admin-pagamentos__data">
                    {diaMes(lancamento.data)}
                    {lancamento.formaPagamento && ` · ${FORMA_PAGAMENTO_LABELS[lancamento.formaPagamento]}`}
                  </span>
                  <span className="pagina-admin-pagamentos__valor">{formatarReais(lancamento.valor)}</span>
                  <div className="lista-admin__so-largo">
                    <span
                      className={`selo-atendimento selo-atendimento--${lancamento.situacao === "recebido" ? "pago" : "a-pagar"}`}
                    >
                      {lancamento.situacao === "recebido" ? "Recebido" : "A receber"}
                    </span>
                  </div>
                  <div className="lista-admin__linha-acoes pagina-admin-pagamentos__acao">
                    <AcaoDaLinha
                      lancamento={lancamento}
                      pagando={pagando === lancamento.id}
                      onMarcarPago={() => marcarPago(lancamento)}
                      onVerPedido={() => setPedidoAberto(lancamento.id)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      {pedido && (
        <Modal titulo={`Pedido #${codigoPedido(pedido.id)}`} onFechar={() => setPedidoAberto(null)} largo>
          <DetalhePedido pedido={pedido} />
        </Modal>
      )}
    </>
  );
}

interface AcaoDaLinhaProps {
  lancamento: Lancamento;
  pagando: boolean;
  onMarcarPago: () => void;
  onVerPedido: () => void;
}

/** OS a receber: "Marcar como pago"; OS paga: link pra OS; pedido: abre o detalhe. */
function AcaoDaLinha({ lancamento, pagando, onMarcarPago, onVerPedido }: AcaoDaLinhaProps) {
  if (lancamento.origem === "pedido") {
    return (
      <button type="button" className="lista-admin__botao lista-admin__botao--contorno" onClick={onVerPedido}>
        Ver pedido
      </button>
    );
  }
  if (lancamento.situacao === "recebido") {
    return (
      <Link
        to={`/admin/atendimentos/${lancamento.id}`}
        className="lista-admin__botao lista-admin__botao--contorno pagina-admin-pagamentos__link"
      >
        Ver OS
      </Link>
    );
  }
  return (
    <button type="button" className="lista-admin__botao" onClick={onMarcarPago} disabled={pagando}>
      {pagando ? "Registrando…" : "Marcar como pago"}
    </button>
  );
}

export default PaginaAdminPagamentos;
