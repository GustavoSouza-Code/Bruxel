# Motion discreto e melhorias de experiência — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animar de forma discreta o que já existe no portal e no painel e preencher as lacunas de
fluxo (avisos, carrinho seguro, confirmação de compra, troca de senha, Piscinator por diagnóstico,
pagamentos, pedidos, números da home e estoque baixo) sem mudar o visual nem o backend.

**Architecture:** Motion em CSS (tokens + `estilos/movimento.css` + CSS de cada componente) com
dois comportamentos em TSX (`usePresenca` pra saída animada e `Recolhivel` pra altura suave). Regras
de negócio novas em funções puras em `crud/` com teste no vitest; hooks e páginas só montam a tela,
no mesmo padrão de `useAtendimentos` + `filtrarAtendimentos` + `paginas/admin/atendimentos`.

**Tech Stack:** React 19 + TypeScript, react-router-dom 7 (`BrowserRouter`), CSS puro, Vitest 5,
Vite 8. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-28-motion-e-experiencia-design.md`

## Global Constraints

- Nada em `backend/`. O que faltar vai pro "Recado pro backend" da spec e do PR.
- Nenhuma dependência nova no `frontend/package.json`.
- O visual parado do Figma não muda: cores, fontes, layout, ondas, curvas, raios.
- Motion só com `transform` e `opacity` (exceções: `grid-template-rows` do `Recolhivel` e
  `block-size` do `::details-content`). Nada de `ease` puro em movimento; saída mais rápida que a
  entrada. Nenhuma animação em loop.
- Tokens (exatos): `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-in-out: cubic-bezier(0.76, 0, 0.24, 1)`,
  `--ease-saida: cubic-bezier(0.55, 0.055, 0.675, 0.19)`, `--t-press: 140ms`, `--t-hover: 180ms`,
  `--t-ui: 220ms`, `--t-modal: 240ms`.
- Todo deslocamento e escala ficam dentro de `@media (prefers-reduced-motion: no-preference)`;
  com `reduce` a tela chega no estado final (só cor e opacidade mudam). Nada fica invisível se o
  JS falhar.
- Comportamento em `.tsx` (hooks, estado, tipos); CSS só pra estilo, layout e transições.
- Hooks seguem a regra de lint do projeto: sem `setState` direto no corpo de `useEffect`
  (ajuste de estado durante a renderização, como em `hooks/useCarregarMais.ts`, ou `setState`
  dentro de callback/timeout).
- Arquivos de componente exportam só componentes (Fast Refresh): contexto + hook ficam em arquivo
  `.ts` separado, como `contexto/useCarrinho.ts`.
- Textos de tela e comentários em pt-BR, no tom dos arquivos vizinhos.
- Dinheiro com `formatarReais` (`crud/atendimentos/valorOs.ts`), alinhado à direita com
  `font-variant-numeric: tabular-nums`; somas em centavos.
- **Commits: um por parte** (escolha do Eduardo), na branch `eduardo`, terminando com
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. PR único pra `main` no fim.
- Repo no OneDrive: depois de editar, se o Vite servir versão velha, `touch` nos arquivos editados
  antes de concluir que algo quebrou.

## Review Focus

1. **Carrinho salvo com produto que mudou** (estoque caiu, produto desativado ou apagado entre
   visitas): o carrinho abre sem quebrar, a quantidade já vem limitada ao estoque guardado e o
   `POST /orders` mostra a mensagem do backend (409/400). Teste na Task 8
   (`lerCarrinhoSalvo` limita e descarta).
2. **OS concluída com total R$ 0,00**: continua em "A receber" e o "Marcar como pago" usa a mesma
   pergunta de alerta da tela da OS. Testes nas Tasks 15 (`lancamentosDePagamento` com total 0)
   e 15 (`perguntaPagamento(0)`).
3. **Virada de mês e fuso** no "Recebido no mês": um pagamento às 00:05 do dia 1 conta no mês; um
   às 23:55 do último dia do mês anterior, não (comparação no horário local). Teste na Task 15.
4. **Modal ou menu fechando enquanto a página troca** (clicar num item do menu que navega, fechar
   e reabrir rápido): nada de erro no console e nada fica preso meio transparente. Verificação
   manual na Task 7 (reabrir o menu durante a saída tem que mostrá-lo aberto).
5. **`/pedido/:id` de outra pessoa ou inexistente**: mostra "Pedido não encontrado" (o
   `GET /orders` do cliente só traz os dele), sem tela em branco. Verificação na Task 12.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/estilos/tokens.css` | + tokens de motion |
| `src/estilos/movimento.css` (novo) | transições globais de hover, press, `::details-content`, reduced motion |
| `src/hooks/usePresenca.ts` (novo) | manter montado durante a saída animada |
| `src/componentes/ui/Recolhivel/` (novo) | painel com altura suave (FAQ, filtros) |
| `src/componentes/ui/Avisos/` (novo) | `PilhaAvisos`, `filaAvisos.ts` (regra pura) |
| `src/contexto/ContextoAvisos.tsx` + `useAvisos.ts` (novos) | provedor e hook `avisar` |
| `src/crud/carrinho/regrasCarrinho.ts` (novo) | adicionar, limitar ao estoque, ler o salvo |
| `src/crud/pedidos/opcoesPedido.ts` (novo) | `codigoPedido`, rótulos de status e forma, `pedidoRecebido` |
| `src/crud/pedidos/filtrarPedidos.ts` (novo) | `PedidoComCliente`, junção com usuários, filtros |
| `src/crud/pedidos/usePedidosAdmin.ts` (novo) | `GET /orders` + `GET /users` |
| `src/crud/pagamentos/lancamentos.ts` (novo) | lançamentos, resumo, filtro, contagem |
| `src/crud/produtos/estoque.ts` (novo) | `POUCO_ESTOQUE`, `situacaoEstoque`, `contarEstoque` |
| `src/crud/produtos/recomendacaoPiscinator.ts` (novo) | recomendação por diagnóstico |
| `src/crud/usuarios/validarTrocaSenha.ts` (novo) | validação da troca de senha |
| `src/paginas/portal/pedido/` (novo) | confirmação `/pedido/:id` |
| `src/paginas/portal/perfil/componentes/AbaSenha/` (novo) | aba "Senha" |
| `src/paginas/admin/pedidos/` (novo) | `/admin/pedidos` + `componentes/DetalhePedido` |
| `src/paginas/admin/pagamentos/` (novo) | `/admin/pagamentos` |
| `src/paginas/admin/inicio/componentes/NumerosPainel/` (novo) | faixa de números da home |

---

## Parte 1 · Motion discreto e avisos

### Task 1: Tokens, `movimento.css` e transições dos hovers existentes

