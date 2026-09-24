import { useState } from "react";
import { AdminNav } from "../../components/AdminNav/AdminNav";
import { Container } from "../../components/Container/Container";
import type { User } from "../../types/user";
import "./AdminUsers.css";

const INITIAL_USERS: User[] = [
  {
    id: "user-1",
    name: "Marcos Bruxel",
    email: "marcos@bruxelpiscinas.com",
    address: "Av. Benjamim Constant, 2361, Lajeado - RS",
    phone: "(51) 99307-8577",
    document: "123.456.789-00",
  },
  {
    id: "user-2",
    name: "Ana Paula Martins",
    email: "ana.paula@email.com",
    address: "Rua das Flores, 120, Lajeado - RS",
    phone: "(51) 99123-4567",
    document: "987.654.321-00",
  },
  {
    id: "user-3",
    name: "Eduardo Oliveira",
    email: "eduardo.oliveira@email.com",
    address: "Rua Sete de Setembro, 850, Lajeado - RS",
    phone: "(51) 99876-5432",
    document: "456.789.123-00",
  },
  {
    id: "user-4",
    name: "Luciana Hass",
    email: "luciana.hass@email.com",
    address: "Av. Presidente Vargas, 45, Lajeado - RS",
    phone: "(51) 99555-2211",
    document: "321.654.987-00",
  },
];

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<User | null>(null);

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
    setUsers((current) =>
      current.map((user) => (user.id === editDraft.id ? editDraft : user))
    );
    setEditingId(null);
    setEditDraft(null);
  }

  function deleteUser(user: User) {
    if (!window.confirm(`Excluir o usuário ${user.name}?`)) return;
    setUsers((current) => current.filter((u) => u.id !== user.id));
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
          <h1 className="admin-users-page__title">Gestão de Usuários</h1>

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
                      <span data-label="Nome">{user.name}</span>
                      <span data-label="E-mail">{user.email}</span>
                      <span data-label="Endereço">{user.address}</span>
                      <span data-label="Telefone">{user.phone}</span>
                      <span data-label="CPF/CNPJ">{user.document}</span>
                      <div className="admin-users-page__actions">
                        <button
                          className="admin-users-page__edit"
                          onClick={() => startEdit(user)}
                        >
                          Editar
                        </button>
                        <button
                          className="admin-users-page__delete"
                          onClick={() => deleteUser(user)}
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
    </>
  );
}

export default AdminUsersPage;
