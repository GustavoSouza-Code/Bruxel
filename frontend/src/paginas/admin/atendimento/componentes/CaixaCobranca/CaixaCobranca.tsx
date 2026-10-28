import { useId, useState } from "react";
import { useAvisos } from "../../../../../contexto/useAvisos";
import { useCobrancasLocais } from "../../../../../hooks/useCobrancasLocais";
import {
  formatarTelefone,
  linkOsCliente,
  linkWhatsApp,
  textoCobranca,
} from "../../../../../crud/atendimentos/whatsapp";
import type { Atendimento } from "../../../../../tipos/atendimento";
import "./CaixaCobranca.css";

// ISO → "21/10", no relógio de quem usa
function diaMes(iso: string) {
  const data = new Date(iso);
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Cobrança de uma OS atrasada pelo WhatsApp: o texto vem pronto (com o link da
 * OS pro cliente) e o admin pode editar antes de abrir. Quem envia é o admin,
 * no WhatsApp dele; o site só monta o link. "Cobrado em" fica guardado neste
 * navegador (useCobrancasLocais).
 */
export function CaixaCobranca({ atendimento }: { atendimento: Atendimento }) {
  const { avisar } = useAvisos();
  const { cobradoEm, registrar } = useCobrancasLocais();
  const padrao = textoCobranca(atendimento, linkOsCliente(atendimento.id, window.location.origin));
  const [texto, setTexto] = useState(padrao);
  const idTexto = useId();

  const telefone = atendimento.contato.telefone;
  const link = linkWhatsApp(telefone, texto);
  const cobrado = cobradoEm(atendimento.id);

  function aoAbrir() {
    registrar(atendimento.id);
    avisar({ tipo: "info", mensagem: "Cobrança aberta no WhatsApp." });
  }

  return (
    <div className="caixa-cobranca">
      <label htmlFor={idTexto} className="caixa-cobranca__titulo">
        Cobrar pelo WhatsApp
      </label>
      <textarea
        id={idTexto}
        className="caixa-cobranca__texto"
        rows={6}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />

      <div className="caixa-cobranca__meta">
        <span>{link ? `Pode editar antes de enviar · Para ${formatarTelefone(telefone)}` : "Pode editar antes de enviar"}</span>
        {texto !== padrao && (
          <button type="button" className="caixa-cobranca__restaurar" onClick={() => setTexto(padrao)}>
            Voltar ao texto padrão
          </button>
        )}
      </div>

      <div className="caixa-cobranca__acoes">
        {link ? (
          texto.trim() ? (
            <a className="caixa-cobranca__whatsapp" href={link} target="_blank" rel="noreferrer" onClick={aoAbrir}>
              Abrir no WhatsApp
            </a>
          ) : (
            <span className="caixa-cobranca__sem-telefone">Escreva a mensagem pra cobrar.</span>
          )
        ) : (
          <span className="caixa-cobranca__sem-telefone">
            Esta OS não tem telefone com DDD. Cobre o cliente por outro canal.
          </span>
        )}
        {cobrado && <span className="caixa-cobranca__cobrado">Cobrado em {diaMes(cobrado)} (neste navegador)</span>}
      </div>
    </div>
  );
}

export default CaixaCobranca;
