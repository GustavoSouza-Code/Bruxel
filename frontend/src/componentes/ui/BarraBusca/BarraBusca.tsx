import { IconeBusca, IconeFiltros } from "../Icones/Icones";
import "./BarraBusca.css";

interface BarraBuscaProps {
  valor: string;
  onMudar: (valor: string) => void;
  placeholder: string;
  /** nome do campo pra leitores de tela, ex.: "Buscar produtos" */
  rotulo: string;
  filtrosAbertos: boolean;
  onAlternarFiltros: () => void;
  /** quantos filtros do painel estão em uso; aparece no botão como "Filtros (2)" */
  qtdFiltrosAtivos: number;
  /** id do PainelFiltros que o botão abre e fecha */
  idPainel: string;
}

/** Campo de busca + botão "Filtros", que abre e fecha o PainelFiltros logo abaixo. */
export function BarraBusca({
  valor,
  onMudar,
  placeholder,
  rotulo,
  filtrosAbertos,
  onAlternarFiltros,
  qtdFiltrosAtivos,
  idPainel,
}: BarraBuscaProps) {
  return (
    <div className="barra-busca">
      <div className="barra-busca__campo">
        <IconeBusca />
        <input
          type="search"
          value={valor}
          onChange={(e) => onMudar(e.target.value)}
          placeholder={placeholder}
          aria-label={rotulo}
        />
      </div>
      <button
        type="button"
        className={`barra-busca__filtros${filtrosAbertos ? " barra-busca__filtros--aberto" : ""}`}
        onClick={onAlternarFiltros}
        aria-expanded={filtrosAbertos}
        aria-controls={idPainel}
      >
        <IconeFiltros />
        Filtros{qtdFiltrosAtivos > 0 && ` (${qtdFiltrosAtivos})`}
      </button>
    </div>
  );
}

export default BarraBusca;
