import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { SecaoProdutos } from "../../../componentes/produto/SecaoProdutos/SecaoProdutos";
import type { Produto } from "../../../tipos/produto";
import { useCatalogo } from "../../../crud/produtos/useCatalogo";
import { nomeDaCategoria } from "../../../crud/produtos/categorias";
import { produtosRelacionados, quantidadeDisponivel } from "../../../crud/produtos/selecaoProdutos";
// a partir de POUCO_ESTOQUE o selo de estoque vira "Últimas unidades"
import { POUCO_ESTOQUE } from "../../../crud/produtos/estoque";
import { useCarrinho } from "../../../contexto/useCarrinho";
import "./produto.css";

function formatarPreco(preco: number) {
  return preco.toFixed(2).replace(".", ",");
}

/**
 * Detalhe de um produto (rota "/produto/:id"): trilha, foto, preço, estoque,
 * quantidade e botão de carrinho; embaixo, a descrição e outros produtos da
 * mesma categoria. Usa o mesmo catálogo da Loja (useCatalogo), então produto
 * inativo ou inexistente aparece como "não encontrado".
 */
export function PaginaProduto() {
  const { id } = useParams();
  const { produtos, categorias, carregando, erro, recarregar } = useCatalogo();
  const produto = produtos.find((p) => p.id === id);
  const categoria = produto ? nomeDaCategoria(categorias, produto.categoria_id) : "";
  const relacionados = produto ? produtosRelacionados(produtos, produto) : [];

  // ao abrir outro produto pelos relacionados, a página estaria rolada lá embaixo
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <>
      <Cabecalho />

      <section className="pagina-produto">
        <Container>
          {carregando && <p role="status">Carregando produto…</p>}

          {!carregando && erro && (
            <div className="pagina-produto__estado" role="alert">
              <p>{erro}</p>
              <button type="button" className="pagina-produto__botao" onClick={recarregar}>
                Tentar novamente
              </button>
            </div>
          )}

          {!carregando && !erro && !produto && (
            <div className="pagina-produto__estado">
              <p>Produto não encontrado.</p>
              <Link to="/loja" className="pagina-produto__botao">
                Voltar para a loja
              </Link>
            </div>
          )}

          {/* a key zera quantidade e aviso de "adicionado" ao trocar de produto */}
          {produto && <DetalheProduto key={produto.id} produto={produto} categoria={categoria} />}
        </Container>
      </section>

      {relacionados.length > 0 && (
        <SecaoProdutos
          titulo={categoria ? `Mais de ${categoria}` : "Você também pode gostar"}
          produtos={relacionados}
        />
      )}

      <Rodape />
    </>
  );
}

interface DetalheProdutoProps {
  produto: Produto;
  /** nome da categoria; vazio se as categorias não carregaram */
  categoria: string;
}

function DetalheProduto({ produto, categoria }: DetalheProdutoProps) {
  const { itens, adicionarItem, atualizarQuantidade } = useCarrinho();
  const [quantidade, setQuantidade] = useState(1);
  // unidades adicionadas no último clique, pro aviso; null = nenhum clique ainda
  const [adicionado, setAdicionado] = useState<number | null>(null);
  const [imagemComErro, setImagemComErro] = useState(false);

  const noCarrinho = itens.find((item) => item.produto.id === produto.id)?.quantidade ?? 0;
  const disponivel = quantidadeDisponivel(produto.estoque, noCarrinho);
  // depois de adicionar, o disponível diminui; a quantidade escolhida não pode passar dele
  const qtd = Math.min(quantidade, Math.max(disponivel, 1));

  function adicionar() {
    // o carrinho só sabe somar 1 ou definir a quantidade exata: entra com 1 e já ajusta
    if (noCarrinho === 0) adicionarItem(produto);
    atualizarQuantidade(produto.id, noCarrinho + qtd);
    setAdicionado(qtd);
    setQuantidade(1);
  }

  return (
    <>
      <nav aria-label="Trilha de navegação">
        <ol className="pagina-produto__trilha">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/loja">Loja</Link>
          </li>
          {categoria && (
            <li>
              <Link to={`/loja#${produto.categoria_id}`}>{categoria}</Link>
            </li>
          )}
          <li aria-current="page">{produto.nome}</li>
        </ol>
      </nav>

      <article className="pagina-produto__layout">
        <div className="pagina-produto__moldura">
          {produto.url_imagem && !imagemComErro ? (
            <img
              className="pagina-produto__imagem"
              src={produto.url_imagem}
              alt={produto.nome}
              onError={() => setImagemComErro(true)}
            />
          ) : (
            <span className="pagina-produto__imagem--vazio" aria-hidden="true" />
          )}
        </div>

        <div className="pagina-produto__info">
          {categoria && <span className="pagina-produto__categoria">{categoria}</span>}
          <h1 className="pagina-produto__nome">{produto.nome}</h1>
          <p className="pagina-produto__preco">
            R$ <strong>{formatarPreco(produto.preco)}</strong>
          </p>

          <SeloEstoque estoque={produto.estoque} />

          {produto.estoque > 0 && disponivel === 0 && (
            <p className="pagina-produto__aviso">
              Você já tem todo o estoque deste produto no carrinho.{" "}
              <Link to="/carrinho">Ver carrinho</Link>
            </p>
          )}

          {disponivel > 0 && (
            <div className="pagina-produto__compra">
              <div className="pagina-produto__quantidade" role="group" aria-label="Quantidade">
                <button
                  type="button"
                  onClick={() => setQuantidade(qtd - 1)}
                  disabled={qtd <= 1}
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>
                <span aria-live="polite">{qtd}</span>
                <button
                  type="button"
                  onClick={() => setQuantidade(qtd + 1)}
                  disabled={qtd >= disponivel}
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
              <button type="button" className="pagina-produto__adicionar" onClick={adicionar}>
                Adicionar ao carrinho
              </button>
            </div>
          )}

          {adicionado !== null && (
            <p className="pagina-produto__adicionado" role="status">
              ✓ {adicionado} {adicionado === 1 ? "unidade adicionada" : "unidades adicionadas"} ao carrinho.{" "}
              <Link to="/carrinho">Ver carrinho</Link>
            </p>
          )}

          <p className="pagina-produto__ajuda">
            Dúvida sobre o produto? <Link to="/solicitar-atendimento">Solicitar atendimento</Link>
          </p>
        </div>
      </article>

      {produto.descricao && (
        <section className="pagina-produto__descricao">
          <h2>Descrição</h2>
          <p>{produto.descricao}</p>
        </section>
      )}
    </>
  );
}

/** Selo verde com o estoque; amarelo quando está acabando e vermelho quando esgotou. */
function SeloEstoque({ estoque }: { estoque: number }) {
  if (estoque <= 0) {
    return <span className="pagina-produto__selo pagina-produto__selo--esgotado">Esgotado</span>;
  }
  if (estoque <= POUCO_ESTOQUE) {
    return (
      <span className="pagina-produto__selo pagina-produto__selo--pouco">
        {estoque === 1 ? "Última unidade" : `Últimas ${estoque} unidades`}
      </span>
    );
  }
  return <span className="pagina-produto__selo">{estoque} em estoque</span>;
}

export default PaginaProduto;
