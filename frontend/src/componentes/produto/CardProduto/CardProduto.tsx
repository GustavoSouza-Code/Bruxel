import type { Produto } from "../../../tipos/produto";
import { useCarrinho } from "../../../contexto/ContextoCarrinho";
import "./CardProduto.css";

interface CardProdutoProps {
  produto: Produto;
  /** chamada ao clicar no ♡; opcional e ainda não usada por nenhuma página (o botão não faz nada por enquanto) */
  onFavoritar?: (produtoId: string) => void;
}

/**
 * Card de produto: imagem, nome, preço e botão de adicionar ao
 * carrinho. É usado na Home, na Loja e no resultado do Piscinator.
 */
export function CardProduto({ produto, onFavoritar }: CardProdutoProps) {
  const { adicionarItem } = useCarrinho();

  return (
    <article className="card-produto">
      <button
        className="card-produto__favorito"
        aria-label="Favoritar produto"
        onClick={() => onFavoritar?.(produto.id)}
      >
        ♡
      </button>

      <img
        className="card-produto__imagem"
        src={produto.url_imagem}
        alt={produto.nome}
      />

      <div className="card-produto__info">
        <p className="card-produto__nome">{produto.nome}</p>
      </div>

      {/* toFixed(2) garante 2 casas decimais; o replace troca o ponto pela vírgula (formato brasileiro) */}
      <p className="card-produto__preco">
        R$ <strong>{produto.preco.toFixed(2).replace(".", ",")}</strong>
      </p>

      <button
        className="card-produto__botao-adicionar"
        onClick={() => adicionarItem(produto)}
      >
        Adicionar ao carrinho
      </button>
    </article>
  );
}

export default CardProduto;
