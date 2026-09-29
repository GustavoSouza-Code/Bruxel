import { useState } from "react";
import type { FormEvent } from "react";
import { AdminNav } from "../../../components/layout/AdminNav/AdminNav";
import { Container } from "../../../components/layout/Container/Container";
import type { Product, ProductCategory } from "../../../types/product";
import { ALL_PRODUCTS } from "../../../data/products";
import "./AdminProducts.css";

// opções do <select> de categoria (value = slug de ProductCategory)
const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "tratamento-agua", label: "Tratamento da água" },
  { value: "limpeza-piscina", label: "Limpeza da Piscina" },
  { value: "filtracao-circulacao", label: "Filtração e circulação" },
  { value: "acessorios-lazer", label: "Acessórios & Lazer" },
];

// formulário em branco (sem id: ele é gerado ao salvar); a categoria começa em "tratamento-agua"
// pra o <select> nunca ficar sem valor
const EMPTY_FORM: Omit<Product, "id"> = {
  name: "",
  variant: "",
  packageInfo: "",
  description: "",
  price: 0,
  imageUrl: "",
  category: "tratamento-agua",
};

/**
 * Gestão de produtos do painel admin (rota "/admin/produtos"): um formulário
 * que serve tanto pra cadastrar quanto pra editar, e a lista de produtos
 * abaixo dele. Parte de ALL_PRODUCTS e vive só na memória; as alterações
 * somem ao recarregar a página.
 */
export function AdminProductsPage() {
  // a função inicial copia a lista, pra não alterar ALL_PRODUCTS (que a Loja também usa)
  const [products, setProducts] = useState<Product[]>(() => [...ALL_PRODUCTS]);
  // id do produto em edição; null = o formulário está cadastrando um produto novo
  const [editingId, setEditingId] = useState<string | null>(null);
  // valores atuais dos campos do formulário (tanto no cadastro quanto na edição)
  const [formState, setFormState] = useState<Omit<Product, "id">>(EMPTY_FORM);

  const isEditing = editingId !== null;

  // genérico pra o TypeScript garantir que o valor combina com o campo (ex.: "price" só aceita number)
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
    // campos opcionais podem ser undefined no produto, mas os inputs precisam de string: daí o ?? ""
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
    // se o produto excluído estava no formulário, limpa o formulário
    if (editingId === product.id) resetForm();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // mesmo formulário pros dois casos: editando, substitui o produto (mantém o id); senão, cria um novo
    if (isEditing) {
      setProducts((current) =>
        current.map((p) =>
          p.id === editingId ? { ...formState, id: editingId } : p
        )
      );
    } else {
      const newProduct: Product = {
        ...formState,
        // TODO: o id virá do backend; por enquanto usa a hora atual só pra ser único na sessão
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

          {/* títulos das colunas (só em telas largas; no celular o rótulo vem do data-label) */}
          <div className="admin-products-page__header-row">
            <span>Imagem</span>
            <span>Nome</span>
            <span>Categoria</span>
            <span>Preço</span>
            <span>Ações</span>
          </div>

          <div className="admin-products-page__list">
            {products.map((product) => {
              // converte o slug da categoria no nome legível mostrado na lista
              const categoryLabel = CATEGORY_OPTIONS.find(
                (option) => option.value === product.category
              )?.label;

              return (
                <div key={product.id} className="admin-products-page__row">
                  {/* data-label: rótulo do CSS no celular; sem imagem, aparece um quadrado cinza */}
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
