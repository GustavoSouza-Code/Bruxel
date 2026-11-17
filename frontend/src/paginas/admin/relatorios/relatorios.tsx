import { Link, useSearchParams } from "react-router-dom";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { GraficoBarras } from "../../../componentes/graficos/GraficoBarras/GraficoBarras";
import { GraficoRosca } from "../../../componentes/graficos/GraficoRosca/GraficoRosca";
import { useReceitaMensal, useReceitaPorCategoria } from "../../../crud/dashboard/useDashboard";
import { rotuloMes } from "../../../crud/dashboard/graficos";
import { QuemCobrar } from "./componentes/QuemCobrar/QuemCobrar";
import { GerarRelatorio } from "./componentes/GerarRelatorio/GerarRelatorio";
import "../lista-admin.css";
import "./relatorios.css";

const OPCOES_MESES = [3, 6, 12];

// "?meses=" só vale com 3, 6 ou 12; qualquer outra coisa cai em 6
function mesesDaUrl(valor: string | null): number {
  const numero = Number(valor);
  return OPCOES_MESES.includes(numero) ? numero : 6;
}

/**
 * Relatórios do painel (rota "/admin/relatorios"): receita por mês, vendas da
 * loja por categoria, quem cobrar e exportação em CSV/PDF. Cada bloco busca os
 * próprios dados e mostra o próprio erro.
 */
export function PaginaAdminRelatorios() {
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
    <>
      <NavAdmin />
      <main className="pagina-admin-relatorios">
        <Container>
          <Link to="/admin" className="pagina-admin-relatorios__voltar">
            ← Painel
          </Link>
          <div className="lista-admin__topo">
            <div>
              <h1 className="lista-admin__titulo">Relatórios</h1>
              <p className="pagina-admin-relatorios__subtitulo">
                Receita da loja e dos serviços, cobranças e exportação
              </p>
            </div>
          </div>

          <div className="pagina-admin-relatorios__blocos">
            <section className="pagina-admin-relatorios__bloco" aria-label="Receita por mês">
              <div className="pagina-admin-relatorios__cabecalho">
                <h2 className="pagina-admin-relatorios__titulo">Receita por mês</h2>
                <div className="pagina-admin-relatorios__meses" role="group" aria-label="Período">
                  {OPCOES_MESES.map((opcao) => (
                    <button
                      key={opcao}
                      type="button"
                      className="pagina-admin-relatorios__mes"
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
                <p className="pagina-admin-relatorios__nota">Carregando…</p>
              ) : (
                <GraficoBarras linhas={receita.dados} />
              )}
            </section>

            <section className="pagina-admin-relatorios__bloco" aria-label="Loja por categoria">
              <div className="pagina-admin-relatorios__cabecalho">
                <h2 className="pagina-admin-relatorios__titulo">Loja por categoria</h2>
                <span className="pagina-admin-relatorios__dica">Vendas de {mesAtual}</span>
              </div>
              {categorias.erro ? (
                <div className="lista-admin__aviso" role="alert">
                  {categorias.erro}
                  <button type="button" className="lista-admin__botao lista-admin__botao--contorno" onClick={categorias.recarregar}>
                    Tentar novamente
                  </button>
                </div>
              ) : !categorias.dados ? (
                <p className="pagina-admin-relatorios__nota">Carregando…</p>
              ) : (
                <div className="pagina-admin-relatorios__rosca">
                  <GraficoRosca linhas={categorias.dados} />
                </div>
              )}
            </section>

            <QuemCobrar />
            <GerarRelatorio />
          </div>
        </Container>
      </main>
    </>
  );
}
