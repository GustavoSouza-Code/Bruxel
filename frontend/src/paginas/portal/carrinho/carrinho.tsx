import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { ItemCarrinho } from "./componentes/ItemCarrinho/ItemCarrinho";
import { useCarrinho } from "../../../contexto/ContextoCarrinho";
import "./carrinho.css";

/**
 * Carrinho de compras (rota "/carrinho"): lista os itens com controle de
 * quantidade e mostra o resumo do pedido. Sem itens, mostra uma mensagem
 * com link pra Loja.
 */
export function PaginaCarrinho() {
  const { itens, total, removerItem, atualizarQuantidade } = useCarrinho();

  return (
    <>
      <Cabecalho />

      <section className="pagina-carrinho">
        <Container>
          <nav className="pagina-carrinho__trilha" aria-label="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Carrinho de compras</span>
          </nav>

          <h1 className="pagina-carrinho__titulo">Seu carrinho</h1>

          {/* vazio: mensagem + link pra Loja; com itens: lista à esquerda e resumo à direita */}
          {itens.length === 0 ? (
            <p className="pagina-carrinho__vazio">
              Seu carrinho está vazio.{" "}
              <a href="/loja">Continue navegando pela loja virtual.</a>
            </p>
          ) : (
            <div className="pagina-carrinho__layout">
              <div className="pagina-carrinho__itens">
                {itens.map((item) => (
                  <ItemCarrinho
                    key={item.produto.id}
                    item={item}
                    onRemover={removerItem}
                    onMudarQuantidade={atualizarQuantidade}
                  />
                ))}
              </div>

              <aside className="pagina-carrinho__resumo">
                <h2>Finalizar compra</h2>
                {/* TODO: hoje "Produtos" e "Total" são iguais; frete e desconto ainda não existem */}
                <div className="pagina-carrinho__linha-resumo">
                  <span>Produtos</span>
                  <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="pagina-carrinho__linha-resumo pagina-carrinho__linha-resumo--total">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
                {/* TODO: ligar ao fechamento do pedido quando existir; o botão ainda não faz nada */}
                <button className="pagina-carrinho__continuar">Continuar</button>
              </aside>
            </div>
          )}
        </Container>
      </section>

      <Rodape />
    </>
  );
}

export default PaginaCarrinho;
