# OS atrasadas e cobrança pelo WhatsApp — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar no painel as OS concluídas e não pagas há 7 dias ou mais (e há 30 ou mais), deixar
o admin cobrar o cliente pelo WhatsApp com uma mensagem editável que leva o link da OS, e dar ao
cliente uma página própria pra ver aquela OS.

**Architecture:** As regras ficam em funções puras com teste (`crud/pagamentos/atraso.ts`,
`crud/pagamentos/cobrancasLocais.ts`, textos em `crud/atendimentos/whatsapp.ts`, extensões de
`lancamentos.ts` e `filtrarAtendimentos.ts`). A tela usa três peças compartilhadas na pasta da OS do
painel: `SeloAtraso`, `CaixaCobranca` e `ModalCobrancaOs`. Elas entram em pagamentos, na lista de
atendimentos, na tela da OS e na home. O cliente ganha a rota `/minha-conta/atendimentos/:id`.

**Tech Stack:** React 19 + TypeScript, react-router-dom 7, CSS puro, Vitest. Sem dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-28-cobranca-os-atrasadas-design.md`

## Global Constraints

- Nada em `backend/`. Pedidos ficam de fora.
- O atraso conta do dia da visita (`data` + `horario`, no relógio local). A partir de 7 dias é
  "semana" e de 30 é "mês". Só vale pra OS `concluido` sem `pagoEm`.
- Rótulos exatos: "Atrasada há N dias" (7–29), "Atrasada há 1 mês", "Atrasada há N meses" (`Math.floor(dias / 30)`).
- Texto padrão da cobrança, exato (com uma quebra de linha antes da última frase):
  `Olá, {primeiro nome}! Aqui é da Bruxel Piscinas. O pagamento da ordem de serviço #{código} ({tipo}, visita em {dd/mm}), no valor de {R$ total}, ainda está em aberto. Você pode ver a OS aqui: {link}`
  `Qualquer dúvida, é só responder esta mensagem.`
- Link da OS: `${window.location.origin}/minha-conta/atendimentos/${id}`.
- "Cobrado em" só no navegador: `localStorage` com a chave `bruxel:cobrancas`, sempre em `try/catch`.
- Cores do selo de atraso: semana `#fdf3d7`/`#8a6100`; mês `#fdecea`/`#c0392b`. "A receber"
  recente em pagamentos: `#f1f1f4`/`#5f6368`.
- O estilo do botão "Abrir no WhatsApp" é o mesmo do `cartao-cliente-os__whatsapp`.
- Comportamento em `.tsx`, CSS só pra estilo. Motion só pelos padrões que já existem (Modal, avisos).
- Um commit `feat:` no fim, na `eduardo`, com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **OS concluída sem telefone válido**: a caixa mostra "Esta OS não tem telefone com DDD. Cobre
   o cliente por outro canal." e não aparece link quebrado. Verificação manual na Task 4.
2. **Texto editado com caracteres especiais e quebras de linha**: o `wa.me` leva o texto exato
   (`encodeURIComponent`). Teste na Task 2.
3. **Visita no futuro ou hoje**: `diasDesdeVisita` dá 0 e nunca fica negativo, então não há selo
   de atraso. Teste na Task 2.
4. **Clicar no "Cobrar" de um card da lista não pode navegar pra OS** (link esticado por baixo), e
   o resto do card continua abrindo a OS. Verificação manual na Task 6.
5. **OS de outra conta** em `/minha-conta/atendimentos/:id`: o backend responde 403, e a tela
   mostra "OS não encontrada", não o erro genérico. Verificação na Task 8.

---

### Task 1: Regras puras — atraso, cobrança e cobranças locais

**Files:** Create `crud/pagamentos/atraso.ts` (+ test), `crud/pagamentos/cobrancasLocais.ts` (+ test),
`hooks/useCobrancasLocais.ts`. Modify `crud/atendimentos/whatsapp.ts` (+ `whatsapp.test.ts`).

**Produces:**
- `LIMITE_SEMANA = 7`, `LIMITE_MES = 30`, `type NivelAtraso = "em-dia" | "semana" | "mes"`;
- `diasDesdeVisita(a: Pick<Atendimento, "data" | "horario">, hoje: Date): number`;
- `nivelAtraso(dias: number): NivelAtraso`;
- `estaAtrasada(a: Atendimento, hoje: Date): boolean`;
- `rotuloAtraso(dias: number): string`;
- `linkOsCliente(id: string, origem: string): string`;
- `textoCobranca(a: Pick<Atendimento, "id" | "cliente" | "tipo" | "data" | "produtosUsados" | "valorMaoDeObra">, linkOs: string): string`;
- `CHAVE_COBRANCAS`, `lerCobrancas(texto: string | null): Record<string, string>`,
  `registrarCobranca(mapa: Record<string, string>, id: string, quando: Date): Record<string, string>`;
- `useCobrancasLocais(): { cobradoEm: (id: string) => string | null; registrar: (id: string) => void }`.

