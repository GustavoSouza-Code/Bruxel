import { Link } from "react-router-dom";
import { useAtendimentos } from "../../../../../crud/atendimentos/useAtendimentos";
import { contarPorStatus } from "../../../../../crud/atendimentos/filtrarAtendimentos";
import { formatarReais } from "../../../../../crud/atendimentos/valorOs";
import { usePedidosAdmin } from "../../../../../crud/pedidos/usePedidosAdmin";
import { useProdutos } from "../../../../../crud/produtos/useProdutos";
import { contarEstoque } from "../../../../../crud/produtos/estoque";
import { lancamentosDePagamento, resumoPagamentos } from "../../../../../crud/pagamentos/lancamentos";
import "./NumerosPainel.css";

// "1 pedido" / "2 pedidos"
function plural(quantidade: number, singular: string, varios: string) {
  return `${quantidade} ${quantidade === 1 ? singular : varios}`;
}

interface Numero {
  rotulo: string;
  /** null enquanto carrega (mostra "—") */
  valor: string | null;
  detalhe: string;
  para: string;
}

/**
 * Faixa de números no topo da home do painel: o que falta receber, o que
 * entrou no mês, os atendimentos esperando confirmação e os produtos com
 * estoque baixo. Cada número leva pra tela onde se resolve. Se uma busca
 * falhar, só o número dela some; os outros continuam.
 */
export function NumerosPainel() {
  const atend = useAtendimentos();
  const ped = usePedidosAdmin();
  const prod = useProdutos();

  const hoje = new Date();
  const mes = hoje.toLocaleDateString("pt-BR", { month: "long" });
  const pagamentosProntos = !atend.carregando && !ped.carregando;
  const resumo = resumoPagamentos(lancamentosDePagamento(atend.atendimentos, ped.pedidos), hoje);
  const estoque = contarEstoque(prod.produtos);

  const numeros: Numero[] = [];

  // os dois números de dinheiro dependem das OS e dos pedidos juntos
  if (!atend.erro && !ped.erro) {
    numeros.push(
      {
        rotulo: "A receber",
        valor: pagamentosProntos ? formatarReais(resumo.aReceber.valor) : null,
        detalhe: pagamentosProntos
          ? `${resumo.aReceber.quantidade} a receber` +
            (resumo.aReceber.atrasadas > 0
              ? ` · ${plural(resumo.aReceber.atrasadas, "atrasada", "atrasadas")}`
              : "")
          : "",
        // com OS atrasada, o atalho já abre no chip "Atrasadas"
        para: resumo.aReceber.atrasadas > 0 ? "/admin/pagamentos?situacao=atrasadas" : "/admin/pagamentos",
      },
      {
        rotulo: `Recebido em ${mes}`,
        valor: pagamentosProntos ? formatarReais(resumo.recebidoNoMes.valor) : null,
        detalhe: pagamentosProntos
          ? `${plural(resumo.recebidoNoMes.pedidos, "pedido", "pedidos")} · ${resumo.recebidoNoMes.os} OS`
          : "",
        para: "/admin/pagamentos",
      }
    );
  }

  if (!atend.erro) {
    numeros.push({
      rotulo: "Atendimentos aguardando",
      valor: atend.carregando ? null : String(contarPorStatus(atend.atendimentos).aguardando),
      detalhe: "para confirmar",
      para: "/admin/atendimentos",
    });
  }

  if (!prod.erro) {
    numeros.push({
      rotulo: "Estoque baixo",
      valor: prod.carregando ? null : String(estoque.baixo),
      detalhe: prod.carregando ? "" : plural(estoque.esgotados, "esgotado", "esgotados"),
      // só ativos, igual à conta do contarEstoque: o número e a lista batem
      para: "/admin/produtos?estoque=baixo&status=ativo",
    });
  }

  if (numeros.length === 0) return null;

  return (
    <nav className="numeros-painel" aria-label="Resumo do painel">
      {numeros.map((numero) => (
        <Link key={numero.rotulo} to={numero.para} className="numeros-painel__item">
          <span className="numeros-painel__rotulo">{numero.rotulo}</span>
          <strong className="numeros-painel__valor">{numero.valor ?? "—"}</strong>
          <span className="numeros-painel__detalhe">{numero.detalhe}</span>
        </Link>
      ))}
    </nav>
  );
}

export default NumerosPainel;
