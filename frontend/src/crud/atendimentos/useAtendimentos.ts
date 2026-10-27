import { useEffect, useState } from "react";
import type { Atendimento } from "../../tipos/atendimento";
import { mensagemDeErro } from "../../api/cliente";
import { listarAtendimentos } from "../../api/atendimentos";
import { useAutenticacao } from "../../contexto/useAutenticacao";

/**
 * Busca os atendimentos de quem está logado (GET /appointments): o admin
 * recebe todos e o cliente só os dele, do mais novo pro mais antigo. Usado no
 * painel (lista e início) e na aba "Atendimentos" do /perfil.
 */
export function useAtendimentos() {
  const { token } = useAutenticacao();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  // começa true porque a busca dispara assim que a tela abre
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // muda a cada "Tentar novamente", pra o efeito rodar de novo
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!token) return;
    // se a tela fechar antes da resposta chegar, o resultado é ignorado
    let cancelado = false;

    listarAtendimentos(token)
      .then((lista) => {
        if (!cancelado) setAtendimentos(lista);
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
  }, [token, tentativa]);

  function recarregar() {
    setCarregando(true);
    setErro(null);
    setTentativa((atual) => atual + 1);
  }

  return { atendimentos, carregando, erro, recarregar };
}
