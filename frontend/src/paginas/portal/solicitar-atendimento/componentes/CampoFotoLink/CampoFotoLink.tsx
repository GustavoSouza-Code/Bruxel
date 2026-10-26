import { useState } from "react";
import { FOTO_URL_MAX } from "../../../../../crud/atendimentos/validarSolicitacao";
import "./CampoFotoLink.css";

interface CampoFotoLinkProps {
  valor: string;
  onChange: (valor: string) => void;
  /** erro do validarSolicitacao pra este campo */
  erro?: string;
}

/**
 * Bloco "Foto do problema": um link opcional, com a prévia da imagem embaixo.
 * O backend guarda só o link (foto_url); o envio de arquivo espera o servidor
 * da VM (ver o recado no spec).
 */
export function CampoFotoLink({ valor, onChange, erro }: CampoFotoLinkProps) {
  // link cuja imagem não carregou; a prévia some até o link mudar
  const [linkComErro, setLinkComErro] = useState<string | null>(null);
  const link = valor.trim();
  const mostrarPrevia = /^https?:\/\//i.test(link) && link !== linkComErro;

  return (
    <div className="campo-foto-link">
      <input
        type="url"
        className="campo-foto-link__input"
        placeholder="https://..."
        aria-label="Link da foto do problema"
        aria-invalid={Boolean(erro)}
        value={valor}
        maxLength={FOTO_URL_MAX}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="campo-foto-link__dica">
        Cole o link de uma foto (do Google Fotos, Drive ou outro site). Ajuda o técnico a já vir preparado.
      </p>
      {erro && (
        <p className="pagina-atendimento__erro" role="alert">
          {erro}
        </p>
      )}
      {mostrarPrevia && (
        <img
          className="campo-foto-link__previa"
          src={link}
          alt="Prévia da foto do problema"
          onError={() => setLinkComErro(link)}
        />
      )}
      {link && link === linkComErro && (
        <p className="campo-foto-link__dica">Não deu pra mostrar a prévia, mas o link vai junto no pedido.</p>
      )}
    </div>
  );
}

export default CampoFotoLink;
