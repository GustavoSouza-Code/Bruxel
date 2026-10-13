import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import type { Usuario } from "../../../tipos/usuario";
import { mensagemDeErro } from "../../../api/cliente";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { CAMPOS_ENDERECO, formatarEndereco } from "../../../crud/usuarios/camposUsuario";
import type { CampoEditavelUsuario } from "../../../crud/usuarios/camposUsuario";
import { usePerfil } from "./usePerfil";
import "./perfil.css";

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
// de edição; `type` é o type do <input>, pra o teclado/validação certos (e-mail, telefone).
// `maxLength` é o tamanho da coluna no banco; `travado` = só aparece, o backend não deixa trocar
const PROFILE_FIELDS: {
  field: CampoEditavelUsuario;
  label: string;
  type: string;
  maxLength: number;
  required?: boolean;
  travado?: boolean;
}[] = [
  { field: "nome", label: "Nome completo", type: "text", maxLength: 150, required: true },
  { field: "email", label: "E-mail", type: "email", maxLength: 255, required: true },
  { field: "telefone", label: "Telefone", type: "tel", maxLength: 20 },
  { field: "cpf", label: "CPF", type: "text", maxLength: 11, travado: true },
];

/** Formata um valor em reais no padrão brasileiro: 289.7 → "R$ 289,70". */
function formatPrice(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/**
 * Área "Minha conta" (rota "/perfil", só pra quem está logado): menu lateral
 * com três abas — dados do perfil e endereços (os dois vindos do banco e
 * editáveis) e histórico de compras.
 *
 * As compras ainda são dados de exemplo (MOCK_ORDERS): o backend não tem rota de pedidos.
 */
export function PaginaPerfil() {
  const { usuario: usuarioSessao, sair } = useAutenticacao();
  const navigate = useNavigate();
  // dados do banco (null enquanto carrega ou se a busca falhou)
  const { dados, carregando, erro, recarregar, salvar } = usePerfil();
  // aba selecionada no menu lateral
  const [activeSection, setActiveSection] = useState<ProfileSection>("perfil");
  // rascunho da edição: cópia de `dados` que o formulário altera; null = fora do modo de
  // edição. Só vai pro banco ao salvar; cancelar apenas descarta o rascunho
  const [draft, setDraft] = useState<Usuario | null>(null);
  // true enquanto o PUT está em andamento (trava o botão Salvar)
  const [salvando, setSalvando] = useState(false);
  // erro ao salvar, mostrado acima dos botões; null = sem erro
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  function startEdit() {
    if (!dados) return;
    // copia pra o formulário editar sem mexer nos dados salvos até clicar em Salvar
    setDraft({ ...dados });
    setErroSalvar(null);
  }

  function cancelEdit() {
    setDraft(null);
    setErroSalvar(null);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
      await salvar(draft);
      setDraft(null);
    } catch (falha) {
      // o formulário continua aberto, com o que a pessoa digitou, pra ela corrigir
      setErroSalvar(mensagemDeErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  function updateDraftField(field: CampoEditavelUsuario, value: string) {
    // troca só o campo alterado; sem rascunho (fora da edição), não faz nada
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function changeSection(section: ProfileSection) {
    // trocar de aba descarta uma edição em andamento
    setActiveSection(section);
    cancelEdit();
  }

  function handleSair() {
    sair();
    navigate("/");
  }

  // título da aba + botão Editar (só fora do modo de edição e com os dados já carregados)
  function cabecalhoEditavel(titulo: string) {
    return (
      <div className="pagina-perfil__cabecalho-conteudo">
        <h2>{titulo}</h2>
        {!draft && dados && (
          <button type="button" className="pagina-perfil__editar" onClick={startEdit}>
            Editar
          </button>
        )}
      </div>
    );
  }

  // mensagem de erro do salvar + botões Salvar/Cancelar, iguais nas duas abas editáveis
  const acoesFormulario = (
    <>
      {erroSalvar && (
        <p className="pagina-perfil__erro" role="alert">
          {erroSalvar}
        </p>
      )}
      <div className="pagina-perfil__acoes-formulario">
        <button type="submit" className="pagina-perfil__salvar" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          className="pagina-perfil__cancelar"
          onClick={cancelEdit}
          disabled={salvando}
        >
          Cancelar
        </button>
      </div>
    </>
  );

  // enquanto carrega ou se a busca falhou, as abas de dados mostram isso no lugar do conteúdo
  const estadoCarregamento = carregando ? (
    <p className="pagina-perfil__vazio">Carregando seus dados…</p>
  ) : erro || !dados ? (
    <div className="pagina-perfil__falha">
      <p className="pagina-perfil__erro" role="alert">
        {erro ?? "Não foi possível carregar seus dados."}
      </p>
      <button type="button" className="pagina-perfil__cancelar" onClick={recarregar}>
        Tentar novamente
      </button>
    </div>
  ) : null;

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

          {/* saudação só com o primeiro nome; vem da sessão, então aparece mesmo carregando */}
          <h1 className="pagina-perfil__titulo">
            Olá, {(dados?.nome ?? usuarioSessao?.nome ?? "").split(" ")[0]}!
          </h1>

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
              <button type="button" className="pagina-perfil__sair" onClick={handleSair}>
                Sair
              </button>
            </aside>

            <div className="pagina-perfil__conteudo">
              {/* só a aba selecionada é renderizada */}
              {activeSection === "perfil" && (
                <>
                  {cabecalhoEditavel("Informações do perfil")}

                  {/* com rascunho: formulário de edição; sem rascunho: só leitura */}
                  {estadoCarregamento ??
                    (draft ? (
                      <form className="pagina-perfil__formulario" onSubmit={saveEdit}>
                        {PROFILE_FIELDS.map(({ field, label, type, maxLength, required, travado }) => (
                          <label key={field}>
                            {label}
                            <input
                              type={type}
                              value={draft[field] ?? ""}
                              onChange={(e) => updateDraftField(field, e.target.value)}
                              maxLength={maxLength}
                              required={required}
                              disabled={travado}
                              title={travado ? "O CPF não pode ser alterado." : undefined}
                            />
                          </label>
                        ))}
                        {acoesFormulario}
                      </form>
                    ) : (
                      dados && (
                        <dl className="pagina-perfil__info">
                          {PROFILE_FIELDS.map(({ field, label }) => (
                            <div key={field} className="pagina-perfil__linha-info">
                              <dt>{label}</dt>
                              <dd>{dados[field] || "—"}</dd>
                            </div>
                          ))}
                        </dl>
                      )
                    ))}
                </>
              )}

              {activeSection === "enderecos" && (
                <>
                  {cabecalhoEditavel("Endereços")}

                  {estadoCarregamento ??
                    (draft ? (
                      <form className="pagina-perfil__formulario" onSubmit={saveEdit}>
                        {/* o banco guarda cada parte do endereço numa coluna */}
                        {CAMPOS_ENDERECO.map(({ campo, label, maxLength, normalizar }) => (
                          <label key={campo}>
                            {label}
                            <input
                              type="text"
                              value={draft[campo] ?? ""}
                              onChange={(e) =>
                                updateDraftField(
                                  campo,
                                  normalizar ? normalizar(e.target.value) : e.target.value
                                )
                              }
                              maxLength={maxLength}
                            />
                          </label>
                        ))}
                        {acoesFormulario}
                      </form>
                    ) : (
                      dados && (
                        <div className="pagina-perfil__card">
                          <span className="pagina-perfil__etiqueta">Principal</span>
                          <p>{formatarEndereco(dados) || "Nenhum endereço cadastrado."}</p>
                          {/* o banco guarda só os 8 dígitos; na tela vai com hífen (95900-000) */}
                          {dados.cep && <p>CEP {dados.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</p>}
                        </div>
                      )
                    ))}
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
