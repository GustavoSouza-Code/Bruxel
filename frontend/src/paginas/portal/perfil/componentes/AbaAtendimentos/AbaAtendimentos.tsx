import { Link } from "react-router-dom";
import { useAtendimentos } from "../../../../../crud/atendimentos/useAtendimentos";
import {
  STATUS_LABELS,
  TIPO_SERVICO_LABELS,
  codigoAtendimento,
  totalVisivelParaCliente,
} from "../../../../../crud/atendimentos/opcoesAtendimento";
import { formatarAgendamento } from "../../../../../crud/atendimentos/agenda";
import { formatarReais } from "../../../../../crud/atendimentos/valorOs";
import { IconeFerramenta } from "../../../../../componentes/ui/Icones/Icones";
import "./AbaAtendimentos.css";

interface AbaAtendimentosProps {
  /** aviso de sucesso que o formulário manda pelo state do navigate; null = sem aviso */
  mensagem: string | null;
}

/**
 * Aba "Atendimentos" do /perfil: os atendimentos que o cliente pediu, do mais
 * novo pro mais antigo (GET /appointments), com o status de cada um, e o atalho
 * pro formulário. O total vem pronto do backend, sem separar a mão de obra.
 * Usa as classes de card do perfil.css, porque só aparece dentro do /perfil.
 */
export function AbaAtendimentos({ mensagem }: AbaAtendimentosProps) {
  const { atendimentos, carregando, erro, recarregar } = useAtendimentos();

  return (
    <>
      <div className="pagina-perfil__cabecalho-conteudo">
        <h2>Atendimentos</h2>
        <Link to="/solicitar-atendimento" className="aba-atendimentos__solicitar">
          <IconeFerramenta />
          Solicitar atendimento
        </Link>
      </div>

      {mensagem && (
        <p className="aba-atendimentos__aviso" role="status">
          {mensagem}
        </p>
      )}

      {carregando ? (
        <p className="pagina-perfil__vazio">Carregando seus atendimentos…</p>
      ) : erro ? (
        <div className="pagina-perfil__falha">
          <p className="pagina-perfil__erro" role="alert">
            {erro}
          </p>
          <button type="button" className="pagina-perfil__cancelar" onClick={recarregar}>
            Tentar novamente
          </button>
        </div>
      ) : atendimentos.length === 0 ? (
        <p className="pagina-perfil__vazio">
          Você ainda não solicitou nenhum atendimento.{" "}
          <Link to="/solicitar-atendimento">Solicite o primeiro.</Link>
        </p>
      ) : (
        <ul className="aba-atendimentos__lista">
          {atendimentos.map((atendimento) => {
            const encerrado = atendimento.status === "recusado" || atendimento.status === "cancelado";
            return (
              <li key={atendimento.id} className="pagina-perfil__card aba-atendimentos__item">
                <div className="aba-atendimentos__principal">
                  <strong>
                    #{codigoAtendimento(atendimento.id)} · {TIPO_SERVICO_LABELS[atendimento.tipo]}
                  </strong>
                  <span>
                    Visita: {formatarAgendamento(atendimento.data, atendimento.horario, atendimento.tecnico?.nome ?? null)}
                  </span>
                  <span>
                    Enviado em {new Date(atendimento.criadoEm).toLocaleDateString("pt-BR")}
                    {atendimento.abertoNaLoja && " · aberto na loja"}
                    {atendimento.fotoUrl && " · com foto"}
                  </span>
                  {encerrado && atendimento.mensagemCliente && (
                    <span className="aba-atendimentos__mensagem">
                      Mensagem da Bruxel: {atendimento.mensagemCliente}
                    </span>
                  )}

                  <details className="aba-atendimentos__detalhes">
                    <summary>Ver detalhes da OS</summary>
                    <div className="aba-atendimentos__detalhes-conteudo">
                      {atendimento.descricao && (
                        <p>
                          <strong>Descrição do atendimento:</strong> {atendimento.descricao}
                        </p>
                      )}

                      {atendimento.produtosUsados.length > 0 && (
                        <div>
                          <strong>Materiais utilizados</strong>
                          <ul className="aba-atendimentos__materiais">
                            {atendimento.produtosUsados.map((produto) => (
                              <li key={produto.produtoId}>
                                {produto.quantidade}× {produto.nome}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {totalVisivelParaCliente(atendimento) && atendimento.valorTotal !== null && (
                          <p>
                            <strong>Total da OS:</strong> {formatarReais(atendimento.valorTotal)}
                          </p>
                        )}
                    </div>
                  </details>
                  {/* a mesma página que vai no link da cobrança pelo WhatsApp */}
                  <Link to={`/minha-conta/atendimentos/${atendimento.id}`} className="aba-atendimentos__ver-os">
                    Ver OS
                  </Link>
                </div>
                {/* o sufixo da classe é o próprio status (ver AbaAtendimentos.css) */}
                <span
                  className={`aba-atendimentos__status aba-atendimentos__status--${atendimento.status}`}
                >
                  {STATUS_LABELS[atendimento.status]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default AbaAtendimentos;
