import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { BarraBusca } from "../../../componentes/ui/BarraBusca/BarraBusca";
import { PainelFiltros } from "../../../componentes/ui/PainelFiltros/PainelFiltros";
import { ChipsFiltro } from "../../../componentes/ui/ChipsFiltro/ChipsFiltro";
import { AlternarVisualizacao } from "../../../componentes/ui/AlternarVisualizacao/AlternarVisualizacao";
import { useAtendimentos } from "../../../crud/atendimentos/useAtendimentos";
import {
  FILTROS_ATENDIMENTO_INICIAIS,
  contarFiltrosAtivosAtendimento,
  contarPorStatus,
  filtrarAtendimentos,
} from "../../../crud/atendimentos/filtrarAtendimentos";
import type {
  FiltroPagamento,
  FiltroStatus,
  FiltrosAtendimento,
  OrdemAtendimento,
} from "../../../crud/atendimentos/filtrarAtendimentos";
import { TIPO_SERVICO_LABELS, codigoAtendimento } from "../../../crud/atendimentos/opcoesAtendimento";
import { formatarAgendamento } from "../../../crud/atendimentos/agenda";
import { useCarregarMais } from "../../../hooks/useCarregarMais";
import { useModoVisualizacao } from "../../../hooks/useModoVisualizacao";
import type { Atendimento } from "../../../tipos/atendimento";
import { SeloPagamento, SeloStatusAtendimento } from "./componentes/SeloStatusAtendimento/SeloStatusAtendimento";
import "../lista-admin.css";
import "./atendimentos.css";

// texto de cada chip, na ordem em que aparecem
const ROTULOS_STATUS: Record<FiltroStatus, string> = {
  aguardando: "Aguardando",
  agendado: "Agendados",
  "em-andamento": "Em andamento",
  concluido: "Concluídos",
  encerrados: "Recusados e cancelados",
  todos: "Todos",
};

// quantos itens aparecem de cada vez (a lista compacta cabe mais na tela)
const POR_VEZ = { cards: 12, lista: 20 };

const ID_PAINEL = "filtros-atendimentos";

// "21/10/2026 às 13:30 com Rafael" (sem técnico definido, só o dia e o horário)
function quandoEQuem(atendimento: Atendimento) {
  return formatarAgendamento(atendimento.data, atendimento.horario, atendimento.tecnico?.nome ?? null);
}

/**
 * Gestão de atendimentos do painel admin (rota "/admin/atendimentos"): todos os
 * pedidos (GET /appointments), de todas as contas, com busca, chips de status, painel de
 * filtros e a lista em cards ou compacta. Cada pedido abre a OS
 * (/admin/atendimentos/:id), onde o admin decide e acompanha o serviço.
 */
