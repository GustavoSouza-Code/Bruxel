import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { mensagemDeErro } from "../../../api/cliente";
import { useAtendimento } from "../../../crud/atendimentos/useAtendimento";
import { STATUS_DA_ACAO, acoesDoStatus, osEditavel } from "../../../crud/atendimentos/andamento";
import { TIPO_SERVICO_LABELS, codigoAtendimento } from "../../../crud/atendimentos/opcoesAtendimento";
import { formatarAgendamento } from "../../../crud/atendimentos/agenda";
import { formatarDataHora } from "../../../crud/atendimentos/datasAtendimento";
import {
  formatarReais,
  maoDeObraParaTexto,
  paraValorEmReais,
  totalOs,
  validarMaoDeObra,
} from "../../../crud/atendimentos/valorOs";
import { linkWhatsApp, textoMensagemCliente } from "../../../crud/atendimentos/whatsapp";
import type { Atendimento, ProdutoUsado } from "../../../tipos/atendimento";
import { SeloPagamento, SeloStatusAtendimento } from "../atendimentos/componentes/SeloStatusAtendimento/SeloStatusAtendimento";
import { CartaoClienteOs } from "./componentes/CartaoClienteOs/CartaoClienteOs";
import { GaleriaFotosOs } from "./componentes/GaleriaFotosOs/GaleriaFotosOs";
import { ModalMensagemCliente } from "./componentes/ModalMensagemCliente/ModalMensagemCliente";
import { ProdutosDaOs } from "./componentes/ProdutosDaOs/ProdutosDaOs";
import "../lista-admin.css";
import "./atendimento.css";

type AcaoDireta = "confirmar" | "iniciar" | "concluir";
type AcaoComMensagem = "recusar" | "cancelar";

// ações que mudam o status sem mensagem: texto do botão, pergunta de confirmação e aviso depois
const ACOES_DIRETAS: Record<AcaoDireta, { botao: string; pergunta: string; aviso: string }> = {
  confirmar: {
    botao: "Confirmar visita",
    pergunta: "Confirmar a visita deste pedido?",
    aviso: "Visita confirmada.",
  },
  iniciar: {
    botao: "Iniciar atendimento",
    pergunta: "Marcar que o atendimento começou?",
    aviso: "Atendimento iniciado. Agora dá pra lançar as observações, os produtos e a mão de obra.",
  },
  concluir: {
    botao: "Marcar como concluído",
    pergunta: "Marcar o atendimento como concluído? O estoque dos produtos lançados vai ser baixado.",
    aviso: "Atendimento concluído e estoque atualizado. Falta registrar o pagamento.",
  },
};

const ORDEM_ACOES_DIRETAS: AcaoDireta[] = ["confirmar", "iniciar", "concluir"];

/**
 * OS de um atendimento no painel (rota "/admin/atendimentos/:id"): busca o
 * atendimento na API e mostra carregando, erro (com "Tentar novamente") ou
 * "não encontrado" enquanto não tem o que exibir.
 */
export function PaginaAdminAtendimento() {
  const { id } = useParams();
  const os = useAtendimento(id);

  if (!os.atendimento) {
    return (
      <>
        <NavAdmin />
        <section className="pagina-admin-atendimento">
          <Container>
            {os.carregando ? (
              <p className="lista-admin__vazio">Carregando atendimento…</p>
            ) : os.erro ? (
              <div className="lista-admin__aviso" role="alert">
                <span>{os.erro}</span>
                <button
                  type="button"
                  className="lista-admin__botao lista-admin__botao--contorno"
                  onClick={os.recarregar}
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="lista-admin__vazio">
                <p>Atendimento não encontrado.</p>
                <Link to="/admin/atendimentos" className="lista-admin__botao pagina-admin-atendimento__link-botao">
                  Ver os atendimentos
                </Link>
              </div>
            )}
          </Container>
        </section>
      </>
    );
  }

  // key: trocar de OS pela URL começa a tela do zero (aviso, modal, rascunho)
  return (
    <ConteudoOs
      key={os.atendimento.id}
      atendimento={os.atendimento}
      salvando={os.salvando}
      mudarStatus={os.mudarStatus}
      salvarOs={os.salvarOs}
      marcarPago={os.marcarPago}
    />
  );
}

interface ConteudoOsProps {
  atendimento: Atendimento;
  salvando: boolean;
  mudarStatus: ReturnType<typeof useAtendimento>["mudarStatus"];
  salvarOs: ReturnType<typeof useAtendimento>["salvarOs"];
  marcarPago: ReturnType<typeof useAtendimento>["marcarPago"];
}

