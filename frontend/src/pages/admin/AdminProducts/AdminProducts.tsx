import { useState } from "react";
import { AdminNav } from "../../../components/layout/AdminNav/AdminNav";
import { Container } from "../../../components/layout/Container/Container";
import type { Product } from "../../../types/product";
import { useProducts } from "../../../crud/products/useProducts";
import { getCategoryName } from "../../../crud/products/productCategories";
import { ProductForm } from "../../../crud/products/ProductForm/ProductForm";
import type { ProductFormData } from "../../../crud/products/ProductForm/ProductForm";
import "./AdminProducts.css";

/**
 * Gestão de produtos do painel admin (rota "/admin/produtos"): o formulário
 * de cadastro/edição (ProductForm) e a lista de produtos abaixo dele. A
 * lista e as operações de criar/editar/excluir vêm do useProducts
 * (src/crud/products); esta página só cuida da tela.
 */
export function AdminProductsPage() {
  const { products, createProduct, updateProduct, deleteProduct } = useProducts();
  // id do produto em edição; null = o formulário está cadastrando um produto novo
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingProduct = products.find((p) => p.id === editingId) ?? null;

  function handleSubmit(data: ProductFormData) {
    // mesmo formulário pros dois casos: editando, substitui o produto (mantém o id); senão, cria um novo
    if (editingId) {
      updateProduct(editingId, data);
    } else {
      createProduct(data);
    }
    setEditingId(null);
  }

  function handleDelete(product: Product) {
    if (!window.confirm(`Excluir o produto "${product.nome}"?`)) return;
    deleteProduct(product.id);
    // se o produto excluído estava no formulário, volta o formulário pro cadastro
    if (editingId === product.id) setEditingId(null);
  }

  return (
    <>
      <AdminNav />

      <section className="admin-products-page">
        <Container>
          <h1 className="admin-products-page__title">Gestão de Produtos</h1>

          {/* a key muda quando o produto em edição muda: o React descarta o formulário
              antigo e cria outro, já com os dados do novo produto (ou em branco) */}
          <ProductForm
            key={editingId ?? "novo"}
            product={editingProduct}
            onSubmit={handleSubmit}
            onCancel={() => setEditingId(null)}
          />

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
              // converte o categoria_id no nome legível mostrado na lista
              const categoryLabel = getCategoryName(product.categoria_id);

              return (
                <div key={product.id} className="admin-products-page__row">
                  {/* data-label: rótulo do CSS no celular; sem imagem, aparece um quadrado cinza */}
                  <span data-label="Imagem" className="admin-products-page__thumb-cell">
                    {product.url_imagem ? (
                      <img
                        src={product.url_imagem}
                        alt={product.nome}
                        className="admin-products-page__thumb"
                      />
                    ) : (
                      <span className="admin-products-page__thumb admin-products-page__thumb--empty" />
                    )}
                  </span>
                  <span data-label="Nome">{product.nome}</span>
                  <span data-label="Categoria">{categoryLabel || "—"}</span>
                  <span data-label="Preço">
                    R$ {product.preco.toFixed(2).replace(".", ",")}
                  </span>
                  <div className="admin-products-page__actions">
                    <button
                      className="admin-products-page__edit"
                      onClick={() => setEditingId(product.id)}
                    >
                      Editar
                    </button>
                    <button
                      className="admin-products-page__delete"
                      onClick={() => handleDelete(product)}
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