export function PaginaAdminAtendimentos() {
  const { atendimentos: todosAtendimentos, carregando, erro, recarregar } = useAtendimentos();
  const prontos = !carregando && !erro;
  const [filtros, setFiltros] = useState<FiltrosAtendimento>(FILTROS_ATENDIMENTO_INICIAIS);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [modo, setModo] = useModoVisualizacao("admin-atendimentos");

  const filtrados = useMemo(() => filtrarAtendimentos(todosAtendimentos, filtros), [todosAtendimentos, filtros]);
  const contagem = useMemo(() => contarPorStatus(todosAtendimentos), [todosAtendimentos]);
  // a chave muda com os filtros e o modo: aí a lista volta a mostrar só o começo
  const { visiveis, temMais, carregarMais } = useCarregarMais(
    filtrados,
    JSON.stringify(filtros) + modo,
    POR_VEZ[modo]
  );

  // cada chip com a quantidade, ex.: "Aguardando (2)"
  const opcoesStatus = (Object.keys(ROTULOS_STATUS) as FiltroStatus[]).map((valor) => ({
    valor,
    rotulo: `${ROTULOS_STATUS[valor]} (${contagem[valor]})`,
  }));

  // genérico pra o TypeScript garantir que o valor combina com o campo
  function atualizarFiltro<K extends keyof FiltrosAtendimento>(campo: K, valor: FiltrosAtendimento[K]) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  }

  // "Limpar filtros" do painel: zera o painel e mantém a busca e o chip, que a pessoa vê na tela
  function limparFiltros() {
    setFiltros((atuais) => ({ ...FILTROS_ATENDIMENTO_INICIAIS, busca: atuais.busca, status: atuais.status }));
  }

  const contador =
    filtrados.length === todosAtendimentos.length
      ? `${todosAtendimentos.length} ${todosAtendimentos.length === 1 ? "atendimento" : "atendimentos"}`
      : `${filtrados.length} de ${todosAtendimentos.length} atendimentos`;

  return (
    <>
      <NavAdmin />

      <section className="pagina-admin-atendimentos">
        <Container>
          <div className="lista-admin__topo">
            <h1 className="lista-admin__titulo">Atendimentos</h1>
            <Link to="/solicitar-atendimento" className="lista-admin__botao pagina-admin-atendimentos__novo">
              + Abrir atendimento
            </Link>
          </div>

          <BarraBusca
            valor={filtros.busca}
            onMudar={(valor) => atualizarFiltro("busca", valor)}
            placeholder="Buscar por cliente, número ou bairro"
            rotulo="Buscar atendimentos"
            filtrosAbertos={filtrosAbertos}
            onAlternarFiltros={() => setFiltrosAbertos((aberto) => !aberto)}
            qtdFiltrosAtivos={contarFiltrosAtivosAtendimento(filtros)}
            idPainel={ID_PAINEL}
          />

          <PainelFiltros id={ID_PAINEL} aberto={filtrosAbertos} onLimpar={limparFiltros}>
            <label>
              Pagamento
              <select
                value={filtros.pagamento}
                onChange={(e) => atualizarFiltro("pagamento", e.target.value as FiltroPagamento)}
              >
                <option value="">Qualquer</option>
                <option value="a-pagar">A pagar</option>
                <option value="pago">Pago</option>
              </select>
            </label>
            <label>
              Ordenar por
              <select
                value={filtros.ordem}
                onChange={(e) => atualizarFiltro("ordem", e.target.value as OrdemAtendimento)}
              >
                <option value="visita">Visita mais próxima</option>
                <option value="visita-desc">Visita mais distante</option>
              </select>
            </label>
          </PainelFiltros>

          <div className="lista-admin__linha-chips">
            <ChipsFiltro
              opcoes={opcoesStatus}
              selecionado={filtros.status}
              onSelecionar={(valor) => atualizarFiltro("status", valor)}
              rotulo="Status"
            />
            <AlternarVisualizacao modo={modo} onMudar={setModo} />
          </div>

          {/* aria-live: leitores de tela anunciam o novo total quando um filtro muda */}
          <p className="lista-admin__contador" aria-live="polite">
            {prontos && contador}
          </p>

          {carregando && <p className="lista-admin__vazio">Carregando atendimentos…</p>}

          {!carregando && erro && (
            <div className="lista-admin__aviso" role="alert">
              <span>{erro}</span>
              <button
                type="button"
                className="lista-admin__botao lista-admin__botao--contorno"
                onClick={recarregar}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {prontos && filtrados.length === 0 && (
            <div className="lista-admin__vazio">
              <p>Nenhum atendimento por aqui. Troque o status ou limpe os filtros.</p>
              <button
                type="button"
                className="lista-admin__botao lista-admin__botao--contorno"
                onClick={() => setFiltros({ ...FILTROS_ATENDIMENTO_INICIAIS, status: "todos" })}
              >
                Ver todos os atendimentos
              </button>
            </div>
          )}

          {prontos && filtrados.length > 0 && modo === "cards" && (
            <ul className="lista-admin__grade">
              {visiveis.map((atendimento) => (
                <li key={atendimento.id}>
                  <Link
                    to={`/admin/atendimentos/${atendimento.id}`}
                    className="lista-admin__card pagina-admin-atendimentos__card"
                  >
                    <span className="lista-admin__card-titulo">
                      #{codigoAtendimento(atendimento.id)} · {TIPO_SERVICO_LABELS[atendimento.tipo]}
                    </span>
                    <span className="lista-admin__card-corpo">
                      <span className="lista-admin__card-detalhe">
                        {atendimento.cliente.nome}
                        {atendimento.abertoNaLoja && <SeloLoja />}
                      </span>
                      <span className="lista-admin__card-detalhe">{quandoEQuem(atendimento)}</span>
                    </span>
                    <SelosDoAtendimento atendimento={atendimento} />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {prontos && filtrados.length > 0 && modo === "lista" && (
            <ul className="lista-admin__compacta pagina-admin-atendimentos__compacta">
              {/* títulos das colunas; aria-hidden porque cada linha já é lida inteira */}
              <li className="lista-admin__linha lista-admin__linha--titulos" aria-hidden="true">
                <span>Cliente</span>
                <span className="lista-admin__so-largo">Pedido</span>
                <span className="lista-admin__so-largo">Visita</span>
                <span>Status</span>
              </li>
              {visiveis.map((atendimento) => (
                <li key={atendimento.id}>
                  <Link
                    to={`/admin/atendimentos/${atendimento.id}`}
                    className="lista-admin__linha pagina-admin-atendimentos__linha"
                  >
                    <span title={atendimento.cliente.nome}>
                      {atendimento.cliente.nome}
                      {atendimento.abertoNaLoja && <SeloLoja />}
                    </span>
                    <span className="lista-admin__so-largo">
                      #{codigoAtendimento(atendimento.id)} · {TIPO_SERVICO_LABELS[atendimento.tipo]}
                    </span>
                    <span className="lista-admin__so-largo">{quandoEQuem(atendimento)}</span>
                    <SelosDoAtendimento atendimento={atendimento} />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {prontos && temMais && (
            <div className="lista-admin__carregar-mais">
              <button
                type="button"
                className="lista-admin__botao lista-admin__botao--contorno"
                onClick={carregarMais}
              >
                Carregar mais ({filtrados.length - visiveis.length} restantes)
              </button>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

// <div> e não <span>: no celular, o CSS da lista compacta mexe no display de todo <span> filho da linha
function SelosDoAtendimento({ atendimento }: { atendimento: Atendimento }) {
  return (
    <div className="pagina-admin-atendimentos__selos">
      <SeloStatusAtendimento status={atendimento.status} />
      {atendimento.status === "concluido" && <SeloPagamento pagoEm={atendimento.pagoEm} />}
    </div>
  );
}

function SeloLoja() {
  return <span className="lista-admin__selo lista-admin__selo--destaque">loja</span>;
}

export default PaginaAdminAtendimentos;
