import { useState } from "react";
import { AdminNav } from "../../../components/layout/AdminNav/AdminNav";
import { Container } from "../../../components/layout/Container/Container";
import type { Produto } from "../../../types/produto";
import { useProdutos } from "../../../crud/produtos/useProdutos";
import { nomeDaCategoria } from "../../../crud/produtos/categorias";
import { FormularioProduto } from "../../../crud/produtos/FormularioProduto/FormularioProduto";
import type { DadosFormularioProduto } from "../../../crud/produtos/FormularioProduto/FormularioProduto";
import "./AdminProducts.css";

/**
 * Gestão de produtos do painel admin (rota "/admin/produtos"): o formulário
 * de cadastro/edição (FormularioProduto) e a lista de produtos abaixo dele. A
 * lista e as operações de criar/editar/excluir vêm do useProdutos
 * (src/crud/produtos); esta página só cuida da tela.
 */
export function AdminProductsPage() {
  const { produtos, criarProduto, atualizarProduto, excluirProduto } = useProdutos();
  // id do produto em edição; null = o formulário está cadastrando um produto novo
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingProduct = produtos.find((p) => p.id === editingId) ?? null;

  function handleSubmit(data: DadosFormularioProduto) {
    // mesmo formulário pros dois casos: editando, substitui o produto (mantém o id); senão, cria um novo
    if (editingId) {
      atualizarProduto(editingId, data);
    } else {
      criarProduto(data);
    }
    setEditingId(null);
  }

  function handleDelete(product: Produto) {
    if (!window.confirm(`Excluir o produto "${product.nome}"?`)) return;
    excluirProduto(product.id);
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
          <FormularioProduto
            key={editingId ?? "novo"}
            produto={editingProduct}
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
            {produtos.map((product) => {
              // converte o categoria_id no nome legível mostrado na lista
              const categoryLabel = nomeDaCategoria(product.categoria_id);

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

            {produtos.length === 0 && (
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