function ConteudoOs({ atendimento, salvando, mudarStatus, salvarOs, marcarPago }: ConteudoOsProps) {
  // aviso depois de cada ação; null = sem aviso
  const [aviso, setAviso] = useState<string | null>(null);
  // erro da última ação (o backend recusou ou caiu); null = sem erro
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  // qual janela de mensagem está aberta; null = nenhuma
  const [mensagemAberta, setMensagemAberta] = useState<AcaoComMensagem | null>(null);
  // rascunho da OS: só vai pro banco no "Salvar OS" (antes, cada tecla gravava)
  const [observacoes, setObservacoes] = useState(atendimento.observacoesTecnico);
  const [textoMaoDeObra, setTextoMaoDeObra] = useState(() => maoDeObraParaTexto(atendimento.valorMaoDeObra));

  const acoes = acoesDoStatus(atendimento);
  const encerrado = atendimento.status === "recusado" || atendimento.status === "cancelado";
  const whatsappMensagem = atendimento.mensagemCliente
    ? linkWhatsApp(atendimento.contato.telefone, textoMensagemCliente(atendimento))
    : null;
  // a OS (observações, produtos, mão de obra) aparece a partir do início do atendimento
  const mostrarOs = atendimento.status === "em-andamento" || atendimento.status === "concluido";
  const editavel = osEditavel(atendimento);

  const erroMaoDeObra = validarMaoDeObra(textoMaoDeObra);
  const maoDeObraDoRascunho = erroMaoDeObra ? atendimento.valorMaoDeObra : paraValorEmReais(textoMaoDeObra);
  // tem coisa digitada que ainda não foi pro banco
  const temAlteracoes =
    editavel &&
    (observacoes !== atendimento.observacoesTecnico ||
      textoMaoDeObra !== maoDeObraParaTexto(atendimento.valorMaoDeObra));

  // roda uma ação da API: mostra o aviso se deu certo ou o erro do backend se não
  async function executar(acao: () => Promise<unknown>, textoAviso: string) {
    setErroAcao(null);
    setAviso(null);
    try {
      await acao();
      setAviso(textoAviso);
    } catch (falha) {
      setErroAcao(mensagemDeErro(falha));
    }
  }

  async function salvarRascunho() {
    if (erroMaoDeObra) return;
    await executar(async () => {
      const atualizado = await salvarOs({ observacoesTecnico: observacoes, valorMaoDeObra: maoDeObraDoRascunho });
      // o campo volta formatado como ficou no banco ("150" → "150,00")
      setObservacoes(atualizado.observacoesTecnico);
      setTextoMaoDeObra(maoDeObraParaTexto(atualizado.valorMaoDeObra));
    }, "OS salva.");
  }

  function salvarProdutos(produtos: ProdutoUsado[]) {
    setAviso(null);
    return salvarOs({ produtosUsados: produtos });
  }

  function fazerAcaoDireta(acao: AcaoDireta) {
    const { pergunta, aviso: textoAviso } = ACOES_DIRETAS[acao];
    if (!window.confirm(pergunta)) return;
    executar(() => mudarStatus(STATUS_DA_ACAO[acao]), textoAviso);
  }

  function registrarPagamento() {
    const valor = totalOs(atendimento);
    // OS sem mão de obra e sem produto: pode ser cortesia, mas o mais comum é ter esquecido de lançar
    const pergunta =
      valor === 0
        ? "Esta OS está com total de R$ 0,00 (sem mão de obra e sem produtos). Registrar o pagamento assim mesmo? Depois disso a OS não pode mais mudar."
        : `Registrar o pagamento de ${formatarReais(valor)}? Depois disso a OS não pode mais mudar.`;
    if (!window.confirm(pergunta)) return;
    executar(marcarPago, "Pagamento registrado. A OS está fechada.");
  }

  // o modal mostra o erro e continua aberto se a API recusar
  async function enviarMensagem(mensagem: string) {
    if (!mensagemAberta) return;
    const acao = mensagemAberta;
    await mudarStatus(STATUS_DA_ACAO[acao], mensagem);
    setMensagemAberta(null);
    setErroAcao(null);
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
            <h1 className="pagina-admin-atendimento__titulo">#{codigoAtendimento(atendimento.id)}</h1>
            <SeloStatusAtendimento status={atendimento.status} />
            {atendimento.status === "concluido" && <SeloPagamento pagoEm={atendimento.pagoEm} />}
          </div>
          <p className="pagina-admin-atendimento__subtitulo">
            Pedido em {formatarDataHora(atendimento.criadoEm)}
            {atendimento.abertoNaLoja && " · aberto na loja"}
            {atendimento.pagoEm && ` · pago em ${formatarDataHora(atendimento.pagoEm)}`}
          </p>

          {/* as regiões ficam sempre montadas: o leitor de tela anuncia o texto quando ele entra */}
          <div role="status">{aviso && <p className="pagina-admin-atendimento__aviso">{aviso}</p>}</div>
          <div role="alert">{erroAcao && <p className="pagina-admin-atendimento__erro-acao">{erroAcao}</p>}</div>

          <div className="pagina-admin-atendimento__blocos">
            <CartaoClienteOs atendimento={atendimento} />

            <section className="pagina-admin-atendimento__bloco">
              <h2>Visita</h2>
              <p>{formatarAgendamento(atendimento.data, atendimento.horario, atendimento.tecnico?.nome ?? null)}</p>
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
              <h2>Foto do problema</h2>
              <GaleriaFotosOs fotoUrl={atendimento.fotoUrl} />
            </section>

            <section className="pagina-admin-atendimento__bloco">
              <h2>Descrição do problema</h2>
              <p className="pagina-admin-atendimento__descricao">{atendimento.descricao}</p>
            </section>

            {mostrarOs && (
              <section className="pagina-admin-atendimento__bloco">
                <h2 id="titulo-observacoes">Observações do técnico</h2>
                {editavel ? (
                  <textarea
                    className="pagina-admin-atendimento__observacoes"
                    aria-labelledby="titulo-observacoes"
                    placeholder="Descreva o diagnóstico, as peças e os reparos feitos na visita."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    maxLength={2000}
                    rows={5}
                  />
                ) : (
                  <p className="pagina-admin-atendimento__texto">
                    {atendimento.observacoesTecnico || "Sem observações."}
                  </p>
                )}
              </section>
            )}

            {mostrarOs && (
              <section className="pagina-admin-atendimento__bloco">
                <h2>Produtos e valor</h2>
                <ProdutosDaOs
                  atendimento={atendimento}
                  produtosEditaveis={atendimento.status === "em-andamento"}
                  maoDeObraEditavel={editavel}
                  textoMaoDeObra={textoMaoDeObra}
                  onMudarMaoDeObra={setTextoMaoDeObra}
                  erroMaoDeObra={erroMaoDeObra}
                  valorMaoDeObra={maoDeObraDoRascunho}
                  onSalvarProdutos={salvarProdutos}
                  salvando={salvando}
                />
              </section>
            )}

            {editavel && (
              <div className="pagina-admin-atendimento__salvar-os">
                <button
                  type="button"
                  className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--principal"
                  onClick={salvarRascunho}
                  disabled={!temAlteracoes || Boolean(erroMaoDeObra) || salvando}
                >
                  {salvando ? "Salvando…" : "Salvar OS"}
                </button>
                <span className="pagina-admin-atendimento__detalhe">
                  {temAlteracoes ? "Observações ou mão de obra ainda não salvas." : "Tudo salvo."}
                </span>
              </div>
            )}
          </div>

          {acoes.length > 0 && (
            <>
              {temAlteracoes && (
                <p className="pagina-admin-atendimento__detalhe">
                  Salve a OS antes de mudar o andamento, pra nada do que foi digitado se perder.
                </p>
              )}
              <div className="pagina-admin-atendimento__acoes">
                {acoes.includes("recusar") && (
                  <button
                    type="button"
                    className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--perigo"
                    onClick={() => setMensagemAberta("recusar")}
                    disabled={salvando}
                  >
                    Recusar
                  </button>
                )}
                {acoes.includes("cancelar") && (
                  <button
                    type="button"
                    className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--perigo"
                    onClick={() => setMensagemAberta("cancelar")}
                    disabled={salvando}
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
                    disabled={salvando || temAlteracoes}
                  >
                    {ACOES_DIRETAS[acao].botao}
                  </button>
                ))}
                {acoes.includes("marcar-pago") && (
                  <button
                    type="button"
                    className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--principal"
                    onClick={registrarPagamento}
                    disabled={salvando || temAlteracoes}
                  >
                    Marcar como pago
                  </button>
                )}
              </div>
            </>
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
