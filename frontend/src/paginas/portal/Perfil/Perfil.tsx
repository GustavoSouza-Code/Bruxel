import { useState } from "react";
import { Link } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import type { Usuario } from "../../../tipos/usuario";
import { formatarEndereco } from "../../../crud/usuarios/camposUsuario";
import type { CampoEditavelUsuario } from "../../../crud/usuarios/camposUsuario";
import "./Perfil.css";

/** Abas do menu lateral da conta. */
type ProfileSection = "perfil" | "enderecos" | "compras";

/** Situação de um pedido; também vira o sufixo da classe CSS profile-page__status--… */
type OrderStatus = "entregue" | "a-caminho" | "cancelado";

/** Pedido do histórico de compras. */
interface Order {
  id: string;
  /** data já formatada (dd/mm/aaaa) */
  date: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
}

// Mock até o login estar integrado com o backend
const MOCK_USER: Usuario = {
  id: "usuario-3",
  nome: "Eduardo Oliveira",
  email: "eduardo.oliveira@email.com",
  cpf: "45678912300",
  telefone: "(51) 99876-5432",
  rua: "Rua Sete de Setembro",
  numero: "850",
  cidade: "Lajeado",
  estado: "RS",
  perfil: "CLIENTE",
};

// Mock até o backend ter a rota de pedidos
const MOCK_ORDERS: Order[] = [
  { id: "10482", date: "12/09/2026", itemCount: 3, total: 289.7, status: "a-caminho" },
  { id: "10231", date: "28/07/2026", itemCount: 1, total: 159.9, status: "entregue" },
  { id: "09877", date: "03/05/2026", itemCount: 2, total: 74.8, status: "cancelado" },
];

// texto amigável de cada status, mostrado na etiqueta do pedido
const STATUS_LABELS: Record<OrderStatus, string> = {
  entregue: "Entregue",
  "a-caminho": "A caminho",
  cancelado: "Cancelado",
};

// itens do menu lateral, na ordem em que aparecem
const SECTIONS: { id: ProfileSection; label: string }[] = [
  { id: "perfil", label: "Informações do perfil" },
  { id: "enderecos", label: "Endereços" },
  { id: "compras", label: "Compras" },
];

// campos do perfil: alimentam tanto a visualização (lista dt/dd) quanto o formulário
// de edição; `type` é o type do <input>, pra o teclado/validação certos (e-mail, telefone)
const PROFILE_FIELDS: { field: CampoEditavelUsuario; label: string; type: string }[] = [
  { field: "nome", label: "Nome completo", type: "text" },
  { field: "email", label: "E-mail", type: "email" },
  { field: "telefone", label: "Telefone", type: "tel" },
  { field: "cpf", label: "CPF", type: "text" },
];

