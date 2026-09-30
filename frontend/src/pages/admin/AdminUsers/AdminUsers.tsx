import { useState } from "react";
import { AdminNav } from "../../../components/layout/AdminNav/AdminNav";
import { Container } from "../../../components/layout/Container/Container";
import { Modal } from "../../../components/ui/Modal/Modal";
import { SignupForm } from "../../../crud/users/SignupForm/SignupForm";
import type { SignupFormData } from "../../../crud/users/SignupForm/SignupForm";
import { useUsers } from "../../../crud/users/useUsers";
import type { User } from "../../../types/user";
import "./AdminUsers.css";

/**
 * Gestão de usuários do painel admin (rota "/admin/usuarios"): tabela com
 * edição inline e exclusão, e um botão que abre um modal com o mesmo
 * formulário do "/criar-conta" pra cadastrar usuários. A lista e as
 * operações de criar/editar/excluir vêm do useUsers (src/crud/users);
 * esta página só cuida da tela.
 */
export function AdminUsersPage() {
  const { users, createUser, updateUser, deleteUser } = useUsers();
  // id do usuário cuja linha está em edição; null = ninguém (só uma linha por vez)
  const [editingId, setEditingId] = useState<string | null>(null);
  // cópia editável do usuário em edição; só vai pra lista ao clicar em Salvar
  const [editDraft, setEditDraft] = useState<User | null>(null);
  // controla se o modal de "Novo usuário" está aberto
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  function handleCreate(data: SignupFormData) {
    createUser(data);
    setIsCreateOpen(false);
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setEditDraft({ ...user });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  function saveEdit() {
    if (!editDraft) return;
    updateUser(editDraft);
    setEditingId(null);
    setEditDraft(null);
  }

  function handleDelete(user: User) {
    // pede confirmação antes de excluir (a ação não tem desfazer)
    if (!window.confirm(`Excluir o usuário ${user.name}?`)) return;
    deleteUser(user.id);
    // se a linha excluída estava em edição, encerra a edição
    if (editingId === user.id) {
      setEditingId(null);
      setEditDraft(null);
    }
  }

  function updateDraftField(field: keyof User, value: string) {
    setEditDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  return (
    <>
      <AdminNav />

      <section className="admin-users-page">
        <Container>
          <div className="admin-users-page__top">
            <h1 className="admin-users-page__title">Gestão de Usuários</h1>
            <button
              className="admin-users-page__new"
              onClick={() => setIsCreateOpen(true)}
            >
              + Novo usuário
            </button>
          </div>

          {/* títulos das colunas (só em telas largas; no celular o rótulo vem do data-label) */}
          <div className="admin-users-page__header-row">
            <span>Nome</span>
            <span>E-mail</span>
            <span>Endereço</span>
            <span>Telefone</span>
            <span>CPF/CNPJ</span>
            <span>Ações</span>
          </div>

          <div className="admin-users-page__list">
            {users.map((user) => {
              // só a linha do usuário em edição vira inputs; as outras continuam em modo leitura
              const isEditing = editingId === user.id;
              const draft = isEditing ? editDraft : null;

              return (
                <div key={user.id} className="admin-users-page__row">
                  {isEditing && draft ? (
                    <>
                      <input
                        value={draft.name}
                        onChange={(e) => updateDraftField("name", e.target.value)}
                        aria-label="Nome"
                      />
                      <input
                        value={draft.email}
                        onChange={(e) => updateDraftField("email", e.target.value)}
                        aria-label="E-mail"
                      />
                      <input
                        value={draft.address}
                        onChange={(e) => updateDraftField("address", e.target.value)}
                        aria-label="Endereço"
                      />
                      <input
                        value={draft.phone}
                        onChange={(e) => updateDraftField("phone", e.target.value)}
                        aria-label="Telefone"
                      />
                      <input
                        value={draft.document}
                        onChange={(e) => updateDraftField("document", e.target.value)}
                        aria-label="CPF/CNPJ"
                      />
                      <div className="admin-users-page__actions">
                        <button
                          className="admin-users-page__save"
                          onClick={saveEdit}
                        >
                          Salvar
                        </button>
                        <button
                          className="admin-users-page__cancel"
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* data-label: rótulo que o CSS mostra no celular, onde não há linha de títulos */}
                      <span data-label="Nome">{user.name}</span>
                      <span data-label="E-mail">{user.email}</span>
                      {/* campos vazios (ex.: usuário recém-criado pelo modal) mostram "—" */}
                      <span data-label="Endereço">{user.address || "—"}</span>
                      <span data-label="Telefone">{user.phone || "—"}</span>
                      <span data-label="CPF/CNPJ">{user.document || "—"}</span>
                      <div className="admin-users-page__actions">
                        <button
                          className="admin-users-page__edit"
                          onClick={() => startEdit(user)}
                        >
                          Editar
                        </button>
                        <button
                          className="admin-users-page__delete"
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

            {users.length === 0 && (
              <p className="admin-users-page__empty">Nenhum usuário cadastrado.</p>
            )}
          </div>
        </Container>
      </section>

      {isCreateOpen && (
        <Modal title="Novo usuário" onClose={() => setIsCreateOpen(false)}>
          <SignupForm submitLabel="Criar usuário" onSubmit={handleCreate} />
        </Modal>
      )}
    </>
  );
}

export default AdminUsersPage;
