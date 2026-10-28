import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { ItemCarrinho } from "./componentes/ItemCarrinho/ItemCarrinho";
import { FinalizarCompra } from "./componentes/FinalizarCompra/FinalizarCompra";
import { useEffect, useRef } from "react";
import { useCarrinho } from "../../../contexto/useCarrinho";
import { useAvisos } from "../../../contexto/useAvisos";
import { useCatalogo } from "../../../crud/produtos/useCatalogo";
import { reconciliarComCatalogo } from "../../../crud/carrinho/regrasCarrinho";
import "./carrinho.css";

/**
 * Carrinho de compras (rota "/carrinho"): lista os itens com controle de
 * quantidade e, ao lado, o resumo com o fechamento da compra (FinalizarCompra).
 * Sem itens, mostra uma mensagem com link pra Loja.
 *
 * O carrinho fica salvo no navegador, então pode estar velho: ao abrir, a
 * página confere com a loja (preço, estoque, produto que saiu) antes de a
 * pessoa fechar a compra, e avisa o que mudou.
 */
export function PaginaCarrinho() {
  const { itens, removerItem, atualizarQuantidade, substituirItens } = useCarrinho();
  const { avisar } = useAvisos();
  const catalogo = useCatalogo();
  // confere uma vez por visita à página, quando o catálogo chega
  const conferido = useRef(false);

  useEffect(() => {
    if (conferido.current || catalogo.carregando || catalogo.erro) return;
    conferido.current = true;
    const { itens: novos, removidos, ajustados } = reconciliarComCatalogo(itens, catalogo.produtos);
    substituirItens(novos);
    if (removidos.length > 0) {
      avisar({ tipo: "info", mensagem: `Saiu da loja e foi tirado do carrinho: ${removidos.join(", ")}.` });
    }
    if (ajustados.length > 0) {
      avisar({ tipo: "info", mensagem: `Preço ou quantidade atualizados conforme a loja: ${ajustados.join(", ")}.` });
    }
  }, [catalogo.carregando, catalogo.erro, catalogo.produtos, itens, substituirItens, avisar]);

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

              <FinalizarCompra />
            </div>
          )}
        </Container>
      </section>

      <Rodape />
    </>
  );
}

export default PaginaCarrinho;
