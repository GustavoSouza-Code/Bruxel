# Integração de produtos e categorias com a API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Loja, Início, Piscinator, admin de produtos e "Produtos da OS" passam a ler e gravar produtos no banco via API, sem o mock.

**Architecture:** Funções de API em `src/api/` (molde de `api/usuarios.ts`, usando `requisicao()`), hooks em `src/crud/produtos/` (molde de `useUsuarios`), telas consumindo os hooks. Conversões e seleções são funções puras com teste.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest, react-router 7.

**Spec:** `docs/superpowers/specs/2026-10-18-integracao-produtos-design.md`

## Global Constraints

- Não mexer em nada dentro de `backend/`.
- Código, nomes e comentários em português, no estilo dos arquivos vizinhos (comentários curtos explicando o porquê).
- Comportamento em `.tsx`/`.ts` com hooks e tipos; CSS só pra layout.
- Corpo de escrita de produto só com: `categoria_id, codigo, nome, descricao, preco, estoque, url_imagem, ativo`.
- Preço mínimo no formulário: `0.01` (banco exige `preco > 0`).
- Textos fixos: "Carregando produtos…", "Tentar novamente", "Nenhum produto cadastrado ainda.", "Salvando…", seção sem categorias com título "Produtos".
- Cada commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. `preco` chegando como string (`"21.5"`) ou número — sempre vira número, senão `toFixed` quebra o card. → teste em Task 1.
2. `/categories` inexistente (404) — Loja ainda mostra os produtos numa seção "Produtos"; admin desabilita "+ Novo produto". → Task 3 (useCatalogo) e verificação no navegador (Task 7).
3. Produto inativo — não aparece na Loja/Início/Piscinator, aparece no admin. → teste de `apenasAtivos` na Task 2.
4. Menos de 4 produtos ou categoria "Tratamento da água" ausente — destaques/recomendados não quebram. → testes na Task 2.
5. Falha no `PUT` logo após o `POST` na criação — o erro sobe pro formulário (o produto já existe no banco; a lista é recarregada pra mostrá-lo). → Task 4.

---

### Task 1: API de produtos e categorias

**Files:**
- Create: `frontend/src/api/produtos.ts`, `frontend/src/api/categorias.ts`
- Test: `frontend/src/api/produtos.test.ts`

**Interfaces:**
- Produces:
  - `type ProdutoApi = Omit<Produto, "preco" | "descricao" | "url_imagem"> & { preco: string | number; descricao?: string | null; url_imagem?: string | null; criado_em?: string; atualizado_em?: string }`
  - `type DadosProduto = Omit<Produto, "id">` (o que o formulário entrega)
  - `paraProduto(bruto: ProdutoApi): Produto`
  - `paraCorpoProduto(dados: DadosProduto): DadosProduto` (só campos permitidos; `descricao`/`url_imagem` vazios viram `null` no corpo — tipar o retorno como `Record<string, unknown>` se precisar)
  - `listarProdutos(): Promise<Produto[]>`
  - `criarProduto(token: string, dados: DadosProduto): Promise<Produto>` — `POST /products` com `{categoria_id, nome, codigo, preco}`, depois `PUT /products/:id` com `paraCorpoProduto(dados)`; devolve o resultado do PUT convertido.
  - `atualizarProduto(token: string, id: string, dados: DadosProduto): Promise<Produto>`
  - `excluirProduto(token: string, id: string): Promise<void>`
  - Em `categorias.ts`: `listarCategorias(): Promise<Categoria[]>` → `GET /categories`.

- [ ] **Step 1: Testes que falham** em `api/produtos.test.ts`:
  - `paraProduto converte preço em string pra número`: `{..., preco: "21.5"}` → `preco === 21.5`.
  - `paraProduto mantém preço numérico`: `preco: 395` → `395`.
  - `paraProduto troca null por undefined e descarta datas`: `descricao: null, url_imagem: null, criado_em: "..."` → `descricao` e `url_imagem` `undefined`, `"criado_em" in resultado === false`.
  - `paraCorpoProduto só leva os campos aceitos`: entrada com `id` e `criado_em` extras (via cast) → `Object.keys` ordenadas `== ["ativo","categoria_id","codigo","descricao","estoque","nome","preco","url_imagem"]`.
  - `paraCorpoProduto manda null em texto vazio`: `descricao: "", url_imagem: "  "` → ambos `null`.
