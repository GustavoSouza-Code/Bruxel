import type { Produto } from "../../../tipos/produto";
import { CardProduto } from "../CardProduto/CardProduto";
import { Container } from "../../layout/Container/Container";
import "./SecaoProdutos.css";

interface SecaoProdutosProps {
  /** vira o id da <section>; o NavCategorias usa pra rolar até ela */
  id?: string;
  /** título da seção (padrão: "Produtos mais vendidos") */
  titulo?: string;
  produtos: Produto[];
  /** se informado, mostra o botão "Acessar loja virtual" ao lado do título */
  onVerLoja?: () => void;
}

/**
 * Seção com título e uma grade de ProductCards. Serve tanto pra Home
 * (destaques) quanto pras seções por categoria da Loja.
 */
export function SecaoProdutos({
  id,
  titulo = "Produtos mais vendidos",
  produtos,
  onVerLoja,
}: SecaoProdutosProps) {
  return (
    <section id={id} className="secao-produtos">
      <Container>
        <div className="secao-produtos__cabecalho">
          <h2>{titulo}</h2>
          {onVerLoja && (
            <button
              className="secao-produtos__botao-loja"
              onClick={onVerLoja}
            >
              Acessar loja virtual
            </button>
          )}
        </div>

        <div className="secao-produtos__grade">
          {produtos.map((produto) => (
            <CardProduto key={produto.id} produto={produto} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default SecaoProdutos;
