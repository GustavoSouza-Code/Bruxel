import { useState } from "react";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { Modal } from "../../../componentes/ui/Modal/Modal";
import { FormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import type { DadosFormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import { useUsuarios } from "../../../crud/usuarios/useUsuarios";
import {
  CAMPOS_ENDERECO,
  formatarEndereco,
  paraCamposAtualizacao,
} from "../../../crud/usuarios/camposUsuario";
import type { CampoEditavelUsuario } from "../../../crud/usuarios/camposUsuario";
import { mensagemDeErro } from "../../../api/cliente";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import type { Usuario } from "../../../tipos/usuario";
import "./usuarios.css";

/**
 * Gestão de usuários do painel admin (rota "/admin/usuarios"): tabela com
 * edição inline e exclusão, e um botão que abre um modal com o mesmo
 * formulário do "/criar-conta" pra cadastrar usuários. A lista e as
 * operações de criar/editar/excluir vêm do useUsuarios (src/crud/usuarios),
 * que conversa com a API; esta página só cuida da tela.
 */
export function PaginaAdminUsuarios() {
  const { usuarios, carregando, erro, recarregar, criarUsuario, atualizarUsuario, excluirUsuario } =
    useUsuarios();
  // admin logado: a linha dele não pode ser excluída
  const { usuario: usuarioLogado } = useAutenticacao();
  // id do usuário cuja linha está em edição; null = ninguém (só uma linha por vez)
  const [editingId, setEditingId] = useState<string | null>(null);
  // cópia editável do usuário em edição; só vai pra API ao clicar em Salvar
  const [editDraft, setEditDraft] = useState<Usuario | null>(null);
  // controla se o modal de "Novo usuário" está aberto
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // erro ao salvar ou excluir, mostrado acima da lista; null = sem erro
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  // true enquanto o PUT da edição não volta (desabilita Salvar e Cancelar)
  const [salvando, setSalvando] = useState(false);

  // se a API recusar, o erro sobe pro FormularioCadastro, que mostra a mensagem e deixa o modal aberto
  async function handleCreate(data: DadosFormularioCadastro) {
    await criarUsuario(data);
    setIsCreateOpen(false);
  }

  function startEdit(user: Usuario) {
    setEditingId(user.id);
    setEditDraft({ ...user });
    setErroAcao(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
    setErroAcao(null);
  }

  async function saveEdit() {
    if (!editDraft) return;
    // o backend não valida o update: sem isso daria pra salvar um usuário sem nome
    if (!editDraft.nome.trim() || !editDraft.email.trim()) {
      setErroAcao("Nome e e-mail são obrigatórios.");
      return;
    }
    setSalvando(true);
    setErroAcao(null);
    try {
      await atualizarUsuario(editDraft.id, paraCamposAtualizacao(editDraft));
      setEditingId(null);
      setEditDraft(null);
    } catch (falha) {
      // a linha continua em edição pra pessoa corrigir (ex.: e-mail que já existe)
      setErroAcao(mensagemDeErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(user: Usuario) {
    // pede confirmação antes de excluir (a ação não tem desfazer)
    if (!window.confirm(`Excluir o usuário ${user.nome}?`)) return;
    setErroAcao(null);
    try {
      await excluirUsuario(user.id);
      // se a linha excluída estava em edição, encerra a edição
      if (editingId === user.id) {
        setEditingId(null);
        setEditDraft(null);
      }
    } catch (falha) {
      setErroAcao(mensagemDeErro(falha));
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

          {erroAcao && (
            <p className="pagina-admin-usuarios__aviso" role="alert">
              {erroAcao}
            </p>
          )}

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
            {carregando && <p className="pagina-admin-usuarios__vazio">Carregando usuários…</p>}

            {!carregando && erro && (
              <div className="pagina-admin-usuarios__aviso" role="alert">
                <span>{erro}</span>
                <button
                  type="button"
                  className="pagina-admin-usuarios__cancelar"
                  onClick={recarregar}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!carregando &&
              !erro &&
              usuarios.map((user) => {
                // só a linha do usuário em edição vira inputs; as outras continuam em modo leitura
                const isEditing = editingId === user.id;
                const draft = isEditing ? editDraft : null;
                const ehVoceMesmo = user.id === usuarioLogado?.id;

                return (
                  <div key={user.id} className="pagina-admin-usuarios__linha">
                    {isEditing && draft ? (
                      <>
                        <input
                          value={draft.nome}
                          onChange={(e) => updateDraftField("nome", e.target.value)}
                          maxLength={150}
                          aria-label="Nome"
                        />
                        <input
                          type="email"
                          value={draft.email}
                          onChange={(e) => updateDraftField("email", e.target.value)}
                          maxLength={255}
                          aria-label="E-mail"
                        />
                        {/* o endereço tem uma coluna por campo no banco, então vira um grupo de inputs */}
                        <div className="pagina-admin-usuarios__editar-endereco">
                          {CAMPOS_ENDERECO.map(({ campo, label, maxLength, normalizar }) => (
                            <input
                              key={campo}
                              value={draft[campo] ?? ""}
                              onChange={(e) =>
                                updateDraftField(
                                  campo,
                                  normalizar ? normalizar(e.target.value) : e.target.value
                                )
                              }
                              maxLength={maxLength}
                              placeholder={label}
                              aria-label={label}
                            />
                          ))}
                        </div>
                        <input
                          value={draft.telefone ?? ""}
                          onChange={(e) => updateDraftField("telefone", e.target.value)}
                          maxLength={20}
                          aria-label="Telefone"
                        />
                        {/* o backend não deixa trocar o CPF, então na edição ele só aparece */}
                        <span data-label="CPF">{draft.cpf}</span>
                        <div className="pagina-admin-usuarios__acoes">
                          <button
                            className="pagina-admin-usuarios__salvar"
                            onClick={saveEdit}
                            disabled={salvando}
                          >
                            {salvando ? "Salvando…" : "Salvar"}
                          </button>
                          <button
                            className="pagina-admin-usuarios__cancelar"
                            onClick={cancelEdit}
                            disabled={salvando}
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
                        {/* campos vazios (ex.: usuário recém-criado) mostram "—" */}
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
                            // excluir a própria conta derrubaria a sessão no meio do uso
                            disabled={ehVoceMesmo}
                            title={ehVoceMesmo ? "Você não pode excluir a própria conta" : undefined}
                          >
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

            {!carregando && !erro && usuarios.length === 0 && (
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
