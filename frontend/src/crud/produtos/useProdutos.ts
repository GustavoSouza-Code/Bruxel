import { useEffect, useState } from "react";
import type { Produto } from "../../tipos/produto";
import { ErroApi, mensagemDeErro } from "../../api/cliente";
import * as apiProdutos from "../../api/produtos";
import type { DadosProduto } from "../../api/produtos";
import { useAutenticacao } from "../../contexto/useAutenticacao";

/**
 * CRUD de produtos do admin: busca a lista na API e é o único lugar que a
 * altera. As telas só chamam essas funções.
 *
 * Cada alteração espera a resposta do backend antes de mexer na lista, pra
 * tela nunca mostrar algo que não foi salvo. Se a API recusar, a promessa
 * rejeita com um ErroApi e quem chamou mostra a mensagem.
 *
 * Criar, editar e excluir exigem token de administrador. Se a API responder
 * 401 (token vencido), o cliente.ts encerra a sessão e o RotaAdmin manda a
 * pessoa pro /entrar. A leitura da lista é pública.
 */
export function useProdutos() {
  const { token } = useAutenticacao();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  // começa true porque a busca dispara assim que a página abre
  const [carregando, setCarregando] = useState(true);
  // erro ao carregar a lista; null = sem erro
  const [erro, setErro] = useState<string | null>(null);
  // somar 1 aqui faz o useEffect abaixo buscar a lista de novo ("Tentar novamente")
  const [tentativa, setTentativa] = useState(0);

  // busca a lista ao abrir a página (e a cada "Tentar novamente"). Os setState
  // ficam dentro do .then/.catch, depois da resposta, e não direto no efeito
  useEffect(() => {
    // se a página fechar antes da resposta chegar, o resultado é ignorado
    let cancelado = false;

    apiProdutos
      .listarProdutos()
      .then((lista) => {
        if (!cancelado) setProdutos(lista);
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
  }, [tentativa]);

  function recarregar() {
    setCarregando(true);
    setErro(null);
    setTentativa((atual) => atual + 1);
  }

  // roda uma chamada autenticada. Um 401 da API já encerra a sessão no cliente.ts
  // (ver registrarSessaoExpirada), então aqui só repassamos o erro
  async function comToken<T>(chamada: (token: string) => Promise<T>): Promise<T> {
    if (!token) throw new ErroApi(401, "Sessão encerrada. Entre novamente.");
    return chamada(token);
  }

  async function criarProduto(dados: DadosProduto) {
    try {
      const novo = await comToken((t) => apiProdutos.criarProduto(t, dados));
      setProdutos((atuais) => [...atuais, novo]);
    } catch (falha) {
      // a criação é um POST seguido de um PUT: se o PUT falhar, o produto já existe no
      // banco pela metade. Recarrega a lista pra tela mostrar o que de fato foi salvo
      recarregar();
      throw falha;
    }
  }

  // substitui o produto pela versão que o backend devolveu (já com o que ele de fato salvou)
  async function atualizarProduto(id: string, dados: DadosProduto) {
    const atualizado = await comToken((t) => apiProdutos.atualizarProduto(t, id, dados));
    setProdutos((atuais) => atuais.map((produto) => (produto.id === id ? atualizado : produto)));
  }

  async function excluirProduto(id: string) {
    await comToken((t) => apiProdutos.excluirProduto(t, id));
    setProdutos((atuais) => atuais.filter((produto) => produto.id !== id));
  }

  return { produtos, carregando, erro, recarregar, criarProduto, atualizarProduto, excluirProduto };
}
