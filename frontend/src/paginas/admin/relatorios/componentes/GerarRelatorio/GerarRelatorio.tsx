import { useState } from "react";
import { useRelatorio } from "../../../../../crud/relatorios/useRelatorio";
import { OPCOES_STATUS, periodoPadrao } from "../../../../../crud/relatorios/filtros";
import { formatarCentavos } from "../../../../../crud/dashboard/textos";
import type { FiltrosRelatorio } from "../../../../../crud/relatorios/filtros";
import type { TipoRelatorio } from "../../../../../api/relatorios";
import "./GerarRelatorio.css";

const ABAS: { tipo: TipoRelatorio; rotulo: string }[] = [
  { tipo: "pedidos", rotulo: "Pedidos" },
  { tipo: "atendimentos", rotulo: "OS" },
];

const LIMITE_LINHAS = 50;

/** Filtros, prévia e download (CSV/PDF) do relatório de pedidos ou de OS. */
export function GerarRelatorio() {
  const [tipo, setTipo] = useState<TipoRelatorio>("pedidos");
  const [filtros, setFiltros] = useState<FiltrosRelatorio>(() => ({
    ...periodoPadrao(new Date()),
    status: "",
    pagamento: "",
  }));
  const { relatorio, carregando, erro, baixando, erroDownload, baixar } = useRelatorio(tipo, filtros);

  const aReceber = tipo === "atendimentos" && filtros.pagamento === "a-receber";

  function mudar(parcial: Partial<FiltrosRelatorio>) {
    setFiltros((atual) => ({ ...atual, ...parcial }));
  }

  // trocar de aba limpa situação e pagamento, mas mantém as datas
  function trocarAba(novo: TipoRelatorio) {
    if (novo === tipo) return;
    setTipo(novo);
    setFiltros((atual) => ({ ...atual, status: "", pagamento: "" }));
  }

  const visiveis = relatorio?.linhas.slice(0, LIMITE_LINHAS) ?? [];
  const restantes = relatorio ? relatorio.linhas.length - visiveis.length : 0;

  return (
    <section className="pagina-admin-relatorios__bloco" aria-label="Gerar relatório">
      <div className="pagina-admin-relatorios__cabecalho">
        <h2 className="pagina-admin-relatorios__titulo">Gerar relatório</h2>
      </div>

      <div className="gerar-relatorio__abas" role="tablist" aria-label="Tipo de relatório">
        {ABAS.map((aba) => (
          <button
            key={aba.tipo}
            type="button"
            role="tab"
            aria-selected={aba.tipo === tipo}
            className="gerar-relatorio__aba"
            onClick={() => trocarAba(aba.tipo)}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      <div className="gerar-relatorio__filtros">
        <label className="gerar-relatorio__campo">
          De
          <input type="date" value={filtros.inicio} onChange={(e) => mudar({ inicio: e.target.value })} />
        </label>
        <label className="gerar-relatorio__campo">
          Até
          <input type="date" value={filtros.fim} onChange={(e) => mudar({ fim: e.target.value })} />
        </label>
        <label className="gerar-relatorio__campo">
          Situação
          <select
            value={aReceber ? "CONCLUIDO" : filtros.status}
            disabled={aReceber}
            onChange={(e) => mudar({ status: e.target.value })}
          >
            {OPCOES_STATUS[tipo].map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </label>
        {tipo === "atendimentos" && (
          <label className="gerar-relatorio__campo">
            Pagamento
            <select
              value={filtros.pagamento}
              onChange={(e) => mudar({ pagamento: e.target.value as FiltrosRelatorio["pagamento"] })}
            >
              <option value="">Todos</option>
              <option value="pago">Pago</option>
              <option value="a-receber">A receber</option>
            </select>
          </label>
        )}
      </div>

      {erro && (
        <div className="lista-admin__aviso" role="alert">
          {erro}
        </div>
      )}
      {erroDownload && (
        <div className="lista-admin__aviso" role="alert">
          {erroDownload}
        </div>
      )}

      {carregando && !relatorio ? (
        <p className="pagina-admin-relatorios__nota">Carregando…</p>
      ) : relatorio ? (
        <>
          <div className="gerar-relatorio__rolagem">
            <table className="gerar-relatorio__tabela">
              <thead>
                <tr>
                  {relatorio.colunas.map((coluna) => (
                    <th key={coluna.titulo} className={coluna.tipo === "moeda" ? "gerar-relatorio__direita" : undefined}>
                      {coluna.titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((linha, i) => (
                  <tr key={i}>
                    {relatorio.colunas.map((coluna, c) => (
                      <td key={coluna.titulo} className={coluna.tipo === "moeda" ? "gerar-relatorio__direita" : undefined}>
                        {coluna.tipo === "moeda" ? formatarCentavos(Number(linha[c])) : String(linha[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
                {relatorio.linhas.length === 0 && (
                  <tr>
                    <td colSpan={relatorio.colunas.length}>Nenhum registro no período</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {restantes > 0 && <p className="pagina-admin-relatorios__nota">… mais {restantes}</p>}

          {relatorio.totais.length > 0 && (
            <dl className="gerar-relatorio__totais">
              {relatorio.totais.map((total) => (
                <div key={total.rotulo} className="gerar-relatorio__total">
                  <dt>{total.rotulo}</dt>
                  <dd>{formatarCentavos(total.centavos)}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      ) : null}

      <div className="gerar-relatorio__acoes">
        <button
          type="button"
          className="lista-admin__botao lista-admin__botao--contorno"
          disabled={baixando !== null}
          onClick={() => baixar("csv")}
        >
          {baixando === "csv" ? "Gerando…" : "Baixar planilha (CSV)"}
        </button>
        <button
          type="button"
          className="lista-admin__botao"
          disabled={baixando !== null}
          onClick={() => baixar("pdf")}
        >
          {baixando === "pdf" ? "Gerando…" : "Baixar PDF"}
        </button>
      </div>
    </section>
  );
}
