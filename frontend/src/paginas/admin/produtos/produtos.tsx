import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { Modal } from "../../../componentes/ui/Modal/Modal";
import { BarraBusca } from "../../../componentes/ui/BarraBusca/BarraBusca";
import { PainelFiltros } from "../../../componentes/ui/PainelFiltros/PainelFiltros";
import { ChipsFiltro } from "../../../componentes/ui/ChipsFiltro/ChipsFiltro";
import { AlternarVisualizacao } from "../../../componentes/ui/AlternarVisualizacao/AlternarVisualizacao";
import { IconeEditar, IconeLixeira } from "../../../componentes/ui/Icones/Icones";
import type { Produto } from "../../../tipos/produto";
import { useProdutos } from "../../../crud/produtos/useProdutos";
import { useCategorias } from "../../../crud/produtos/useCategorias";
import { nomeDaCategoria } from "../../../crud/produtos/categorias";
import {
  FILTROS_PRODUTO_INICIAIS,
  contarFiltrosAtivosProduto,
  filtrarProdutos,
  filtrosProdutoDaUrl,
} from "../../../crud/produtos/filtrarProdutos";
import type { FiltroEstoque, FiltrosProduto, OrdemProduto } from "../../../crud/produtos/filtrarProdutos";
import { situacaoEstoque } from "../../../crud/produtos/estoque";
import { GerenciarCategorias } from "../../../crud/produtos/GerenciarCategorias/GerenciarCategorias";
import { FormularioProduto } from "../../../crud/produtos/FormularioProduto/FormularioProduto";
import { ErroApi, mensagemDeErro } from "../../../api/cliente";
import { useAvisos } from "../../../contexto/useAvisos";
import type { DadosFormularioProduto } from "../../../crud/produtos/FormularioProduto/FormularioProduto";
import { useCarregarMais } from "../../../hooks/useCarregarMais";
import { useModoVisualizacao } from "../../../hooks/useModoVisualizacao";
import "../lista-admin.css";
import "./produtos.css";

const ORDENS: { valor: OrdemProduto; rotulo: string }[] = [
  { valor: "nome", rotulo: "Nome (A–Z)" },
  { valor: "preco-asc", rotulo: "Menor preço" },
  { valor: "preco-desc", rotulo: "Maior preço" },
  { valor: "estoque-asc", rotulo: "Menor estoque" },
];

// quantos itens aparecem de cada vez (a lista compacta cabe mais na tela)
const POR_VEZ = { cards: 12, lista: 20 };

const ID_PAINEL = "filtros-produtos";

function formatarPreco(preco: number) {
  return `R$ ${preco.toFixed(2).replace(".", ",")}`;
}

/**
 * Gestão de produtos do painel admin (rota "/admin/produtos"): busca, chips
 * de categoria, painel de filtros e a lista em cards ou em lista compacta.
 * Cadastrar e editar abrem o FormularioProduto num modal. A lista e as
 * operações vêm do useProdutos (src/crud/produtos) e a filtragem do
 * filtrarProdutos; esta página só cuida da tela.
 */
