import { useEffect, useState } from "react";
import type { Usuario } from "../../../tipos/usuario";
import { ErroApi, mensagemDeErro } from "../../../api/cliente";
import * as apiUsuarios from "../../../api/usuarios";
import { paraCamposAtualizacao } from "../../../crud/usuarios/camposUsuario";
import { useAutenticacao } from "../../../contexto/useAutenticacao";

/**
 * Dados completos de quem está logado, pra página /perfil: busca no banco ao
 * abrir e salva as edições.
 *
 * A sessão só guarda id, nome, e-mail e perfil; CPF, telefone e endereço vêm
 * do GET /users/:id. Hoje essa rota (e o PUT) só aceita administrador, então
 * um cliente recebe 403 e a página mostra o erro até o backend liberar o
 * acesso pro próprio usuário.
 *
 * Se a API responder 401 (token vencido ou usuário apagado), a sessão é
 * encerrada e o RotaLogado manda a pessoa pro /entrar.
 */
export function usePerfil() {
  const { usuario, token, sair, atualizarDadosSessao } = useAutenticacao();
  const id = usuario?.id;
  // dados vindos do banco; null enquanto carrega ou se a busca falhar
  const [dados, setDados] = useState<Usuario | null>(null);
  // começa true porque a busca dispara assim que a página abre
  const [carregando, setCarregando] = useState(true);
  // erro ao carregar; null = sem erro
  const [erro, setErro] = useState<string | null>(null);
  // somar 1 aqui faz o useEffect abaixo buscar de novo ("Tentar novamente")
  const [tentativa, setTentativa] = useState(0);

  // busca os dados ao abrir a página (e a cada "Tentar novamente"). Os setState
  // ficam dentro do .then/.catch, depois da resposta, e não direto no efeito
  useEffect(() => {
    if (!token || !id) return;
    // se a página fechar antes da resposta chegar, o resultado é ignorado
    let cancelado = false;

    apiUsuarios
      .buscarUsuario(token, id)
      .then((encontrado) => {
        if (!cancelado) setDados(encontrado);
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
  }, [token, id, sair, tentativa]);

  function recarregar() {
    setCarregando(true);
    setErro(null);
    setTentativa((atual) => atual + 1);
  }

  /**
   * Grava o usuário editado e troca os dados da tela pelo que o backend
   * devolveu. Se a API recusar, a promessa rejeita com um ErroApi e a página
   * mostra a mensagem.
   */
  async function salvar(editado: Usuario) {
    if (!token || !id) throw new ErroApi(401, "Sessão encerrada. Entre novamente.");
    try {
      const atualizado = await apiUsuarios.atualizarUsuario(token, id, paraCamposAtualizacao(editado));
      setDados(atualizado);
      // o Cabecalho mostra o nome da sessão, então ela acompanha a edição
      atualizarDadosSessao({
        id: atualizado.id,
        nome: atualizado.nome,
        email: atualizado.email,
        perfil: atualizado.perfil,
      });
    } catch (falha) {
      if (falha instanceof ErroApi && falha.status === 401) sair();
      throw falha;
    }
  }

  return { dados, carregando, erro, recarregar, salvar };
}
