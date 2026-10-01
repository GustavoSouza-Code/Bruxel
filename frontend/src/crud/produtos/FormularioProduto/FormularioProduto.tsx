import { useState } from "react";
import type { FormEvent } from "react";
import type { Produto } from "../../../tipos/produto";
import { CATEGORIAS } from "../categorias";
import "./FormularioProduto.css";

/** O que o formulário entrega ao ser enviado: o produto sem o id (quem decide o id é o CRUD). */
export type DadosFormularioProduto = Omit<Produto, "id">;

interface FormularioProdutoProps {
  /** produto em edição; null = o formulário está cadastrando um produto novo */
  produto: Produto | null;
  onEnviar: (dados: DadosFormularioProduto) => void;
  /** chamado pelo botão "Cancelar edição" (só aparece editando) */
  onCancelar: () => void;
}

// formulário em branco; a categoria começa na primeira pra o <select> nunca ficar sem valor
const FORMULARIO_VAZIO: DadosFormularioProduto = {
  categoria_id: CATEGORIAS[0].id,
  codigo: "",
  nome: "",
  descricao: "",
  preco: 0,
  estoque: 0,
  url_imagem: "",
  ativo: true,
};

// campos opcionais podem ser undefined no produto, mas os inputs precisam de string: daí o ?? ""
function paraDadosFormulario(produto: Produto): DadosFormularioProduto {
  return {
    categoria_id: produto.categoria_id,
    codigo: produto.codigo,
    nome: produto.nome,
    descricao: produto.descricao ?? "",
    preco: produto.preco,
    estoque: produto.estoque,
    url_imagem: produto.url_imagem ?? "",
    ativo: produto.ativo,
  };
}

/**
 * Formulário de produto do painel admin, que serve tanto pra cadastrar
 * quanto pra editar. Os campos começam com os dados de `produto` (ou em
 * branco); pra trocar o produto em edição, a página muda a `key` do
 * componente, e o React cria um formulário novo.
 */
export function FormularioProduto({ produto, onEnviar, onCancelar }: FormularioProdutoProps) {
  const editando = produto !== null;
  // a função inicial só roda quando o componente é criado
  const [formulario, setFormulario] = useState<DadosFormularioProduto>(() =>
    produto ? paraDadosFormulario(produto) : FORMULARIO_VAZIO
  );

  // genérico pra o TypeScript garantir que o valor combina com o campo (ex.: "preco" só aceita number)
  function atualizarCampo<K extends keyof DadosFormularioProduto>(
    campo: K,
    valor: DadosFormularioProduto[K]
  ) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function enviar(event: FormEvent) {
    event.preventDefault();
    onEnviar(formulario);
    // no cadastro, limpa os campos pro próximo produto (na edição a página troca a key e recria o form)
    if (!editando) setFormulario(FORMULARIO_VAZIO);
  }

  return (
    <form className="formulario-produto" onSubmit={enviar}>
      <label>
        Nome
        <input
          type="text"
          placeholder="ex.: Hidrofloc 1L"
          value={formulario.nome}
          onChange={(e) => atualizarCampo("nome", e.target.value)}
          required
        />
      </label>

      <label>
        Código
        <input
          type="text"
          value={formulario.codigo}
          onChange={(e) => atualizarCampo("codigo", e.target.value)}
          required
        />
      </label>

      <label>
        Categoria
        <select
          value={formulario.categoria_id}
          onChange={(e) => atualizarCampo("categoria_id", e.target.value)}
        >
          {CATEGORIAS.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </label>

      <label>
        Preço
        <input
          type="number"
          step="0.01"
          min="0"
          value={formulario.preco}
          onChange={(e) => atualizarCampo("preco", Number(e.target.value))}
          required
        />
      </label>

      <label>
        Estoque
        <input
          type="number"
          step="1"
          min="0"
          value={formulario.estoque}
          onChange={(e) => atualizarCampo("estoque", Number(e.target.value))}
          required
        />
      </label>

      <label className="formulario-produto__checkbox">
        <input
          type="checkbox"
          checked={formulario.ativo}
          onChange={(e) => atualizarCampo("ativo", e.target.checked)}
        />
        Ativo na loja
      </label>

      <label className="formulario-produto__campo--inteiro">
        Descrição/Características
        <textarea
          value={formulario.descricao}
          onChange={(e) => atualizarCampo("descricao", e.target.value)}
          rows={3}
        />
      </label>

      <label className="formulario-produto__campo--inteiro">
        URL da imagem
        <input
          type="text"
          placeholder="https://..."
          value={formulario.url_imagem}
          onChange={(e) => atualizarCampo("url_imagem", e.target.value)}
        />
      </label>

      <div className="formulario-produto__acoes">
        <button type="submit" className="formulario-produto__enviar">
          {editando ? "Salvar alterações" : "Adicionar produto"}
        </button>
        {editando && (
          <button
            type="button"
            className="formulario-produto__cancelar"
            onClick={onCancelar}
          >
            Cancelar edição
          </button>
        )}
      </div>
    </form>
  );
}

export default FormularioProduto;
