import { useMemo, useState } from "react";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { Modal } from "../../../componentes/ui/Modal/Modal";
import { BarraBusca } from "../../../componentes/ui/BarraBusca/BarraBusca";
import { PainelFiltros } from "../../../componentes/ui/PainelFiltros/PainelFiltros";
import { ChipsFiltro } from "../../../componentes/ui/ChipsFiltro/ChipsFiltro";
import { AlternarVisualizacao } from "../../../componentes/ui/AlternarVisualizacao/AlternarVisualizacao";
import { IconeEditar, IconeLixeira } from "../../../componentes/ui/Icones/Icones";
import { FormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import type { DadosFormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import { FormularioEdicaoUsuario } from "../../../crud/usuarios/FormularioEdicaoUsuario/FormularioEdicaoUsuario";
import { useUsuarios } from "../../../crud/usuarios/useUsuarios";
import {
  FILTROS_USUARIO_INICIAIS,
  contarFiltrosAtivosUsuario,
  filtrarUsuarios,
  opcoesDeEstado,
} from "../../../crud/usuarios/filtrarUsuarios";
import type { FiltrosUsuario, OrdemUsuario } from "../../../crud/usuarios/filtrarUsuarios";
import type { CamposAtualizacaoUsuario } from "../../../api/usuarios";
import { mensagemDeErro } from "../../../api/cliente";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { useAvisos } from "../../../contexto/useAvisos";
import { useCarregarMais } from "../../../hooks/useCarregarMais";
import { useModoVisualizacao } from "../../../hooks/useModoVisualizacao";
import type { Usuario } from "../../../tipos/usuario";
import "../lista-admin.css";
import "./usuarios.css";

const OPCOES_PERFIL: { valor: FiltrosUsuario["perfil"]; rotulo: string }[] = [
  { valor: "", rotulo: "Todos" },
  { valor: "CLIENTE", rotulo: "Clientes" },
  { valor: "ADMINISTRADOR", rotulo: "Administradores" },
];

// quantos itens aparecem de cada vez (a lista compacta cabe mais na tela)
const POR_VEZ = { cards: 12, lista: 20 };

const ID_PAINEL = "filtros-usuarios";

/** "Ana Paula Souza" → "AS": primeira letra do primeiro e do último nome. */
function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function cidadeUf(usuario: Usuario) {
  return [usuario.cidade, usuario.estado].filter(Boolean).join(" - ");
}

/**
 * Gestão de usuários do painel admin (rota "/admin/usuarios"): busca, chips
 * de perfil, painel de filtros e a lista em cards ou em lista compacta.
 * "+ Novo usuário" abre o mesmo formulário do "/criar-conta" num modal, e
 * "Editar" abre o FormularioEdicaoUsuario. A lista e as operações vêm do
 * useUsuarios (src/crud/usuarios), que conversa com a API; esta página só
 * cuida da tela.
 */
export function PaginaAdminUsuarios() {
  const { usuarios, carregando, erro, recarregar, criarUsuario, atualizarUsuario, excluirUsuario } =
    useUsuarios();
  // admin logado: a conta dele não pode ser excluída
  const { usuario: usuarioLogado } = useAutenticacao();
  const { avisar } = useAvisos();
  const [filtros, setFiltros] = useState<FiltrosUsuario>(FILTROS_USUARIO_INICIAIS);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [modo, setModo] = useModoVisualizacao("admin-usuarios");
  // controla se o modal de "Novo usuário" está aberto
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // id do usuário no modal de edição; null = modal fechado
  const [editingId, setEditingId] = useState<string | null>(null);
  // erro ao excluir, mostrado acima da lista; null = sem erro
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  // só refiltra quando a lista ou os filtros mudam (não a cada renderização)
  const filtrados = useMemo(() => filtrarUsuarios(usuarios, filtros), [usuarios, filtros]);
  const estados = useMemo(() => opcoesDeEstado(usuarios), [usuarios]);
  // a chave muda com os filtros e o modo: aí a lista volta a mostrar só o começo
  const { visiveis, temMais, carregarMais } = useCarregarMais(
    filtrados,
    JSON.stringify(filtros) + modo,
    POR_VEZ[modo]
  );

  const editingUser = usuarios.find((u) => u.id === editingId) ?? null;

  // genérico pra o TypeScript garantir que o valor combina com o campo (ex.: "ordem" só aceita OrdemUsuario)
  function atualizarFiltro<K extends keyof FiltrosUsuario>(campo: K, valor: FiltrosUsuario[K]) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  }

  // "Limpar filtros" do painel: zera tudo menos o texto da busca, que a pessoa vê e apaga no campo
  function limparFiltros() {
    setFiltros((atuais) => ({ ...FILTROS_USUARIO_INICIAIS, busca: atuais.busca }));
  }

  // se a API recusar, o erro sobe pro FormularioCadastro, que mostra a mensagem e deixa o modal aberto
  async function handleCreate(data: DadosFormularioCadastro) {
    await criarUsuario(data);
    setIsCreateOpen(false);
    avisar({ tipo: "sucesso", mensagem: "Usuário cadastrado." });
  }

  function startEdit(user: Usuario) {
    setEditingId(user.id);
    setErroAcao(null);
  }

  // se a API recusar, o erro sobe pro FormularioEdicaoUsuario, que mostra a mensagem e deixa o modal aberto
  async function saveEdit(campos: CamposAtualizacaoUsuario) {
    if (!editingId) return;
    await atualizarUsuario(editingId, campos);
    setEditingId(null);
    avisar({ tipo: "sucesso", mensagem: "Usuário salvo." });
  }

  async function handleDelete(user: Usuario) {
    // pede confirmação antes de excluir (a ação não tem desfazer)
    if (!window.confirm(`Excluir o usuário ${user.nome}?`)) return;
    setErroAcao(null);
    try {
      await excluirUsuario(user.id);
      avisar({ tipo: "sucesso", mensagem: "Usuário excluído." });
    } catch (falha) {
      setErroAcao(mensagemDeErro(falha));
    }
  }

  const contador =
    filtrados.length === usuarios.length
      ? `${usuarios.length} ${usuarios.length === 1 ? "usuário" : "usuários"}`
      : `${filtrados.length} de ${usuarios.length} usuários`;

  // botão Excluir com o mesmo jeito nos dois modos; travado na conta do próprio admin
  function botaoExcluir(user: Usuario) {
    const ehVoceMesmo = user.id === usuarioLogado?.id;
    return (
      <button
        className="lista-admin__icone-botao lista-admin__icone-botao--perigo"
        onClick={() => handleDelete(user)}
        // excluir a própria conta derrubaria a sessão no meio do uso
        disabled={ehVoceMesmo}
        aria-label={`Excluir ${user.nome}`}
        title={ehVoceMesmo ? "Você não pode excluir a própria conta" : "Excluir"}
      >
        <IconeLixeira />
      </button>
    );
  }

  const prontos = !carregando && !erro;

  return (
    <>
      <NavAdmin />

      <section className="pagina-admin-usuarios">
        <Container>
          <div className="lista-admin__topo">
            <h1 className="lista-admin__titulo">Gestão de Usuários</h1>
            <button className="lista-admin__botao" onClick={() => setIsCreateOpen(true)}>
              + Novo usuário
            </button>
          </div>

          <BarraBusca
            valor={filtros.busca}
            onMudar={(valor) => atualizarFiltro("busca", valor)}
            placeholder="Buscar por nome, e-mail ou CPF"
            rotulo="Buscar usuários"
            filtrosAbertos={filtrosAbertos}
            onAlternarFiltros={() => setFiltrosAbertos((aberto) => !aberto)}
            qtdFiltrosAtivos={contarFiltrosAtivosUsuario(filtros)}
            idPainel={ID_PAINEL}
          />

          <PainelFiltros id={ID_PAINEL} aberto={filtrosAbertos} onLimpar={limparFiltros}>
            <label>
              Cidade
              <input
                placeholder="Ex.: Lajeado"
                value={filtros.cidade}
                onChange={(e) => atualizarFiltro("cidade", e.target.value)}
              />
            </label>
            <label>
              UF
              <select
                value={filtros.estado}
                onChange={(e) => atualizarFiltro("estado", e.target.value)}
              >
                <option value="">Qualquer</option>
                {estados.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ordenar por
              <select
                value={filtros.ordem}
                onChange={(e) => atualizarFiltro("ordem", e.target.value as OrdemUsuario)}
              >
                <option value="nome">Nome (A–Z)</option>
                <option value="nome-desc">Nome (Z–A)</option>
              </select>
            </label>
          </PainelFiltros>

          <div className="lista-admin__linha-chips">
            <ChipsFiltro
              opcoes={OPCOES_PERFIL}
              selecionado={filtros.perfil}
              onSelecionar={(valor) => atualizarFiltro("perfil", valor)}
              rotulo="Perfil"
            />
            <AlternarVisualizacao modo={modo} onMudar={setModo} />
          </div>

          {prontos && (
            // aria-live: leitores de tela anunciam o novo total quando um filtro muda
            <p className="lista-admin__contador" aria-live="polite">
              {contador}
            </p>
          )}

          {erroAcao && (
            <p className="lista-admin__aviso" role="alert">
              {erroAcao}
            </p>
          )}

          {carregando && <p className="lista-admin__vazio">Carregando usuários…</p>}

          {!carregando && erro && (
            <div className="lista-admin__aviso" role="alert">
              <span>{erro}</span>
              <button
                type="button"
                className="lista-admin__botao lista-admin__botao--contorno"
                onClick={recarregar}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {prontos && usuarios.length === 0 && (
            <p className="lista-admin__vazio">Nenhum usuário cadastrado.</p>
          )}

          {prontos && usuarios.length > 0 && filtrados.length === 0 && (
            <div className="lista-admin__vazio">
              <p>Nenhum usuário encontrado. Tente outro termo ou limpe os filtros.</p>
              <button
                className="lista-admin__botao lista-admin__botao--contorno"
                onClick={() => setFiltros(FILTROS_USUARIO_INICIAIS)}
              >
                Limpar busca e filtros
              </button>
            </div>
          )}

          {prontos && filtrados.length > 0 && modo === "cards" && (
            <ul className="lista-admin__grade">
              {visiveis.map((user) => (
                <li key={user.id} className="lista-admin__card">
                  <div className="pagina-admin-usuarios__cabecalho-card">
                    <span className="pagina-admin-usuarios__avatar" aria-hidden="true">
                      {iniciais(user.nome)}
                    </span>
                    <span className="lista-admin__card-titulo">
                      {user.nome}
                      {user.perfil === "ADMINISTRADOR" && <SeloAdmin />}
                    </span>
                  </div>
                  {/* o e-mail fica fora do cabeçalho pra ter a largura toda do card e não quebrar no meio */}
                  <div className="lista-admin__card-corpo">
                    <span className="lista-admin__card-detalhe" title={user.email}>
                      {user.email}
                    </span>
                    {/* campos vazios (ex.: usuário recém-criado) mostram "—" */}
                    <span className="lista-admin__card-detalhe">
                      Telefone: {user.telefone || "—"}
                    </span>
                    <span className="lista-admin__card-detalhe">Cidade: {cidadeUf(user) || "—"}</span>
                  </div>
                  <div className="lista-admin__card-acoes">
                    <button className="lista-admin__botao" onClick={() => startEdit(user)}>
                      Editar
                    </button>
                    {botaoExcluir(user)}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {prontos && filtrados.length > 0 && modo === "lista" && (
            <ul className="lista-admin__compacta pagina-admin-usuarios__compacta">
              {/* títulos das colunas; aria-hidden porque cada linha já é lida inteira */}
              <li className="lista-admin__linha lista-admin__linha--titulos" aria-hidden="true">
                <span>Nome</span>
                <span className="lista-admin__so-largo">E-mail</span>
                <span className="lista-admin__so-largo">Telefone</span>
                <span className="lista-admin__so-largo">Cidade</span>
                <span />
              </li>
              {visiveis.map((user) => (
                <li key={user.id} className="lista-admin__linha">
                  <span title={user.nome}>
                    {user.nome}
                    {user.perfil === "ADMINISTRADOR" && <SeloAdmin />}
                  </span>
                  <span className="lista-admin__so-largo" title={user.email}>
                    {user.email}
                  </span>
                  <span className="lista-admin__so-largo">{user.telefone || "—"}</span>
                  <span className="lista-admin__so-largo">{cidadeUf(user) || "—"}</span>
                  <span className="lista-admin__linha-acoes">
                    <button
                      className="lista-admin__icone-botao"
                      onClick={() => startEdit(user)}
                      aria-label={`Editar ${user.nome}`}
                      title="Editar"
                    >
                      <IconeEditar />
                    </button>
                    {botaoExcluir(user)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {prontos && temMais && (
            <div className="lista-admin__carregar-mais">
              <button
                className="lista-admin__botao lista-admin__botao--contorno"
                onClick={carregarMais}
              >
                Carregar mais ({filtrados.length - visiveis.length} restantes)
              </button>
            </div>
          )}
        </Container>
      </section>

      {isCreateOpen && (
        <Modal titulo="Novo usuário" onFechar={() => setIsCreateOpen(false)}>
          <FormularioCadastro textoBotao="Criar usuário" onEnviar={handleCreate} />
        </Modal>
      )}

      {editingUser && (
        <Modal titulo="Editar usuário" onFechar={() => setEditingId(null)} largo>
          <FormularioEdicaoUsuario
            key={editingUser.id}
            usuario={editingUser}
            onSalvar={saveEdit}
            onCancelar={() => setEditingId(null)}
          />
        </Modal>
      )}
    </>
  );
}

function SeloAdmin() {
  return <span className="lista-admin__selo lista-admin__selo--destaque">admin</span>;
}

export default PaginaAdminUsuarios;
