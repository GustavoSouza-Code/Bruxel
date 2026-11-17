# Dashboard e relatórios no painel: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consumir no front as rotas `/api/dashboard/*` e `/api/reports/*` do PR #98. A home do painel ganha uma dashboard leve e é criada a tela `/admin/relatorios`.

**Architecture:** Funções de api finas (`api/dashboard.ts`, `api/relatorios.ts`). Funções puras testadas com Vitest (`crud/dashboard/`, `crud/relatorios/`), hooks no padrão do `usePedidosAdmin`, e dois componentes SVG próprios (`GraficoBarras`, `GraficoRosca`) usados nas duas telas.

**Tech Stack:** React 19 + TypeScript, react-router-dom 7, Vitest (só `.ts`, sem DOM), CSS puro com os tokens de `estilos/tokens.css`.

**Spec:** `docs/superpowers/specs/2026-11-16-dashboard-relatorios-front-design.md`

## Global Constraints

- Não alterar nada em `backend/`.
- Nenhuma dependência nova (sem lib de gráficos).
- Cores: verde `#1e7a3c` (selo `#e3f5e8`), amarelo da faixa `#f5a623` e valor `#8a6100`, vermelho `#c0392b` (selo `#fdecea`), laranja da faixa 7–29 dias `#e67e22` com texto `#a04f00`, azul `--color-accent`. Barras: loja `--color-primary`, serviços `--color-accent`. Rosca: `--color-primary`, `--color-accent`, `--color-wave`, `--color-accent-light` e cinza `#b8b8c4` para "Outras".
- Celular (< 600px): todos os blocos em coluna, separados por gap de cerca de 12px. Tela de Relatórios: um bloco por linha em todas as larguras. Home no computador: barras e rosca lado a lado (1.6fr / 1fr).
- Textos em pt-BR com acento, e comentários no estilo do projeto.
- Não commitar sem o ok do Eduardo. Branch `feat/dashboard-relatorios-front`, a partir da `eduardo`.

## Review Focus

- **Mês sem vendas** (`receita-por-categoria` vazio, todos os meses zerados): mostrar o estado vazio em vez de uma rosca ou eixo quebrado. Teste em `fatiasRosca([])` e `escalaBarras` com tudo zero.
- **`variacaoPercentual: null`:** mostrar "sem receita em <mês>", não "NaN%". Teste em `textoVariacao`.
- **Erro 400 do relatório** (período invertido, mais de 5000 linhas): a mensagem do back aparece na tela, inclusive quando vem do download (blob). Teste no `baixarArquivo` com resposta 400 JSON.
- **Pagamento "a-receber" com situação diferente de CONCLUIDO:** a query força `CONCLUIDO`. Teste em `montarQueryRelatorio`.
- **Fuso no período padrão:** usar a data local, não `toISOString()`, porque perto da meia-noite em UTC-3 ela vira o dia seguinte. Teste em `periodoPadrao(new Date(2026, 10, 16, 23, 30))`.

---

### Task 1: api do dashboard e dos relatórios + download

**Files:**
- Create: `frontend/src/api/dashboard.ts`, `frontend/src/api/relatorios.ts`
- Modify: `frontend/src/api/cliente.ts` (adicionar `baixarArquivo`)
- Test: `frontend/src/api/relatorios.test.ts`

**Interfaces (Produces):**
- `api/dashboard.ts`: os tipos `KpisDashboard`, `ReceitaMensalLinha`, `ReceitaPorCategoriaLinha`, `FaixaAtraso`, `FaixaAReceber`, `OsAReceber` e `AReceberDashboard` copiam os campos do `backend/src/models/dashboard.ts` do PR #98 (`data_hora` como `string`). Funções: `buscarKpis(token): Promise<KpisDashboard>`, `buscarReceitaMensal(token, meses: number): Promise<ReceitaMensalLinha[]>`, `buscarReceitaPorCategoria(token): Promise<ReceitaPorCategoriaLinha[]>`, `buscarAReceber(token): Promise<AReceberDashboard>`.
- `api/relatorios.ts`: `type TipoRelatorio = "pedidos" | "atendimentos"`, `interface ColunaRelatorio { titulo: string; tipo: "texto" | "moeda"; peso: number }`, `interface Relatorio { titulo; periodo; geradoEm; colunas: ColunaRelatorio[]; linhas: (string|number)[][]; totais: { rotulo: string; centavos: number }[] }`, `buscarRelatorio(token, tipo, query: string): Promise<Relatorio>` e `baixarRelatorio(token, tipo, formato: "csv" | "pdf", query: string): Promise<void>`. O nome do arquivo é `relatorio-${tipo}-${AAAA-MM-DD local}.${formato}`.
- `api/cliente.ts`: `baixarArquivo(caminho: string, token: string, nomeArquivo: string): Promise<void>`. Mesmos erros que a `requisicao` (`ErroApi` 0 sem conexão, `paraErroApi` lendo o JSON do corpo de erro, 401 chama `aoSessaoExpirar`). Em caso de sucesso faz `blob` → `URL.createObjectURL` → `<a download>` com click → `revokeObjectURL`.

