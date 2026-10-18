import { useMemo, useState } from "react";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Container } from "../../../componentes/layout/Container/Container";
import { BannerLoja } from "./componentes/BannerLoja/BannerLoja";
import { NavCategorias } from "./componentes/NavCategorias/NavCategorias";
import { SecaoProdutos } from "../../../componentes/produto/SecaoProdutos/SecaoProdutos";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { useCatalogo } from "../../../crud/produtos/useCatalogo";
import { produtosEmDestaque } from "../../../crud/produtos/selecaoProdutos";

/**
 * Loja virtual (rota "/loja"): busca por nome no topo, atalhos de categoria
 * e uma seção de produtos por categoria, tudo vindo da API.
 */
export function PaginaLoja() {
  const { produtos, categorias, carregando, erro, recarregar } = useCatalogo();
  // texto digitado no campo de busca do BannerLoja
  const [searchTerm, setSearchTerm] = useState("");

  // busca por nome, sem diferenciar maiúsculas de minúsculas; campo vazio mostra tudo
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return produtos;
    return produtos.filter((product) =>
      product.nome.toLowerCase().includes(term)
    );
  }, [produtos, searchTerm]);

  function conteudo() {
    if (carregando) {
      return (
        <Container>
          <p>Carregando produtos…</p>
        </Container>
      );
    }
    // com erro, a lista pode ser a antiga de antes do recarregar; mostra só o erro
    if (erro) {
      return (
        <Container>
          <p>{erro}</p>
          <button type="button" onClick={recarregar}>
            Tentar novamente
          </button>
        </Container>
      );
    }
    if (produtos.length === 0) {
      return (
        <Container>
          <p>Nenhum produto cadastrado ainda.</p>
        </Container>
      );
    }
    // sem categorias (ex.: só a API de categorias falhou) mostra tudo numa seção só
    if (categorias.length === 0) {
      return <SecaoProdutos titulo="Produtos" produtos={filteredProducts} />;
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
      <BannerLoja termoBusca={searchTerm} onMudarBusca={setSearchTerm} />
      <NavCategorias categorias={categorias} />
      {conteudo()}
      <Rodape />
    </>
  );
}

export default PaginaLoja;
