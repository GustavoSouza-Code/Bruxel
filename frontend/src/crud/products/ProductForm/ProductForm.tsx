import { useState } from "react";
import type { FormEvent } from "react";
import type { Product, ProductCategory } from "../../../types/product";
import { CATEGORY_OPTIONS } from "../productCategories";
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

// formulário em branco; a categoria começa em "tratamento-agua" pra o <select> nunca ficar sem valor
const EMPTY_FORM: ProductFormData = {
  name: "",
  variant: "",
  packageInfo: "",
  description: "",
  price: 0,
  imageUrl: "",
  category: "tratamento-agua",
};

// campos opcionais podem ser undefined no produto, mas os inputs precisam de string: daí o ?? ""
function toFormData(product: Product): ProductFormData {
  return {
    name: product.name,
    variant: product.variant ?? "",
    packageInfo: product.packageInfo ?? "",
    description: product.description ?? "",
    price: product.price,
    imageUrl: product.imageUrl,
    category: product.category ?? "tratamento-agua",
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

  // genérico pra o TypeScript garantir que o valor combina com o campo (ex.: "price" só aceita number)
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
          value={formState.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
      </label>

      <label>
        Variante
        <input
          type="text"
          value={formState.variant}
          onChange={(e) => updateField("variant", e.target.value)}
        />
      </label>

      <label>
        Embalagem/Pacote
        <input
          type="text"
          value={formState.packageInfo}
          onChange={(e) => updateField("packageInfo", e.target.value)}
        />
      </label>

      <label className="product-form__field--full">
        Descrição/Características
        <textarea
          value={formState.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
        />
      </label>

      <label>
        Preço
        <input
          type="number"
          step="0.01"
          min="0"
          value={formState.price}
          onChange={(e) => updateField("price", Number(e.target.value))}
          required
        />
      </label>

      <label>
        Categoria
        <select
          value={formState.category}
          onChange={(e) =>
            updateField("category", e.target.value as ProductCategory)
          }
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="product-form__field--full">
        URL da imagem
        <input
          type="text"
          placeholder="https://..."
          value={formState.imageUrl}
          onChange={(e) => updateField("imageUrl", e.target.value)}
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