**Files:**
- Modify: `frontend/src/estilos/tokens.css`, `frontend/src/App.css` (importar `./estilos/movimento.css` logo depois do `tokens.css`)
- Create: `frontend/src/estilos/movimento.css`
- Modify (só `transition` na propriedade que o hover já muda): `componentes/produto/CardProduto/CardProduto.css` (`border-color`), `paginas/admin/lista-admin.css` (`.lista-admin__card`, `.lista-admin__linha`, botões), `paginas/admin/inicio/inicio.css` (`.pagina-admin-inicio__area`), `componentes/layout/Cabecalho/Cabecalho.css` (trocar `0.18s ease` por `var(--t-hover)` + `--ease-out` no padding), `componentes/layout/MenuUsuario/MenuUsuario.css` (`.menu-usuario__seta` com `var(--t-ui) var(--ease-out)`)

**Interfaces:**
- Produces: as variáveis CSS dos Global Constraints, usadas por todas as tasks seguintes.

- [ ] **Step 1: Adicionar os 7 tokens de motion em `:root` de `tokens.css`**, com os valores exatos dos Global Constraints e um comentário curto por token.
- [ ] **Step 2: Escrever `movimento.css`** com, nesta ordem:
  - `a, button` com `transition` de `color`, `background-color`, `border-color`, `opacity`, `text-decoration-color` em `var(--t-hover) ease` (cor pode usar `ease`; é a única exceção);
  - dentro de `@media (prefers-reduced-motion: no-preference)`: `button:not(:disabled):active` e as classes de link-botão `.cabecalho__botao-entrar`, `.cabecalho__botao-atendimento`, `.banner-inicio__cta`, `.secao-produtos__botao` (confirmar o nome real da pílula "Acessar loja virtual" em `SecaoProdutos.css`) com `transform: scale(0.97)`, e `transition: transform var(--t-press) var(--ease-out)` somado às de cor;
  - `@media (prefers-reduced-motion: reduce)`: `*, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }`.
- [ ] **Step 3: Nos CSS listados em Files, acrescentar só a `transition`** da propriedade que o `:hover` já muda (nenhuma cor, borda ou tamanho novo).
- [ ] **Step 4: Verificar**: `npm run build` no `frontend/` passa. No Browser pane (`preview_start` com `frontend-dev`), passar o mouse num card de produto e num link do header: a borda e a opacidade mudam suaves (javascript: `getComputedStyle(document.querySelector('.card-produto')).transitionDuration` ≠ `0s`). Clicar e segurar em "Entrar": encolhe de leve.

### Task 2: `usePresenca` e `MenuUsuario` animado

**Files:**
- Create: `frontend/src/hooks/usePresenca.ts`
- Modify: `frontend/src/componentes/layout/MenuUsuario/MenuUsuario.tsx`, `MenuUsuario.css`

**Interfaces:**
- Produces: `usePresenca(aberto: boolean, duracaoSaidaMs: number): { montado: boolean; saindo: boolean }` — usado também pela Task 6.

- [ ] **Step 1: Implementar `usePresenca`.** `montado` fica `true` enquanto `aberto` ou durante a saída; `saindo = !aberto && montado`. Com `matchMedia("(prefers-reduced-motion: reduce)").matches`, a saída dura 0. Ao `aberto` virar `true`, ajuste de estado durante a renderização (guardar o `aberto` anterior em estado, como o `useCarregarMais`); o fim da saída é um `setTimeout` com `clearTimeout` na limpeza do efeito. Reabrir durante a saída cancela o timeout e volta a `saindo = false`.
- [ ] **Step 2: Usar no `MenuUsuario`**: `const { montado, saindo } = usePresenca(aberto, 120)`; renderizar o menu enquanto `montado`, com a classe `menu-usuario__menu--saindo` quando `saindo`. O `aria-expanded` continua ligado a `aberto`.
- [ ] **Step 3: CSS do menu** (dentro de `no-preference`): `transform-origin: top right`; entrada por `@keyframes menu-usuario-entrar` de `opacity: 0; transform: scale(0.97) translateY(-4px)` até o normal, `180ms var(--ease-out)`; `.menu-usuario__menu--saindo` com `opacity: 0; transform: scale(0.97) translateY(-4px)` por `transition` de `120ms var(--ease-saida)`, e `pointer-events: none`.
- [ ] **Step 4: Verificar** no navegador, logado: o menu abre a partir do botão e fecha mais rápido; Esc, clique fora e clique num item fecham sem erro no console (`read_console_messages`). Abrir e fechar 5 vezes rápido: termina no estado certo.

### Task 3: `Modal` com entrada e saída

**Files:**
- Modify: `frontend/src/componentes/ui/Modal/Modal.tsx`, `Modal.css`

**Interfaces:**
- Consumes: tokens da Task 1.
- Produces: a mesma API (`titulo`, `onFechar`, `children`, `largo`); `IconeFechar` (já existe em `Icones.tsx`) no lugar do "✕".

- [ ] **Step 1: Fechamento animado em TSX.** Estado `fechando`; uma função interna `fechar()` usada pelo botão, pelo clique no fundo e pelo `onCancel` (Esc): se já `fechando`, ignora; senão liga `fechando` e chama `onFechar` depois de 160ms (0 com reduced motion), num `setTimeout` limpo ao desmontar. A classe `modal--fechando` entra quando `fechando`.
- [ ] **Step 2: Trocar o "✕" do botão por `<IconeFechar />`** (o `aria-label="Fechar"` fica).
- [ ] **Step 3: CSS** (dentro de `no-preference`): `.modal[open]` com `@keyframes modal-entrar` de `opacity: 0; transform: scale(0.97)` em `var(--t-modal) var(--ease-out)`; `.modal[open]::backdrop` com `@keyframes modal-fundo` de `opacity: 0`; `.modal--fechando` e seu `::backdrop` com `@keyframes modal-sair` até `opacity: 0; transform: scale(0.98)` em `160ms var(--ease-saida) forwards`.
- [ ] **Step 4: Verificar** em `/admin/produtos` (Novo produto) e `/admin/usuarios`: abre com fade e escala, fecha suave pelo ✕, pelo fundo e pelo Esc; salvar fecha na hora (a página desmonta). Foco continua indo pro primeiro campo.

### Task 4: `Recolhivel`, FAQ, `PainelFiltros`, `<details>` e ícones

**Files:**
- Create: `frontend/src/componentes/ui/Recolhivel/Recolhivel.tsx`, `Recolhivel.css`
- Modify: `componentes/ui/Icones/Icones.tsx`, `paginas/portal/inicio/componentes/Faq/Faq.tsx` + `Faq.css`, `componentes/ui/PainelFiltros/PainelFiltros.tsx` + `PainelFiltros.css`, `estilos/movimento.css`

