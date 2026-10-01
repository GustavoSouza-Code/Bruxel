import { useState } from "react";
import type { Produto } from "../../tipos/produto";
import { TODOS_PRODUTOS } from "../../dados/produtos";
import type { DadosFormularioProduto } from "./FormularioProduto/FormularioProduto";

/**
 * CRUD de produtos: guarda a lista e é o único lugar que a altera. As telas
 * só chamam essas funções. Parte de TODOS_PRODUTOS e vive só na memória;
 * quando o backend for integrado, as chamadas à API entram aqui dentro sem
 * precisar mexer nas páginas.
 */
export function useProdutos() {
  // a função inicial copia a lista, pra não alterar TODOS_PRODUTOS (que a Loja também usa)
  const [produtos, setProdutos] = useState<Produto[]>(() => [...TODOS_PRODUTOS]);

  function criarProduto(dados: DadosFormularioProduto) {
    const novoProduto: Produto = {
      ...dados,
      // TODO: o id virá do backend; por enquanto usa a hora atual só pra ser único na sessão
      id: `produto-${Date.now()}`,
    };
    setProdutos((atuais) => [...atuais, novoProduto]);
  }

  // substitui os dados do produto, mantendo o id
  function atualizarProduto(id: string, dados: DadosFormularioProduto) {
    setProdutos((atuais) =>
      atuais.map((produto) => (produto.id === id ? { ...dados, id } : produto))
    );
  }

  function excluirProduto(id: string) {
    setProdutos((atuais) => atuais.filter((produto) => produto.id !== id));
  }

  return { produtos, criarProduto, atualizarProduto, excluirProduto };
}