/** Formata um valor em reais no padrão brasileiro: 289.7 → "R$ 289,70". */
function formatPrice(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/**
 * Área "Minha conta" (rota "/perfil"): menu lateral com três abas — dados do
 * perfil (com edição), endereços e histórico de compras.
 *
 * Por enquanto usa dados de exemplo (MOCK_USER e MOCK_ORDERS); as alterações
 * feitas na edição valem só até recarregar a página.
 */
export function PaginaPerfil() {
  // dados salvos do usuário (o que aparece na tela)
  const [user, setUser] = useState<Usuario>(MOCK_USER);
  // aba selecionada no menu lateral
  const [activeSection, setActiveSection] = useState<ProfileSection>("perfil");
  // rascunho da edição: cópia de `user` que o formulário altera; null = fora do modo de
  // edição. Só vira `user` ao salvar; cancelar apenas descarta o rascunho
  const [draft, setDraft] = useState<Usuario | null>(null);

  function startEdit() {
    // copia pra o formulário editar sem mexer nos dados salvos até clicar em Salvar
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

  function updateDraftField(field: CampoEditavelUsuario, value: string) {
    // troca só o campo alterado; sem rascunho (fora da edição), não faz nada
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function changeSection(section: ProfileSection) {
    // trocar de aba descarta uma edição em andamento
    setActiveSection(section);
    setDraft(null);
  }

  return (
    <>
      <Cabecalho />

      <section className="pagina-perfil">
        <Container>
          <nav className="pagina-perfil__trilha" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Minha conta</span>
          </nav>

          {/* saudação só com o primeiro nome */}
          <h1 className="pagina-perfil__titulo">Olá, {user.nome.split(" ")[0]}!</h1>

          <div className="pagina-perfil__layout">
            <aside className="pagina-perfil__menu">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`pagina-perfil__item-menu${
                    activeSection === section.id ? " pagina-perfil__item-menu--ativo" : ""
                  }`}
                  onClick={() => changeSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
              {/* TODO: "Sair" só leva pra tela de login; ainda não existe sessão pra encerrar */}
              <Link to="/entrar" className="pagina-perfil__sair">
                Sair
              </Link>
            </aside>

            <div className="pagina-perfil__conteudo">
              {/* só a aba selecionada é renderizada */}
              {activeSection === "perfil" && (
                <>
                  <div className="pagina-perfil__cabecalho-conteudo">
                    <h2>Informações do perfil</h2>
                    {/* o botão Editar só aparece fora do modo de edição */}
                    {!draft && (
                      <button
                        type="button"
                        className="pagina-perfil__editar"
                        onClick={startEdit}
                      >
                        Editar
                      </button>
                    )}
                  </div>

                  {/* com rascunho: formulário de edição; sem rascunho: só leitura */}
                  {draft ? (
                    <form className="pagina-perfil__formulario" onSubmit={saveEdit}>
                      {PROFILE_FIELDS.map(({ field, label, type }) => (
                        <label key={field}>
                          {label}
                          <input
                            type={type}
                            value={draft[field] ?? ""}
                            onChange={(e) => updateDraftField(field, e.target.value)}
                            required
                          />
                        </label>
                      ))}
                      <div className="pagina-perfil__acoes-formulario">
                        <button type="submit" className="pagina-perfil__salvar">
                          Salvar
                        </button>
                        <button
                          type="button"
                          className="pagina-perfil__cancelar"
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <dl className="pagina-perfil__info">
                      {PROFILE_FIELDS.map(({ field, label }) => (
                        <div key={field} className="pagina-perfil__linha-info">
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
                  <div className="pagina-perfil__cabecalho-conteudo">
                    <h2>Endereços</h2>
                  </div>
                  <div className="pagina-perfil__card">
                    <span className="pagina-perfil__etiqueta">Principal</span>
                    <p>{formatarEndereco(user) || "Nenhum endereço cadastrado."}</p>
                  </div>
                </>
              )}

              {activeSection === "compras" && (
                <>
                  <div className="pagina-perfil__cabecalho-conteudo">
                    <h2>Compras</h2>
                  </div>
                  {MOCK_ORDERS.length === 0 ? (
                    <p className="pagina-perfil__vazio">
                      Você ainda não fez nenhuma compra.{" "}
                      <Link to="/loja">Conheça a loja virtual.</Link>
                    </p>
                  ) : (
                    <div className="pagina-perfil__pedidos">
                      {MOCK_ORDERS.map((order) => (
                        <div key={order.id} className="pagina-perfil__card pagina-perfil__pedido">
                          <div className="pagina-perfil__pedido-principal">
                            <strong>Pedido #{order.id}</strong>
                            <span>
                              {order.date} · {order.itemCount}{" "}
                              {order.itemCount === 1 ? "item" : "itens"}
                            </span>
                          </div>
                          <span
                            className={`pagina-perfil__status pagina-perfil__status--${order.status}`}
                          >
                            {STATUS_LABELS[order.status]}
                          </span>
                          <strong className="pagina-perfil__pedido-total">
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

      <Rodape />
    </>
  );
}

export default PaginaPerfil;
