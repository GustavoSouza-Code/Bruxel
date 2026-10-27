import { useState } from "react";
import "./GaleriaFotosOs.css";

/**
 * Foto que o cliente mandou (o backend guarda um link só). Se a imagem não
 * carregar, fica o link pra abrir em outra aba.
 */
export function GaleriaFotosOs({ fotoUrl }: { fotoUrl: string | null }) {
  // link cuja imagem falhou; aí só o link aparece
  const [falhou, setFalhou] = useState<string | null>(null);

  if (!fotoUrl) {
    return <p className="galeria-fotos-os__vazio">O cliente não mandou foto.</p>;
  }

  return (
    <div className="galeria-fotos-os">
      {falhou !== fotoUrl && (
        <img
          className="galeria-fotos-os__principal"
          src={fotoUrl}
          alt="Foto do problema"
          onError={() => setFalhou(fotoUrl)}
        />
      )}
      <a className="galeria-fotos-os__link" href={fotoUrl} target="_blank" rel="noreferrer">
        {falhou === fotoUrl ? "A foto não carregou aqui. Abrir o link" : "Abrir a foto em outra aba"}
      </a>
    </div>
  );
}

export default GaleriaFotosOs;
