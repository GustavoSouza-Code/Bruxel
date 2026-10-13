import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { useAtendimentos } from "../../../contexto/useAtendimentos";
import {
  acoesDoStatus,
  cancelar,
  concluir,
  confirmar,
  iniciar,
  marcarPago,
  recusar,
} from "../../../crud/atendimentos/andamento";
import { TIPO_SERVICO_LABELS } from "../../../crud/atendimentos/opcoesAtendimento";
import { formatarAgendamento, nomeDoTecnico } from "../../../crud/atendimentos/agenda";
import { formatarDataHora } from "../../../crud/atendimentos/datasAtendimento";
import { formatarReais, totalOs } from "../../../crud/atendimentos/valorOs";
import { linkWhatsApp, textoMensagemCliente } from "../../../crud/atendimentos/whatsapp";
import type { Atendimento } from "../../../tipos/atendimento";
import { SeloPagamento, SeloStatusAtendimento } from "../atendimentos/componentes/SeloStatusAtendimento/SeloStatusAtendimento";
import { CartaoClienteOs } from "./componentes/CartaoClienteOs/CartaoClienteOs";
import { GaleriaFotosOs } from "./componentes/GaleriaFotosOs/GaleriaFotosOs";
import { ModalMensagemCliente } from "./componentes/ModalMensagemCliente/ModalMensagemCliente";
import "../lista-admin.css";
import "./atendimento.css";

type AcaoDireta = "confirmar" | "iniciar" | "concluir";
type AcaoComMensagem = "recusar" | "cancelar";

// ações que mudam o status sem mensagem: texto do botão, pergunta de confirmação e aviso depois
const ACOES_DIRETAS: Record<AcaoDireta, { botao: string; pergunta: string; aviso: string; aplicar: (at: Atendimento) => Atendimento }> = {
  confirmar: {
    botao: "Confirmar visita",
    pergunta: "Confirmar a visita deste pedido?",
    aviso: "Visita confirmada.",
    aplicar: confirmar,
  },
  iniciar: {
    botao: "Iniciar atendimento",
    pergunta: "Marcar que o atendimento começou?",
    aviso: "Atendimento iniciado. Agora dá pra lançar as observações, os produtos e a mão de obra.",
    aplicar: iniciar,
  },
  concluir: {
    botao: "Marcar como concluído",
    pergunta: "Marcar o atendimento como concluído?",
    aviso: "Atendimento concluído. Falta registrar o pagamento.",
    aplicar: concluir,
  },
};

const ORDEM_ACOES_DIRETAS: AcaoDireta[] = ["confirmar", "iniciar", "concluir"];

/**
 * OS de um atendimento no painel (rota "/admin/atendimentos/:id"): dados do
 * cliente, visita, fotos e descrição, a OS (observações, produtos e valor) e os
 * botões do andamento. Se o id não existe (ex.: a página foi recarregada e os
 * pedidos em memória sumiram), mostra um aviso com o caminho de volta.
 */
export function PaginaAdminAtendimento() {
  const { id } = useParams();
  const { todosAtendimentos } = useAtendimentos();
  const atendimento = todosAtendimentos.find((item) => item.id === id) ?? null;

  if (!atendimento) {
    return (
      <>
        <NavAdmin />
        <section className="pagina-admin-atendimento">
          <Container>
            <div className="lista-admin__vazio">
              <p>Atendimento não encontrado.</p>
              <Link to="/admin/atendimentos" className="lista-admin__botao pagina-admin-atendimento__link-botao">
                Ver os atendimentos
              </Link>
            </div>
          </Container>
        </section>
      </>
    );
  }

  // key: trocar de OS pela URL começa a tela do zero (aviso, modal)
  return <ConteudoOs key={atendimento.id} atendimento={atendimento} />;
}

