import { useState } from "react";
import type { FormEvent } from "react";
import type { Product } from "../../../types/product";
import { CATEGORIES } from "../productCategories";
import "./ProductForm.css";

/** O que o formulário entrega ao ser enviado: o produto sem o id (quem decide o id é o CRUD). */
export type ProductFormData = Omit<Product, "id">;

interface ProductFormProps {
  /** produto em edição; null = o formulário está cadastrando um produto novo */
  product: Product | null;
  onSubmit: (data: ProductFormData) => void;
  /** chamado pelo botão "Cancelar edição" (só aparece editando) */
  onCancel: () => void;
}

// formulário em branco; a categoria começa na primeira pra o <select> nunca ficar sem valor
const EMPTY_FORM: ProductFormData = {
  categoria_id: CATEGORIES[0].id,
  codigo: "",
  nome: "",
  descricao: "",
  preco: 0,
  estoque: 0,
  url_imagem: "",
  ativo: true,
};

// campos opcionais podem ser undefined no produto, mas os inputs precisam de string: daí o ?? ""
function toFormData(product: Product): ProductFormData {
  return {
    categoria_id: product.categoria_id,
    codigo: product.codigo,
    nome: product.nome,
    descricao: product.descricao ?? "",
    preco: product.preco,
    estoque: product.estoque,
    url_imagem: product.url_imagem ?? "",
    ativo: product.ativo,
  };
}

/**
 * Formulário de produto do painel admin, que serve tanto pra cadastrar
 * quanto pra editar. Os campos começam com os dados de `product` (ou em
 * branco); pra trocar o produto em edição, a página muda a `key` do
 * componente, e o React cria um formulário novo.
 */
export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const isEditing = product !== null;
  // a função inicial só roda quando o componente é criado
  const [formState, setFormState] = useState<ProductFormData>(() =>
    product ? toFormData(product) : EMPTY_FORM
  );

  // genérico pra o TypeScript garantir que o valor combina com o campo (ex.: "preco" só aceita number)
  function updateField<K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(formState);
    // no cadastro, limpa os campos pro próximo produto (na edição a página troca a key e recria o form)
    if (!isEditing) setFormState(EMPTY_FORM);
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <label>
        Nome
        <input
          type="text"
          placeholder="ex.: Hidrofloc 1L"
          value={formState.nome}
          onChange={(e) => updateField("nome", e.target.value)}
          required
        />
      </label>

      <label>
        Código
        <input
          type="text"
          value={formState.codigo}
          onChange={(e) => updateField("codigo", e.target.value)}
          required
        />
      </label>

      <label>
        Categoria
        <select
          value={formState.categoria_id}
          onChange={(e) => updateField("categoria_id", e.target.value)}
        >
          {CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nome}
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
          value={formState.preco}
          onChange={(e) => updateField("preco", Number(e.target.value))}
          required
        />
      </label>

      <label>
        Estoque
        <input
          type="number"
          step="1"
          min="0"
          value={formState.estoque}
          onChange={(e) => updateField("estoque", Number(e.target.value))}
          required
        />
      </label>

      <label className="product-form__checkbox">
        <input
          type="checkbox"
          checked={formState.ativo}
          onChange={(e) => updateField("ativo", e.target.checked)}
        />
        Ativo na loja
      </label>

      <label className="product-form__field--full">
        Descrição/Características
        <textarea
          value={formState.descricao}
          onChange={(e) => updateField("descricao", e.target.value)}
          rows={3}
        />
      </label>

      <label className="product-form__field--full">
        URL da imagem
        <input
          type="text"
          placeholder="https://..."
          value={formState.url_imagem}
          onChange={(e) => updateField("url_imagem", e.target.value)}
        />
      </label>

      <div className="product-form__actions">
        <button type="submit" className="product-form__submit">
          {isEditing ? "Salvar alterações" : "Adicionar produto"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="product-form__cancel"
            onClick={onCancel}
          >
            Cancelar edição
          </button>
        )}
      </div>
    </form>
  );
}

export default ProductForm;
