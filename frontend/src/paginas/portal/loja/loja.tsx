import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Container } from "../../../componentes/layout/Container/Container";
import { BannerLoja } from "./componentes/BannerLoja/BannerLoja";
import { FiltrosLoja } from "./componentes/FiltrosLoja/FiltrosLoja";
import { SecaoProdutos } from "../../../componentes/produto/SecaoProdutos/SecaoProdutos";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { contemTexto } from "../../../crud/busca";
import { useCatalogo } from "../../../crud/produtos/useCatalogo";
import { FILTROS_PRODUTO_INICIAIS, filtrarProdutos } from "../../../crud/produtos/filtrarProdutos";
import type { FiltrosProduto } from "../../../crud/produtos/filtrarProdutos";
import { filtrosAtivosLoja, limparFiltrosLoja, temFiltroLoja } from "../../../crud/produtos/filtrosLoja";
import { produtosEmDestaque } from "../../../crud/produtos/selecaoProdutos";
import "./loja.css";

/**
 * Loja virtual (rota "/loja"): busca por nome no topo, botão de filtros
 * (categoria, preço e ordenação) e os produtos, tudo vindo da API. Sem filtro
 * do painel, aparece uma seção por categoria; com filtro, uma lista só.
 */
export function PaginaLoja() {
  const { produtos, categorias, carregando, erro, recarregar } = useCatalogo();
  // busca do BannerLoja + filtros do painel (categoria, preço e ordem), tudo num estado só
  const [filtros, setFiltros] = useState<FiltrosProduto>(FILTROS_PRODUTO_INICIAIS);
  const { hash } = useLocation();

  // vindo de "/loja#<id da categoria>" (ex.: trilha da página do produto), rola
  // até a seção da categoria assim que os produtos aparecem
  useEffect(() => {
    if (!carregando && hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: "start" });
    }
  }, [carregando, hash]);

  const comFiltro = temFiltroLoja(filtros);
  // sem filtro do painel só a busca vale e a ordem da API continua (a vitrine "mais vendidos" depende dela);
  // com filtro, aplica categoria, preço e ordenação também
  const filteredProducts = useMemo(
    () =>
      comFiltro
        ? filtrarProdutos(produtos, filtros)
        : produtos.filter((p) => contemTexto(p.nome, filtros.busca) || contemTexto(p.codigo, filtros.busca)),
    [produtos, filtros, comFiltro]
  );

  function conteudo() {
    if (carregando) {
      return (
        <Container className="pagina-loja__estado">
          <p role="status">Carregando produtos…</p>
        </Container>
      );
    }
    // com erro, a lista pode ser a antiga de antes do recarregar; mostra só o erro
    if (erro) {
      return (
        <Container className="pagina-loja__estado">
          <p role="alert">{erro}</p>
          <button type="button" className="pagina-loja__tentar" onClick={recarregar}>
            Tentar novamente
          </button>
        </Container>
      );
    }
    if (produtos.length === 0) {
      return (
        <Container className="pagina-loja__estado">
          <p>Nenhum produto cadastrado ainda.</p>
        </Container>
      );
    }
    // a busca não achou nada: aviso no lugar de seções vazias
    if (filteredProducts.length === 0) {
      return (
        <Container className="pagina-loja__estado">
          <p>Nenhum produto encontrado.</p>
          {comFiltro && (
            <button type="button" className="pagina-loja__tentar" onClick={() => setFiltros(limparFiltrosLoja(filtros))}>
              Limpar filtros
            </button>
          )}
        </Container>
      );
    }
    // com filtro do painel (ou sem categorias, ex.: só a API de categorias falhou) vai uma lista só
    if (comFiltro || categorias.length === 0) {
      const etiquetaCategoria = filtrosAtivosLoja(filtros, categorias).find((f) => f.chave === "categoria");
      return (
        <SecaoProdutos
          titulo={etiquetaCategoria?.rotulo ?? (comFiltro ? "Resultados" : "Produtos")}
          produtos={filteredProducts}
        />
      );
    }
    return (
      <>
        <SecaoProdutos
          titulo="Produtos mais vendidos"
          produtos={produtosEmDestaque(filteredProducts)}
        />

        {/* uma seção por categoria; o id vira a âncora do NavCategorias */}
        {categorias.map((category) => {
          const products = filteredProducts.filter(
            (product) => product.categoria_id === category.id
          );
          // categoria sem produtos (ex.: a busca não achou nada nela) não aparece
          if (products.length === 0) return null;

          return (
            <SecaoProdutos
              key={category.id}
              id={category.id}
              titulo={category.nome}
              produtos={products}
            />
          );
        })}
      </>
    );
  }

  return (
    <>
      <Cabecalho />
      <BannerLoja termoBusca={filtros.busca} onMudarBusca={(busca) => setFiltros({ ...filtros, busca })} />
      <FiltrosLoja
        categorias={categorias}
        filtros={filtros}
        onMudar={setFiltros}
        totalResultados={filteredProducts.length}
      />
      {conteudo()}
      <Rodape />
    </>
  );
}

export default PaginaLoja;
