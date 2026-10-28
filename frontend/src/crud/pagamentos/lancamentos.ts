import type { Atendimento } from "../../tipos/atendimento";
import type { FormaPagamento } from "../../tipos/pedido";
import type { PedidoComCliente } from "../pedidos/filtrarPedidos";
import { codigoPedido, pedidoRecebido } from "../pedidos/opcoesPedido";
import { codigoAtendimento } from "../atendimentos/opcoesAtendimento";
import { totalOs } from "../atendimentos/valorOs";
import { contemTexto } from "../busca";

export type SituacaoLancamento = "a-receber" | "recebido";
export type FiltroSituacao = SituacaoLancamento | "todos";

/**
 * Uma linha da gestão de pagamentos: uma OS (serviço) ou um pedido (loja), já
 * com o valor e se o dinheiro entrou. A tela monta o link de cada linha.
 */
export interface Lancamento {
  id: string;
  origem: "os" | "pedido";
  codigo: string;
  cliente: string;
  /** ISO: dia da visita (OS a receber), do pagamento (OS paga) ou da compra (pedido) */
  data: string;
  /** em reais */
  valor: number;
  situacao: SituacaoLancamento;
  /** só pedido tem; a OS não guarda como foi paga */
  formaPagamento: FormaPagamento | null;
}

// "2026-10-21" + "13:30" no relógio de quem usa → ISO
function dataDaVisita(atendimento: Atendimento) {
  return new Date(`${atendimento.data}T${atendimento.horario}:00`).toISOString();
}

/**
 * Junta as OS concluídas e os pedidos numa lista só. OS concluída sem pagoEm
 * está a receber; com pagoEm, recebida. Pedido pago, enviado ou entregue já
 * entrou; pendente (pedidos antigos, de antes da simulação de pagamento) está
 * a receber; cancelado fica de fora.
 */
export function lancamentosDePagamento(atendimentos: Atendimento[], pedidos: PedidoComCliente[]): Lancamento[] {
  const servicos = atendimentos
    .filter((atendimento) => atendimento.status === "concluido")
    .map(
      (atendimento): Lancamento => ({
        id: atendimento.id,
        origem: "os",
        codigo: codigoAtendimento(atendimento.id),
        cliente: atendimento.cliente.nome,
        data: atendimento.pagoEm ?? dataDaVisita(atendimento),
        valor: totalOs(atendimento),
        situacao: atendimento.pagoEm ? "recebido" : "a-receber",
        formaPagamento: null,
      })
    );

  const compras = pedidos
    .filter((pedido) => pedido.status !== "CANCELADO")
    .map(
      (pedido): Lancamento => ({
        id: pedido.id,
        origem: "pedido",
        codigo: codigoPedido(pedido.id),
        cliente: pedido.cliente,
        data: pedido.criadoEm,
        valor: pedido.valorTotal,
        situacao: pedidoRecebido(pedido.status) ? "recebido" : "a-receber",
        formaPagamento: pedido.formaPagamento,
      })
    );

  return [...servicos, ...compras];
}

// soma em centavos, pra 0,10 + 0,20 dar 0,30 e não 0,30000000000000004
function somar(lancamentos: Lancamento[]) {
  return lancamentos.reduce((centavos, lancamento) => centavos + Math.round(lancamento.valor * 100), 0) / 100;
}

/**
 * O que falta receber (tudo, de qualquer data) e o que entrou no mês de `hoje`,
 * comparando no relógio de quem usa (um pagamento às 00:05 do dia 1 é do mês novo).
 */
export function resumoPagamentos(lancamentos: Lancamento[], hoje: Date) {
  const aReceber = lancamentos.filter((l) => l.situacao === "a-receber");
  const doMes = lancamentos.filter((l) => {
    if (l.situacao !== "recebido") return false;
    const data = new Date(l.data);
    return data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth();
  });

  return {
    aReceber: { valor: somar(aReceber), quantidade: aReceber.length },
    recebidoNoMes: {
      valor: somar(doMes),
      pedidos: doMes.filter((l) => l.origem === "pedido").length,
      os: doMes.filter((l) => l.origem === "os").length,
    },
  };
}

/** Situação escolhida no chip e busca por cliente ou código; do mais recente pro mais antigo. */
export function filtrarLancamentos(
  lancamentos: Lancamento[],
  filtros: { situacao: FiltroSituacao; busca: string }
): Lancamento[] {
  return lancamentos
    .filter(
      (l) =>
        (filtros.situacao === "todos" || l.situacao === filtros.situacao) &&
        (contemTexto(l.cliente, filtros.busca) || contemTexto(l.codigo, filtros.busca))
    )
    .sort((a, b) => b.data.localeCompare(a.data));
}

/** Quantos em cada chip: "A receber (n)", "Recebidos (n)", "Todos (n)". */
export function contarPorSituacao(lancamentos: Lancamento[]): Record<FiltroSituacao, number> {
  const aReceber = lancamentos.filter((l) => l.situacao === "a-receber").length;
  return { "a-receber": aReceber, recebido: lancamentos.length - aReceber, todos: lancamentos.length };
}