- [ ] **Step 1: Testes (RED).**
  - `atraso.test.ts`:
    - `diasDesdeVisita` dá 0 antes da visita e no próprio dia, 7 no sétimo dia, e conta a
      virada de mês no relógio local (datas com `new Date(2026, 9, 28)`);
    - `nivelAtraso`: 6 → em-dia, 7 → semana, 29 → semana, 30 → mes;
    - `estaAtrasada`: só concluída, sem `pagoEm` e com 7 dias ou mais (paga, em andamento e
      recente dão false);
    - `rotuloAtraso`: 10 → "Atrasada há 10 dias", 30 → "Atrasada há 1 mês", 65 → "Atrasada há 2 meses".
  - `whatsapp.test.ts`:
    - `textoCobranca` com o texto exato dos Global Constraints, usando
      `atendimentoDeTeste({ tipo: "limpeza", data: "2026-10-18", valorMaoDeObra: 480 })`;
    - `linkOsCliente("abc", "https://bruxel.test")` → `"https://bruxel.test/minha-conta/atendimentos/abc"`;
    - `linkWhatsApp` com um texto que tem quebra de linha e "R$" leva `%0A` e `R%24`.
  - `cobrancasLocais.test.ts`: `null`, `"{"` e `"[]"` → `{}`; valor que não é string é
    descartado; `registrarCobranca` põe ou sobrescreve o ISO sem alterar o mapa original.
- [ ] **Step 2: Rodar** os três arquivos → FAIL. **Step 3: Implementar.** **Step 4: Rodar** → PASS.
- [ ] **Step 5: `useCobrancasLocais`**: estado inicial lido do `localStorage` com `try/catch` e
  gravação no `registrar`, que usa a data de agora.

### Task 2: Lançamentos e filtro de atendimentos com atrasadas

**Files:** Modify `crud/pagamentos/lancamentos.ts` (+ test), `crud/atendimentos/filtrarAtendimentos.ts` (+ test).

**Produces:**
- `Lancamento.diasEmAberto: number | null`;
- `lancamentosDePagamento(atendimentos, pedidos, hoje = new Date())`;
- `FiltroSituacao` inclui `"atrasadas"`; `contarPorSituacao` devolve `atrasadas`;
- `resumoPagamentos(...).aReceber.atrasadas: number`;
- `FiltroPagamento` inclui `"atrasado"`;
- `filtrarAtendimentos(atendimentos, filtros, hoje = new Date())`.

- [ ] **Step 1: Testes (RED).**
  - em `lancamentos.test.ts`:
    - "diasEmAberto só em OS a receber" (paga e pedido dão `null`);
    - "filtro atrasadas traz só OS a receber com 7 dias ou mais";
    - `contarPorSituacao` com `atrasadas`;
    - `resumoPagamentos` com `aReceber.atrasadas`.
  - em `filtrarAtendimentos.test.ts`:
    - "pagamento atrasado traz só concluídas não pagas com 7 dias ou mais";
    - "a-pagar continua trazendo todas as não pagas".
  - Os testes que já existem continuam passando.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar** (`estaAtrasada` e `diasDesdeVisita` da Task 1). **Step 4: Rodar** → PASS.

### Task 3: `SeloAtraso`

**Files:** Modify `paginas/admin/atendimentos/componentes/SeloStatusAtendimento/SeloStatusAtendimento.tsx` + `.css`.

- [ ] **Step 1:** `SeloAtraso({ dias }: { dias: number })` usa as classes
  `selo-atendimento selo-atendimento--atraso-{semana|mes}` e mostra o `rotuloAtraso(dias)`.
  As cores são as dos Global Constraints, e o `nowrap` é o que o selo já tem.

### Task 4: `CaixaCobranca` e `ModalCobrancaOs`

**Files:** Create `paginas/admin/atendimento/componentes/CaixaCobranca/` and `.../ModalCobrancaOs/` (tsx + css).

**Produces:**
- `CaixaCobranca({ atendimento }: { atendimento: Atendimento })`;
- `ModalCobrancaOs({ atendimento, onFechar, onMarcarPago, pagando }: { atendimento: Atendimento; onFechar: () => void; onMarcarPago?: () => void; pagando?: boolean })`.

- [ ] **Step 1: `CaixaCobranca`**:
  - título "Cobrar pelo WhatsApp" e `<textarea>` (6 linhas) com o `textoCobranca`, editável;
  - "Voltar ao texto padrão" só quando o texto foi editado;
  - "Para {telefone formatado (51) 99876-5432}";
  - "Abrir no WhatsApp" é um `<a target="_blank" rel="noreferrer">` com
    `linkWhatsApp(telefone, texto)`. No `onClick`, chama `registrar(id)` e
    `avisar({ tipo: "info", mensagem: "Cobrança aberta no WhatsApp." })`;
  - sem telefone válido: mostra a frase da Review Focus 1 no lugar do botão;
  - "Cobrado em dd/mm (neste navegador)" quando `cobradoEm(id)` existe;
  - o `<label>` da textarea fica ligado a ela por `id`.
