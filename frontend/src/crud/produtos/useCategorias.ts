import { useEffect, useState } from "react";
import type { Categoria } from "../../tipos/produto";
import { mensagemDeErro } from "../../api/cliente";
import { listarCategorias } from "../../api/categorias";

/**
 * Busca as categorias na API (rota pública, sem token). Os setState ficam
 * dentro do .then/.catch, depois da resposta, e não direto no efeito.
 */
export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  // começa true porque a busca dispara assim que a tela abre
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // se a tela fechar antes da resposta chegar, o resultado é ignorado
    let cancelado = false;

    listarCategorias()
      .then((lista) => {
        if (!cancelado) setCategorias(lista);
      })
      .catch((falha: unknown) => {
        if (!cancelado) setErro(mensagemDeErro(falha));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return { categorias, carregando, erro };
}
