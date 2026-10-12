import type { ModoVisualizacao } from "../../../hooks/useModoVisualizacao";
import { IconeGrade, IconeLista } from "../Icones/Icones";
import "./AlternarVisualizacao.css";

interface AlternarVisualizacaoProps {
  modo: ModoVisualizacao;
  onMudar: (modo: ModoVisualizacao) => void;
}

const OPCOES = [
  { modo: "cards", rotulo: "Ver em cards", Icone: IconeGrade },
  { modo: "lista", rotulo: "Ver em lista compacta", Icone: IconeLista },
] as const;

/** Dois botões de ícone pra trocar a lista entre cards e lista compacta. */
export function AlternarVisualizacao({ modo, onMudar }: AlternarVisualizacaoProps) {
  return (
    <div className="alternar-visualizacao" role="group" aria-label="Visualização">
      {OPCOES.map(({ modo: opcao, rotulo, Icone }) => (
        <button
          key={opcao}
          type="button"
          className={`alternar-visualizacao__botao${opcao === modo ? " alternar-visualizacao__botao--marcado" : ""}`}
          aria-pressed={opcao === modo}
          aria-label={rotulo}
          title={rotulo}
          onClick={() => onMudar(opcao)}
        >
          <Icone />
        </button>
      ))}
    </div>
  );
}

export default AlternarVisualizacao;
