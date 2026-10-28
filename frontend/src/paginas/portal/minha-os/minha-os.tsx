import { Link, useParams } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { MensagemPagina } from "../../../componentes/ui/MensagemPagina/MensagemPagina";
import { useAtendimento } from "../../../crud/atendimentos/useAtendimento";
import { STATUS_LABELS, TIPO_SERVICO_LABELS, codigoAtendimento } from "../../../crud/atendimentos/opcoesAtendimento";
import { formatarAgendamento } from "../../../crud/atendimentos/agenda";
import { formatarReais } from "../../../crud/atendimentos/valorOs";
import type { Atendimento } from "../../../tipos/atendimento";
import "./minha-os.css";

/**
 * Uma OS vista pelo cliente (rota "/minha-conta/atendimentos/:id", só pra
 * quem está logado). É o link que vai na cobrança pelo WhatsApp; sem login, o
 * RotaLogado manda pro /entrar e volta pra cá depois. O total vem pronto do
 * backend (sem separar a mão de obra). OS de outra conta (403) ou que não
 * existe (404) mostra "OS não encontrada".
 */
export function PaginaMinhaOs() {
  const { id } = useParams();
  const { atendimento, carregando, erro, naoEncontrado, recarregar } = useAtendimento(id);

  if (naoEncontrado) {
    return (
      <>
        <Cabecalho />
        <MensagemPagina titulo="OS não encontrada" texto="Essa ordem de serviço não está na sua conta.">
          <Link to="/perfil" state={{ aba: "atendimentos" }} className="pagina-minha-os__botao">
            Ver meus atendimentos
          </Link>
        </MensagemPagina>
        <Rodape />
      </>
    );
  }

  return (
    <>
      <Cabecalho />

      <section className="pagina-minha-os">
        <Container className="pagina-minha-os__interno">
          {carregando && <p className="pagina-minha-os__estado">Carregando a OS…</p>}

          {!carregando && erro && (
            <div className="pagina-minha-os__estado" role="alert">
              <p>{erro}</p>
              <button type="button" className="pagina-minha-os__botao pagina-minha-os__botao--contorno" onClick={recarregar}>
                Tentar novamente
              </button>
            </div>
          )}

          {!carregando && !erro && atendimento && <ResumoDaOs atendimento={atendimento} />}
        </Container>
      </section>

      <Rodape />
    </>
  );
}

function ResumoDaOs({ atendimento }: { atendimento: Atendimento }) {
  return (
    <>
      <h1 className="pagina-minha-os__titulo">Ordem de serviço #{codigoAtendimento(atendimento.id)}</h1>
      <p className="pagina-minha-os__meta">
        {TIPO_SERVICO_LABELS[atendimento.tipo]} · visita em{" "}
        {formatarAgendamento(atendimento.data, atendimento.horario, atendimento.tecnico?.nome ?? null)}
      </p>

      <div className="pagina-minha-os__resumo">
        <div className="pagina-minha-os__linha">
          <span>Situação</span>
          <strong>{STATUS_LABELS[atendimento.status]}</strong>
        </div>

        {atendimento.descricao && (
          <div className="pagina-minha-os__bloco">
            <h2>O que foi pedido</h2>
            <p>{atendimento.descricao}</p>
          </div>
        )}

        {atendimento.produtosUsados.length > 0 && (
          <div className="pagina-minha-os__bloco">
            <h2>Materiais utilizados</h2>
            <ul className="pagina-minha-os__materiais">
              {atendimento.produtosUsados.map((produto) => (
                <li key={produto.produtoId}>
                  {produto.quantidade}× {produto.nome}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* o backend só manda o total pro cliente quando a OS tem valor */}
        {atendimento.valorTotal !== null && (
          <div className="pagina-minha-os__linha pagina-minha-os__linha--total">
            <span>Total</span>
            <span>{formatarReais(atendimento.valorTotal)}</span>
          </div>
        )}
      </div>

      {atendimento.mensagemCliente && (
        <p className="pagina-minha-os__mensagem">
          <strong>Mensagem da Bruxel:</strong> {atendimento.mensagemCliente}
        </p>
      )}

      <p className="pagina-minha-os__ajuda">Dúvidas sobre o pagamento? Responda a mensagem da Bruxel no WhatsApp.</p>

      <Link to="/perfil" state={{ aba: "atendimentos" }} className="pagina-minha-os__botao pagina-minha-os__botao--contorno">
        Ver meus atendimentos
      </Link>
    </>
  );
}

export default PaginaMinhaOs;
