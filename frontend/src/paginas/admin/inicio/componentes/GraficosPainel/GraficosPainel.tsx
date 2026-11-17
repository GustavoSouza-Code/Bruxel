import { Link } from "react-router-dom";
import { GraficoBarras } from "../../../../../componentes/graficos/GraficoBarras/GraficoBarras";
import { GraficoRosca } from "../../../../../componentes/graficos/GraficoRosca/GraficoRosca";
import { useReceitaMensal, useReceitaPorCategoria } from "../../../../../crud/dashboard/useDashboard";
import "./GraficosPainel.css";

/**
 * Gráficos compactos da home do painel: receita dos últimos 6 meses e a loja
 * por categoria. Cada bloco some sozinho se a busca dele falhar.
 */
export function GraficosPainel() {
  const receita = useReceitaMensal(6);
  const categorias = useReceitaPorCategoria();

  if (receita.erro && categorias.erro) return null;

  return (
    <div className="graficos-painel">
      {!receita.erro && (
        <section className="graficos-painel__bloco" aria-label="Receita dos últimos 6 meses">
          <div className="graficos-painel__cabecalho">
            <h2 className="graficos-painel__titulo">Receita · 6 meses</h2>
            <Link to="/admin/relatorios" className="graficos-painel__link">
              Ver relatórios →
            </Link>
          </div>
          {!receita.dados ? (
            <p className="graficos-painel__carregando">Carregando…</p>
          ) : (
            <GraficoBarras linhas={receita.dados} compacto />
          )}
        </section>
      )}

      {!categorias.erro && (
        <section className="graficos-painel__bloco" aria-label="Loja por categoria">
          <div className="graficos-painel__cabecalho">
            <h2 className="graficos-painel__titulo">Loja por categoria</h2>
          </div>
          {!categorias.dados ? (
            <p className="graficos-painel__carregando">Carregando…</p>
          ) : (
            <GraficoRosca linhas={categorias.dados} compacto />
          )}
        </section>
      )}
    </div>
  );
}

export default GraficosPainel;
