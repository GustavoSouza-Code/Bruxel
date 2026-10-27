import { useRef } from "react";
import type { HorarioVisita } from "../../../../../tipos/atendimento";
import { formatarDiaCurto, horariosDoDia, partesDoDia } from "../../../../../crud/atendimentos/agenda";
import { useBordasRolagem } from "../../../../../hooks/useBordasRolagem";
import "./SeletorDiaHorario.css";

interface SeletorDiaHorarioProps {
  /** dias que aparecem na faixa ("aaaa-mm-dd"), já sem domingo */
  dias: string[];
  /** dia escolhido; "" = nenhum */
  data: string;
  horario: HorarioVisita | null;
  onChangeData: (data: string) => void;
  onChangeHorario: (horario: HorarioVisita) => void;
}

/**
 * Bloco "Dia e horário": uma faixa de dias que rola pro lado e, depois de
 * escolher o dia, os horários dele (os blocos de 2h do horário de funcionamento).
 * O backend ainda não informa a agenda ocupada (ver o recado no spec), então
 * todos aparecem livres e a Bruxel confirma o horário com o cliente.
 */
export function SeletorDiaHorario({
  dias,
  data,
  horario,
  onChangeData,
  onChangeHorario,
}: SeletorDiaHorarioProps) {
  const faixaRef = useRef<HTMLDivElement>(null);
  // esmaece as bordas da faixa quando tem dia escondido (o mesmo efeito do menu do cabeçalho no celular)
  const { canScrollLeft, canScrollRight } = useBordasRolagem(faixaRef);

  return (
    <div className="seletor-dia-horario">
      <p className="seletor-dia-horario__titulo" id="titulo-dias">
        Escolha o dia
      </p>
      <div
        ref={faixaRef}
        className={[
          "seletor-dia-horario__dias",
          canScrollLeft && "seletor-dia-horario__dias--esmaecer-esquerda",
          canScrollRight && "seletor-dia-horario__dias--esmaecer-direita",
        ]
          .filter(Boolean)
          .join(" ")}
        role="radiogroup"
        aria-labelledby="titulo-dias"
      >
        {dias.map((dia) => {
          const { semana, dia: numero } = partesDoDia(dia);
          const ativo = data === dia;
          return (
            <label
              key={dia}
              className={["seletor-dia-horario__dia", ativo && "seletor-dia-horario__dia--ativo"]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name="dia"
                value={dia}
                checked={ativo}
                onChange={() => onChangeData(dia)}
                className="seletor-dia-horario__radio"
                aria-label={formatarDiaCurto(dia)}
              />
              <span>{semana}</span>
              <strong>{numero}</strong>
            </label>
          );
        })}
      </div>

      {data ? (
        <>
          <p className="seletor-dia-horario__titulo" id="titulo-horarios">
            Horários em {formatarDiaCurto(data)}
          </p>
          <div className="seletor-dia-horario__horarios" role="radiogroup" aria-labelledby="titulo-horarios">
            {horariosDoDia(data).map((opcao) => {
              const ativo = horario === opcao;
              return (
                <label
                  key={opcao}
                  className={["seletor-dia-horario__horario", ativo && "seletor-dia-horario__horario--ativo"]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <input
                    type="radio"
                    name="horario"
                    value={opcao}
                    checked={ativo}
                    onChange={() => onChangeHorario(opcao)}
                    className="seletor-dia-horario__radio"
                    aria-label={opcao}
                  />
                  {opcao}
                </label>
              );
            })}
          </div>
        </>
      ) : (
        <p className="seletor-dia-horario__vazio">Escolha um dia pra ver os horários.</p>
      )}
    </div>
  );
}

export default SeletorDiaHorario;