- [ ] **Step 1: Testes que falham** em `relatorios.test.ts`, com `vi.stubGlobal("fetch", ...)`:
  - `buscarRelatorio("t", "atendimentos", "inicio=2026-11-01")` chama `${URL_BASE}/reports/atendimentos?inicio=2026-11-01&formato=json` com `Authorization: Bearer t`.
  - `baixarRelatorio` com resposta 400 `{ mensagem: "O relatório passa de 5000 linhas. Reduza o período." }` rejeita com um `ErroApi` com `status` 400 e essa `mensagem`.
  - `baixarRelatorio` chama `/reports/pedidos?…&formato=pdf` (stub de `URL.createObjectURL` / `document` mínimo via `vi.stubGlobal`).
- [ ] **Step 2:** `cd frontend && npx vitest run src/api/relatorios.test.ts` deve dar FAIL (módulo inexistente).
- [ ] **Step 3:** Implementar os três arquivos.
- [ ] **Step 4:** O mesmo comando deve dar PASS.

### Task 2: funções puras do dashboard

**Files:**
- Create: `frontend/src/crud/dashboard/graficos.ts`, `frontend/src/crud/dashboard/textos.ts`
- Test: `frontend/src/crud/dashboard/graficos.test.ts`, `frontend/src/crud/dashboard/textos.test.ts`

**Interfaces (Produces):**
- `rotuloMes(mes: "AAAA-MM", longo?: boolean): string`: `"2026-11"` vira `"nov"`, e com longo vira `"novembro"`.
- `escalaBarras(linhas: ReceitaMensalLinha[], marcas = 4): { maximo: number; marcas: number[] }`: o máximo da soma loja+serviços, arredondado para cima para um valor "redondo" (1, 2 ou 5 × 10ⁿ). `marcas` vão de 0 ao máximo em `marcas` passos. Com tudo zero: `{ maximo: 0, marcas: [0] }`.
- `fatiasRosca(linhas: ReceitaPorCategoriaLinha[], maxFatias = 5): { label: string; value: number; percentual: number; cor: string }[]`: ordena por valor (maior primeiro). Acima de `maxFatias`, as 4 maiores ficam e o resto vira "Outras". Ignora valores ≤ 0. A soma dos percentuais (inteiros) dá 100. As cores seguem a ordem das Global Constraints, com "Outras" sempre em cinza.
- `textoVariacao(variacao: number | null, mesAnterior: string): { texto: string; tom: "alta" | "queda" | "neutro" }`: `12.4` vira `{ "▲ 12%", alta }`, `-3` vira `{ "▼ 3%", queda }`, `0` vira `{ "0%", neutro }`, e `null` vira `{ "sem receita em outubro", neutro }`.
- `formatarCentavos(centavos: number): string`, reaproveitando `formatarReais(centavos / 100)`.
- `reaisCurtos(valor: number): string`: `5900` vira `"R$ 5,9 mil"` e `950` vira `"R$ 950"` (eixo e centro da rosca).

- [ ] **Step 1: Testes que falham** com os exemplos acima, mais: 7 categorias geram 5 fatias com a última `"Outras"` somando as 3 menores; percentuais `[33.3, 33.3, 33.3]` somam 100; `escalaBarras` com máximo 8420 dá `maximo` 10000 e `marcas` `[0, 2500, 5000, 7500, 10000]`.
- [ ] **Step 2:** `npx vitest run src/crud/dashboard` deve dar FAIL.
- [ ] **Step 3:** Implementar. Os percentuais saem pelo método do maior resto, para a soma fechar 100.
- [ ] **Step 4:** O mesmo comando deve dar PASS.

### Task 3: filtros do relatório

**Files:**
- Create: `frontend/src/crud/relatorios/filtros.ts`
- Test: `frontend/src/crud/relatorios/filtros.test.ts`

