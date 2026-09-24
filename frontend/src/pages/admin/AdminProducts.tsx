import { useState } from "react";
import type { FormEvent } from "react";
import { AdminNav } from "../../components/AdminNav/AdminNav";
import { Container } from "../../components/Container/Container";
import type { Product, ProductCategory } from "../../types/product";
import { ALL_PRODUCTS } from "../portal/Home";
import "./AdminProducts.css";

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "tratamento-agua", label: "Tratamento da água" },
  { value: "limpeza-piscina", label: "Limpeza da Piscina" },
  { value: "filtracao-circulacao", label: "Filtração e circulação" },
  { value: "acessorios-lazer", label: "Acessórios & Lazer" },
];

const EMPTY_FORM: Omit<Product, "id"> = {
  name: "",
  variant: "",
  packageInfo: "",
  description: "",
  price: 0,
  imageUrl: "",
  category: "tratamento-agua",
};

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(() => [...ALL_PRODUCTS]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Omit<Product, "id">>(EMPTY_FORM);

  const isEditing = editingId !== null;

  function updateField<K extends keyof Omit<Product, "id">>(
    field: K,
    value: Omit<Product, "id">[K]
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setFormState(EMPTY_FORM);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setFormState({
      name: product.name,
      variant: product.variant ?? "",
      packageInfo: product.packageInfo ?? "",
      description: product.description ?? "",
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category ?? "tratamento-agua",
    });
  }

  function deleteProduct(product: Product) {
    if (!window.confirm(`Excluir o produto "${product.name}"?`)) return;
    setProducts((current) => current.filter((p) => p.id !== product.id));
    if (editingId === product.id) resetForm();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isEditing) {
      setProducts((current) =>
        current.map((p) =>
          p.id === editingId ? { ...formState, id: editingId } : p
        )
      );
    } else {
      const newProduct: Product = {
        ...formState,
        id: `produto-${Date.now()}`,
      };
      setProducts((current) => [...current, newProduct]);
    }

    resetForm();
  }

  return (
    <>
      <AdminNav />

      <section className="admin-products-page">
        <Container>
          <h1 className="admin-products-page__title">Gestão de Produtos</h1>

          <form className="admin-products-page__form" onSubmit={handleSubmit}>
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

            <label className="admin-products-page__field--full">
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

            <label className="admin-products-page__field--full">
              URL da imagem
              <input
                type="text"
                placeholder="https://..."
                value={formState.imageUrl}
                onChange={(e) => updateField("imageUrl", e.target.value)}
              />
            </label>

            <div className="admin-products-page__form-actions">
              <button type="submit" className="admin-products-page__submit">
                {isEditing ? "Salvar alterações" : "Adicionar produto"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="admin-products-page__cancel"
                  onClick={resetForm}
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </form>

          <div className="admin-products-page__header-row">
            <span>Imagem</span>
            <span>Nome</span>
            <span>Categoria</span>
            <span>Preço</span>
            <span>Ações</span>
          </div>

          <div className="admin-products-page__list">
            {products.map((product) => {
              const categoryLabel = CATEGORY_OPTIONS.find(
                (option) => option.value === product.category
              )?.label;

              return (
                <div key={product.id} className="admin-products-page__row">
                  <span data-label="Imagem" className="admin-products-page__thumb-cell">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="admin-products-page__thumb"
                      />
                    ) : (
                      <span className="admin-products-page__thumb admin-products-page__thumb--empty" />
                    )}
                  </span>
                  <span data-label="Nome">{product.name}</span>
                  <span data-label="Categoria">{categoryLabel ?? "—"}</span>
                  <span data-label="Preço">
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </span>
                  <div className="admin-products-page__actions">
                    <button
                      className="admin-products-page__edit"
                      onClick={() => startEdit(product)}
                    >
                      Editar
                    </button>
                    <button
                      className="admin-products-page__delete"
                      onClick={() => deleteProduct(product)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}

            {products.length === 0 && (
              <p className="admin-products-page__empty">
                Nenhum produto cadastrado.
              </p>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}

export default AdminProductsPage;
