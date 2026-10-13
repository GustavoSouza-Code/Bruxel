import { Link } from "react-router-dom";
import { useAtendimentos } from "../../../../../contexto/useAtendimentos";
import { STATUS_LABELS, TIPO_SERVICO_LABELS } from "../../../../../crud/atendimentos/opcoesAtendimento";
import { formatarPreferencia } from "../../../../../crud/atendimentos/datasAtendimento";
import { IconeFerramenta } from "../../../../../componentes/ui/Icones/Icones";
import "./AbaAtendimentos.css";

interface AbaAtendimentosProps {
  /** aviso de sucesso que o formulário manda pelo state do navigate; null = sem aviso */
  mensagem: string | null;
}

/**
 * Aba "Atendimentos" do /perfil: os atendimentos que o cliente pediu, do mais
 * novo pro mais antigo, com o status de cada um, e o atalho pro formulário.
 * Usa as classes de card do perfil.css, porque só aparece dentro do /perfil.
 */
export function AbaAtendimentos({ mensagem }: AbaAtendimentosProps) {
  const { atendimentos } = useAtendimentos();

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

      {atendimentos.length === 0 ? (
        <p className="pagina-perfil__vazio">
          Você ainda não solicitou nenhum atendimento.{" "}
          <Link to="/solicitar-atendimento">Solicite o primeiro.</Link>
        </p>
      ) : (
        <ul className="aba-atendimentos__lista">
          {atendimentos.map((atendimento) => {
            const quantidadeFotos = atendimento.fotos.length;
            return (
              <li key={atendimento.id} className="pagina-perfil__card aba-atendimentos__item">
                <div className="aba-atendimentos__principal">
                  <strong>
                    #{atendimento.id} · {TIPO_SERVICO_LABELS[atendimento.tipo]}
                  </strong>
                  <span>
                    Preferência: {formatarPreferencia(atendimento.dataPreferida, atendimento.periodo)}
                  </span>
                  <span>
                    Enviado em {new Date(atendimento.criadoEm).toLocaleDateString("pt-BR")}
                    {quantidadeFotos > 0 &&
                      ` · ${quantidadeFotos} ${quantidadeFotos === 1 ? "foto" : "fotos"}`}
                  </span>
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
