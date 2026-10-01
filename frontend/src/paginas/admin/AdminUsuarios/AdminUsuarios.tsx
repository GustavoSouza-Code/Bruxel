import { useState } from "react";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { Modal } from "../../../componentes/ui/Modal/Modal";
import { FormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import type { DadosFormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import { useUsuarios } from "../../../crud/usuarios/useUsuarios";
import { CAMPOS_ENDERECO, formatarEndereco } from "../../../crud/usuarios/camposUsuario";
import type { CampoEditavelUsuario } from "../../../crud/usuarios/camposUsuario";
import type { Usuario } from "../../../tipos/usuario";
import "./AdminUsuarios.css";

/**
 * Gestão de usuários do painel admin (rota "/admin/usuarios"): tabela com
 * edição inline e exclusão, e um botão que abre um modal com o mesmo
 * formulário do "/criar-conta" pra cadastrar usuários. A lista e as
 * operações de criar/editar/excluir vêm do useUsuarios (src/crud/usuarios);
 * esta página só cuida da tela.
 */
export function PaginaAdminUsuarios() {
  const { usuarios, criarUsuario, atualizarUsuario, excluirUsuario } = useUsuarios();
  // id do usuário cuja linha está em edição; null = ninguém (só uma linha por vez)
  const [editingId, setEditingId] = useState<string | null>(null);
  // cópia editável do usuário em edição; só vai pra lista ao clicar em Salvar
  const [editDraft, setEditDraft] = useState<Usuario | null>(null);
  // controla se o modal de "Novo usuário" está aberto
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  function handleCreate(data: DadosFormularioCadastro) {
    criarUsuario(data);
    setIsCreateOpen(false);
  }

  function startEdit(user: Usuario) {
    setEditingId(user.id);
    setEditDraft({ ...user });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  function saveEdit() {
    if (!editDraft) return;
    atualizarUsuario(editDraft);
    setEditingId(null);
    setEditDraft(null);
  }

  function handleDelete(user: Usuario) {
    // pede confirmação antes de excluir (a ação não tem desfazer)
    if (!window.confirm(`Excluir o usuário ${user.nome}?`)) return;
    excluirUsuario(user.id);
    // se a linha excluída estava em edição, encerra a edição
    if (editingId === user.id) {
      setEditingId(null);
      setEditDraft(null);
    }
  }

  function updateDraftField(field: CampoEditavelUsuario, value: string) {
    setEditDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  return (
    <>
      <NavAdmin />

      <section className="pagina-admin-usuarios">
        <Container>
          <div className="pagina-admin-usuarios__topo">
            <h1 className="pagina-admin-usuarios__titulo">Gestão de Usuários</h1>
            <button
              className="pagina-admin-usuarios__novo"
              onClick={() => setIsCreateOpen(true)}
            >
              + Novo usuário
            </button>
          </div>

          {/* títulos das colunas (só em telas largas; no celular o rótulo vem do data-label) */}
          <div className="pagina-admin-usuarios__linha-titulos">
            <span>Nome</span>
            <span>E-mail</span>
            <span>Endereço</span>
            <span>Telefone</span>
            <span>CPF</span>
            <span>Ações</span>
          </div>

          <div className="pagina-admin-usuarios__lista">
            {usuarios.map((user) => {
              // só a linha do usuário em edição vira inputs; as outras continuam em modo leitura
              const isEditing = editingId === user.id;
              const draft = isEditing ? editDraft : null;

              return (
                <div key={user.id} className="pagina-admin-usuarios__linha">
                  {isEditing && draft ? (
                    <>
                      <input
                        value={draft.nome}
                        onChange={(e) => updateDraftField("nome", e.target.value)}
                        aria-label="Nome"
                      />
                      <input
                        value={draft.email}
                        onChange={(e) => updateDraftField("email", e.target.value)}
                        aria-label="E-mail"
                      />
                      {/* o endereço tem uma coluna por campo no banco, então vira um grupo de inputs */}
                      <div className="pagina-admin-usuarios__editar-endereco">
                        {CAMPOS_ENDERECO.map(({ campo, label }) => (
                          <input
                            key={campo}
                            value={draft[campo] ?? ""}
                            onChange={(e) => updateDraftField(campo, e.target.value)}
                            placeholder={label}
                            aria-label={label}
                          />
                        ))}
                      </div>
                      <input
                        value={draft.telefone ?? ""}
                        onChange={(e) => updateDraftField("telefone", e.target.value)}
                        aria-label="Telefone"
                      />
                      <input
                        value={draft.cpf}
                        onChange={(e) => updateDraftField("cpf", e.target.value.replace(/\D/g, ""))}
                        maxLength={11}
                        aria-label="CPF"
                      />
                      <div className="pagina-admin-usuarios__acoes">
                        <button
                          className="pagina-admin-usuarios__salvar"
                          onClick={saveEdit}
                        >
                          Salvar
                        </button>
                        <button
                          className="pagina-admin-usuarios__cancelar"
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* data-label: rótulo que o CSS mostra no celular, onde não há linha de títulos */}
                      <span data-label="Nome">{user.nome}</span>
                      <span data-label="E-mail">{user.email}</span>
                      {/* campos vazios (ex.: usuário recém-criado pelo modal) mostram "—" */}
                      <span data-label="Endereço">{formatarEndereco(user) || "—"}</span>
                      <span data-label="Telefone">{user.telefone || "—"}</span>
                      <span data-label="CPF">{user.cpf || "—"}</span>
                      <div className="pagina-admin-usuarios__acoes">
                        <button
                          className="pagina-admin-usuarios__editar"
                          onClick={() => startEdit(user)}
                        >
                          Editar
                        </button>
                        <button
                          className="pagina-admin-usuarios__excluir"
                          onClick={() => handleDelete(user)}
                        >
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {usuarios.length === 0 && (
              <p className="pagina-admin-usuarios__vazio">Nenhum usuário cadastrado.</p>
            )}
          </div>
        </Container>
      </section>

      {isCreateOpen && (
        <Modal titulo="Novo usuário" onFechar={() => setIsCreateOpen(false)}>
          <FormularioCadastro textoBotao="Criar usuário" onEnviar={handleCreate} />
        </Modal>
      )}
    </>
  );
}

export default PaginaAdminUsuarios;
