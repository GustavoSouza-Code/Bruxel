import { useEffect, useState } from "react";
import type { Categoria } from "../../tipos/produto";
import { ErroApi, mensagemDeErro } from "../../api/cliente";
import * as apiCategorias from "../../api/categorias";
import { useAutenticacao } from "../../contexto/useAutenticacao";

/**
 * Categorias na API. A leitura é pública; criar, renomear e excluir exigem
 * token de administrador. Como no useProdutos, a lista só muda depois da
 * resposta da API, e um erro (ex.: 409) rejeita a promessa pra tela mostrar.
 */
export function useCategorias() {
  const { token } = useAutenticacao();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  // começa true porque a busca dispara assim que a tela abre
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // se a tela fechar antes da resposta chegar, o resultado é ignorado
    let cancelado = false;

    apiCategorias
      .listarCategorias()
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

  async function comToken<T>(chamada: (token: string) => Promise<T>): Promise<T> {
    if (!token) throw new ErroApi(401, "Sessão encerrada. Entre novamente.");
    return chamada(token);
  }

  // mantém a lista em ordem alfabética, como a API devolve
  function ordenar(lista: Categoria[]) {
    return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  async function criarCategoria(nome: string) {
    const nova = await comToken((t) => apiCategorias.criarCategoria(t, nome));
    setCategorias((atuais) => ordenar([...atuais, nova]));
  }

  async function atualizarCategoria(id: string, nome: string) {
    const atualizada = await comToken((t) => apiCategorias.atualizarCategoria(t, id, nome));
    setCategorias((atuais) => ordenar(atuais.map((c) => (c.id === id ? atualizada : c))));
  }

  async function excluirCategoria(id: string) {
    await comToken((t) => apiCategorias.excluirCategoria(t, id));
    setCategorias((atuais) => atuais.filter((c) => c.id !== id));
  }

  return { categorias, carregando, erro, criarCategoria, atualizarCategoria, excluirCategoria };
}