**Interfaces (Produces):**
- `interface FiltrosRelatorio { inicio: string; fim: string; status: string; pagamento: "" | "pago" | "a-receber" }` (strings `AAAA-MM-DD`, e `""` quer dizer "todos").
- `periodoPadrao(hoje: Date): { inicio: string; fim: string }`: do 1º dia do mês até hoje, em data local.
- `montarQueryRelatorio(tipo: TipoRelatorio, filtros: FiltrosRelatorio): string`: sem `?` e sem os campos vazios. `pagamento` só vai em `atendimentos`. Com `pagamento: "a-receber"`, `status` vira `CONCLUIDO`.
- `OPCOES_STATUS: Record<TipoRelatorio, { valor: string; rotulo: string }[]>`: os rótulos são os mesmos do `reportsService` do back (Pendente, Pago, Enviado, Entregue, Cancelado / Disponível, Aguardando confirmação, Agendado, Em andamento, Concluído, Cancelado, Recusado), com `{ "", "Todas" }` primeiro.

- [ ] **Step 1: Testes que falham:** `periodoPadrao(new Date(2026, 10, 16, 23, 30))` dá `{ inicio: "2026-11-01", fim: "2026-11-16" }`; `montarQueryRelatorio("pedidos", { …pagamento: "pago" })` não inclui `pagamento`; `("atendimentos", { status: "AGENDADO", pagamento: "a-receber" })` contém `status=CONCLUIDO&pagamento=a-receber`; filtros vazios dão `""`.
- [ ] **Step 2:** `npx vitest run src/crud/relatorios` deve dar FAIL.
- [ ] **Step 3:** Implementar com `URLSearchParams`.
- [ ] **Step 4:** O mesmo comando deve dar PASS.

### Task 4: hooks e componentes de gráfico

**Files:**
- Create: `frontend/src/crud/dashboard/useDashboard.ts`, `frontend/src/crud/relatorios/useRelatorio.ts`
- Create: `frontend/src/componentes/graficos/GraficoBarras/GraficoBarras.tsx` + `.css`, `frontend/src/componentes/graficos/GraficoRosca/GraficoRosca.tsx` + `.css`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces:
  - `useBusca<T>(buscar: (token: string) => Promise<T>, deps: unknown[]): { dados: T | null; carregando: boolean; erro: string | null; recarregar(): void }`, genérico e no padrão do `usePedidosAdmin` (cancelado, tentativa). Exporta também `useKpis()`, `useReceitaMensal(meses)`, `useReceitaPorCategoria()` e `useAReceber()`.
  - `useRelatorio(tipo, filtros)`: `{ relatorio, carregando, erro, baixando: "csv" | "pdf" | null, erroDownload, baixar(formato) }`. Busca a prévia quando muda o tipo ou a query (debounce de 300ms nas datas).
  - `<GraficoBarras linhas compacto? />`: SVG com `viewBox`, barras empilhadas (loja embaixo, serviços em cima), eixo Y com `escalaBarras(...).marcas` (escondido no `compacto`) e o mês atual em negrito. Cada barra é um `<g tabIndex={0}>` e, no hover, foco ou toque, mostra um balão com "Mês / Loja R$ / Serviços R$". `role="img"` com `aria-label` resumindo o último mês. Animação de crescimento em `transform: scaleY` com `--ease-out`, desligada em `prefers-reduced-motion`. Com tudo zero mostra o texto "Nenhuma receita no período".
  - `<GraficoRosca linhas compacto? />`: arcos com `stroke-dasharray` sobre `fatiasRosca`, o total `reaisCurtos` no centro e a legenda em HTML (nome · %). Vazio: "Nenhuma venda este mês ainda".

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `cd frontend && npx tsc -b && npx eslint src` sem erros.

### Task 5: home do painel com dashboard leve

**Files:**
- Modify: `frontend/src/paginas/admin/inicio/componentes/NumerosPainel/NumerosPainel.tsx` + `.css`
- Create: `frontend/src/paginas/admin/inicio/componentes/GraficosPainel/GraficosPainel.tsx` + `.css`
- Modify: `frontend/src/paginas/admin/inicio/inicio.tsx` (cartão "Relatórios" em primeiro nas `AREAS_ADMIN`, com rota `/admin/relatorios`, ícone de gráfico e a descrição "Gráficos e exportação"; `<GraficosPainel />` logo depois do `<NumerosPainel />`)

