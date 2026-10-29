import { describe, expect, it } from "vitest";
import type { ProdutoUsado } from "../../tipos/atendimento";
import {
  adicionarProduto,
  formatarReais,
  perguntaPagamento,
  maoDeObraParaTexto,
  paraValorEmReais,
  quantidadeNaOs,
  removerProduto,
  subtotalProduto,
  totalOs,
  totalProdutos,
  validarMaoDeObra,
  validarQuantidade,
} from "./valorOs";

const CLORO: ProdutoUsado = { produtoId: "propool-3kg", nome: "Cloro 3kg", precoUnitario: 210, quantidade: 1 };
const CLARIFICANTE: ProdutoUsado = { produtoId: "hidrofloc-1l", nome: "Hidrofloc 1L", precoUnitario: 21.5, quantidade: 2 };

describe("totais", () => {
  it("subtotal é preço × quantidade e o total soma a mão de obra", () => {
    expect(subtotalProduto(CLARIFICANTE)).toBe(43);
    expect(totalProdutos([CLORO, CLARIFICANTE])).toBe(253);
    expect(totalOs({ produtosUsados: [CLORO, CLARIFICANTE], valorMaoDeObra: 150 })).toBe(403);
  });

  it("sem mão de obra informada, conta só os produtos; sem nada, é zero", () => {
    expect(totalOs({ produtosUsados: [CLORO], valorMaoDeObra: null })).toBe(210);
    expect(totalOs({ produtosUsados: [], valorMaoDeObra: null })).toBe(0);
  });

  it("arredonda pros centavos", () => {
    const barato: ProdutoUsado = { produtoId: "x", nome: "X", precoUnitario: 0.1, quantidade: 3 };
    expect(totalProdutos([barato])).toBe(0.3);
  });
});

describe("estoque", () => {
  it("quantidade tem que ser inteira e pelo menos 1", () => {
    const erro = "Informe uma quantidade de pelo menos 1.";
    expect(validarQuantidade(0, 10)).toBe(erro);
    expect(validarQuantidade(1.5, 10)).toBe(erro);
    expect(validarQuantidade(Number.NaN, 10)).toBe(erro);
  });

  it("não passa do estoque, somando o que já está na OS", () => {
    expect(validarQuantidade(4, 4)).toBeNull();
    expect(validarQuantidade(5, 4)).toBe("Só tem 4 em estoque.");
    expect(validarQuantidade(3, 4, 2)).toBe("Só tem 4 em estoque.");
    expect(validarQuantidade(1, 0)).toBe("Produto sem estoque.");
  });

  it("o mesmo produto soma na mesma linha; outro produto vira uma linha nova", () => {
    const produto = { id: "hidrofloc-1l", nome: "Hidrofloc 1L", preco: 21.5 };
    const uma = adicionarProduto([], produto, 2);
    expect(uma).toEqual([CLARIFICANTE]);
    expect(adicionarProduto(uma, produto, 1)).toEqual([{ ...CLARIFICANTE, quantidade: 3 }]);
    expect(quantidadeNaOs(uma, "hidrofloc-1l")).toBe(2);
    expect(quantidadeNaOs(uma, "outro")).toBe(0);
    expect(removerProduto([CLORO, CLARIFICANTE], "propool-3kg")).toEqual([CLARIFICANTE]);
  });
});

describe("mão de obra", () => {
  it("aceita reais com vírgula ou ponto; vazio é sem mão de obra", () => {
    expect(validarMaoDeObra("150")).toBeNull();
    expect(validarMaoDeObra("150,50")).toBeNull();
    expect(validarMaoDeObra(" 150.5 ")).toBeNull();
    expect(validarMaoDeObra("")).toBeNull();
    expect(paraValorEmReais("150,50")).toBe(150.5);
    expect(paraValorEmReais("")).toBeNull();
  });

  it("aceita o milhar com ponto, do jeito brasileiro", () => {
    expect(validarMaoDeObra("1.500,00")).toBeNull();
    expect(paraValorEmReais("1.500,00")).toBe(1500);
    expect(paraValorEmReais("1.500")).toBe(1500);
    expect(paraValorEmReais("12.345,6")).toBe(12345.6);
    // ponto com 1 ou 2 casas continua sendo decimal
    expect(paraValorEmReais("1.50")).toBe(1.5);
  });

  it("recusa negativo, texto e número mal formado", () => {
    const erro = "Informe um valor em reais, ex.: 150,00.";
    expect(validarMaoDeObra("-10")).toBe(erro);
    expect(validarMaoDeObra("abc")).toBe(erro);
    expect(validarMaoDeObra("1.5000")).toBe(erro);
    expect(validarMaoDeObra("1,500.00")).toBe(erro);
    expect(paraValorEmReais("abc")).toBeNull();
  });

  it("volta pro campo com vírgula e 2 casas", () => {
    expect(maoDeObraParaTexto(150.5)).toBe("150,50");
    expect(maoDeObraParaTexto(null)).toBe("");
  });
});

describe("formatarReais", () => {
  it("usa o formato brasileiro com espaço comum depois do R$", () => {
    expect(formatarReais(1234.5)).toBe("R$ 1.234,50");
    expect(formatarReais(0)).toBe("R$ 0,00");
  });
});

describe("perguntaPagamento", () => {
  it("avisa quando o total é zero", () => {
    expect(perguntaPagamento(0)).toBe(
      "Esta OS está com total de R$ 0,00 (sem mão de obra e sem produtos). Registrar o pagamento assim mesmo? Depois disso a OS não pode mais mudar."
    );
  });

  it("mostra o valor", () => {
    expect(perguntaPagamento(150)).toBe("Registrar o pagamento de R$ 150,00? Depois disso a OS não pode mais mudar.");
  });
});
