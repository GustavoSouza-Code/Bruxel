import { Link } from "react-router-dom";
import "./Logo.css";

/**
 * Logo "Bruxel / Piscinas" dos headers (Cabecalho do site e NavAdmin do
 * painel). É um link: clicar em qualquer tela leva de volta pra Home.
 */
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Bruxel Piscinas, ir para a página inicial">
      <span className="logo__principal">Bruxel</span>
      <span className="logo__secundario">Piscinas</span>
    </Link>
  );
}

export default Logo;
