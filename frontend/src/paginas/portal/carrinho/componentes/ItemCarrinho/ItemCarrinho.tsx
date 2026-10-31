import type { LinhaCarrinho } from "../../../../../contexto/useCarrinho";
import "./ItemCarrinho.css";

interface ItemCarrinhoProps {
  item: LinhaCarrinho;
  /** remove o produto do carrinho de vez */
  onRemover: (produtoId: string) => void;
  /** define a nova quantidade; o carrinho remove o item se ela ficar abaixo de 1 */
  onMudarQuantidade: (produtoId: string, quantidade: number) => void;
}

/**
 * Uma linha do carrinho: imagem, nome, controle de quantidade e o subtotal
 * (preço × quantidade). O tipo do item é importado como LinhaCarrinho pra não
 * conflitar com o nome deste componente.
 */
export function ItemCarrinho({ item, onRemover, onMudarQuantidade }: ItemCarrinhoProps) {
  const { produto, quantidade } = item;
  // no máximo o estoque do produto; no limite o "+" trava e aparece o aviso
  const noLimite = quantidade >= produto.estoque;

  return (
    <div className="item-carrinho">
      <button
        className="item-carrinho__remover"
        aria-label="Remover produto"
        onClick={() => onRemover(produto.id)}
      >
        ×
      </button>

      <img className="item-carrinho__imagem" src={produto.url_imagem} alt={produto.nome} />

      <div className="item-carrinho__info">
        <p className="item-carrinho__nome">{produto.nome}</p>

        <div className="item-carrinho__quantidade">
          <span>Quantidade</span>
          <div className="item-carrinho__seletor">
            <button
              onClick={() => onMudarQuantidade(produto.id, quantidade - 1)}
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span>{quantidade}</span>
            <button
              onClick={() => onMudarQuantidade(produto.id, quantidade + 1)}
              disabled={noLimite}
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>
        </div>
        {noLimite && (
          <p className="item-carrinho__aviso" role="status">
            {produto.estoque === 1 ? "Só tem 1 unidade em estoque." : `Máximo em estoque: ${produto.estoque} unidades.`}
          </p>
        )}
      </div>

      {/* subtotal deste item (preço × quantidade) */}
      <p className="item-carrinho__preco">
        R$ <strong>{(produto.preco * quantidade).toFixed(2).replace(".", ",")}</strong>
      </p>
    </div>
  );
}

export default ItemCarrinho;