**Interfaces:**
- Produces: `Recolhivel({ id, aberto, children, className }: { id: string; aberto: boolean; children: ReactNode; className?: string })`; `IconeSeta()` (chevron pra baixo, `<path d="m6 9 6 6 6-6" />`); `IconeCheck()` (`<path d="M20 6 9 17l-5-5" />`), ambos com o `Icone` base.

- [ ] **Step 1: `Recolhivel`**: `<div id className="recolhivel …" data-aberto inert={!aberto}><div className="recolhivel__interno">{children}</div></div>`. CSS: `display: grid; grid-template-rows: 0fr` → `1fr` com `[data-aberto="true"]`; `.recolhivel__interno { overflow: hidden; min-height: 0; }`; a `transition: grid-template-rows var(--t-ui) var(--ease-out)` só em `no-preference`.
- [ ] **Step 2: Ícones** `IconeSeta` e `IconeCheck` em `Icones.tsx`.
- [ ] **Step 3: FAQ**: a resposta sempre no DOM, dentro de `<Recolhivel id={`faq-${item.id}`} aberto={isOpen}>`; o botão ganha `aria-controls`; a seta vira `<span className="faq__seta"><IconeSeta /></span>` com `transform: rotate(180deg)` quando aberto (classe `faq__seta--aberta`, transição `var(--t-ui) var(--ease-out)`). O `margin-top` da resposta vira `padding-top` (senão o fechado não chega a 0) e o comentário "só existe no DOM enquanto…" é atualizado.
- [ ] **Step 4: `PainelFiltros`**: trocar o `hidden` por `<Recolhivel id={id} aberto={aberto}>`; mover `background`, `padding` e `margin-bottom` de `.painel-filtros` pra um filho interno (o recolhido tem de chegar a altura 0); apagar a regra `.painel-filtros[hidden]` e atualizar o comentário do componente (o `aria-controls` continua apontando pro `id`).
- [ ] **Step 5: `<details>` do perfil** em `movimento.css`, dentro de `no-preference` e de `@supports selector(::details-content)`: `:root { interpolate-size: allow-keywords; }`, `details::details-content { block-size: 0; overflow-y: clip; transition: block-size var(--t-ui) var(--ease-out), content-visibility var(--t-ui) allow-discrete; }`, `details[open]::details-content { block-size: auto; }`.
- [ ] **Step 6: Verificar**: FAQ abre e fecha com altura suave e a seta gira; Tab não entra na resposta fechada (`inert`); "Filtros" em `/admin/atendimentos` abre e fecha suave e o fechado não ocupa espaço; em `/perfil` → Compras, "Ver produtos e preços" abre suave no Chrome.

### Task 5: Piscinator e selo do carrinho

**Files:**
- Modify: `paginas/portal/piscinator/componentes/PiscinatorQuestionario/PiscinatorQuestionario.tsx` + `.css`, `PiscinatorIntroducao.css`, `PiscinatorResultado.css`, `componentes/layout/Cabecalho/Cabecalho.tsx` + `Cabecalho.css`, `estilos/movimento.css`

- [ ] **Step 1: Barra de progresso** por `style={{ transform: `scaleX(${(step + 1) / QUESTIONS.length})` }}` com `transform-origin: left`, `width: 100%` e `transition: transform 300ms var(--ease-in-out)` no lugar do `width 0.3s ease` (comentários do TSX e do CSS atualizados).
- [ ] **Step 2: Entrada da pergunta e das etapas**: `key={step}` no `<h2>` da pergunta; em `movimento.css` um `@keyframes entrar-suave` (de `opacity: 0; transform: translateY(8px)`, `200ms var(--ease-out)`) aplicado, dentro de `no-preference`, a `.piscinator-questionario__pergunta`, `.piscinator-introducao` e `.piscinator-resultado` (conferir os nomes das classes-raiz nos CSS).
- [ ] **Step 3: Pulo do selo** no `Cabecalho.tsx`: `ref` no `<span className="cabecalho__selo-carrinho">` e um `useRef<number>()` com a quantidade anterior; num `useEffect([quantidadeItens])`, se havia valor anterior diferente e o reduced motion está desligado, `selo.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" })`; depois guarda o valor atual. Sem `setState` (o Cabecalho remonta a cada página, então trocar de página não pula).
- [ ] **Step 4: Verificar**: no Piscinator a barra cresce suave e cada pergunta entra com fade; adicionar ao carrinho faz o selo pular uma vez; trocar de página não pula.

### Task 6: Avisos (toast)

**Files:**
- Create: `frontend/src/componentes/ui/Avisos/filaAvisos.ts`, `filaAvisos.test.ts`, `Avisos.tsx`, `Avisos.css`, `frontend/src/contexto/useAvisos.ts`, `frontend/src/contexto/ContextoAvisos.tsx`
- Modify: `frontend/src/App.tsx`, `componentes/produto/CardProduto/CardProduto.tsx`, `paginas/portal/perfil/perfil.tsx` (`saveEdit`), `paginas/admin/produtos/produtos.tsx` (`handleSubmit`, `handleDelete`), `paginas/admin/usuarios/usuarios.tsx` (depois de criar, salvar e excluir), `crud/produtos/GerenciarCategorias/GerenciarCategorias.tsx` (depois de criar, renomear e excluir)

**Interfaces:**
- Consumes: `usePresenca` (Task 2), `IconeFechar`.
- Produces (em `contexto/useAvisos.ts`): `type TipoAviso = "sucesso" | "erro" | "info"`; `interface NovoAviso { tipo: TipoAviso; mensagem: string; acao?: { rotulo: string; para: string } }`; `interface Aviso extends NovoAviso { id: number }`; `useAvisos(): { avisar: (aviso: NovoAviso) => void }` (lança erro fora do provedor, igual ao `useCarrinho`). Em `filaAvisos.ts`: `MAX_AVISOS = 3`, `empilharAviso(fila: Aviso[], novo: Aviso): Aviso[]`, `duracaoDoAviso(tipo: TipoAviso): number`.

- [ ] **Step 1: Testes de `filaAvisos.test.ts`**:
  - `empilharAviso põe o novo no fim` → `empilharAviso([a1], a2)` igual a `[a1, a2]`;
  - `empilharAviso guarda só os 3 mais novos` → com `[a1, a2, a3]` + `a4` dá `[a2, a3, a4]`;
  - `duracaoDoAviso dá 4s pra sucesso e info e 6s pra erro` → `4000`, `4000`, `6000`.
