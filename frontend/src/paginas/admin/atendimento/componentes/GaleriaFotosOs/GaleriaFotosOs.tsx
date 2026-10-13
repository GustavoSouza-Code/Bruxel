import { useState } from "react";
import "./GaleriaFotosOs.css";

/** Fotos que o cliente mandou: a escolhida em tamanho grande e as outras em miniatura. */
export function GaleriaFotosOs({ fotos }: { fotos: string[] }) {
  const [indice, setIndice] = useState(0);

  if (fotos.length === 0) {
    return <p className="galeria-fotos-os__vazio">O cliente não mandou fotos.</p>;
  }

  const escolhida = Math.min(indice, fotos.length - 1);

  return (
    <div className="galeria-fotos-os">
      <img
        className="galeria-fotos-os__principal"
        src={fotos[escolhida]}
        alt={`Foto ${escolhida + 1} de ${fotos.length} do problema`}
      />
      {fotos.length > 1 && (
        <ul className="galeria-fotos-os__miniaturas">
          {fotos.map((foto, posicao) => (
            <li key={foto}>
              <button
                type="button"
                className={`galeria-fotos-os__miniatura${posicao === escolhida ? " galeria-fotos-os__miniatura--ativa" : ""}`}
                aria-label={`Ver a foto ${posicao + 1}`}
                aria-pressed={posicao === escolhida}
                onClick={() => setIndice(posicao)}
              >
                <img src={foto} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GaleriaFotosOs;
