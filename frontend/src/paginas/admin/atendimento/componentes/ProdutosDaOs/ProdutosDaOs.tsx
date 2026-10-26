import { useMemo, useState } from "react";
import { useProdutos } from "../../../../../crud/produtos/useProdutos";
import { mensagemDeErro } from "../../../../../api/cliente";
import {
  adicionarProduto,
  formatarReais,
  quantidadeNaOs,
  removerProduto,
  subtotalProduto,
  totalProdutos,
  validarQuantidade,
} from "../../../../../crud/atendimentos/valorOs";
import type { Atendimento, ProdutoUsado } from "../../../../../tipos/atendimento";
import "../../../lista-admin.css";
import "./ProdutosDaOs.css";

interface ProdutosDaOsProps {
  atendimento: Atendimento;
  /** true só com o atendimento em andamento: depois de concluído o estoque já baixou */
  produtosEditaveis: boolean;
  /** true enquanto a OS ainda aceita mão de obra (em andamento ou concluída sem pagamento) */
  maoDeObraEditavel: boolean;
  /** texto do campo de mão de obra (o rascunho fica na página, junto com as observações) */
  textoMaoDeObra: string;
  onMudarMaoDeObra: (texto: string) => void;
  erroMaoDeObra: string | null;
  /** mão de obra que entra no total: a do rascunho, se for válida, ou a salva */
  valorMaoDeObra: number | null;
  /** grava a lista inteira de produtos na OS (PUT); lança o erro da API se falhar */
  onSalvarProdutos: (produtos: ProdutoUsado[]) => Promise<unknown>;
  /** true enquanto alguma gravação da OS está em andamento */
  salvando: boolean;
}

/**
 * Produtos da loja usados no serviço, a mão de obra e o total da OS. Cada
 * produto adicionado ou removido já é gravado no banco; o estoque só baixa
 * quando o atendimento é concluído (o backend confere de novo nessa hora).
 */
export function ProdutosDaOs({
  atendimento,
  produtosEditaveis,
  maoDeObraEditavel,
  textoMaoDeObra,
  onMudarMaoDeObra,
  erroMaoDeObra,
  valorMaoDeObra,
  onSalvarProdutos,
  salvando,
}: ProdutosDaOsProps) {
  const { produtos, carregando, erro } = useProdutos();
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [erroProduto, setErroProduto] = useState<string | null>(null);

  // só os produtos ativos, em ordem alfabética
  const disponiveis = useMemo(
    () => produtos.filter((produto) => produto.ativo).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [produtos]
  );
  const usados = atendimento.produtosUsados;
  const total = (valorMaoDeObra ?? 0) + totalProdutos(usados);

  async function salvarLista(lista: ProdutoUsado[]) {
    try {
      await onSalvarProdutos(lista);
      setErroProduto(null);
      return true;
    } catch (falha) {
      // ex.: estoque insuficiente (409) ou a OS mudou de situação noutra aba
      setErroProduto(mensagemDeErro(falha));
      return false;
    }
  }

  async function adicionar() {
    const produto = disponiveis.find((item) => item.id === produtoId);
    if (!produto) {
      setErroProduto("Escolha um produto.");
      return;
    }
    const qtd = Number(quantidade);
    // aviso rápido com o estoque da tela; quem barra de verdade é o backend
    const problema = validarQuantidade(qtd, produto.estoque, quantidadeNaOs(usados, produto.id));
    if (problema) {
      setErroProduto(problema);
      return;
    }
    if (await salvarLista(adicionarProduto(usados, produto, qtd))) {
      setProdutoId("");
      setQuantidade("1");
    }
  }

  return (
    <div className="produtos-os">
      {usados.length === 0 ? (
        <p className="produtos-os__vazio">Nenhum produto lançado.</p>
      ) : (
        <ul className="produtos-os__lista">
          {usados.map((usado) => (
            <li key={usado.produtoId} className="produtos-os__item">
              <span className="produtos-os__nome">{usado.nome}</span>
              <span className="produtos-os__conta">
                {usado.quantidade} × {formatarReais(usado.precoUnitario)}
              </span>
              <strong className="produtos-os__subtotal">{formatarReais(subtotalProduto(usado))}</strong>
              {produtosEditaveis && (
                <button
                  type="button"
                  className="produtos-os__remover"
                  onClick={() => salvarLista(removerProduto(usados, usado.produtoId))}
                  disabled={salvando}
                  aria-label={`Remover ${usado.nome}`}
                >
                  Remover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {produtosEditaveis && (
        <div className="produtos-os__adicionar">
          <label className="produtos-os__campo produtos-os__campo--produto">
            Produto
            <select
              value={produtoId}
              onChange={(e) => {
                setProdutoId(e.target.value);
                setErroProduto(null);
              }}
            >
              <option value="">Escolha um produto</option>
              {disponiveis.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome} · {formatarReais(produto.preco)} · {produto.estoque} em estoque
                </option>
              ))}
            </select>
          </label>
          {carregando && <p className="produtos-os__vazio">Carregando produtos…</p>}
          {erro && (
            <p className="produtos-os__erro" role="alert">
              {erro}
            </p>
          )}
          <label className="produtos-os__campo produtos-os__campo--quantidade">
            Quantidade
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={quantidade}
              onChange={(e) => {
                setQuantidade(e.target.value);
                setErroProduto(null);
              }}
            />
          </label>
          <button
            type="button"
            className="lista-admin__botao produtos-os__botao-adicionar"
            onClick={adicionar}
            disabled={salvando}
          >
            {salvando ? "Salvando…" : "Adicionar"}
          </button>
        </div>
      )}
      {erroProduto && (
        <p className="produtos-os__erro" role="alert">
          {erroProduto}
        </p>
      )}

      <div className="produtos-os__mao-de-obra">
        {maoDeObraEditavel ? (
          <label className="produtos-os__campo">
            Mão de obra (R$)
            <input
              type="text"
              inputMode="decimal"
              placeholder="150,00"
              value={textoMaoDeObra}
              onChange={(e) => onMudarMaoDeObra(e.target.value)}
              aria-invalid={Boolean(erroMaoDeObra)}
            />
          </label>
        ) : (
          <p>
            Mão de obra:{" "}
            {atendimento.valorMaoDeObra === null ? "não informada" : formatarReais(atendimento.valorMaoDeObra)}
          </p>
        )}
        {maoDeObraEditavel && erroMaoDeObra && (
          <p className="produtos-os__erro" role="alert">
            {erroMaoDeObra}
          </p>
        )}
      </div>

      <p className="produtos-os__total">
        Total <strong>{formatarReais(Math.round(total * 100) / 100)}</strong>
      </p>
    </div>
  );
}

export default ProdutosDaOs;
