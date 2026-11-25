import { useRef } from "react";
import type { HorarioVisita } from "../../../../../tipos/atendimento";
import {
  formatarDiaCurto,
  horariosDoDia,
  horariosPorTurno,
  partesDoDia,
} from "../../../../../crud/atendimentos/agenda";
import { useBordasRolagem } from "../../../../../hooks/useBordasRolagem";
import "./SeletorDiaHorario.css";

interface SeletorDiaHorarioProps {
  /** dias que aparecem na faixa ("aaaa-mm-dd"), já sem domingo */
  dias: string[];
  /** dia escolhido; "" = nenhum */
  data: string;
  /** "hh:mm"; null = nenhum */
  horario: string | null;
  /** "livre" = admin escolhe qualquer data e hora; "cliente" = grade de 30 min */
  modo: "cliente" | "livre";
  /** horários já reservados ("hh:mm"), usados só no modo cliente */
  ocupados: string[];
  /** true enquanto os horários reservados do dia estão sendo buscados */
  carregandoOcupados: boolean;
  onChangeData: (data: string) => void;
  onChangeHorario: (horario: string) => void;
}

/**
 * Bloco "Dia e horário".
 *
 * Cliente: uma faixa de dias que rola pro lado e, depois de escolher o dia, a
 * grade de 30 min separada em manhã e tarde. Os horários já reservados aparecem
 * desabilitados; o backend confirma a reserva de novo no envio.
 *
 * Administrador: campos livres de data e hora, sem a grade (ele encaixa o
 * atendimento quando precisar).
 */
export function SeletorDiaHorario({
  dias,
  data,
  horario,
  modo,
  ocupados,
  carregandoOcupados,
  onChangeData,
  onChangeHorario,
}: SeletorDiaHorarioProps) {
  const faixaRef = useRef<HTMLDivElement>(null);
  // esmaece as bordas da faixa quando tem dia escondido (o mesmo efeito do menu do cabeçalho no celular)
  const { canScrollLeft, canScrollRight } = useBordasRolagem(faixaRef);

  if (modo === "livre") {
    return (
      <div className="seletor-dia-horario">
        <div className="seletor-dia-horario__livre">
          <label>
            Data
            <input type="date" value={data} onChange={(e) => onChangeData(e.target.value)} />
          </label>
          <label>
            Horário
            <input
              type="time"
              value={horario ?? ""}
              onChange={(e) => onChangeHorario(e.target.value)}
            />
          </label>
        </div>
      </div>
    );
  }

  const turnos = data ? horariosPorTurno(data) : { manha: [], tarde: [] };
  const total = horariosDoDia(data).length;
  const livres = horariosDoDia(data).filter((opcao) => !ocupados.includes(opcao));

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

          {carregandoOcupados && (
            <p className="seletor-dia-horario__aviso" role="status">
              Verificando horários reservados…
            </p>
          )}

          <div className="seletor-dia-horario__grade" role="radiogroup" aria-labelledby="titulo-horarios">
            {(
              [
                ["Manhã", turnos.manha],
                ["Tarde", turnos.tarde],
              ] as const
            ).map(([titulo, opcoes]) =>
              opcoes.length === 0 ? null : (
                <div className="seletor-dia-horario__turno" key={titulo}>
                  <p className="seletor-dia-horario__turno-titulo">{titulo}</p>
                  <div className="seletor-dia-horario__horarios">
                    {opcoes.map((opcao: HorarioVisita) => {
                      const reservado = ocupados.includes(opcao);
                      const ativo = horario === opcao && !reservado;
                      return (
                        <label
                          key={opcao}
                          className={[
                            "seletor-dia-horario__horario",
                            ativo && "seletor-dia-horario__horario--ativo",
                            reservado && "seletor-dia-horario__horario--indisponivel",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          title={reservado ? "Horário já reservado" : undefined}
                        >
                          <input
                            type="radio"
                            name="horario"
                            value={opcao}
                            checked={ativo}
                            onChange={() => onChangeHorario(opcao)}
                            disabled={reservado}
                            className="seletor-dia-horario__radio"
                            aria-label={reservado ? `${opcao} (reservado)` : opcao}
                          />
                          {opcao}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>

          {total > 0 && livres.length === 0 && !carregandoOcupados && (
            <p className="seletor-dia-horario__aviso" role="status">
              Todos os horários deste dia já foram reservados. Escolha outro dia.
            </p>
          )}
        </>
      ) : (
        <p className="seletor-dia-horario__vazio">Escolha um dia pra ver os horários.</p>
      )}
    </div>
  );
}

export default SeletorDiaHorario;