- [ ] **Step 2: Rodar** `npx vitest run src/componentes/ui/Avisos` → FAIL (módulo não existe).
- [ ] **Step 3: Implementar `filaAvisos.ts`.**
- [ ] **Step 4: Rodar de novo** → PASS.
- [ ] **Step 5: Contexto e pilha.** `ProvedorAvisos` guarda a fila (id com um contador em `useRef`), expõe `avisar` e renderiza `children` + `<PilhaAvisos avisos onFechar />`. `PilhaAvisos` é um `<div className="avisos" aria-live="polite">` fixo no canto inferior direito (≤ 640px: embaixo, largura toda com 16px de margem). Cada `ItemAviso`: `role="alert"` quando `erro`; texto; `Link` da ação (fecha o aviso ao clicar); botão fechar com `IconeFechar` e `aria-label="Fechar aviso"`; timer de `duracaoDoAviso` que pausa no `mouseenter`/`focusin` e recomeça no `mouseleave`/`focusout`; saída pelo `usePresenca(visivel, 150)`, removendo da fila quando `montado` vira `false`. Cores: sucesso com o fundo `--color-primary` e texto branco; erro com `#fdecea`/`#c0392b`; info com branco e borda `--color-border-soft`; sombra só aqui (flutua): `0 12px 32px rgba(10, 13, 77, 0.25)`, a mesma do menu.
- [ ] **Step 6: CSS de movimento** (dentro de `no-preference`): entrada de `opacity: 0; transform: translateY(8px)` em `var(--t-ui) var(--ease-out)`; `.aviso--saindo` com `opacity: 0` em `150ms var(--ease-saida)`.
- [ ] **Step 7: Ligar no `App.tsx`**: `<BrowserRouter><ProvedorAvisos><RotasDoSite /></ProvedorAvisos></BrowserRouter>` e uma linha no comentário do `App` explicando por que fica dentro do router.
- [ ] **Step 8: Chamar `avisar`** com estes textos exatos:
  - `CardProduto`, ao adicionar: `{ tipo: "sucesso", mensagem: `${produto.nome} no carrinho.`, acao: { rotulo: "Ver carrinho", para: "/carrinho" } }`;
  - `perfil.tsx`, depois de `salvar(draft)`: "Perfil salvo." na aba perfil, "Endereço salvo." na de endereços;
  - admin produtos: "Produto cadastrado." / "Produto salvo." / "Produto excluído.";
  - admin usuários: "Usuário cadastrado." / "Usuário salvo." / "Usuário excluído.";
  - categorias: "Categoria criada." / "Categoria renomeada." / "Categoria excluída.".
  Erros continuam onde já aparecem hoje (inline), sem aviso duplicado.
- [ ] **Step 9: Verificar**: adicionar pelo card mostra o aviso com "Ver carrinho" (o link navega e o aviso some); três avisos seguidos empilham e o quarto empurra o mais velho; o mouse em cima pausa; no celular (390px) o aviso ocupa a largura sem cobrir o header.

### Task 7: Fechar a Parte 1

