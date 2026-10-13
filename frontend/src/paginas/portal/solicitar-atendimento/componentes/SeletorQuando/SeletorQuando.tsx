import type { PeriodoAtendimento } from "../../../../../tipos/atendimento";
import { PERIODOS, PERIODO_LABELS } from "../../../../../crud/atendimentos/opcoesAtendimento";
import "./SeletorQuando.css";

interface SeletorQuandoProps {
  /** "aaaa-mm-dd"; "" = ainda não escolheu */
  data: string;
  periodo: PeriodoAtendimento | null;
  /** primeiro dia aceito ("aaaa-mm-dd"); vai no min do calendário */
  dataMinima: string;
  onChangeData: (data: string) => void;
  onChangePeriodo: (periodo: PeriodoAtendimento) => void;
}

/**
 * Bloco "Quando você prefere?": data + turno. Fica num componente separado de
 * propósito: no futuro vira a escolha do piscineiro e de um horário livre na
 * agenda dele, sem mexer no resto do formulário.
 */
export function SeletorQuando({
  data,
  periodo,
  dataMinima,
  onChangeData,
  onChangePeriodo,
}: SeletorQuandoProps) {
  return (
    <div className="seletor-quando">
      <label className="seletor-quando__data">
        Data
        <input type="date" value={data} min={dataMinima} onChange={(e) => onChangeData(e.target.value)} />
      </label>

      <div className="seletor-quando__periodos" role="radiogroup" aria-label="Período">
        {PERIODOS.map((opcao) => {
          const ativo = periodo === opcao;
          return (
            <label
              key={opcao}
              className={`seletor-quando__periodo${ativo ? " seletor-quando__periodo--ativo" : ""}`}
            >
              <input
                type="radio"
                name="periodo"
                value={opcao}
                checked={ativo}
                onChange={() => onChangePeriodo(opcao)}
                className="seletor-quando__radio"
              />
              {PERIODO_LABELS[opcao]}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default SeletorQuando;
