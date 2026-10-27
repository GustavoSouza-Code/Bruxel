import { Link } from "react-router-dom";
import { useAtendimentos } from "../../../../../crud/atendimentos/useAtendimentos";
import {
  STATUS_LABELS,
  TIPO_SERVICO_LABELS,
  codigoAtendimento,
} from "../../../../../crud/atendimentos/opcoesAtendimento";
import { formatarAgendamento } from "../../../../../crud/atendimentos/agenda";
import { IconeFerramenta } from "../../../../../componentes/ui/Icones/Icones";
import "./AbaAtendimentos.css";

interface AbaAtendimentosProps {
  /** aviso de sucesso que o formulário manda pelo state do navigate; null = sem aviso */
  mensagem: string | null;
}

/**
 * Aba "Atendimentos" do /perfil: os atendimentos que o cliente pediu, do mais
 * novo pro mais antigo (GET /appointments), com o status de cada um, e o atalho
 * pro formulário. O valor da OS não aparece: o backend não manda a mão de obra
 * pro cliente, então um total aqui sairia errado.
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