- [ ] **Step 1: Rodar no `frontend/`** `npm run test`, `npm run lint`, `npm run build` → todos passam.
- [ ] **Step 2: Passada no navegador a 1440 e 390px** pela tabela da Parte 1 da spec (cada linha) e pelo item 4 do Review Focus: reabrir o menu do usuário no meio da saída deixa ele aberto; clicar em "Minha conta" no menu navega sem erro no console.
- [ ] **Step 3: Reduced motion**: com a emulação do DevTools (ou, no Browser pane, conferindo via javascript que `matchMedia('(prefers-reduced-motion: reduce)')` existe nas regras), menu, modal e aviso abrem e fecham sem deslocamento e nada fica invisível.
- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat: motion discreto nas interações e avisos de confirmação"
```

---

## Parte 2 · Fluxo do cliente

### Task 8: Carrinho salvo e limitado ao estoque

**Files:**
- Create: `frontend/src/crud/carrinho/regrasCarrinho.ts`, `regrasCarrinho.test.ts`
- Modify: `contexto/ContextoCarrinho.tsx`, `contexto/useCarrinho.ts`, `componentes/produto/CardProduto/CardProduto.tsx` (+ `.css` pro estado desativado), `paginas/portal/carrinho/componentes/ItemCarrinho/ItemCarrinho.tsx`

**Interfaces:**
- Consumes: `quantidadeDisponivel(estoque, noCarrinho)` de `crud/produtos/selecaoProdutos.ts`; `LinhaCarrinho` de `contexto/useCarrinho.ts`.
- Produces: `CHAVE_CARRINHO = "bruxel:carrinho"`; `quantidadeNoCarrinho(itens: LinhaCarrinho[], produtoId: string): number`; `adicionarUnidade(itens: LinhaCarrinho[], produto: Produto): LinhaCarrinho[]`; `definirQuantidade(itens: LinhaCarrinho[], produtoId: string, quantidade: number): LinhaCarrinho[]`; `lerCarrinhoSalvo(texto: string | null): LinhaCarrinho[]`. No contexto, `adicionarItem` passa a devolver `boolean` (true = entrou).

- [ ] **Step 1: Testes** (`regrasCarrinho.test.ts`, com um `produto()` de fábrica igual ao de `filtrarProdutos.test.ts`):
  - `adicionarUnidade soma 1 até o estoque e para no limite` → estoque 2: 0→1→2→2;
  - `adicionarUnidade não põe produto esgotado` → estoque 0 devolve `[]`;
  - `definirQuantidade abaixo de 1 remove o item`;
  - `definirQuantidade não passa do estoque` → estoque 3, pedir 7 dá 3;
  - `lerCarrinhoSalvo devolve [] pra null, JSON quebrado e formato errado` → `null`, `"{"`, `'{"a":1}'`;
  - `lerCarrinhoSalvo descarta linhas inválidas e esgotadas e limita a quantidade ao estoque` → linha sem `produto.id`, linha com `estoque: 0` e linha `{ quantidade: 9, estoque: 4 }` dão só a última, com quantidade 4 (Review Focus 1).
- [ ] **Step 2: Rodar** `npx vitest run src/crud/carrinho` → FAIL.
- [ ] **Step 3: Implementar `regrasCarrinho.ts`** (`lerCarrinhoSalvo` com `try/catch` no `JSON.parse`; uma linha vale se `produto.id` e `produto.nome` são string, `preco`/`estoque` número e `quantidade` inteiro ≥ 1).
- [ ] **Step 4: Rodar de novo** → PASS.
- [ ] **Step 5: Provedor**: `useState(() => lerCarrinhoSalvo(lerDoStorage()))` e um `useEffect([itens])` que grava `JSON.stringify(itens)`; leitura e gravação em `try/catch` (sem storage segue em memória). As três operações passam a usar as regras puras; `adicionarItem` calcula o retorno a partir de `itens` antes do `setItems`. Atualizar o comentário do provedor ("vive só na memória") e o JSDoc de `adicionarItem` em `useCarrinho.ts`.
- [ ] **Step 6: `CardProduto`**: com `quantidadeNoCarrinho` e `quantidadeDisponivel`, o botão fica `disabled` quando não há disponível, com o texto "Esgotado" (estoque ≤ 0) ou "Máximo no carrinho"; o aviso da Task 6 só sai quando `adicionarItem` devolve `true`.
- [ ] **Step 7: `ItemCarrinho`**: o "+" fica `disabled` quando `quantidade >= produto.estoque`.
- [ ] **Step 8: Verificar**: montar o carrinho, recarregar → continua lá; produto com estoque 1 trava o card em "Máximo no carrinho" e o "+" do carrinho; no DevTools, apagar `bruxel:carrinho` e recarregar → carrinho vazio sem erro.

### Task 9: Rótulos de pedido compartilhados e confirmação `/pedido/:id`

**Files:**
- Create: `frontend/src/crud/pedidos/opcoesPedido.ts`, `opcoesPedido.test.ts`, `frontend/src/paginas/portal/pedido/pedido.tsx`, `pedido.css`
- Modify: `frontend/src/App.tsx` (rota dentro do `RotaLogado`), `paginas/portal/carrinho/componentes/FinalizarCompra/FinalizarCompra.tsx`, `paginas/portal/perfil/componentes/AbaCompras/AbaCompras.tsx` (trocar as duas constantes locais pelo import)

**Interfaces:**
- Consumes: `usePedidos()` (`crud/pedidos/usePedidos.ts`), `formatarReais`, `formatarDataHora` (`crud/atendimentos/datasAtendimento.ts`), `MensagemPagina`, `IconeCheck`.
- Produces: `codigoPedido(id: string): string`; `STATUS_PEDIDO_LABELS: Record<StatusPedido, string>` e `FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string>` (os mesmos textos de hoje do `AbaCompras`: "Aguardando pagamento", "Pago", "A caminho", "Entregue", "Cancelado"; "Pix", "Cartão de crédito", "Boleto"); `pedidoRecebido(status: StatusPedido): boolean` (true pra `PAGO`, `ENVIADO`, `ENTREGUE`).

- [ ] **Step 1: Testes**: `codigoPedido mostra os 8 primeiros caracteres em maiúsculo` (`"9e12fa07-aaaa"` → `"9E12FA07"`); `pedidoRecebido é true pra PAGO, ENVIADO e ENTREGUE e false pra PENDENTE e CANCELADO`.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar.** **Step 4: Rodar** → PASS.
- [ ] **Step 5: `AbaCompras`** passa a importar `STATUS_PEDIDO_LABELS` e `FORMA_PAGAMENTO_LABELS` (e `codigoPedido` no lugar do `slice` inline); nada mais muda nesse arquivo.
- [ ] **Step 6: `FinalizarCompra`**: guardar o retorno de `criarPedido`, `limparCarrinho()` e `navigate(`/pedido/${pedido.id}`, { state: { pedido } })`.
- [ ] **Step 7: `PaginaPedido`** (`Cabecalho` + `Rodape` como as outras páginas): o pedido vem do `location.state` quando o id bate; senão de `usePedidos()` + `find`. Estados: "Carregando pedido…"; erro com "Tentar novamente"; não achou → `<MensagemPagina titulo="Pedido não encontrado" texto="Esse pedido não está na sua conta." >` com o link "Ver minhas compras". Conteúdo, nesta ordem: `h1` "Pedido recebido"; "Pedido #{codigoPedido} · {formatarDataHora(criadoEm)}"; linha com `IconeCheck` + "Pagamento confirmado · {forma}" quando `pedidoRecebido`, senão "{STATUS_PEDIDO_LABELS[status]}"; lista dos itens (quantidade × nome, unitário, subtotal); total; "Entregar em" + endereço; botões "Ver minhas compras" (`Link` pra `/perfil` com `state={{ aba: "compras" }}`) e "Continuar comprando" (`/loja`). CSS reaproveitando o visual do resumo do carrinho (`pagina-carrinho__resumo` como referência), sem cor nova.
- [ ] **Step 8: Verificar**: fechar uma compra cai em `/pedido/:id` com tudo certo; recarregar a página mostra o mesmo pedido; `/pedido/qualquer-coisa` mostra "Pedido não encontrado" (Review Focus 5).

### Task 10: Trocar senha no perfil

**Files:**
- Create: `frontend/src/crud/usuarios/validarTrocaSenha.ts`, `validarTrocaSenha.test.ts`, `frontend/src/paginas/portal/perfil/componentes/AbaSenha/AbaSenha.tsx`
- Modify: `frontend/src/api/usuarios.ts`, `frontend/src/paginas/portal/perfil/perfil.tsx`

**Interfaces:**
- Consumes: `useAvisos` (Task 6), `useAutenticacao` (`token`, `usuario.id`), `errosPorCampo`, `mensagemDeErro`, `ErroApi`.
- Produces: `interface CamposTrocaSenha { atual: string; nova: string; confirmacao: string }`; `type ErrosTrocaSenha = Partial<Record<keyof CamposTrocaSenha, string>>`; `validarTrocaSenha(campos: CamposTrocaSenha): ErrosTrocaSenha`; `alterarSenha(token: string, id: string, senhaAtual: string, senha: string): Promise<Usuario>`.

- [ ] **Step 1: Testes** com as mensagens exatas:
  - vazio → `{ atual: "Informe a senha atual.", nova: "Informe a nova senha.", confirmacao: "Confirme a nova senha." }`;
  - `nova: "1234567"` → `nova: "A nova senha precisa ter pelo menos 8 caracteres."`;
  - nova igual à atual → `nova: "A nova senha precisa ser diferente da atual."`;
  - confirmação diferente → `confirmacao: "As senhas não conferem."`;
  - tudo certo → `{}`.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar.** **Step 4: Rodar** → PASS.
- [ ] **Step 5: `alterarSenha`** em `api/usuarios.ts`: `PUT /users/:id` com corpo `{ senha, senhaAtual }`. Corrigir de passagem os JSDoc de `buscarUsuario` e `atualizarUsuario`, que dizem que a rota é só de admin (o backend já libera a própria conta).
- [ ] **Step 6: `AbaSenha`**: três `<input type="password">` com `autoComplete` (`current-password`, `new-password`, `new-password`), erros embaixo de cada campo, botão "Alterar senha" (desativado e "Salvando…" enquanto envia). Na resposta de erro: `errosPorCampo(falha).senha` vai pra "nova"; um 400 sem campo (o "Senha atual incorreta." do backend) vai pra "atual"; qualquer outro erro, em cima do botão. Sucesso: limpa os campos e `avisar({ tipo: "sucesso", mensagem: "Senha alterada." })`. Reaproveitar as classes `pagina-perfil__formulario` e `pagina-perfil__salvar`.
- [ ] **Step 7: `perfil.tsx`**: `ProfileSection` ganha `"senha"`; `SECTIONS` ganha `{ id: "senha", label: "Senha" }` depois de "Endereços"; renderizar `{activeSection === "senha" && <AbaSenha />}` e atualizar o comentário ("quatro abas" → cinco).
- [ ] **Step 8: Verificar**: senha atual errada mostra "Senha atual incorreta." no campo certo; nova curta é barrada antes de enviar; troca certa mostra o aviso e o login seguinte funciona com a senha nova (voltar a senha antiga depois).

### Task 11: Piscinator recomendando pelo diagnóstico

**Files:**
- Create: `frontend/src/crud/produtos/recomendacaoPiscinator.ts`, `recomendacaoPiscinator.test.ts`
- Modify: `paginas/portal/piscinator/piscinator.tsx`, `componentes/PiscinatorResultado/PiscinatorResultado.tsx`

**Interfaces:**
- Consumes: `normalizar`, `apenasAtivos`, `produtosRecomendados` (reserva por categoria) de `crud/produtos/selecaoProdutos.ts`.
- Produces: `TERMOS_POR_PERGUNTA: string[][]` = `[["algicida", "choque", "cloro"], ["clarificante", "floculante", "floc", "decantador"], ["escova", "peneira", "aspirador", "3 em 1"]]`; `TERMOS_SEM_PROBLEMA = ["manutencao", "3 em 1", "ph"]`; `recomendarPorDiagnostico(respostas: boolean[], produtos: Produto[], categorias: Categoria[]): Produto[]` (até 4).

- [ ] **Step 1: Testes** (catálogo de fábrica com nomes como "Algicida Choque 1L", "Hidrofloc 1L", "Escova de parede", "Propool 3em1 10kg", "pH+ 2kg", "Cadeira", um inativo e um esgotado):
  - `água verde recomenda algicida e cloro primeiro` → `[true, false, false]` começa pelo algicida;
  - `água turva recomenda floculante` → `[false, true, false]` traz o Hidrofloc;
  - `sem nenhum Sim recomenda manutenção` → traz "3em1" e "pH+";
  - `3em1 sem espaço casa com "3 em 1"`;
  - `não repete produto que casa com duas respostas`;
  - `ignora inativos e deixa esgotados por último`;
  - `completa com a categoria Tratamento da água e depois com qualquer ativo, até 4`;
  - `catálogo vazio devolve lista vazia`.
- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Implementar**: o texto de cada produto é `normalizar(nome + " " + descricao)` e casa se contém o termo normalizado, com e sem espaços; candidatos na ordem dos "Sim" (ou `TERMOS_SEM_PROBLEMA`), com estoque > 0 antes; completa com `produtosRecomendados(apenasAtivos(produtos), categorias)` sem repetir.
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Ligar**: `piscinator.tsx` usa `recomendarPorDiagnostico(answers, produtos, categorias)` (some o TODO); o `h2` do resultado vira "Recomendados para o seu diagnóstico".
- [ ] **Step 6: Verificar** no navegador: "Sim" só na primeira pergunta e "Sim" só na segunda dão listas diferentes, coerentes com os produtos cadastrados.

### Task 12: Fechar a Parte 2

- [ ] **Step 1:** `npm run test`, `npm run lint`, `npm run build` → passam.
- [ ] **Step 2:** fluxo de ponta a ponta a 1440 e 390px: entrar → adicionar pelo card (aviso) → recarregar (carrinho salvo) → finalizar → `/pedido/:id` → recarregar → "Ver minhas compras". Mais o Review Focus 5 (`/pedido/id-inexistente`).
- [ ] **Step 3: Commit**

```bash
git add frontend/src
git commit -m "feat: carrinho salvo, confirmação de compra, troca de senha e Piscinator por diagnóstico"
```

---

## Parte 3 · Painel admin

### Task 13: Estoque baixo

**Files:**
- Create: `frontend/src/crud/produtos/estoque.ts`, `estoque.test.ts`
- Modify: `crud/produtos/filtrarProdutos.ts` + `filtrarProdutos.test.ts`, `paginas/admin/produtos/produtos.tsx`, `paginas/admin/lista-admin.css`, `paginas/portal/produto/produto.tsx`

**Interfaces:**
- Produces: `POUCO_ESTOQUE = 3`; `type SituacaoEstoque = "esgotado" | "baixo" | "ok"`; `situacaoEstoque(estoque: number): SituacaoEstoque`; `contarEstoque(produtos: Produto[]): { baixo: number; esgotados: number }` (só ativos; `baixo` inclui os esgotados). `FiltrosProduto` ganha `estoque: "" | "baixo" | "esgotado"` (inicial `""`).

- [ ] **Step 1: Testes**:
  - `situacaoEstoque` → `0` e `-1` "esgotado"; `1` e `3` "baixo"; `4` "ok";
  - `contarEstoque conta só ativos e baixo inclui esgotados`;
  - em `filtrarProdutos.test.ts`: `filtro estoque baixo inclui os esgotados`, `filtro esgotado mostra só estoque 0`, `estoque conta como filtro ativo`.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar** (`filtrarProdutos` usa `situacaoEstoque`; `contarFiltrosAtivosProduto` conta `estoque !== ""`). **Step 4: Rodar** → PASS.
- [ ] **Step 5: `produto.tsx`** importa `POUCO_ESTOQUE` de `estoque.ts` (sai a constante local).
- [ ] **Step 6: Admin produtos**:
  - filtro inicial lê `useSearchParams().get("estoque")` ("baixo" ou "esgotado"; outro valor é ignorado);
  - `<label>Estoque <select>` no `PainelFiltros` com "Todos", "Estoque baixo", "Esgotado";
  - `SeloEstoque` ao lado do `SeloInativo` em cards e lista: "esgotado" com a classe nova `lista-admin__selo--perigo` (`#fdecea` / `#c0392b`, os valores já usados no projeto) e "estoque baixo" com `lista-admin__selo--aviso`;
  - `handleDelete`: se a falha é `ErroApi` com `status === 409` e o produto está ativo, `window.confirm(`"${product.nome}" já aparece em pedidos ou ordens de serviço e não pode ser excluído. Desativar o produto? Ele sai da loja, mas continua no histórico.`)` → `atualizarProduto(product.id, { ...dados, ativo: false })` (os dados são o produto sem o `id`) → `avisar({ tipo: "sucesso", mensagem: "Produto desativado. Ele não aparece mais na loja." })`. Recusou → mostra o erro como hoje.
