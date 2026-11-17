import { fatiasRosca } from "../../../crud/dashboard/graficos";
import { reaisCurtos } from "../../../crud/dashboard/textos";
import type { ReceitaPorCategoriaLinha } from "../../../api/dashboard";
import "./GraficoRosca.css";

interface GraficoRoscaProps {
  linhas: ReceitaPorCategoriaLinha[];
  compacto?: boolean;
}

const RAIO = 44;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

/** Receita por categoria em rosca, com o total no centro e a legenda ao lado (ou embaixo). */
export function GraficoRosca({ linhas, compacto = false }: GraficoRoscaProps) {
  const fatias = fatiasRosca(linhas);
  if (fatias.length === 0) {
    return <p className="grafico-rosca__vazio">Nenhuma venda este mês ainda</p>;
  }

  const total = fatias.reduce((soma, fatia) => soma + fatia.value, 0);
  const rotulo = `Receita por categoria: ${fatias.map((f) => `${f.label} ${f.percentual}%`).join(", ")}`;

  // cada arco começa onde o anterior termina
  const arcos = fatias.map((fatia, i) => ({
    fatia,
    comprimento: (fatia.value / total) * CIRCUNFERENCIA,
    inicio: fatias.slice(0, i).reduce((soma, f) => soma + (f.value / total) * CIRCUNFERENCIA, 0),
  }));

  return (
    <div className={`grafico-rosca${compacto ? " grafico-rosca--compacto" : ""}`}>
      <svg className="grafico-rosca__svg" viewBox="0 0 120 120" role="img" aria-label={rotulo}>
        <g transform="rotate(-90 60 60)">
          {arcos.map(({ fatia, comprimento, inicio }) => {
            return (
              <circle
                key={fatia.label}
                cx="60"
                cy="60"
                r={RAIO}
                fill="none"
                style={{ stroke: fatia.cor }}
                strokeWidth="16"
                strokeDasharray={`${comprimento} ${CIRCUNFERENCIA - comprimento}`}
                strokeDashoffset={-inicio}
              />
            );
          })}
        </g>
        <text className="grafico-rosca__total" x="60" y="60" textAnchor="middle" dominantBaseline="central">
          {reaisCurtos(total)}
        </text>
      </svg>

      <ul className="grafico-rosca__legenda">
        {fatias.map((fatia) => (
          <li key={fatia.label} className="grafico-rosca__item">
            <i className="grafico-rosca__cor" style={{ backgroundColor: fatia.cor }} />
            {fatia.label} · {fatia.percentual}%
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GraficoRosca;
