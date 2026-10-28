import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import type { Usuario } from "../../../tipos/usuario";
import { mensagemDeErro } from "../../../api/cliente";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { useAvisos } from "../../../contexto/useAvisos";
import { CAMPOS_ENDERECO, formatarEndereco, validarEndereco } from "../../../crud/usuarios/camposUsuario";
import type { CampoEditavelUsuario } from "../../../crud/usuarios/camposUsuario";
import { usePerfil } from "./usePerfil";
import { AbaAtendimentos } from "./componentes/AbaAtendimentos/AbaAtendimentos";
import { AbaCompras } from "./componentes/AbaCompras/AbaCompras";
import { AbaSenha } from "./componentes/AbaSenha/AbaSenha";
import "./perfil.css";

/** Abas do menu lateral da conta. */
type ProfileSection = "perfil" | "enderecos" | "senha" | "compras" | "atendimentos";

// itens do menu lateral, na ordem em que aparecem
const SECTIONS: { id: ProfileSection; label: string }[] = [
  { id: "perfil", label: "Informações do perfil" },
  { id: "enderecos", label: "Endereços" },
  { id: "senha", label: "Senha" },
  { id: "compras", label: "Compras" },
  { id: "atendimentos", label: "Atendimentos" },
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

/**
 * Área "Minha conta" (rota "/perfil", só pra quem está logado): menu lateral
 * com cinco abas — dados do perfil e endereços (os dois vindos do banco e
 * editáveis), troca de senha, histórico de compras e os atendimentos pedidos.
 */
export function PaginaPerfil() {
  const { usuario: usuarioSessao, sair } = useAutenticacao();
  const { avisar } = useAvisos();
  const navigate = useNavigate();
  // dados do banco (null enquanto carrega ou se a busca falhou)
  const { dados, carregando, erro, recarregar, salvar } = usePerfil();
  const location = useLocation();
  // recado do /solicitar-atendimento ou do /carrinho (state do navigate): aba pra abrir e aviso de sucesso
  const recado = location.state as { aba?: string; mensagem?: string } | null;
  // só aceita uma aba que existe; qualquer outra coisa abre "Informações do perfil"
  const abaDoRecado = SECTIONS.find((section) => section.id === recado?.aba)?.id;
  // aba selecionada no menu lateral
  const [activeSection, setActiveSection] = useState<ProfileSection>(abaDoRecado ?? "perfil");
  // o aviso é guardado uma vez só, na primeira renderização; o recado do histórico é apagado logo abaixo
  const [mensagemRecado, setMensagemRecado] = useState<string | null>(() => recado?.mensagem ?? null);

  // apaga o recado do histórico: recarregar a página ou voltar pra ela não mostra o aviso de novo
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);
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
    // o backend responde 500 pra CEP/UF fora do formato; melhor avisar antes de enviar
    const erroEndereco = validarEndereco(draft);
    if (erroEndereco) {
      setErroSalvar(erroEndereco);
      return;
    }
    setSalvando(true);
    setErroSalvar(null);
    try {
      await salvar(draft);
      setDraft(null);
      avisar({
        tipo: "sucesso",
        mensagem: activeSection === "enderecos" ? "Endereço salvo." : "Perfil salvo.",
      });
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
    // trocar de aba descarta uma edição em andamento e esconde o aviso de sucesso
    setActiveSection(section);
    setMensagemRecado(null);
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

              {activeSection === "senha" && <AbaSenha />}

              {activeSection === "compras" && <AbaCompras mensagem={mensagemRecado} />}

              {activeSection === "atendimentos" && (
                <AbaAtendimentos mensagem={mensagemRecado} />
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
