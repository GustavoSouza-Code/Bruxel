import { Link } from "react-router-dom";
import { Modal } from "../../../../../componentes/ui/Modal/Modal";
import { codigoAtendimento } from "../../../../../crud/atendimentos/opcoesAtendimento";
import { formatarData } from "../../../../../crud/atendimentos/datasAtendimento";
import { formatarReais, totalOs } from "../../../../../crud/atendimentos/valorOs";
import { diasDesdeVisita, estaAtrasada } from "../../../../../crud/pagamentos/atraso";
import type { Atendimento } from "../../../../../tipos/atendimento";
import { SeloAtraso, SeloPagamento } from "../../../atendimentos/componentes/SeloStatusAtendimento/SeloStatusAtendimento";
import { CaixaCobranca } from "../CaixaCobranca/CaixaCobranca";
import "../../../lista-admin.css";
import "./ModalCobrancaOs.css";

interface ModalCobrancaOsProps {
  atendimento: Atendimento;
  onFechar: () => void;
  /** só pagamentos passa: aí o modal também mostra "Marcar como pago" */
  onMarcarPago?: () => void;
  /** true enquanto o pagamento é registrado (o botão mostra "Registrando…") */
  pagando?: boolean;
}

/**
 * Resumo de uma OS concluída num modal (gestão de pagamentos e lista de
 * atendimentos): cliente, visita, total e situação. Se ela estiver atrasada,
 * traz a caixa de cobrança pelo WhatsApp.
 */
export function ModalCobrancaOs({ atendimento, onFechar, onMarcarPago, pagando = false }: ModalCobrancaOsProps) {
  const hoje = new Date();
  const atrasada = estaAtrasada(atendimento, hoje);

  return (
    <Modal titulo={`OS #${codigoAtendimento(atendimento.id)}`} onFechar={onFechar} largo>
      <dl className="modal-cobranca-os__dados">
        <div>
          <dt>Cliente</dt>
          <dd>{atendimento.cliente.nome}</dd>
        </div>
        <div>
          <dt>Visita</dt>
          <dd>
            {formatarData(atendimento.data)} às {atendimento.horario}
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd className="modal-cobranca-os__valor">{formatarReais(totalOs(atendimento))}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>
            {atrasada ? (
              <SeloAtraso dias={diasDesdeVisita(atendimento, hoje)} />
            ) : (
              <SeloPagamento pagoEm={atendimento.pagoEm} />
            )}
          </dd>
        </div>
      </dl>

      {atrasada && <CaixaCobranca atendimento={atendimento} />}

      <div className="modal-cobranca-os__acoes">
        {onMarcarPago && !atendimento.pagoEm && (
          <button type="button" className="lista-admin__botao" onClick={onMarcarPago} disabled={pagando}>
            {pagando ? "Registrando…" : "Marcar como pago"}
          </button>
        )}
        <Link
          to={`/admin/atendimentos/${atendimento.id}`}
          className="lista-admin__botao lista-admin__botao--contorno modal-cobranca-os__link"
        >
          Abrir a OS completa
        </Link>
      </div>
    </Modal>
  );
}

export default ModalCobrancaOs;