- [ ] **Step 7: Verificar**: `/admin/produtos?estoque=baixo` já abre filtrado; selos certos; excluir um produto com pedido oferece desativar e ele some da `/loja`.

### Task 14: Tela de pedidos (`/admin/pedidos`)

**Files:**
- Modify: `frontend/src/tipos/pedido.ts`, `frontend/src/api/pedidos.ts`, `frontend/src/api/pedidos.test.ts` (e qualquer fábrica de `Pedido` que o `tsc` apontar)
- Create: `frontend/src/crud/pedidos/filtrarPedidos.ts`, `filtrarPedidos.test.ts`, `frontend/src/crud/pedidos/usePedidosAdmin.ts`, `frontend/src/paginas/admin/pedidos/pedidos.tsx`, `pedidos.css`, `frontend/src/paginas/admin/pedidos/componentes/DetalhePedido/DetalhePedido.tsx`, `DetalhePedido.css`
- Modify: `frontend/src/App.tsx` (rota dentro do `RotaAdmin`)

**Interfaces:**
- Consumes: `listarPedidos`, `listarUsuarios`, `contemTexto` (`crud/busca.ts`), `codigoPedido`, rótulos e `pedidoRecebido` (Task 9), `Modal`, `BarraBusca`, `PainelFiltros`, `AlternarVisualizacao`, `useModoVisualizacao`, `useCarregarMais`, classes `selo-atendimento--*` de `SeloStatusAtendimento.css`.
- Produces: `Pedido.usuarioId: string`; `type PedidoComCliente = Pedido & { cliente: string }`; `comNomeDoCliente(pedidos: Pedido[], usuarios: Usuario[]): PedidoComCliente[]` ("Cliente removido" quando não acha); `type OrdemPedido = "recentes" | "antigos" | "maior-valor"`; `interface FiltrosPedido { busca: string; forma: "" | FormaPagamento; ordem: OrdemPedido }`; `FILTROS_PEDIDO_INICIAIS` (`ordem: "recentes"`); `filtrarPedidos(pedidos: PedidoComCliente[], filtros: FiltrosPedido): PedidoComCliente[]`; `contarFiltrosAtivosPedido(filtros: FiltrosPedido): number`; `usePedidosAdmin(): { pedidos: PedidoComCliente[]; carregando: boolean; erro: string | null; recarregar: () => void }`; `DetalhePedido({ pedido }: { pedido: PedidoComCliente })`.

