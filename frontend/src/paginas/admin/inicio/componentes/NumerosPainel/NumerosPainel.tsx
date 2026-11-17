import { Link } from "react-router-dom";
import { formatarReais } from "../../../../../crud/atendimentos/valorOs";
import { useKpis } from "../../../../../crud/dashboard/useDashboard";
import { textoVariacao } from "../../../../../crud/dashboard/textos";
import { rotuloMes } from "../../../../../crud/dashboard/graficos";
import "./NumerosPainel.css";

// "1 atrasada" / "2 atrasadas"
function plural(quantidade: number, singular: string, varios: string) {
  return `${quantidade} ${quantidade === 1 ? singular : varios}`;
}

interface Selo {
  texto: string;
  tom: "alta" | "queda" | "neutro";
}

interface Numero {
  rotulo: string;
  tom: "verde" | "amarelo" | "azul" | "vermelho";
  /** null enquanto carrega (mostra "—") */
  valor: string | null;
  detalhe: string;
  selo?: Selo;
  para: string;
}

/** "AAAA-MM" do mês de `data` e do mês anterior (janeiro volta para dezembro do ano anterior). */
function mesesAtualEAnterior(data: Date) {
  const ano = data.getFullYear();
  const mes = data.getMonth() + 1;
  const atual = `${ano}-${String(mes).padStart(2, "0")}`;
  const anterior = mes === 1 ? `${ano - 1}-12` : `${ano}-${String(mes - 1).padStart(2, "0")}`;
  return { atual, anterior };
}

/**
 * Faixa de números no topo da home do painel, vinda do /dashboard/kpis: a
 * receita do mês (com a variação contra o mês anterior), o que falta receber,
 * os atendimentos aguardando e o estoque baixo. Cada número leva à tela onde
 * se resolve. Se a busca falhar, a faixa some.
 */
export function NumerosPainel() {
  const { dados, carregando, erro } = useKpis();

  if (erro) return null;

  const meses = mesesAtualEAnterior(new Date());
  const nomeMes = rotuloMes(meses.atual, true);
  const nomeMesAnterior = rotuloMes(meses.anterior, true);
  const kpis = carregando ? null : dados;

  const variacao = kpis ? textoVariacao(kpis.variacaoPercentual, nomeMesAnterior) : null;
  const atrasadas = kpis?.aReceber.atrasadas ?? 0;

  const numeros: Numero[] = [
    {
      rotulo: `Receita de ${nomeMes}`,
      tom: "verde",
      valor: kpis ? formatarReais(kpis.receitaMes) : null,
      detalhe: "",
      selo: variacao ?? undefined,
      para: "/admin/relatorios",
    },
    {
      rotulo: "A receber",
      tom: "amarelo",
      valor: kpis ? formatarReais(kpis.aReceber.total) : null,
      detalhe: kpis ? `${kpis.aReceber.quantidade} OS` : "",
      selo: atrasadas > 0 ? { texto: plural(atrasadas, "atrasada", "atrasadas"), tom: "queda" } : undefined,
      // com OS atrasada, o atalho já abre no chip "Atrasadas"
      para: atrasadas > 0 ? "/admin/pagamentos?situacao=atrasadas" : "/admin/pagamentos",
    },
    {
      rotulo: "Atendimentos aguardando",
      tom: "azul",
      valor: kpis ? String(kpis.osAguardando) : null,
      detalhe: kpis ? "para confirmar" : "",
      para: "/admin/atendimentos",
    },
    {
      rotulo: "Estoque baixo",
      tom: "vermelho",
      valor: kpis ? String(kpis.produtosEstoqueBaixo) : null,
      detalhe: kpis ? (kpis.produtosEstoqueBaixo === 1 ? "produto para repor" : "produtos para repor") : "",
      // só ativos, igual à conta do estoque: o número e a lista batem
      para: "/admin/produtos?estoque=baixo&status=ativo",
    },
  ];

  return (
    <nav className="numeros-painel" aria-label="Resumo do painel">
      {numeros.map((numero) => (
        <Link key={numero.rotulo} to={numero.para} className={`numeros-painel__item numeros-painel__item--${numero.tom}`}>
          <span className="numeros-painel__rotulo">{numero.rotulo}</span>
          <strong className="numeros-painel__valor">{numero.valor ?? "—"}</strong>
          <span className="numeros-painel__detalhe">
            {numero.detalhe}
            {numero.selo && (
              <span className={`numeros-painel__selo numeros-painel__selo--${numero.selo.tom}`}>{numero.selo.texto}</span>
            )}
          </span>
        </Link>
      ))}
    </nav>
  );
}

export default NumerosPainel;
