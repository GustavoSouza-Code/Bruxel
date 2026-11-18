import { useSearchParams } from "react-router-dom";
import { Container } from "../../../componentes/layout/Container/Container";
import { GraficoBarras } from "../../../componentes/graficos/GraficoBarras/GraficoBarras";
import { GraficoRosca } from "../../../componentes/graficos/GraficoRosca/GraficoRosca";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { useReceitaMensal, useReceitaPorCategoria } from "../../../crud/dashboard/useDashboard";
import { rotuloMes } from "../../../crud/dashboard/graficos";
import { NumerosPainel } from "./componentes/NumerosPainel/NumerosPainel";
import { QuemCobrar } from "./componentes/QuemCobrar/QuemCobrar";
import { GerarRelatorio } from "./componentes/GerarRelatorio/GerarRelatorio";
import "../lista-admin.css";
import "./inicio.css";

const OPCOES_MESES = [3, 6, 12];

// "?meses=" só vale com 3, 6 ou 12; qualquer outra coisa cai em 6
function mesesDaUrl(valor: string | null): number {
  const numero = Number(valor);
  return OPCOES_MESES.includes(numero) ? numero : 6;
}

/**
 * Dashboard do painel (rota "/admin"), a tela principal da gestão: a faixa de
 * números, a receita por mês (3, 6 ou 12 meses, guardado no "?meses=" da URL),
 * a loja por categoria, quem cobrar e a exportação em CSV/PDF. Cada bloco
 * busca os próprios dados e mostra o próprio erro. A navegação entre as áreas
 * fica na lista lateral (LayoutAdmin).
 */
export function PaginaAdminInicio() {
  const { usuario } = useAutenticacao();
  const [params, setParams] = useSearchParams();
  const meses = mesesDaUrl(params.get("meses"));
  const receita = useReceitaMensal(meses);
  const categorias = useReceitaPorCategoria();
  const hoje = new Date();
  const mesAtual = rotuloMes(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`, true);

  function escolherMeses(valor: number) {
    setParams({ meses: String(valor) }, { replace: true });
  }

  return (
    <main className="pagina-admin-inicio">
      <Container>
        <div className="pagina-admin-inicio__topo">
          <div>
            {/* só o primeiro nome, igual ao MenuUsuario */}
            <h1 className="pagina-admin-inicio__ola">Olá, {usuario?.nome.split(" ")[0]}</h1>
            <p className="pagina-admin-inicio__subtitulo">Resumo da loja e dos serviços em {mesAtual}</p>
          </div>
          <a href="#gerar-relatorio" className="lista-admin__botao pagina-admin-inicio__exportar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            Exportar
          </a>
        </div>

        <NumerosPainel />

        <div className="pagina-admin-inicio__blocos">
          <div className="pagina-admin-inicio__graficos">
            <section id="receita" className="pagina-admin-inicio__bloco" aria-label="Receita por mês">
              <div className="pagina-admin-inicio__cabecalho">
                <h2 className="pagina-admin-inicio__titulo">Receita por mês</h2>
                <div className="pagina-admin-inicio__meses" role="group" aria-label="Período">
                  {OPCOES_MESES.map((opcao) => (
                    <button
                      key={opcao}
                      type="button"
                      className="pagina-admin-inicio__mes"
                      aria-pressed={opcao === meses}
                      onClick={() => escolherMeses(opcao)}
                    >
                      {opcao} meses
                    </button>
                  ))}
                </div>
              </div>
              {receita.erro ? (
                <div className="lista-admin__aviso" role="alert">
                  {receita.erro}
                  <button type="button" className="lista-admin__botao lista-admin__botao--contorno" onClick={receita.recarregar}>
                    Tentar novamente
                  </button>
                </div>
              ) : !receita.dados ? (
                <p className="pagina-admin-inicio__nota pagina-admin-inicio__nota--grafico">Carregando…</p>
              ) : (
                <GraficoBarras linhas={receita.dados} />
              )}
            </section>

            <section className="pagina-admin-inicio__bloco" aria-label="Loja por categoria">
              <div className="pagina-admin-inicio__cabecalho">
                <h2 className="pagina-admin-inicio__titulo">Loja por categoria</h2>
                <span className="pagina-admin-inicio__dica">Vendas de {mesAtual}</span>
              </div>
              {categorias.erro ? (
                <div className="lista-admin__aviso" role="alert">
                  {categorias.erro}
                  <button type="button" className="lista-admin__botao lista-admin__botao--contorno" onClick={categorias.recarregar}>
                    Tentar novamente
                  </button>
                </div>
              ) : !categorias.dados ? (
                <p className="pagina-admin-inicio__nota pagina-admin-inicio__nota--grafico">Carregando…</p>
              ) : (
                <div className="pagina-admin-inicio__rosca">
                  <GraficoRosca linhas={categorias.dados} />
                </div>
              )}
            </section>
          </div>

          <QuemCobrar />
          <GerarRelatorio />
        </div>
      </Container>
    </main>
  );
}

export default PaginaAdminInicio;