- [ ] **Step 1: Testes**: em `pedidos.test.ts`, `paraPedido guarda o usuario_id` (`usuarioId: "u1"`); em `filtrarPedidos.test.ts`: `comNomeDoCliente põe o nome do dono e "Cliente removido" quando não acha`; `busca acha por cliente, número e nome de produto, sem acento`; `filtra por forma de pagamento`; `ordena por recentes (padrão), antigos e maior valor`; `contarFiltrosAtivosPedido conta forma e ordem fora do padrão (a busca não conta)`.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar** (`usuarioId` no tipo e no `paraPedido`; filtros como em `filtrarAtendimentos`). **Step 4: Rodar** → PASS (e `npx tsc -b` sem erro nas fábricas de `Pedido`).
- [ ] **Step 5: `usePedidosAdmin`** no molde do `usePedidos`, com `Promise.all([listarPedidos(token), listarUsuarios(token)])` e `comNomeDoCliente`.
- [ ] **Step 6: `DetalhePedido`**: data (`formatarDataHora`), cliente, status, forma de pagamento, tabela dos itens (produto, quantidade, unitário e subtotal à direita), total e endereço de entrega.
- [ ] **Step 7: `PaginaAdminPedidos`** no molde de `paginas/admin/atendimentos/atendimentos.tsx`: `h1` "Pedidos"; `BarraBusca` (placeholder "Buscar por cliente, número ou produto", rótulo "Buscar pedidos") + `PainelFiltros` (Forma de pagamento; Ordenar por: "Mais recentes", "Mais antigos", "Maior valor"); `AlternarVisualizacao` com `useModoVisualizacao("admin-pedidos")`; contador "N pedidos" / "N de M pedidos"; estados de carregando, erro e vazio. Card: "#{código} · {data}", cliente, resumo dos itens (`2× X, 1× Y`), "{forma} · {total}" e o selo de status (`PAGO`/`ENTREGUE` → `selo-atendimento--pago`, `ENVIADO` → `--agendado`, `PENDENTE` → `--a-pagar`, `CANCELADO` → `--cancelado`). Lista: Cliente | Pedido | Data | Total | Status. "Carregar mais (N restantes)" com `useCarregarMais` (12 por vez em cards, 20 em lista, como em atendimentos). Clicar abre `<Modal titulo={`Pedido #${codigo}`} largo>` com `DetalhePedido`. Ler `?pedido=<id>` da URL pra abrir o modal direto (usado pela Task 15).
- [ ] **Step 8: Verificar** com pedidos reais: busca por nome de produto acha; filtro de forma funciona; o modal mostra os itens com os preços do momento da compra.

### Task 15: Gestão de pagamentos (`/admin/pagamentos`)

