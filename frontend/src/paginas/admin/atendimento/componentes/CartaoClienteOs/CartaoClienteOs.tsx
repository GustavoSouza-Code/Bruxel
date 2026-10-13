import { formatarEndereco } from "../../../../../crud/usuarios/camposUsuario";
import { linkWhatsApp, textoSaudacao } from "../../../../../crud/atendimentos/whatsapp";
import type { Atendimento } from "../../../../../tipos/atendimento";
import "./CartaoClienteOs.css";

/** "Ana Paula Souza" → "AS": primeira letra do primeiro e do último nome. */
function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

/** Quem é o cliente, onde é o serviço e o atalho pro WhatsApp dele (topo da OS). */
export function CartaoClienteOs({ atendimento }: { atendimento: Atendimento }) {
  const { cliente, contato } = atendimento;
  const whatsapp = linkWhatsApp(contato.telefone, textoSaudacao(atendimento));

  return (
    <section className="cartao-cliente-os" aria-label="Cliente">
      <span className="cartao-cliente-os__avatar" aria-hidden="true">
        {iniciais(cliente.nome)}
      </span>
      <div className="cartao-cliente-os__dados">
        <strong>
          {cliente.nome}
          {cliente.id === null && <span className="cartao-cliente-os__sem-cadastro"> · sem cadastro</span>}
        </strong>
        <span>{contato.telefone}</span>
        <span>{formatarEndereco(contato)}</span>
        {/* o banco guarda só os 8 dígitos; na tela vai com hífen (95900-000) */}
        {contato.cep && <span>CEP {contato.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</span>}
      </div>
      {whatsapp && (
        <a className="cartao-cliente-os__whatsapp" href={whatsapp} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      )}
    </section>
  );
}

export default CartaoClienteOs;
