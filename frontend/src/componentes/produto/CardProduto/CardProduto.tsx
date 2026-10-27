import { useState } from "react";
import { Link } from "react-router-dom";
import type { Produto } from "../../../tipos/produto";
import { useCarrinho } from "../../../contexto/useCarrinho";
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
  // URL cuja imagem falhou; o placeholder vale só pra ela (se a URL mudar, tenta de novo)
  const [urlComErro, setUrlComErro] = useState<string | null>(null);
  const mostrarImagem = Boolean(produto.url_imagem) && produto.url_imagem !== urlComErro;

  return (
    <article className="card-produto">
      <button
        className="card-produto__favorito"
        aria-label="Favoritar produto"
        onClick={() => onFavoritar?.(produto.id)}
      >
        ♡
      </button>

      {mostrarImagem ? (
        <img
          className="card-produto__imagem"
          src={produto.url_imagem}
          alt={produto.nome}
          onError={() => setUrlComErro(produto.url_imagem ?? null)}
        />
      ) : (
        <span className="card-produto__imagem card-produto__imagem--vazio" aria-hidden="true" />
      )}

      <div className="card-produto__info">
        <p className="card-produto__nome">{produto.nome}</p>
      </div>

      {/* link esticado sobre o card inteiro; ♡ e o botão do carrinho ficam acima dele (z-index) e não navegam */}
      <Link
        to={`/produto/${produto.id}`}
        className="card-produto__link"
        aria-label={`Ver detalhes de ${produto.nome}`}
      />


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
