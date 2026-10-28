import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Aviso } from "../../../contexto/useAvisos";
import { usePresenca } from "../../../hooks/usePresenca";
import { IconeFechar } from "../Icones/Icones";
import { duracaoDoAviso } from "./filaAvisos";
import "./Avisos.css";

interface PilhaAvisosProps {
  avisos: Aviso[];
  /** tira o aviso da fila, depois que a animação de saída termina */
  onRemover: (id: number) => void;
}

/**
 * Os avisos na tela, empilhados no canto de baixo (ver ContextoAvisos). O
 * aria-live faz o leitor de tela anunciar cada aviso novo sem tirar o foco
 * de onde a pessoa está.
 */
export function PilhaAvisos({ avisos, onRemover }: PilhaAvisosProps) {
  return (
    <div className="avisos" aria-live="polite">
      {avisos.map((aviso) => (
        <ItemAviso key={aviso.id} aviso={aviso} onRemover={onRemover} />
      ))}
    </div>
  );
}

/** Um aviso: some sozinho depois de alguns segundos, mas espera enquanto o mouse ou o foco estão nele. */
function ItemAviso({ aviso, onRemover }: { aviso: Aviso; onRemover: (id: number) => void }) {
  const [visivel, setVisivel] = useState(true);
  const [pausado, setPausado] = useState(false);
  const { montado, saindo } = usePresenca(visivel, 150);

  // conta o tempo na tela; mouse em cima ou foco dentro param a contagem
  useEffect(() => {
    if (!visivel || pausado) return;
    const timer = window.setTimeout(() => setVisivel(false), duracaoDoAviso(aviso.tipo));
    return () => window.clearTimeout(timer);
  }, [visivel, pausado, aviso.tipo]);

  // a animação de saída acabou: avisa o provedor pra tirar da fila
  useEffect(() => {
    if (!montado) onRemover(aviso.id);
  }, [montado, aviso.id, onRemover]);

  if (!montado) return null;

  return (
    <div
      className={`aviso aviso--${aviso.tipo}${saindo ? " aviso--saindo" : ""}`}
      role={aviso.tipo === "erro" ? "alert" : undefined}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="aviso__texto">
        <span>{aviso.mensagem}</span>
        {aviso.acao && (
          <Link to={aviso.acao.para} className="aviso__acao" onClick={() => setVisivel(false)}>
            {aviso.acao.rotulo}
          </Link>
        )}
      </div>
      <button type="button" className="aviso__fechar" aria-label="Fechar aviso" onClick={() => setVisivel(false)}>
        <IconeFechar />
      </button>
    </div>
  );
}

export default PilhaAvisos;
