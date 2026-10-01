import { useMemo, useState } from "react";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { BannerLoja } from "./componentes/BannerLoja/BannerLoja";
import { NavCategorias } from "./componentes/NavCategorias/NavCategorias";
import { SecaoProdutos } from "../../../componentes/produto/SecaoProdutos/SecaoProdutos";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { TODOS_PRODUTOS } from "../../../dados/produtos";
import { CATEGORIAS } from "../../../crud/produtos/categorias";

/**
 * Loja virtual (rota "/loja"): busca por nome no topo, atalhos de categoria
 * e uma seção de produtos por categoria.
 */
export function PaginaLoja() {
  // texto digitado no campo de busca do BannerLoja
  const [searchTerm, setSearchTerm] = useState("");

  // busca por nome, sem diferenciar maiúsculas de minúsculas; campo vazio mostra tudo
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return TODOS_PRODUTOS;
    return TODOS_PRODUTOS.filter((product) =>
      product.nome.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  return (
    <>
      <Cabecalho />
      <BannerLoja termoBusca={searchTerm} onMudarBusca={setSearchTerm} />
      <NavCategorias />

      {/* destaques: os 4 primeiros do resultado (TODOS_PRODUTOS começa pelos PRODUTOS_DESTAQUE) */}
      <SecaoProdutos
        titulo="Produtos mais vendidos"
        produtos={filteredProducts.slice(0, 4)}
      />

      {/* uma seção por categoria; o id vira a âncora do NavCategorias */}
      {CATEGORIAS.map((category) => {
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

      <Rodape />
    </>
  );
}

export default PaginaLoja;
