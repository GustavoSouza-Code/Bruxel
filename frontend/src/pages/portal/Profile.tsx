import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../components/Header/Header";
import { Footer } from "../../components/Footer/Footer";
import { Container } from "../../components/Container/Container";
import type { User } from "../../types/user";
import "./Profile.css";

type ProfileSection = "perfil" | "enderecos" | "compras";

type OrderStatus = "entregue" | "a-caminho" | "cancelado";

interface Order {
  id: string;
  date: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
}

// Mock até o login estar integrado com o backend
const MOCK_USER: User = {
  id: "user-3",
  name: "Eduardo Oliveira",
  email: "eduardo.oliveira@email.com",
  address: "Rua Sete de Setembro, 850, Lajeado - RS",
  phone: "(51) 99876-5432",
  document: "456.789.123-00",
};

const MOCK_ORDERS: Order[] = [
  { id: "10482", date: "12/09/2026", itemCount: 3, total: 289.7, status: "a-caminho" },
  { id: "10231", date: "28/07/2026", itemCount: 1, total: 159.9, status: "entregue" },
  { id: "09877", date: "03/05/2026", itemCount: 2, total: 74.8, status: "cancelado" },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  entregue: "Entregue",
  "a-caminho": "A caminho",
  cancelado: "Cancelado",
};

const SECTIONS: { id: ProfileSection; label: string }[] = [
  { id: "perfil", label: "Informações do perfil" },
  { id: "enderecos", label: "Endereços" },
  { id: "compras", label: "Compras" },
];

const PROFILE_FIELDS: { field: keyof User; label: string; type: string }[] = [
  { field: "name", label: "Nome completo", type: "text" },
  { field: "email", label: "E-mail", type: "email" },
  { field: "phone", label: "Telefone", type: "tel" },
  { field: "document", label: "CPF/CNPJ", type: "text" },
];

function formatPrice(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function ProfilePage() {
  const [user, setUser] = useState<User>(MOCK_USER);
  const [activeSection, setActiveSection] = useState<ProfileSection>("perfil");
  const [draft, setDraft] = useState<User | null>(null);

  function startEdit() {
    setDraft({ ...user });
  }

  function cancelEdit() {
    setDraft(null);
  }

  function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setUser(draft);
    setDraft(null);
  }

  function updateDraftField(field: keyof User, value: string) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function changeSection(section: ProfileSection) {
    setActiveSection(section);
    setDraft(null);
  }

  return (
    <>
      <Header />

      <section className="profile-page">
        <Container>
          <nav className="profile-page__breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Minha conta</span>
          </nav>

          <h1 className="profile-page__title">Olá, {user.name.split(" ")[0]}!</h1>

          <div className="profile-page__layout">
            <aside className="profile-page__menu">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`profile-page__menu-item${
                    activeSection === section.id ? " profile-page__menu-item--active" : ""
                  }`}
                  onClick={() => changeSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
              <Link to="/entrar" className="profile-page__logout">
                Sair
              </Link>
            </aside>

            <div className="profile-page__content">
              {activeSection === "perfil" && (
                <>
                  <div className="profile-page__content-header">
                    <h2>Informações do perfil</h2>
                    {!draft && (
                      <button
                        type="button"
                        className="profile-page__edit"
                        onClick={startEdit}
                      >
                        Editar
                      </button>
                    )}
                  </div>

                  {draft ? (
                    <form className="profile-page__form" onSubmit={saveEdit}>
                      {PROFILE_FIELDS.map(({ field, label, type }) => (
                        <label key={field}>
                          {label}
                          <input
                            type={type}
                            value={draft[field]}
                            onChange={(e) => updateDraftField(field, e.target.value)}
                            required
                          />
                        </label>
                      ))}
                      <div className="profile-page__form-actions">
                        <button type="submit" className="profile-page__save">
                          Salvar
                        </button>
                        <button
                          type="button"
                          className="profile-page__cancel"
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <dl className="profile-page__info">
                      {PROFILE_FIELDS.map(({ field, label }) => (
                        <div key={field} className="profile-page__info-row">
                          <dt>{label}</dt>
                          <dd>{user[field]}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </>
              )}

              {activeSection === "enderecos" && (
                <>
                  <div className="profile-page__content-header">
                    <h2>Endereços</h2>
                  </div>
                  <div className="profile-page__card">
                    <span className="profile-page__tag">Principal</span>
                    <p>{user.address}</p>
                  </div>
                </>
              )}

              {activeSection === "compras" && (
                <>
                  <div className="profile-page__content-header">
                    <h2>Compras</h2>
                  </div>
                  {MOCK_ORDERS.length === 0 ? (
                    <p className="profile-page__empty">
                      Você ainda não fez nenhuma compra.{" "}
                      <Link to="/loja">Conheça a loja virtual.</Link>
                    </p>
                  ) : (
                    <div className="profile-page__orders">
                      {MOCK_ORDERS.map((order) => (
                        <div key={order.id} className="profile-page__card profile-page__order">
                          <div className="profile-page__order-main">
                            <strong>Pedido #{order.id}</strong>
                            <span>
                              {order.date} · {order.itemCount}{" "}
                              {order.itemCount === 1 ? "item" : "itens"}
                            </span>
                          </div>
                          <span
                            className={`profile-page__status profile-page__status--${order.status}`}
                          >
                            {STATUS_LABELS[order.status]}
                          </span>
                          <strong className="profile-page__order-total">
                            {formatPrice(order.total)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}

export default ProfilePage;