- [ ] **Step 2:** `npx vitest run src/api/produtos.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar os dois arquivos com as assinaturas acima, comentário apontando o recado do POST/PUT.
- [ ] **Step 4:** `npx vitest run src/api/produtos.test.ts` → PASS.
- [ ] **Step 5:** Commit `feat: funções da API de produtos e categorias`.

### Task 2: Funções puras de categoria e seleção

**Files:**
- Modify: `frontend/src/crud/produtos/categorias.ts` (remove `CATEGORIAS`)
- Create: `frontend/src/crud/produtos/selecaoProdutos.ts`
- Test: `frontend/src/crud/produtos/categorias.test.ts`, `frontend/src/crud/produtos/selecaoProdutos.test.ts`

**Interfaces:**
- Produces:
  - `nomeDaCategoria(categorias: Categoria[], id: string): string` ("" se não achar)
  - `apenasAtivos(produtos: Produto[]): Produto[]`
  - `produtosEmDestaque(produtos: Produto[]): Produto[]` — 4 primeiros
  - `produtosRecomendados(produtos: Produto[], categorias: Categoria[]): Produto[]` — 4 primeiros da categoria de nome "Tratamento da água" (comparação sem acento/maiúscula); se a categoria não existir ou não tiver produto, 4 primeiros de `produtos`.

- [ ] **Step 1: Testes que falham:**
  - `nomeDaCategoria acha pelo id` / `devolve "" quando não acha`.
  - `apenasAtivos tira os inativos`.
  - `produtosEmDestaque pega no máximo 4` (6 produtos → 4; 2 produtos → 2).
  - `produtosRecomendados usa Tratamento da água` (categoria `{id:"c1", nome:"Tratamento da água"}`, 5 produtos dela + 2 de outra → 4 dela).
  - `produtosRecomendados acha o nome sem acento/maiúscula` (`"TRATAMENTO DA AGUA"`).
  - `produtosRecomendados cai nos primeiros sem a categoria` (categorias `[]` → 4 primeiros).
- [ ] **Step 2:** `npx vitest run src/crud/produtos` → FAIL.
- [ ] **Step 3:** Implementar. Ainda não ajustar quem importa `CATEGORIAS` (o `tsc` vai reclamar; resolvido nas Tasks 4–6, então **não rodar build aqui**).
- [ ] **Step 4:** `npx vitest run src/crud/produtos` → PASS.
- [ ] **Step 5:** Commit `feat: seleção de destaques e recomendados e nomeDaCategoria com lista`.

### Task 3: Hooks `useCategorias` e `useCatalogo`

**Files:**
- Create: `frontend/src/crud/produtos/useCategorias.ts`, `frontend/src/crud/produtos/useCatalogo.ts`

**Interfaces:**
- Consumes: `listarCategorias`, `listarProdutos` (Task 1); `apenasAtivos` (Task 2).
- Produces:
  - `useCategorias(): { categorias: Categoria[]; carregando: boolean; erro: string | null }`
  - `useCatalogo(): { produtos: Produto[]; categorias: Categoria[]; carregando: boolean; erro: string | null; recarregar: () => void }` — `erro` só reflete a falha dos produtos; falha das categorias deixa `categorias = []`. Busca as duas em paralelo (`Promise.allSettled`), padrão `cancelado`/`tentativa` do `useUsuarios`.

- [ ] **Step 1:** Implementar os dois hooks seguindo o padrão de efeito de `crud/usuarios/useUsuarios.ts` (setState só no `.then/.catch`).
- [ ] **Step 2:** `npx eslint src/crud/produtos` → sem erros.
- [ ] **Step 3:** Commit `feat: hooks useCategorias e useCatalogo`.

### Task 4: `useProdutos` do admin pela API + FormularioProduto assíncrono

**Files:**
- Modify: `frontend/src/crud/produtos/useProdutos.ts`, `frontend/src/crud/produtos/FormularioProduto/FormularioProduto.tsx` (+ `.css` se precisar do erro/preview)

**Interfaces:**
- Consumes: Task 1 (`criarProduto`, `atualizarProduto`, `excluirProduto`, `listarProdutos`, `DadosProduto`).
- Produces:
  - `useProdutos(): { produtos; carregando; erro; recarregar; criarProduto(dados: DadosProduto): Promise<void>; atualizarProduto(id: string, dados: DadosProduto): Promise<void>; excluirProduto(id: string): Promise<void> }` — `comToken` com `sair()` em 401, como no `useUsuarios`. Se `criarProduto` falhar depois do POST (erro no PUT), chama `recarregar()` antes de relançar.
  - `DadosFormularioProduto` passa a ser alias de `DadosProduto`.
  - Props do formulário: `{ produto: Produto | null; categorias: Categoria[]; onEnviar: (dados: DadosProduto) => Promise<void>; onCancelar: () => void }`. Categoria inicial = `categorias[0]?.id ?? ""`, `<select required>`. Erro com `mensagemDeErro` num `<p role="alert">`; botão "Salvando…" desabilitado durante o envio; preço `min="0.01"`; `<img>` de preview ao lado da URL que some no `onError` (volta a aparecer quando a URL muda).

- [ ] **Step 1:** Reescrever `useProdutos` e o formulário.
- [ ] **Step 2:** `npx eslint src/crud/produtos` → sem erros.
- [ ] **Step 3:** Commit `feat: admin de produtos salva no banco pela API`.

### Task 5: Página do admin de produtos

**Files:**
- Modify: `frontend/src/paginas/admin/produtos/produtos.tsx`

**Interfaces:**
- Consumes: `useProdutos` (Task 4), `useCategorias` (Task 3), `nomeDaCategoria(categorias, id)` (Task 2).

- [ ] **Step 1:** Estados como em `paginas/admin/usuarios/usuarios.tsx` (carregando / erro + "Tentar novamente" / `erroAcao` ao excluir). `handleSubmit` vira async e só fecha o modal se der certo. Opções do filtro de categoria vêm de `categorias`. "+ Novo produto" `disabled` quando `categorias.length === 0` depois de carregar, com aviso "Categorias indisponíveis: não dá pra cadastrar produto agora."
- [ ] **Step 2:** `npx tsc -p tsconfig.app.json --noEmit` mostra erros só em Loja/Início/Piscinator/NavCategorias (resolvidos na Task 6).
- [ ] **Step 3:** Commit `feat: página de produtos do admin com carregando, erro e categorias da API`.

### Task 6: Portal (Loja, NavCategorias, Início, Piscinator), imagens e remoção do mock

**Files:**
- Modify: `paginas/portal/loja/loja.tsx`, `paginas/portal/loja/componentes/NavCategorias/NavCategorias.tsx`, `paginas/portal/inicio/inicio.tsx`, `paginas/portal/piscinator/piscinator.tsx`
- Move: `frontend/src/assets/images/produtos/*.png` → `frontend/public/produtos/` (`git mv`)
- Delete: `frontend/src/dados/produtos.ts`
- Modify: `frontend/src/tipos/produto.ts` (comentário de `categoria_id`/`url_imagem`)

**Interfaces:**
- Consumes: `useCatalogo` (Task 3), `produtosEmDestaque`, `produtosRecomendados` (Task 2).
- `NavCategorias` props: `{ categorias: Categoria[] }`; ícone por mapa de nome normalizado (sem acento, minúsculo) → SVG atual; ícone padrão (um círculo simples) pra nome desconhecido. Não renderiza nada com lista vazia.

- [ ] **Step 1:** Loja: estados "Carregando produtos…", erro + "Tentar novamente", "Nenhum produto cadastrado ainda."; destaques via `produtosEmDestaque(filtrados)`; seções por categoria; sem categorias, uma `SecaoProdutos` "Produtos" com tudo.
- [ ] **Step 2:** Início: `SecaoProdutos` só renderiza quando há destaques. Piscinator: `produtosRecomendados(produtos, categorias)`.
- [ ] **Step 3:** Mover imagens, apagar o mock; `grep -rn "dados/produtos\|CATEGORIAS\b" src` → nada.
- [ ] **Step 4:** `npx tsc -p tsconfig.app.json --noEmit` → limpo; `npm test` → tudo passa.
- [ ] **Step 5:** Commit `feat: loja, início e piscinator com produtos do banco`.

### Task 7: Verificação final

- [ ] **Step 1:** Em `frontend/`: `npm run lint` (só o erro antigo do `ContextoCarrinho` é aceitável), `npm test`, `npm run build` → OK.
- [ ] **Step 2:** Preview do Vite com o backend local: Loja sem `/categories` mostra seção "Produtos"; admin mostra o aviso; backend desligado mostra erro + "Tentar novamente". Se houver produtos no banco local, criar/editar/excluir no admin e conferir após F5. Screenshot.