**Interfaces:** Consumes `useKpis`, `useReceitaMensal(6)`, `useReceitaPorCategoria`, `textoVariacao`, `GraficoBarras compacto`, `GraficoRosca compacto`.

- [ ] **Step 1:** `NumerosPainel` passa a usar só o `useKpis`. Os itens são: Receita de <mês> (verde, selo de variação, link `/admin/relatorios`); A receber (amarelo, "N OS" e selo vermelho "N atrasadas" quando > 0, link para pagamentos como hoje); Atendimentos aguardando (azul); Estoque baixo (vermelho, "produtos para repor", link igual ao de hoje). Cada um ganha um modificador `numeros-painel__item--<tom>`, que desenha a faixa de 4px (`::before`) e a cor do valor. Com erro no `/kpis`, o componente devolve `null`.
- [ ] **Step 2:** No CSS, abaixo de 600px vira coluna única com `gap: 12px`. O fundo deixa de aparecer no gap (`background: none`), e cada item ganha borda e `border-radius: 12px` próprios.
- [ ] **Step 3:** `GraficosPainel` usa uma grade `1.6fr 1fr` com o título "Receita · 6 meses" + "Ver relatórios →" e "Loja por categoria". Abaixo de 600px vira coluna com gap de 12px. Cada bloco some sozinho se a busca dele falhar.
- [ ] **Step 4:** `npx tsc -b && npx eslint src && npx vitest run` deve passar.

### Task 6: tela /admin/relatorios

**Files:**
- Create: `frontend/src/paginas/admin/relatorios/relatorios.tsx` + `relatorios.css`
- Create: `frontend/src/paginas/admin/relatorios/componentes/QuemCobrar/QuemCobrar.tsx` + `.css`, `.../GerarRelatorio/GerarRelatorio.tsx` + `.css`
- Modify: `frontend/src/App.tsx` (rota `/admin/relatorios` dentro da `RotaAdmin`)

**Interfaces:** Consumes Tasks 1–4.

- [ ] **Step 1:** Página com `<NavAdmin />`, `<Container>`, link "← Painel", o h1 "Relatórios" e o subtítulo "Receita da loja e dos serviços, cobranças e exportação". Os blocos ficam em coluna única com gap de cerca de 16px: (1) barras com seletor 3/6/12 (botões `aria-pressed`, guardados em `?meses=` na URL); (2) rosca com a dica "Vendas de <mês>", centralizada com `max-width` de cerca de 420px no SVG; (3) `QuemCobrar`; (4) `GerarRelatorio`.
- [ ] **Step 2:** `QuemCobrar` mostra as 3 faixas (rótulos "Até 7 dias", "7 a 29 dias", "30 dias ou mais", com as cores das Global Constraints) e a tabela com OS (link para `/admin/atendimentos/:id`, código com os 8 primeiros caracteres em maiúsculas), cliente (`null` vira "Cliente do balcão"), telefone (`null` vira "—"), visita (dd/mm), atraso (selo âmbar abaixo de 30 dias e vermelho a partir de 30) e valor. Tem o link "Ver pagamentos →". Sem OS: "Nenhuma cobrança pendente".
- [ ] **Step 3:** `GerarRelatorio` tem abas (`role="tablist"`) Pedidos/OS, os campos De/Até (`type="date"`), Situação (select com `OPCOES_STATUS`) e Pagamento (só na aba OS; com "A receber" a situação fica desabilitada mostrando "Concluído"). A prévia é a tabela das `colunas`/`linhas` (moeda com `formatarCentavos`, alinhada à direita) dentro de um contêiner com `overflow-x: auto`, mostrando as primeiras 50 linhas e "… mais N" depois. Depois vêm os totais e os botões "Baixar planilha (CSV)" (secundário) e "Baixar PDF" (primário), com o estado "Gerando…". Os erros (`erro` / `erroDownload`) aparecem embaixo dos filtros com `role="alert"`.
- [ ] **Step 4:** `npx tsc -b && npx eslint src && npx vitest run` deve passar.
- [ ] **Step 5 (verificação no navegador):** subir o back da branch `feat/dashboard-relatorios` (worktree temporário, sem alterar arquivos) e o front, entrar como admin, conferir `/admin` e `/admin/relatorios` no computador e com `resize_window` mobile, baixar PDF e CSV, e tirar screenshot.

### Task 7: fechamento

- [ ] Rodar `npm run build` no `frontend/` sem erros.
- [ ] Mostrar o diff ao Eduardo e pedir o ok antes de commitar.
