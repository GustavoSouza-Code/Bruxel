import { useRef } from "react";
import type { HorarioVisita } from "../../../../../tipos/atendimento";
import type { Ocupacao } from "../../../../../tipos/tecnico";
import {
  diaTemHorarioLivre,
  formatarDiaCurto,
  horarioEstaLivre,
  horariosDoDia,
  partesDoDia,
} from "../../../../../crud/atendimentos/agenda";
import { useBordasRolagem } from "../../../../../hooks/useBordasRolagem";
import "./SeletorDiaHorario.css";

interface SeletorDiaHorarioProps {
  /** dias que aparecem na faixa ("aaaa-mm-dd"), já sem domingo */
  dias: string[];
  /** id do atendente escolhido, ou SEM_PREFERENCIA */
  escolha: string;
  ocupacoes: Ocupacao[];
  /** dia escolhido; "" = nenhum */
  data: string;
  horario: HorarioVisita | null;
  onChangeData: (data: string) => void;
  onChangeHorario: (horario: HorarioVisita) => void;
}

/**
 * Segunda parte do bloco "Atendente e horário": uma faixa de dias que rola pro
 * lado e, depois de escolher o dia, os horários dele. Dia sem nenhum horário livre
 * fica apagado; horário ocupado fica riscado. Tudo depende do atendente escolhido
 * (ou de qualquer um, no "Sem preferência").
 */
export function SeletorDiaHorario({
  dias,
  escolha,
  ocupacoes,
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
          const livre = diaTemHorarioLivre(escolha, dia, ocupacoes);
          const ativo = data === dia;
          return (
            <label
              key={dia}
              className={[
                "seletor-dia-horario__dia",
                ativo && "seletor-dia-horario__dia--ativo",
                !livre && "seletor-dia-horario__dia--lotado",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name="dia"
                value={dia}
                checked={ativo}
                disabled={!livre}
                onChange={() => onChangeData(dia)}
                className="seletor-dia-horario__radio"
                aria-label={livre ? formatarDiaCurto(dia) : `${formatarDiaCurto(dia)}, sem horário livre`}
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
            Horários livres em {formatarDiaCurto(data)}
          </p>
          <div className="seletor-dia-horario__horarios" role="radiogroup" aria-labelledby="titulo-horarios">
            {horariosDoDia(data).map((opcao) => {
              const livre = horarioEstaLivre(escolha, data, opcao, ocupacoes);
              const ativo = horario === opcao;
              return (
                <label
                  key={opcao}
                  className={[
                    "seletor-dia-horario__horario",
                    ativo && "seletor-dia-horario__horario--ativo",
                    !livre && "seletor-dia-horario__horario--ocupado",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <input
                    type="radio"
                    name="horario"
                    value={opcao}
                    checked={ativo}
                    disabled={!livre}
                    onChange={() => onChangeHorario(opcao)}
                    className="seletor-dia-horario__radio"
                    aria-label={livre ? opcao : `${opcao}, ocupado`}
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