**Files:**
- Create: `frontend/src/crud/pagamentos/lancamentos.ts`, `lancamentos.test.ts`, `frontend/src/paginas/admin/pagamentos/pagamentos.tsx`, `pagamentos.css`
- Modify: `frontend/src/crud/atendimentos/valorOs.ts` + `valorOs.test.ts` (`perguntaPagamento`), `paginas/admin/atendimento/atendimento.tsx` (`registrarPagamento` passa a usar `perguntaPagamento`), `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `totalOs`, `formatarReais`, `codigoAtendimento`, `codigoPedido`, `pedidoRecebido`, `PedidoComCliente` + `usePedidosAdmin` (Task 14), `useAtendimentos`, `marcarAtendimentoPago(token, id)`, `contemTexto`, `ChipsFiltro`, `DetalhePedido` (Task 14), `useAvisos`.
- Produces: `type SituacaoLancamento = "a-receber" | "recebido"`; `type FiltroSituacao = SituacaoLancamento | "todos"`; `interface Lancamento { id: string; origem: "os" | "pedido"; codigo: string; cliente: string; data: string /* ISO */; valor: number; situacao: SituacaoLancamento; formaPagamento: FormaPagamento | null }`; `lancamentosDePagamento(atendimentos: Atendimento[], pedidos: PedidoComCliente[]): Lancamento[]`; `resumoPagamentos(lancamentos: Lancamento[], hoje: Date): { aReceber: { valor: number; quantidade: number }; recebidoNoMes: { valor: number; pedidos: number; os: number } }`; `filtrarLancamentos(lancamentos: Lancamento[], filtros: { situacao: FiltroSituacao; busca: string }): Lancamento[]`; `contarPorSituacao(lancamentos: Lancamento[]): Record<FiltroSituacao, number>`; `perguntaPagamento(valor: number): string`.

- [ ] **Step 1: Testes** (atendimentos com `atendimentoDeTeste` de `crud/atendimentos/atendimentoDeTeste.ts`; datas montadas no horário local com `new Date(2026, 9, 1, 0, 5).toISOString()`):
  - `OS concluída sem pagoEm vira a receber com o totalOs` (mão de obra 100 + 2 × 25 → 150, data = dia e horário da visita);
  - `OS concluída com pagoEm vira recebido na data do pagamento`;
  - `OS não concluída fica de fora`;
  - `OS concluída com total 0 continua a receber` (Review Focus 2);
  - `pedido PAGO, ENVIADO e ENTREGUE é recebido; PENDENTE é a receber; CANCELADO fica de fora`;
  - `resumoPagamentos conta o pagamento de 00:05 do dia 1 e não o de 23:55 do mês anterior` (`hoje = new Date(2026, 9, 28)`; Review Focus 3);
  - `resumoPagamentos soma em centavos` (0,10 + 0,20 → 0,3 exato);
  - `filtrarLancamentos filtra por situação e busca (cliente ou código) e ordena do mais recente`;
  - `contarPorSituacao conta a receber, recebidos e todos`;
  - em `valorOs.test.ts`: `perguntaPagamento avisa quando o total é zero` (o texto atual da OS de R$ 0,00) e `perguntaPagamento mostra o valor` (`"Registrar o pagamento de R$ 150,00? Depois disso a OS não pode mais mudar."`).
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar** (`perguntaPagamento` com os dois textos que hoje estão em `atendimento.tsx`, que passa a chamá-la). **Step 4: Rodar** → PASS.
- [ ] **Step 5: `PaginaAdminPagamentos`**: `h1` "Gestão de pagamentos" e, à direita, a nota curta "Pedidos já entram pagos (simulação)." em `--color-text-muted`; `ChipsFiltro` com "A receber (n)", "Recebidos (n)", "Todos (n)", começando em "A receber"; um `<input type="search">` com o visual do campo da `BarraBusca` (a `BarraBusca` exige o botão de filtros, que esta tela não tem); lista no padrão `lista-admin__compacta` com Tipo ("OS"/"Pedido"), Código, Cliente, Data ("dd/mm" + " · {forma}" nos pedidos), Valor (à direita, tabular), Situação (`selo-atendimento--a-pagar` "A receber" / `--pago` "Recebido") e a ação. Ação de OS a receber: botão "Marcar como pago" → `window.confirm(perguntaPagamento(valor))` → `marcarAtendimentoPago` → `avisar({ tipo: "sucesso", mensagem: `Pagamento de ${formatarReais(valor)} registrado.` })` → `recarregar()` dos atendimentos; enquanto envia, o botão da linha mostra "Registrando…" desativado; erro vai pro `lista-admin__aviso`. OS recebida: link "Ver OS" (`/admin/atendimentos/:id`). Pedido: "Ver pedido" abre o `Modal` com `DetalhePedido`. Estados de carregando, erro (de qualquer uma das duas buscas) e vazio ("Nada a receber." no chip "A receber"). No celular, a linha vira duas linhas (identidade e valor em cima; data, situação e ação embaixo).
- [ ] **Step 6: Verificar** com dados reais: uma OS concluída aparece em "A receber" com o mesmo total da tela da OS; marcar como pago passa a linha pra "Recebidos" e a OS fica fechada na tela dela.

### Task 16: Números e áreas novas na home do admin

**Files:**
- Create: `frontend/src/paginas/admin/inicio/componentes/NumerosPainel/NumerosPainel.tsx`, `NumerosPainel.css`
- Modify: `frontend/src/paginas/admin/inicio/inicio.tsx`, `inicio.css`

**Interfaces:**
- Consumes: `useAtendimentos`, `usePedidosAdmin`, `useProdutos`, `contarPorStatus`, `lancamentosDePagamento` + `resumoPagamentos` (Task 15), `contarEstoque` (Task 13), `formatarReais`.
- Produces: `NumerosPainel()` sem props.

- [ ] **Step 1: `NumerosPainel`**: um bloco só, dividido em 4 links (rótulo em cima, número embaixo, uma linha de detalhe), sem ícone, com borda `1px solid var(--color-border-soft)` e divisórias internas da mesma cor (no celular, 2 × 2):
  - "A receber" → `formatarReais(aReceber.valor)`, detalhe "{n} a receber" → `/admin/pagamentos`;
  - "Recebido em {mês por extenso}" → valor, detalhe "{p} pedidos · {o} OS" → `/admin/pagamentos`;
  - "Atendimentos aguardando" → `contarPorStatus(...).aguardando`, detalhe "para confirmar" → `/admin/atendimentos`;
  - "Estoque baixo" → `contarEstoque(...).baixo`, detalhe "{e} esgotado(s)" → `/admin/produtos?estoque=baixo`.
  Enquanto a busca de um número carrega, ele mostra "—"; se ela falhar, aquele link some e os outros ficam.
- [ ] **Step 2: `inicio.tsx`**: `NumerosPainel` entre o subtítulo e a grade; `AREAS_ADMIN` ganha `{ id: "pedidos", titulo: "Pedidos", descricao: "Compras feitas na loja virtual", rota: "/admin/pedidos" }` e `{ id: "pagamentos", titulo: "Pagamentos", descricao: "O que falta receber e o que já entrou", rota: "/admin/pagamentos" }` (ícones de traço 24px como os vizinhos: sacola e carteira); o cartão "Em breve" e sua regra `--em-breve` em `inicio.css` saem; a descrição de "Atendimentos" vira "Visitas e ordens de serviço" (pra não confundir com Pedidos). O `NumerosPainel` busca os próprios dados; `inicio.tsx` deixa de chamar `useAtendimentos` e o cartão de Atendimentos passa a mostrar só a descrição (o "N aguardando confirmação" agora está na faixa de números).
- [ ] **Step 3: Verificar** a 1440 e 390px: os quatro números batem com as telas de destino; cada link leva ao lugar certo (o de estoque já filtrado).

### Task 17: Fechar a Parte 3 e abrir o PR

- [ ] **Step 1:** `npm run test`, `npm run lint`, `npm run build` → passam.
- [ ] **Step 2:** passada a 1440 e 390px nas quatro telas do admin, com dados reais e com a API desligada (estados de erro com "Tentar novamente").
- [ ] **Step 3: Commit**

```bash
git add frontend/src
git commit -m "feat: painel com pagamentos, pedidos, números na home e estoque baixo"
```

- [ ] **Step 4: Revisão do branch inteiro** (superpowers:requesting-code-review) e correções.
- [ ] **Step 5: PR**: `git push origin eduardo` e `gh pr create --base main --head eduardo` com título "Motion discreto e melhorias de experiência (portal e painel)", o resumo das três partes, como testar, e a seção "Recado pro backend" copiada da spec, terminando com `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
