import { useEffect, useState } from "react";
import type { Usuario } from "../../tipos/usuario";
import { ErroApi, mensagemDeErro } from "../../api/cliente";
import * as apiUsuarios from "../../api/usuarios";
import type { CamposAtualizacaoUsuario, DadosNovoUsuario } from "../../api/usuarios";
import { useAutenticacao } from "../../contexto/useAutenticacao";

/**
 * CRUD de usuários: busca a lista na API e é o único lugar que a altera. As
 * telas só chamam essas funções.
 *
 * Cada alteração espera a resposta do backend antes de mexer na lista, pra
 * tela nunca mostrar algo que não foi salvo. Se a API recusar, a promessa
 * rejeita com um ErroApi e quem chamou mostra a mensagem.
 *
 * As rotas de usuários exigem token de administrador. Se a API responder 401
 * (token vencido ou usuário apagado), a sessão é encerrada e o RotaAdmin
 * manda a pessoa pro /entrar.
 */
export function useUsuarios() {
  const { token, sair } = useAutenticacao();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  // começa true porque a busca dispara assim que a página abre
  const [carregando, setCarregando] = useState(true);
  // erro ao carregar a lista; null = sem erro
  const [erro, setErro] = useState<string | null>(null);
  // somar 1 aqui faz o useEffect abaixo buscar a lista de novo ("Tentar novamente")
  const [tentativa, setTentativa] = useState(0);

  // busca a lista ao abrir a página (e a cada "Tentar novamente"). Os setState
  // ficam dentro do .then/.catch, depois da resposta, e não direto no efeito
  useEffect(() => {
    if (!token) return;
    // se a página fechar antes da resposta chegar, o resultado é ignorado
    let cancelado = false;

    apiUsuarios
      .listarUsuarios(token)
      .then((lista) => {
        if (!cancelado) setUsuarios(lista);
      })
      .catch((falha: unknown) => {
        if (falha instanceof ErroApi && falha.status === 401) sair();
        if (!cancelado) setErro(mensagemDeErro(falha));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [token, sair, tentativa]);

  function recarregar() {
    setCarregando(true);
    setErro(null);
    setTentativa((atual) => atual + 1);
  }

  // roda uma chamada autenticada; se o token não vale mais (401), encerra a sessão antes de repassar o erro
  async function comToken<T>(chamada: (token: string) => Promise<T>): Promise<T> {
    if (!token) throw new ErroApi(401, "Sessão encerrada. Entre novamente.");
    try {
      return await chamada(token);
    } catch (falha) {
      if (falha instanceof ErroApi && falha.status === 401) sair();
      throw falha;
    }
  }

  async function criarUsuario(dados: DadosNovoUsuario) {
    // o cadastro é público, não precisa de token
    const novo = await apiUsuarios.criarUsuario(dados);
    setUsuarios((atuais) => [...atuais, novo]);
  }

  // substitui o usuário pela versão que o backend devolveu (já com o que ele de fato salvou)
  async function atualizarUsuario(id: string, campos: CamposAtualizacaoUsuario) {
    const atualizado = await comToken((t) => apiUsuarios.atualizarUsuario(t, id, campos));
    setUsuarios((atuais) => atuais.map((usuario) => (usuario.id === id ? atualizado : usuario)));
  }

  async function excluirUsuario(id: string) {
    await comToken((t) => apiUsuarios.excluirUsuario(t, id));
    setUsuarios((atuais) => atuais.filter((usuario) => usuario.id !== id));
  }

  return { usuarios, carregando, erro, recarregar, criarUsuario, atualizarUsuario, excluirUsuario };
}