- [ ] **Step 2: `ModalCobrancaOs`**:
  - `<Modal titulo={`OS #${código}`} largo>` com a grade de dados: Cliente, Visita
    (`formatarDataHora` da visita), Total (`totalOs`, tabular) e Situação (`SeloAtraso` ou
    "A receber");
  - `CaixaCobranca` quando `estaAtrasada(atendimento, new Date())`;
  - ações: "Marcar como pago" (`lista-admin__botao`, só com `onMarcarPago`, desativado e
    "Registrando…" enquanto `pagando`) e o link "Abrir a OS completa".
- [ ] **Step 3: Verificar** no navegador: OS com e sem telefone; o texto editado vai no `href`;
  "Voltar ao texto padrão"; "Cobrado em" depois de clicar (sem abrir o WhatsApp de verdade:
  conferir o `href`).

### Task 5: Pagamentos e home

**Files:** Modify `paginas/admin/pagamentos/pagamentos.tsx` + `.css`, `paginas/admin/inicio/componentes/NumerosPainel/NumerosPainel.tsx`.

- [ ] **Step 1: Pagamentos**:
  - os chips ficam na ordem "A receber", "Atrasadas", "Recebidos", "Todos";
  - o inicial vem de `useSearchParams().get("situacao")`, se for válido;
  - selo: `SeloAtraso` quando `diasEmAberto >= 7`, senão "A receber" em cinza, ou "Recebido";
  - linha de OS: "Ver OS" (contorno), que abre o `ModalCobrancaOs` com o atendimento achado em
    `atend.atendimentos`, e "Marcar como pago" se a receber;
  - o modal recebe `onMarcarPago` (o mesmo `marcarPago`) e fecha depois do pagamento;
  - a coluna de ação cresce pra caber os dois botões, com largura fixa como hoje.
- [ ] **Step 2: Home**: com `aReceber.atrasadas > 0`, o detalhe vira
  "{n} a receber · {m} atrasada(s)" e o link vai pra `/admin/pagamentos?situacao=atrasadas`.

### Task 6: Lista de atendimentos

**Files:** Modify `paginas/admin/atendimentos/atendimentos.tsx` + `.css`.

- [ ] **Step 1:**
  - **Filtros**: o Pagamento ganha "Atrasados" (`"atrasado"`); `?pagamento=atrasado` na URL
    abre o filtro com o chip "Concluídos" e o painel aberto.
  - **Link esticado nos cards e nas linhas**:
    - o `<Link>` vira um `<div>` com a classe atual mais um `<Link className="pagina-admin-atendimentos__link"
      aria-label="Abrir OS #código">` absoluto (`inset: 0`);
    - o conteúdo fica com `pointer-events: none`, menos o botão;
    - o hover e o foco continuam marcando o card ou a linha (`:has(... :focus-visible)`).
  - **OS atrasada**:
    - o selo de pagamento vira o `SeloAtraso`;
    - entra o botão "Cobrar" (`lista-admin__botao lista-admin__botao--contorno`,
      `position: relative; z-index: 1`), que abre o `ModalCobrancaOs` sem `onMarcarPago`.
- [ ] **Step 2: Verificar** nos dois modos:
  - "Cobrar" abre o modal e não navega;
  - clicar no resto abre a OS;
  - o Tab passa pelo link e depois pelo botão;
  - o "afundar" não pega as linhas.

### Task 7: Tela da OS

**Files:** Modify `paginas/admin/atendimento/atendimento.tsx` + `.css`.

- [ ] **Step 1:** Com `estaAtrasada(atendimento, new Date())`, entra antes do `CartaoClienteOs`
  uma seção "Pagamento atrasado há N dias" (o `rotuloAtraso` em frase) com a `CaixaCobranca`.

### Task 8: Página da OS pro cliente

**Files:** Create `paginas/portal/minha-os/minha-os.tsx` + `.css`. Modify `crud/atendimentos/useAtendimento.ts`,
`App.tsx`, `paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx` (+ css).

- [ ] **Step 1:** No `useAtendimento`, o 403 também liga `naoEncontrado`.
- [ ] **Step 2:** `PaginaMinhaOs`, com o conteúdo e os estados da spec (parte C) e o visual do
  `pedido.css`. A rota `/minha-conta/atendimentos/:id` fica dentro do `RotaLogado`.
- [ ] **Step 3:** No `AbaAtendimentos`, o link "Ver OS" fica ao lado do "Ver detalhes da OS".
- [ ] **Step 4: Verificar**:
  - deslogado → `/entrar` → depois do login volta pra OS;
  - OS de outra conta (resposta simulada 403) → "OS não encontrada";
  - `valorTotal` `null` esconde o total.

### Task 9: Fechar

- [ ] **Step 1:** `npm run test`, `npm run lint` e `npm run build` no `frontend/` → passam.
- [ ] **Step 2:** Passada a 1440 e 390px pela Verificação da spec. No fim, limpar o
  `localStorage` (`bruxel:sessao`, `bruxel:carrinho`, `bruxel:cobrancas`).
- [ ] **Step 3: Commit** `feat: OS atrasadas e cobrança pelo WhatsApp`.
- [ ] **Step 4:** Revisão do branch (revisor separado) e correções. Depois, a decisão sobre o PR
  fica com o Eduardo.
