import { Link } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { MensagemPagina } from "../../../componentes/ui/MensagemPagina/MensagemPagina";

/**
 * Página 404 (rota "*"): aparece quando o endereço não existe no site.
 */
export function PaginaNaoEncontrada() {
  return (
    <>
      <Cabecalho />
      <MensagemPagina
        codigo="404"
        titulo="Página não encontrada"
        texto="O endereço que você tentou abrir não existe ou foi movido."
      >
        <Link to="/" className="mensagem-pagina__botao">
          Voltar ao início
        </Link>
        <Link to="/loja" className="mensagem-pagina__botao mensagem-pagina__botao--contorno">
          Ver a loja
        </Link>
      </MensagemPagina>
      <Rodape />
    </>
  );
}

export default PaginaNaoEncontrada;
