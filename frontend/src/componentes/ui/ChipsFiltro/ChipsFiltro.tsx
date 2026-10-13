import "./ChipsFiltro.css";

interface OpcaoChip<T extends string> {
  valor: T;
  rotulo: string;
}

interface ChipsFiltroProps<T extends string> {
  /** as opções na ordem em que aparecem; inclua a de "Todos" (normalmente com valor "") */
  opcoes: OpcaoChip<T>[];
  selecionado: T;
  onSelecionar: (valor: T) => void;
  /** nome do grupo pra leitores de tela, ex.: "Categoria" */
  rotulo: string;
}

/**
 * Fileira de chips em que só um fica marcado por vez (ex.: as categorias). O
 * genérico T faz o TypeScript conferir que os valores das opções e o
 * selecionado são do mesmo tipo.
 */
export function ChipsFiltro<T extends string>({
  opcoes,
  selecionado,
  onSelecionar,
  rotulo,
}: ChipsFiltroProps<T>) {
  return (
    <div className="chips-filtro" role="group" aria-label={rotulo}>
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          className={`chips-filtro__chip${opcao.valor === selecionado ? " chips-filtro__chip--marcado" : ""}`}
          aria-pressed={opcao.valor === selecionado}
          onClick={() => onSelecionar(opcao.valor)}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}

export default ChipsFiltro;
