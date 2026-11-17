import { Link } from "react-router-dom";
import { useAReceber } from "../../../../../crud/dashboard/useDashboard";
import { formatarReais } from "../../../../../crud/atendimentos/valorOs";
import type { FaixaAtraso } from "../../../../../api/dashboard";
import "./QuemCobrar.css";

const FAIXAS: Record<FaixaAtraso, { rotulo: string; faixa: string; valor: string }> = {
  em_dia: { rotulo: "Menos de 7 dias", faixa: "#f5a623", valor: "#8a5a00" },
  semana: { rotulo: "7 a 29 dias", faixa: "#e67e22", valor: "#a04f00" },
  mes: { rotulo: "30 dias ou mais", faixa: "#c0392b", valor: "#c0392b" },
};

const ORDEM: FaixaAtraso[] = ["em_dia", "semana", "mes"];

// ISO → "27/10", no relógio de quem usa
function diaMes(iso: string) {
  const data = new Date(iso);
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function textoDias(dias: number) {
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

/** OS concluídas e não pagas: total por faixa de atraso e a lista de quem cobrar. */
export function QuemCobrar() {
  const { dados, erro, recarregar } = useAReceber();

  return (
    <section className="pagina-admin-inicio__bloco" aria-label="Quem cobrar">
      <div className="pagina-admin-inicio__cabecalho">
        <h2 className="pagina-admin-inicio__titulo">Quem cobrar</h2>
        <Link to="/admin/pagamentos" className="quem-cobrar__link">
          Ver pagamentos →
        </Link>
      </div>

      {erro ? (
        <div className="lista-admin__aviso" role="alert">
          {erro}
          <button type="button" className="lista-admin__botao lista-admin__botao--contorno" onClick={recarregar}>
            Tentar novamente
          </button>
        </div>
      ) : !dados ? (
        <p className="pagina-admin-inicio__nota">Carregando…</p>
      ) : dados.maisAntigas.length === 0 ? (
        <p className="pagina-admin-inicio__nota">Nenhuma cobrança pendente</p>
      ) : (
        <>
          <div className="quem-cobrar__faixas">
            {ORDEM.map((id) => {
              const info = FAIXAS[id];
              const faixa = dados.faixas.find((f) => f.faixa === id);
              return (
                <div key={id} className="quem-cobrar__faixa" style={{ borderTopColor: info.faixa }}>
                  <span className="quem-cobrar__faixa-rotulo">{info.rotulo}</span>
                  <strong className="quem-cobrar__faixa-valor" style={{ color: info.valor }}>
                    {formatarReais(faixa?.total ?? 0)}
                  </strong>
                  <span className="quem-cobrar__faixa-qtd">{faixa?.quantidade ?? 0} OS</span>
                </div>
              );
            })}
          </div>

          <div className="quem-cobrar__rolagem">
            <table className="quem-cobrar__tabela">
              <thead>
                <tr>
                  <th>OS</th>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>Visita</th>
                  <th>Atraso</th>
                  <th className="quem-cobrar__direita">Valor</th>
                </tr>
              </thead>
              <tbody>
                {dados.maisAntigas.map((os) => (
                  <tr key={os.id}>
                    <td>
                      <Link to={`/admin/atendimentos/${os.id}`} className="quem-cobrar__os">
                        {os.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td>{os.cliente ?? "Cliente do balcão"}</td>
                    <td>
                      {os.telefone ? (
                        <a href={`tel:${os.telefone.replace(/\D/g, "")}`} className="quem-cobrar__os">
                          {os.telefone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{diaMes(os.data_hora)}</td>
                    <td>
                      <span className={`quem-cobrar__selo${os.dias >= 30 ? " quem-cobrar__selo--vermelho" : ""}`}>
                        {textoDias(os.dias)}
                      </span>
                    </td>
                    <td className="quem-cobrar__direita">{formatarReais(os.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
