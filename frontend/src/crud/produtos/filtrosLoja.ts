import type { Categoria } from "../../tipos/produto";
import { FILTROS_PRODUTO_INICIAIS, paraNumero } from "./filtrarProdutos";
import type { FiltrosProduto, OrdemProduto } from "./filtrarProdutos";

/** Cada grupo de filtro do painel da Loja; é o que o botão × de cada etiqueta remove. */
export type ChaveFiltroLoja = "categoria" | "preco" | "ordem";

/** Uma etiqueta de filtro em uso, como aparece ao lado do botão "Filtros". */
export interface FiltroAtivo {
  chave: ChaveFiltroLoja;
  rotulo: string;
}

/** As ordenações que a Loja oferece (a de estoque é só do painel admin). */
export const ORDENS_LOJA: { valor: OrdemProduto; rotulo: string }[] = [
  { valor: "nome", rotulo: "Nome (A a Z)" },
  { valor: "preco-asc", rotulo: "Menor preço" },
  { valor: "preco-desc", rotulo: "Maior preço" },
];

// "R$ 45,90": o mesmo jeito das outras telas (toFixed e vírgula)
function reais(valor: number) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

// o preço só conta como filtro se o texto digitado for um número de verdade
function faixaDePreco(filtros: FiltrosProduto) {
  return { min: paraNumero(filtros.precoMin), max: paraNumero(filtros.precoMax) };
}

/** Quantos grupos de filtro do painel estão em uso (o número do botão): categoria, preço e ordem. */
export function contarFiltrosLoja(filtros: FiltrosProduto) {
  const { min, max } = faixaDePreco(filtros);
  return [
    filtros.categoriaId !== "",
    min !== null || max !== null,
    filtros.ordem !== FILTROS_PRODUTO_INICIAIS.ordem,
  ].filter(Boolean).length;
}

/** true quando algum filtro do painel está em uso; aí a Loja mostra uma lista só, em vez de uma seção por categoria. */
export function temFiltroLoja(filtros: FiltrosProduto) {
  return contarFiltrosLoja(filtros) > 0;
}

/** As etiquetas dos filtros em uso, na ordem categoria, preço, ordenação. */
export function filtrosAtivosLoja(filtros: FiltrosProduto, categorias: Categoria[]): FiltroAtivo[] {
  const ativos: FiltroAtivo[] = [];

  const categoria = categorias.find((c) => c.id === filtros.categoriaId);
  if (categoria) ativos.push({ chave: "categoria", rotulo: categoria.nome });

  const { min, max } = faixaDePreco(filtros);
  if (min !== null && max !== null) ativos.push({ chave: "preco", rotulo: `${reais(min)} a ${reais(max)}` });
  else if (min !== null) ativos.push({ chave: "preco", rotulo: `A partir de ${reais(min)}` });
  else if (max !== null) ativos.push({ chave: "preco", rotulo: `Até ${reais(max)}` });

  if (filtros.ordem !== FILTROS_PRODUTO_INICIAIS.ordem) {
    const ordem = ORDENS_LOJA.find((o) => o.valor === filtros.ordem);
    if (ordem) ativos.push({ chave: "ordem", rotulo: ordem.rotulo });
  }

  return ativos;
}

/** Tira um grupo de filtro e mantém o resto (inclusive a busca por nome). */
export function removerFiltroLoja(filtros: FiltrosProduto, chave: ChaveFiltroLoja): FiltrosProduto {
  switch (chave) {
    case "categoria":
      return { ...filtros, categoriaId: "" };
    case "preco":
      return { ...filtros, precoMin: "", precoMax: "" };
    case "ordem":
      return { ...filtros, ordem: FILTROS_PRODUTO_INICIAIS.ordem };
  }
}

/** Zera os filtros do painel e mantém só a busca por nome. */
export function limparFiltrosLoja(filtros: FiltrosProduto): FiltrosProduto {
  return { ...FILTROS_PRODUTO_INICIAIS, busca: filtros.busca };
}
