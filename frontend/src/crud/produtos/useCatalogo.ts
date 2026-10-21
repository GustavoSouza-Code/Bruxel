import { useEffect, useState } from "react";
import type { Categoria, Produto } from "../../tipos/produto";
import { mensagemDeErro } from "../../api/cliente";
import { listarCategorias } from "../../api/categorias";
import { listarProdutos } from "../../api/produtos";
import { apenasAtivos } from "./selecaoProdutos";

/**
 * Catálogo da loja: busca produtos e categorias juntos (rotas públicas, sem
 * token) e entrega só os produtos ativos.
 *
 * O erro reflete só a falha dos produtos. Se as categorias falharem (ex.: a
 * rota ainda não existe no backend), `categorias` fica vazio e os produtos
 * continuam aparecendo.
 */
export function useCatalogo() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  // começa true porque a busca dispara assim que a tela abre
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // somar 1 aqui faz o useEffect abaixo buscar de novo ("Tentar novamente")
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    // se a tela fechar antes da resposta chegar, o resultado é ignorado
    let cancelado = false;

    Promise.allSettled([listarProdutos(), listarCategorias()]).then(
      ([resProdutos, resCategorias]) => {
        if (cancelado) return;
        if (resProdutos.status === "fulfilled") setProdutos(apenasAtivos(resProdutos.value));
        else setErro(mensagemDeErro(resProdutos.reason));
        setCategorias(resCategorias.status === "fulfilled" ? resCategorias.value : []);
        setCarregando(false);
      },
    );

    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  function recarregar() {
    setCarregando(true);
    setErro(null);
    setTentativa((atual) => atual + 1);
  }

  return { produtos, categorias, carregando, erro, recarregar };
}
