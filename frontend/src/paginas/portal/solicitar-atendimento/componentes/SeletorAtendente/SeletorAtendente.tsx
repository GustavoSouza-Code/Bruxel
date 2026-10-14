import type { Tecnico } from "../../../../../tipos/tecnico";
import { SEM_PREFERENCIA } from "../../../../../crud/atendimentos/agenda";
import { IconePessoas } from "../../../../../componentes/ui/Icones/Icones";
import "./SeletorAtendente.css";

interface SeletorAtendenteProps {
  tecnicos: Tecnico[];
  /** id do atendente escolhido, ou SEM_PREFERENCIA */
  valor: string;
  onChange: (escolha: string) => void;
}

/**
 * Primeira parte do bloco "Atendente e horário": o card "Sem preferência" e um
 * card por atendente. Por baixo são radios (escondidos só visualmente), como os
 * cards de tipo de serviço: dá pra escolher com Tab + setas.
 */
export function SeletorAtendente({ tecnicos, valor, onChange }: SeletorAtendenteProps) {
  // "Sem preferência" vem primeiro e mostra um ícone no lugar das iniciais
  const opcoes = [
    { id: SEM_PREFERENCIA, nome: "Sem preferência", detalhe: "quem estiver livre", iniciais: null },
    ...tecnicos.map((tecnico) => ({
      id: tecnico.id,
      nome: tecnico.nome,
      detalhe: tecnico.especialidade,
      iniciais: tecnico.nome.slice(0, 2).toUpperCase(),
    })),
  ];

  return (
    <div className="seletor-atendente">
      {opcoes.map((opcao) => {
        const ativo = valor === opcao.id;
        return (
          <label
            key={opcao.id}
            className={`seletor-atendente__card${ativo ? " seletor-atendente__card--ativo" : ""}`}
          >
            <input
              type="radio"
              name="atendente"
              value={opcao.id}
              checked={ativo}
              onChange={() => onChange(opcao.id)}
              className="seletor-atendente__radio"
            />
            <span className="seletor-atendente__avatar" aria-hidden="true">
              {opcao.iniciais ?? <IconePessoas />}
            </span>
            <span className="seletor-atendente__textos">
              <strong>{opcao.nome}</strong>
              <span>{opcao.detalhe}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default SeletorAtendente;
