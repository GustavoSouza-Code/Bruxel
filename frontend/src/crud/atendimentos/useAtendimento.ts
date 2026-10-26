import { useEffect, useState } from "react";
import type { Atendimento, StatusAtendimento } from "../../tipos/atendimento";
import { ErroApi, mensagemDeErro } from "../../api/cliente";
import * as apiAtendimentos from "../../api/atendimentos";
import type { CamposOs } from "../../api/atendimentos";
import { useAutenticacao } from "../../contexto/useAutenticacao";

/**
 * Um atendimento do painel (/admin/atendimentos/:id): busca pelo id e expõe as
 * ações da gestão. Cada ação chama a API e troca o atendimento da tela pela
 * resposta, então a tela sempre mostra o que está no banco.
 *
 * As ações lançam o ErroApi quando falham: quem chama decide onde mostrar
 * (no modal, embaixo da OS...). `salvando` trava os botões enquanto espera.
 */
export function useAtendimento(id: string | undefined) {
  const { token } = useAutenticacao();
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // 404 = o id não existe; a tela mostra "não encontrado" em vez do erro genérico
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!token || !id) return;
    let cancelado = false;

    apiAtendimentos
      .buscarAtendimento(token, id)
      .then((encontrado) => {
        if (!cancelado) setAtendimento(encontrado);
      })
      .catch((falha: unknown) => {
        if (cancelado) return;
        if (falha instanceof ErroApi && falha.status === 404) setNaoEncontrado(true);
        else setErro(mensagemDeErro(falha));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [token, id, tentativa]);

  function recarregar() {
    setCarregando(true);
    setErro(null);
    setTentativa((atual) => atual + 1);
  }

  // roda a chamada, troca o atendimento pela resposta e solta a trava no fim
  async function executar(chamada: (token: string, id: string) => Promise<Atendimento>) {
    if (!token || !id) throw new ErroApi(401, "Sessão encerrada. Entre novamente.");
    setSalvando(true);
    try {
      const atualizado = await chamada(token, id);
      setAtendimento(atualizado);
      return atualizado;
    } finally {
      setSalvando(false);
    }
  }

  function mudarStatus(status: StatusAtendimento, mensagemCliente?: string) {
    return executar((t, i) => apiAtendimentos.mudarStatusAtendimento(t, i, status, mensagemCliente));
  }

  function salvarOs(campos: CamposOs) {
    return executar((t, i) => apiAtendimentos.salvarOs(t, i, campos));
  }

  function marcarPago() {
    return executar((t, i) => apiAtendimentos.marcarAtendimentoPago(t, i));
  }

  return { atendimento, carregando, erro, naoEncontrado, recarregar, salvando, mudarStatus, salvarOs, marcarPago };
}