function ConteudoOs({ atendimento }: { atendimento: Atendimento }) {
  const { atualizarAtendimento } = useAtendimentos();
  // aviso depois de cada ação; null = sem aviso
  const [aviso, setAviso] = useState<string | null>(null);
  // qual janela de mensagem está aberta; null = nenhuma
  const [mensagemAberta, setMensagemAberta] = useState<AcaoComMensagem | null>(null);

  const acoes = acoesDoStatus(atendimento);
  const encerrado = atendimento.status === "recusado" || atendimento.status === "cancelado";
  const whatsappMensagem = atendimento.mensagemCliente
    ? linkWhatsApp(atendimento.contato.telefone, textoMensagemCliente(atendimento))
    : null;

  function fazerAcaoDireta(acao: AcaoDireta) {
    const { pergunta, aviso: textoAviso, aplicar } = ACOES_DIRETAS[acao];
    if (!window.confirm(pergunta)) return;
    atualizarAtendimento(atendimento.id, aplicar);
    setAviso(textoAviso);
  }

  function registrarPagamento() {
    const total = formatarReais(totalOs(atendimento));
    if (!window.confirm(`Registrar o pagamento de ${total}? Depois disso a OS não pode mais mudar.`)) return;
    // a hora é pega aqui fora: o transformar roda dentro do setState e precisa ser puro
    const agora = new Date();
    atualizarAtendimento(atendimento.id, (atual) => marcarPago(atual, agora));
    setAviso("Pagamento registrado. A OS está fechada.");
  }

  function enviarMensagem(mensagem: string) {
    if (!mensagemAberta) return;
    const acao = mensagemAberta;
    atualizarAtendimento(atendimento.id, (atual) =>
      acao === "recusar" ? recusar(atual, mensagem) : cancelar(atual, mensagem)
    );
    setMensagemAberta(null);
    setAviso(
      acao === "recusar"
        ? "Pedido recusado. O cliente vê a mensagem no Minha conta."
        : "Atendimento cancelado. O cliente vê a mensagem no Minha conta."
    );
  }

  return (
    <>
      <NavAdmin />

      <section className="pagina-admin-atendimento">
        <Container>
          <Link to="/admin/atendimentos" className="pagina-admin-atendimento__voltar">
            ← Atendimentos
          </Link>

          <div className="pagina-admin-atendimento__topo">
            <h1 className="pagina-admin-atendimento__titulo">#{atendimento.id}</h1>
            <SeloStatusAtendimento status={atendimento.status} />
            {atendimento.status === "concluido" && <SeloPagamento pagoEm={atendimento.pagoEm} />}
          </div>
          <p className="pagina-admin-atendimento__subtitulo">
            Pedido em {formatarDataHora(atendimento.criadoEm)}
            {atendimento.abertoNaLoja && " · aberto na loja"}
            {atendimento.pagoEm && ` · pago em ${formatarDataHora(atendimento.pagoEm)}`}
          </p>

          {/* a região fica sempre montada: o leitor de tela anuncia o texto quando ele entra */}
          <div role="status">{aviso && <p className="pagina-admin-atendimento__aviso">{aviso}</p>}</div>

          <div className="pagina-admin-atendimento__blocos">
            <CartaoClienteOs atendimento={atendimento} />

            <section className="pagina-admin-atendimento__bloco">
              <h2>Visita</h2>
              <p>{formatarAgendamento(atendimento.data, atendimento.horario, nomeDoTecnico(atendimento.tecnicoId))}</p>
              <p className="pagina-admin-atendimento__detalhe">{TIPO_SERVICO_LABELS[atendimento.tipo]}</p>
            </section>

            {encerrado && atendimento.mensagemCliente && (
              <section className="pagina-admin-atendimento__bloco pagina-admin-atendimento__bloco--mensagem">
                <h2>Mensagem enviada ao cliente</h2>
                <p className="pagina-admin-atendimento__texto">{atendimento.mensagemCliente}</p>
                {whatsappMensagem && (
                  <a
                    className="pagina-admin-atendimento__whatsapp"
                    href={whatsappMensagem}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mandar pelo WhatsApp
                  </a>
                )}
              </section>
            )}

            <section className="pagina-admin-atendimento__bloco">
              <h2>Fotos do problema</h2>
              <GaleriaFotosOs fotos={atendimento.fotos} />
            </section>

            <section className="pagina-admin-atendimento__bloco">
              <h2>Descrição do problema</h2>
              <p className="pagina-admin-atendimento__descricao">{atendimento.descricao}</p>
            </section>
          </div>

          {acoes.length > 0 && (
            <div className="pagina-admin-atendimento__acoes">
              {acoes.includes("recusar") && (
                <button
                  type="button"
                  className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--perigo"
                  onClick={() => setMensagemAberta("recusar")}
                >
                  Recusar
                </button>
              )}
              {acoes.includes("cancelar") && (
                <button
                  type="button"
                  className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--perigo"
                  onClick={() => setMensagemAberta("cancelar")}
                >
                  Cancelar atendimento
                </button>
              )}
              {ORDEM_ACOES_DIRETAS.filter((acao) => acoes.includes(acao)).map((acao) => (
                <button
                  key={acao}
                  type="button"
                  className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--principal"
                  onClick={() => fazerAcaoDireta(acao)}
                >
                  {ACOES_DIRETAS[acao].botao}
                </button>
              ))}
              {acoes.includes("marcar-pago") && (
                <button
                  type="button"
                  className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--principal"
                  onClick={registrarPagamento}
                >
                  Marcar como pago
                </button>
              )}
            </div>
          )}
        </Container>
      </section>

      {mensagemAberta && (
        <ModalMensagemCliente
          acao={mensagemAberta}
          idAtendimento={atendimento.id}
          onEnviar={enviarMensagem}
          onFechar={() => setMensagemAberta(null)}
        />
      )}
    </>
  );
}

export default PaginaAdminAtendimento;
