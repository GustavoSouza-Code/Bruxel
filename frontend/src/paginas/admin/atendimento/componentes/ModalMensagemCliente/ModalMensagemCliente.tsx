import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../../../../../componentes/ui/Modal/Modal";
import { mensagemDeErro } from "../../../../../api/cliente";
import { MENSAGEM_CLIENTE_MAX, validarMensagemCliente } from "../../../../../crud/atendimentos/andamento";
import { codigoAtendimento } from "../../../../../crud/atendimentos/opcoesAtendimento";
import "../../../lista-admin.css";
import "./ModalMensagemCliente.css";

interface ModalMensagemClienteProps {
  acao: "recusar" | "cancelar";
  idAtendimento: string;
  /** recebe a mensagem já validada e grava no backend; se lançar erro, a janela continua aberta com ele */
  onEnviar: (mensagem: string) => Promise<void>;
  onFechar: () => void;
}

/**
 * Janela pra recusar um pedido ou cancelar um atendimento: a mensagem é
 * obrigatória, porque é ela que avisa o cliente (no Minha conta e no WhatsApp).
 */
export function ModalMensagemCliente({ acao, idAtendimento, onEnviar, onFechar }: ModalMensagemClienteProps) {
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const recusando = acao === "recusar";
  const codigo = codigoAtendimento(idAtendimento);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    const problema = validarMensagemCliente(mensagem);
    if (problema) {
      setErro(problema);
      return;
    }
    setEnviando(true);
    try {
      await onEnviar(mensagem);
    } catch (falha) {
      // a mensagem digitada continua no campo pra tentar de novo
      setErro(mensagemDeErro(falha));
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo={recusando ? `Recusar o pedido #${codigo}` : `Cancelar o atendimento #${codigo}`}
      onFechar={onFechar}
    >
      {/* noValidate: o erro vem do validarMensagemCliente, não dos balões do navegador */}
      <form className="modal-mensagem-cliente" onSubmit={enviar} noValidate>
        <label className="modal-mensagem-cliente__campo">
          Mensagem pro cliente
          <textarea
            value={mensagem}
            onChange={(e) => {
              setMensagem(e.target.value);
              setErro(null);
            }}
            maxLength={MENSAGEM_CLIENTE_MAX}
            rows={5}
            aria-invalid={Boolean(erro)}
            aria-describedby="dica-mensagem-cliente"
            placeholder={
              recusando
                ? "Ex.: Não atendemos o seu bairro nesse dia. Podemos ir na sexta às 10:00?"
                : "Ex.: O técnico teve um imprevisto. Vamos ligar pra combinar outro horário."
            }
          />
        </label>
        <div className="modal-mensagem-cliente__rodape-campo">
          <span id="dica-mensagem-cliente">O cliente vai ver esta mensagem no Minha conta.</span>
          <span>
            {mensagem.length}/{MENSAGEM_CLIENTE_MAX}
          </span>
        </div>
        {erro && (
          <p className="modal-mensagem-cliente__erro" role="alert">
            {erro}
          </p>
        )}
        <div className="modal-mensagem-cliente__acoes">
          <button type="button" className="lista-admin__botao lista-admin__botao--contorno" onClick={onFechar}>
            Voltar
          </button>
          <button type="submit" className="modal-mensagem-cliente__confirmar" disabled={enviando}>
            {enviando ? "Enviando…" : recusando ? "Recusar pedido" : "Cancelar atendimento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ModalMensagemCliente;