export function PaginaAdminProdutos() {
  const { produtos, carregando, erro, recarregar, criarProduto, atualizarProduto, excluirProduto } =
    useProdutos();
  const {
    categorias,
    carregando: carregandoCategorias,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria,
  } = useCategorias();
  // "/admin/produtos?estoque=baixo&status=ativo" (link da home do painel) já abre filtrado
  const [parametros] = useSearchParams();
  const [filtros, setFiltros] = useState<FiltrosProduto>(() => filtrosProdutoDaUrl(parametros));
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [modo, setModo] = useModoVisualizacao("admin-produtos");
  // modal do formulário: null = fechado; "novo" = cadastro; senão, o id do produto em edição
  const [formularioAberto, setFormularioAberto] = useState<string | null>(null);
  // modal de gerenciar categorias
  const [categoriasAbertas, setCategoriasAbertas] = useState(false);
  // erro ao excluir, mostrado acima da lista; null = sem erro
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const { avisar } = useAvisos();

  // só refiltra quando a lista ou os filtros mudam (não a cada renderização)
  const filtrados = useMemo(() => filtrarProdutos(produtos, filtros), [produtos, filtros]);
  // a chave muda com os filtros e o modo: aí a lista volta a mostrar só o começo
  const { visiveis, temMais, carregarMais } = useCarregarMais(
    filtrados,
    JSON.stringify(filtros) + modo,
    POR_VEZ[modo]
  );

  // chips de categoria: "Todos" (valor "") e uma por categoria vinda da API
  const opcoesCategoria = useMemo(
    () => [
      { valor: "", rotulo: "Todos" },
      ...categorias.map((categoria) => ({ valor: categoria.id, rotulo: categoria.nome })),
    ],
    [categorias]
  );

  const editingProduct =
    formularioAberto && formularioAberto !== "novo"
      ? (produtos.find((p) => p.id === formularioAberto) ?? null)
      : null;

  // genérico pra o TypeScript garantir que o valor combina com o campo (ex.: "ordem" só aceita OrdemProduto)
  function atualizarFiltro<K extends keyof FiltrosProduto>(campo: K, valor: FiltrosProduto[K]) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  }

  // "Limpar filtros" do painel: zera tudo menos o texto da busca, que a pessoa vê e apaga no campo
  function limparFiltros() {
    setFiltros((atuais) => ({ ...FILTROS_PRODUTO_INICIAIS, busca: atuais.busca }));
  }

  // se a API recusar, o erro sobe pro FormularioProduto, que mostra a mensagem e deixa o modal aberto
  async function handleSubmit(data: DadosFormularioProduto) {
    // mesmo formulário pros dois casos: editando, atualiza o produto; senão, cria um novo
    if (editingProduct) {
      await atualizarProduto(editingProduct.id, data);
    } else {
      await criarProduto(data);
    }
    setFormularioAberto(null);
    avisar({ tipo: "sucesso", mensagem: editingProduct ? "Produto salvo." : "Produto cadastrado." });
  }

  function abrirFormulario(id: string) {
    setFormularioAberto(id);
    setErroAcao(null);
  }

  async function handleDelete(product: Produto) {
    // pede confirmação antes de excluir (a ação não tem desfazer)
    if (!window.confirm(`Excluir o produto "${product.nome}"?`)) return;
    setErroAcao(null);
    try {
      await excluirProduto(product.id);
      avisar({ tipo: "sucesso", mensagem: "Produto excluído." });
    } catch (falha) {
      // 409 = o produto já está em pedidos ou OS: não dá pra excluir, mas dá pra tirar da loja
      const ligadoAOutrosDados = falha instanceof ErroApi && falha.status === 409 && product.ativo;
      if (
        ligadoAOutrosDados &&
        window.confirm(
          `"${product.nome}" já aparece em pedidos ou ordens de serviço e não pode ser excluído. Desativar o produto? Ele sai da loja, mas continua no histórico.`
        )
      ) {
        await desativar(product);
        return;
      }
      setErroAcao(mensagemDeErro(falha));
    }
  }

  async function desativar(product: Produto) {
    // DadosProduto é o produto sem o id
    const { id, ...dados } = product;
    try {
      await atualizarProduto(id, { ...dados, ativo: false });
      avisar({ tipo: "sucesso", mensagem: "Produto desativado. Ele não aparece mais na loja." });
    } catch (falha) {
      setErroAcao(mensagemDeErro(falha));
    }
  }

  const contador =
    filtrados.length === produtos.length
      ? `${produtos.length} ${produtos.length === 1 ? "produto" : "produtos"}`
      : `${filtrados.length} de ${produtos.length} produtos`;

  const prontos = !carregando && !erro;
  // sem categorias não dá pra cadastrar: o select do formulário ficaria vazio
  const semCategorias = !carregandoCategorias && categorias.length === 0;

  return (
    <>
      <NavAdmin />

      <section className="pagina-admin-produtos">
        <Container>
          <div className="lista-admin__topo">
            <h1 className="lista-admin__titulo">Gestão de Produtos</h1>
            <div className="pagina-admin-produtos__acoes-topo">
              <button
                className="lista-admin__botao lista-admin__botao--contorno"
                onClick={() => setCategoriasAbertas(true)}
              >
                Gerenciar categorias
              </button>
              <button
                className="lista-admin__botao"
                onClick={() => abrirFormulario("novo")}
                // enquanto as categorias carregam, o formulário abriria com o select vazio
                disabled={carregandoCategorias || semCategorias}
              >
                + Novo produto
              </button>
            </div>
          </div>

          {semCategorias && (
            <p className="lista-admin__aviso" role="status">
              Sem categorias: crie uma em "Gerenciar categorias" pra cadastrar produtos.
            </p>
          )}

          <BarraBusca
            valor={filtros.busca}
            onMudar={(valor) => atualizarFiltro("busca", valor)}
            placeholder="Buscar por nome ou código"
            rotulo="Buscar produtos"
            filtrosAbertos={filtrosAbertos}
            onAlternarFiltros={() => setFiltrosAbertos((aberto) => !aberto)}
            qtdFiltrosAtivos={contarFiltrosAtivosProduto(filtros)}
            idPainel={ID_PAINEL}
          />

          <PainelFiltros id={ID_PAINEL} aberto={filtrosAbertos} onLimpar={limparFiltros}>
            <label>
              Status
              <select
                value={filtros.status}
                onChange={(e) =>
                  atualizarFiltro("status", e.target.value as FiltrosProduto["status"])
                }
              >
                <option value="">Qualquer</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </label>
            <label>
              Estoque
              <select
                value={filtros.estoque}
                onChange={(e) => atualizarFiltro("estoque", e.target.value as FiltroEstoque)}
              >
                <option value="">Todos</option>
                <option value="baixo">Estoque baixo</option>
                <option value="esgotado">Esgotado</option>
              </select>
            </label>
            <label>
              Preço mínimo
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="R$ 0,00"
                value={filtros.precoMin}
                onChange={(e) => atualizarFiltro("precoMin", e.target.value)}
              />
            </label>
            <label>
              Preço máximo
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Sem limite"
                value={filtros.precoMax}
                onChange={(e) => atualizarFiltro("precoMax", e.target.value)}
              />
            </label>
            <label>
              Ordenar por
              <select
                value={filtros.ordem}
                onChange={(e) => atualizarFiltro("ordem", e.target.value as OrdemProduto)}
              >
                {ORDENS.map((ordem) => (
                  <option key={ordem.valor} value={ordem.valor}>
                    {ordem.rotulo}
                  </option>
                ))}
              </select>
            </label>
          </PainelFiltros>

          <div className="lista-admin__linha-chips">
            <ChipsFiltro
              opcoes={opcoesCategoria}
              selecionado={filtros.categoriaId}
              onSelecionar={(valor) => atualizarFiltro("categoriaId", valor)}
              rotulo="Categoria"
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

          {carregando && <p className="lista-admin__vazio">Carregando produtos…</p>}

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

          {prontos && produtos.length === 0 && (
            <p className="lista-admin__vazio">Nenhum produto cadastrado ainda.</p>
          )}

          {prontos && produtos.length > 0 && filtrados.length === 0 && (
            <div className="lista-admin__vazio">
              <p>Nenhum produto encontrado. Tente outro termo ou limpe os filtros.</p>
              <button
                className="lista-admin__botao lista-admin__botao--contorno"
                onClick={() => setFiltros(FILTROS_PRODUTO_INICIAIS)}
              >
                Limpar busca e filtros
              </button>
            </div>
          )}

          {prontos && filtrados.length > 0 && modo === "cards" && (
            <ul className="lista-admin__grade">
              {visiveis.map((product) => (
                <li key={product.id} className="lista-admin__card">
                  <MiniaturaProduto produto={product} grande />
                  <div className="lista-admin__card-corpo">
                    <span className="lista-admin__card-titulo">
                      {product.nome}
                      {!product.ativo && <SeloInativo />}
                      <SeloEstoque estoque={product.estoque} />
                    </span>
                    <span className="lista-admin__card-detalhe">
                      {nomeDaCategoria(categorias, product.categoria_id) || "Sem categoria"}
                    </span>
                    <span className="lista-admin__card-detalhe">
                      {formatarPreco(product.preco)} · {product.estoque} un.
                    </span>
                  </div>
                  <div className="lista-admin__card-acoes">
                    <button
                      className="lista-admin__botao"
                      onClick={() => abrirFormulario(product.id)}
                    >
                      Editar
                    </button>
                    <button
                      className="lista-admin__icone-botao lista-admin__icone-botao--perigo"
                      onClick={() => handleDelete(product)}
                      aria-label={`Excluir ${product.nome}`}
                      title="Excluir"
                    >
                      <IconeLixeira />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {prontos && filtrados.length > 0 && modo === "lista" && (
            <ul className="lista-admin__compacta pagina-admin-produtos__compacta">
              {/* títulos das colunas; aria-hidden porque cada linha já é lida inteira */}
              <li className="lista-admin__linha lista-admin__linha--titulos" aria-hidden="true">
                <span />
                <span>Nome</span>
                <span className="lista-admin__so-largo">Categoria</span>
                <span>Preço</span>
                <span className="lista-admin__so-largo">Estoque</span>
                <span />
              </li>
              {visiveis.map((product) => (
                <li key={product.id} className="lista-admin__linha">
                  <MiniaturaProduto produto={product} />
                  <span title={product.nome}>
                    {product.nome}
                    {!product.ativo && <SeloInativo />}
                    <SeloEstoque estoque={product.estoque} />
                  </span>
                  <span className="lista-admin__so-largo">
                    {nomeDaCategoria(categorias, product.categoria_id) || "—"}
                  </span>
                  <span>{formatarPreco(product.preco)}</span>
                  <span className="lista-admin__so-largo">{product.estoque}</span>
                  <span className="lista-admin__linha-acoes">
                    <button
                      className="lista-admin__icone-botao"
                      onClick={() => abrirFormulario(product.id)}
                      aria-label={`Editar ${product.nome}`}
                      title="Editar"
                    >
                      <IconeEditar />
                    </button>
                    <button
                      className="lista-admin__icone-botao lista-admin__icone-botao--perigo"
                      onClick={() => handleDelete(product)}
                      aria-label={`Excluir ${product.nome}`}
                      title="Excluir"
                    >
                      <IconeLixeira />
                    </button>
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

      {categoriasAbertas && (
        <Modal titulo="Categorias" onFechar={() => setCategoriasAbertas(false)}>
          <GerenciarCategorias
            categorias={categorias}
            onCriar={criarCategoria}
            onRenomear={atualizarCategoria}
            onExcluir={async (id) => {
              await excluirCategoria(id);
              // o chip da categoria some: se ela estava filtrada, volta pra "Todos"
              if (filtros.categoriaId === id) atualizarFiltro("categoriaId", "");
            }}
          />
        </Modal>
      )}

      {formularioAberto && (
        <Modal
          titulo={editingProduct ? "Editar produto" : "Novo produto"}
          onFechar={() => setFormularioAberto(null)}
          largo
        >
          {/* a key muda com o produto: o React cria um formulário novo, já com os dados certos */}
          <FormularioProduto
            key={formularioAberto}
            produto={editingProduct}
            categorias={categorias}
            onEnviar={handleSubmit}
            onCancelar={() => setFormularioAberto(null)}
          />
        </Modal>
      )}
    </>
  );
}

/** Foto do produto; sem imagem, aparece um quadrado cinza. `grande` = versão do card. */
function MiniaturaProduto({ produto, grande = false }: { produto: Produto; grande?: boolean }) {
  const classe = `pagina-admin-produtos__miniatura${grande ? " pagina-admin-produtos__miniatura--grande" : ""}`;
  return produto.url_imagem ? (
    <img src={produto.url_imagem} alt="" className={classe} />
  ) : (
    <span className={`${classe} pagina-admin-produtos__miniatura--vazio`} aria-hidden="true" />
  );
}

function SeloInativo() {
  return <span className="lista-admin__selo lista-admin__selo--aviso">inativo</span>;
}

/** "esgotado" (vermelho) ou "estoque baixo" (amarelo); estoque ok não mostra nada. */
function SeloEstoque({ estoque }: { estoque: number }) {
  const situacao = situacaoEstoque(estoque);
  if (situacao === "esgotado") return <span className="lista-admin__selo lista-admin__selo--perigo">esgotado</span>;
  if (situacao === "baixo") return <span className="lista-admin__selo lista-admin__selo--aviso">estoque baixo</span>;
  return null;
}

export default PaginaAdminProdutos;
