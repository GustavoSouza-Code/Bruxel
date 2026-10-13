import { useMemo, useState } from "react";
import { useProdutos } from "../../../../../crud/produtos/useProdutos";
import {
  adicionarProduto,
  formatarReais,
  maoDeObraParaTexto,
  paraValorEmReais,
  quantidadeNaOs,
  removerProduto,
  subtotalProduto,
  totalOs,
  validarMaoDeObra,
  validarQuantidade,
} from "../../../../../crud/atendimentos/valorOs";
import type { CamposOs } from "../../../../../crud/atendimentos/andamento";
import type { Atendimento } from "../../../../../tipos/atendimento";
import "../../../lista-admin.css";
import "./ProdutosDaOs.css";

interface ProdutosDaOsProps {
  atendimento: Atendimento;
  /** false = OS fechada (paga) ou ainda não começou: só leitura */
  editavel: boolean;
  onMudar: (campos: CamposOs) => void;
}

/**
 * Produtos da loja usados no serviço, a mão de obra e o total da OS. O estoque
 * só é conferido (não dá pra lançar mais do que tem); a baixa é do backend.
 */
export function ProdutosDaOs({ atendimento, editavel, onMudar }: ProdutosDaOsProps) {
  const { produtos } = useProdutos();
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [erroProduto, setErroProduto] = useState<string | null>(null);
  // o campo guarda o texto digitado; o valor só vai pra OS quando é um valor válido
  const [textoMaoDeObra, setTextoMaoDeObra] = useState(() => maoDeObraParaTexto(atendimento.valorMaoDeObra));
  const [erroMaoDeObra, setErroMaoDeObra] = useState<string | null>(null);

  // só os produtos ativos, em ordem alfabética
  const disponiveis = useMemo(
    () => produtos.filter((produto) => produto.ativo).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [produtos]
  );
  const usados = atendimento.produtosUsados;

  function adicionar() {
    const produto = disponiveis.find((item) => item.id === produtoId);
    if (!produto) {
      setErroProduto("Escolha um produto.");
      return;
    }
    const qtd = Number(quantidade);
    const problema = validarQuantidade(qtd, produto.estoque, quantidadeNaOs(usados, produto.id));
    if (problema) {
      setErroProduto(problema);
      return;
    }
    onMudar({ produtosUsados: adicionarProduto(usados, produto, qtd) });
    setProdutoId("");
    setQuantidade("1");
    setErroProduto(null);
  }

  function mudarMaoDeObra(texto: string) {
    setTextoMaoDeObra(texto);
    const problema = validarMaoDeObra(texto);
    setErroMaoDeObra(problema);
    if (!problema) onMudar({ valorMaoDeObra: paraValorEmReais(texto) });
  }

  // ao sair do campo com um texto que não vale, ele volta pro valor que está na OS:
  // o que fica na tela é sempre o que vai ser cobrado
  function sairDaMaoDeObra() {
    if (!validarMaoDeObra(textoMaoDeObra)) return;
    setTextoMaoDeObra(maoDeObraParaTexto(atendimento.valorMaoDeObra));
    setErroMaoDeObra(null);
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
              {editavel && (
                <button
                  type="button"
                  className="produtos-os__remover"
                  onClick={() => onMudar({ produtosUsados: removerProduto(usados, usado.produtoId) })}
                  aria-label={`Remover ${usado.nome}`}
                >
                  Remover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editavel && (
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
          <button type="button" className="lista-admin__botao produtos-os__botao-adicionar" onClick={adicionar}>
            Adicionar
          </button>
          {erroProduto && (
            <p className="produtos-os__erro" role="alert">
              {erroProduto}
            </p>
          )}
        </div>
      )}

      <div className="produtos-os__mao-de-obra">
        {editavel ? (
          <label className="produtos-os__campo">
            Mão de obra (R$)
            <input
              type="text"
              inputMode="decimal"
              placeholder="150,00"
              value={textoMaoDeObra}
              onChange={(e) => mudarMaoDeObra(e.target.value)}
              onBlur={sairDaMaoDeObra}
              aria-invalid={Boolean(erroMaoDeObra)}
            />
          </label>
        ) : (
          <p>
            Mão de obra:{" "}
            {atendimento.valorMaoDeObra === null ? "não informada" : formatarReais(atendimento.valorMaoDeObra)}
          </p>
        )}
        {editavel && erroMaoDeObra && (
          <p className="produtos-os__erro" role="alert">
            {erroMaoDeObra}
          </p>
        )}
      </div>

      <p className="produtos-os__total">
        Total <strong>{formatarReais(totalOs(atendimento))}</strong>
      </p>
    </div>
  );
}

export default ProdutosDaOs;
