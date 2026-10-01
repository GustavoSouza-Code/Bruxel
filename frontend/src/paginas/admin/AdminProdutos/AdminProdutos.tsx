import { useState } from "react";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import type { Produto } from "../../../tipos/produto";
import { useProdutos } from "../../../crud/produtos/useProdutos";
import { nomeDaCategoria } from "../../../crud/produtos/categorias";
import { FormularioProduto } from "../../../crud/produtos/FormularioProduto/FormularioProduto";
import type { DadosFormularioProduto } from "../../../crud/produtos/FormularioProduto/FormularioProduto";
import "./AdminProdutos.css";

/**
 * Gestão de produtos do painel admin (rota "/admin/produtos"): o formulário
 * de cadastro/edição (FormularioProduto) e a lista de produtos abaixo dele. A
 * lista e as operações de criar/editar/excluir vêm do useProdutos
 * (src/crud/produtos); esta página só cuida da tela.
 */
export function PaginaAdminProdutos() {
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
      <NavAdmin />

      <section className="pagina-admin-produtos">
        <Container>
          <h1 className="pagina-admin-produtos__titulo">Gestão de Produtos</h1>

          {/* a key muda quando o produto em edição muda: o React descarta o formulário
              antigo e cria outro, já com os dados do novo produto (ou em branco) */}
          <FormularioProduto
            key={editingId ?? "novo"}
            produto={editingProduct}
            onEnviar={handleSubmit}
            onCancelar={() => setEditingId(null)}
          />

          {/* títulos das colunas (só em telas largas; no celular o rótulo vem do data-label) */}
          <div className="pagina-admin-produtos__linha-titulos">
            <span>Imagem</span>
            <span>Nome</span>
            <span>Categoria</span>
            <span>Preço</span>
            <span>Ações</span>
          </div>

          <div className="pagina-admin-produtos__lista">
            {produtos.map((product) => {
              // converte o categoria_id no nome legível mostrado na lista
              const categoryLabel = nomeDaCategoria(product.categoria_id);

              return (
                <div key={product.id} className="pagina-admin-produtos__linha">
                  {/* data-label: rótulo do CSS no celular; sem imagem, aparece um quadrado cinza */}
                  <span data-label="Imagem" className="pagina-admin-produtos__celula-miniatura">
                    {product.url_imagem ? (
                      <img
                        src={product.url_imagem}
                        alt={product.nome}
                        className="pagina-admin-produtos__miniatura"
                      />
                    ) : (
                      <span className="pagina-admin-produtos__miniatura pagina-admin-produtos__miniatura--vazio" />
                    )}
                  </span>
                  <span data-label="Nome">{product.nome}</span>
                  <span data-label="Categoria">{categoryLabel || "—"}</span>
                  <span data-label="Preço">
                    R$ {product.preco.toFixed(2).replace(".", ",")}
                  </span>
                  <div className="pagina-admin-produtos__acoes">
                    <button
                      className="pagina-admin-produtos__editar"
                      onClick={() => setEditingId(product.id)}
                    >
                      Editar
                    </button>
                    <button
                      className="pagina-admin-produtos__excluir"
                      onClick={() => handleDelete(product)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}

            {produtos.length === 0 && (
              <p className="pagina-admin-produtos__vazio">
                Nenhum produto cadastrado.
              </p>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}

export default PaginaAdminProdutos;
