# Motion discreto e melhorias de experiência (portal e painel)

- **Data:** 28/10/2026
- **Branch:** `eduardo` (atualizada com a `main` em 28/10, fast-forward até `da7ffcd`)

## Objetivo

Duas coisas, sem refatorar nem restilizar o que já existe:

1. **Animar o que já existe**, de forma bem discreta: só microinterações (clicar, passar o mouse,
   foco, abrir e fechar modal, menu e accordion). Nada entra animado no scroll.
2. **Melhorar o fluxo do cliente e do administrador**, preenchendo o que falta: avisos de
   confirmação, carrinho que não some e respeita o estoque, confirmação depois da compra, troca de
   senha, Piscinator que recomenda pelo diagnóstico e, no painel, gestão de pagamentos, pedidos,
   números na home e alerta de estoque baixo.

O visual do Figma fica como está (cores, fonte, layout, ondas, curvas). O backend não muda: o que
faltar vai no recado no fim deste documento.

## Fora do escopo

- Redesign, troca de tokens de cor/raio, remoção de ornamentos do Figma.
- Diálogo de confirmação próprio no lugar do `window.confirm` e esqueletos de carregamento.
- Detalhe do pedido no perfil (já entregue pelo Souza em `afe9e7c`).
- Mudar status de pedido, favoritos, "esqueci a senha" (precisam de rota nova no backend).

## Regras

- **O site nunca fica quebrado:** cada commit deixa tudo funcionando.
- **Comportamento em `.tsx`** (hooks, estado, tipos); CSS só pra estilo, layout e as transições.
- **Motion só com `transform` e `opacity`** (o accordion usa `grid-template-rows`, que é a exceção
  aceita), com curvas próprias (nunca `ease` puro em movimento) e saída mais rápida que a entrada.
- **`prefers-reduced-motion: reduce`:** tudo continua funcionando e chega no estado final, sem
  deslocamento nem escala; só troca de opacidade e cor.
- **Telas novas seguem o padrão das que já existem** (`lista-admin.css`, `BarraBusca`,
  `ChipsFiltro`, `PainelFiltros`, `AlternarVisualizacao`, `Modal`), com estados de carregando, erro
  com "Tentar de novo" e lista vazia.
- **Números de dinheiro** alinhados à direita, com `font-variant-numeric: tabular-nums`.

## Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Intensidade do motion | Bem discreta em tudo; admin ainda mais contido | Pedido do Eduardo |
| Biblioteca de animação | Nenhuma: CSS + hooks próprios | O projeto não tem dependência de animação; o necessário cabe em CSS |
| Saída animada (menu, modal, aviso) | Hook `usePresenca` mantém montado enquanto anima a saída | Renderização condicional desmonta na hora e corta a animação |
| Avisos | Contexto `ProvedorAvisos` + `useAvisos().avisar(...)` | Mesmo padrão de `ContextoCarrinho`/`useCarrinho` |
| Carrinho salvo | `localStorage`, chave `bruxel:carrinho` | Mesmo prefixo de `bruxel:visualizacao:` |
| Confirmação de compra | Rota `/pedido/:id` (logado); usa o pedido do `navigate` ou busca em `GET /orders` | Funciona no reload |
| Pagamento do pedido | Pedido conta como recebido ao ser criado | Desde `dcf7667` o backend cria o pedido já `PAGO` (simulação acadêmica) |
| Pedidos `PENDENTE` antigos | Aparecem em "A receber", sem botão | Não existe rota pra marcar pedido como pago |
| Recomendação do Piscinator | Palavras-chave no nome/descrição, com a categoria "Tratamento da água" de reserva | Os produtos são cadastrados pelo admin; não há nome garantido |
| Limite de "estoque baixo" | 3 unidades, constante única | É o mesmo limite do selo "Últimas N unidades" da página do produto |
| Excluir produto com pedido/OS (409) | Oferecer "Desativar" (`ativo: false`) | O backend não deixa excluir, e desativar tira da loja |

## Parte 1 · Motion discreto e avisos

### Tokens e regra global

`estilos/tokens.css` ganha os tokens de motion:

```css
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);   /* entradas e hovers que movem */
--ease-in-out: cubic-bezier(0.76, 0, 0.24, 1); /* algo que viaja visível (barra do Piscinator) */
--ease-saida: cubic-bezier(0.55, 0.055, 0.675, 0.19); /* algo que sai de vez, curto */
--t-press: 140ms;
--t-hover: 180ms;
--t-ui: 220ms;    /* menu, accordion, aviso */
--t-modal: 240ms;
```

E um arquivo novo, `estilos/movimento.css` (importado no `App.css`), com:

- transição suave nos estados de hover que já existem: `color`, `background-color`,
  `border-color`, `opacity` e `text-decoration-color` em `a` e `button`, por `--t-hover`;
- o "afundar" ao clicar: `button:not(:disabled):active` e os links com cara de botão (as pílulas do
  `Cabecalho`, o CTA do hero, o "Acessar loja virtual") com `transform: scale(0.97)` por
  `--t-press`;
- o bloco `@media (prefers-reduced-motion: reduce)` que zera duração de transição e animação de
  deslocamento e escala, mantendo o estado final.

Os cards que já mudam no hover (`CardProduto`, cartões de `lista-admin`, áreas da home do admin)
ganham só a transição da propriedade que já muda (borda/fundo), sem levantar nem crescer.

### Componentes animados

| Onde | O que acontece | Duração |
|---|---|---|
| `MenuUsuario` | Abre a partir do botão (`transform-origin` no canto do botão), de `opacity: 0; scale(.97) translateY(-4px)`; fecha mais rápido | 180ms / 120ms |
| `Modal` (`<dialog>`) | Entra com fade e `scale(.97)`; o fundo (`::backdrop`) escurece junto; ao fechar pelo ✕, pelo fundo ou pelo Esc, o componente anima a saída e só então chama `onFechar` (quando a página fecha o modal sozinha, ex. depois de salvar, ele some na hora) | 240ms / 160ms |
| FAQ do Início | Resposta abre com altura suave (`grid-template-rows: 0fr → 1fr`); a seta (SVG no lugar do ︿﹀) gira | 220ms |
| `PainelFiltros` | Mesmo accordion do FAQ, no lugar do atributo `hidden` | 220ms |
| `<details>` do perfil (Compras e Atendimentos) | Abertura suave com `::details-content` + `interpolate-size`, onde o navegador suporta; nos outros abre como hoje | 220ms |
| Piscinator | Barra de progresso por `transform: scaleX(...)` (não mais `width`); cada pergunta e cada etapa entram com fade + 8px | 300ms / 200ms |
| Selo do carrinho (`Cabecalho`) | Pulo pequeno (`scale 1 → 1.18 → 1`) quando a quantidade muda; não pula ao trocar de página | 260ms |
| Avisos | Entram de baixo (8px) com fade; saem com fade | 220ms / 150ms |

Sem animação de propósito: alternar cards/lista no admin, linhas de listas, chips de filtro e
"Carregar mais" (ações repetidas).

### Peças novas em TSX

- **`hooks/usePresenca.ts`**: `usePresenca(aberto: boolean, duracaoSaidaMs: number)` devolve
  `{ montado, saindo }`. Quando `aberto` vira `false`, mantém `montado` por `duracaoSaidaMs` com
  `saindo = true`; com reduced motion, desmonta na hora. Usado por `MenuUsuario` e pelos avisos.
- **`componentes/ui/Recolhivel/`**: `Recolhivel` com `aberto`, `id` e `children`; só o painel
  que abre e fecha com altura suave. Fica sempre no DOM, com `inert` quando fechado. O botão que
  controla continua com quem já o tem (`aria-expanded` + `aria-controls` apontando pro `id`): a
  pergunta do FAQ e o botão "Filtros" da `BarraBusca`, que abre o `PainelFiltros`.
- **`Modal`**: ganha o estado "fechando" interno (mesma ideia do `usePresenca`, mas chamando
  `dialog.close()` no fim). A API do componente não muda pra quem já usa.
- **Ícones** em `Icones.tsx`: `IconeSeta` (chevron, no lugar dos glifos ︿﹀ do FAQ, que ganham
  rotação) e `IconeCheck` (usado na confirmação de compra).

### Avisos (toast)

- **`contexto/ContextoAvisos.tsx`** (`ProvedorAvisos`) e **`contexto/useAvisos.ts`**:
  `avisar({ tipo: "sucesso" | "erro" | "info", mensagem: string, acao?: { rotulo: string; para: string } })`.
- **`componentes/ui/Avisos/`**: a pilha de avisos no canto inferior direito (no celular, embaixo,
  na largura da tela). Até 3 visíveis; somem em 4s (erro em 6s); pausam com o mouse em cima ou com
  foco; botão de fechar com `IconeFechar`. Container com `aria-live="polite"`; erro com
  `role="alert"`.
- O provedor fica dentro do `BrowserRouter` (a ação do aviso é um `Link`).
- **Onde avisa** (só onde hoje não há retorno nenhum):
  - portal: adicionar ao carrinho pelo card ("{produto} no carrinho.", com "Ver carrinho"; a
    página do produto já tem a mensagem "✓ … adicionadas" e fica como está); salvar perfil;
    trocar senha;
  - admin: salvar e excluir produto, usuário e categoria; desativar produto; marcar OS como paga
    pela tela de pagamentos.
- As mensagens inline que já funcionam (OS, checkout, formulários) ficam como estão.

## Parte 2 · Fluxo do cliente

### Carrinho mais seguro

- **Salvo no navegador:** o `ProvedorCarrinho` lê `bruxel:carrinho` ao montar e grava a cada
  mudança, com `try/catch` (navegação privada ou armazenamento bloqueado: segue só em memória). A
  leitura passa por uma função pura que descarta o que vier quebrado.
- **Respeita o estoque:** a regra sai do provedor pra funções puras em `crud/carrinho/`
  (adicionar e mudar quantidade sem passar de `quantidadeDisponivel(estoque, noCarrinho)`, que já
  existe em `crud/produtos/selecaoProdutos.ts`).
  - `CardProduto`: estoque 0 mostra "Esgotado" e o botão fica desativado; com tudo que existe já
    no carrinho, o botão fica desativado com "Máximo no carrinho".
  - `ItemCarrinho`: o "+" desativa no limite.
  - O estoque guardado é o do momento em que o produto entrou no carrinho; o backend continua
    conferindo de verdade no `POST /orders` (409 com o nome do produto), como hoje.

### Confirmação depois da compra

- Rota nova **`/pedido/:id`**, dentro de `RotaLogado`, em `paginas/portal/pedido/`.
- O `FinalizarCompra` passa a navegar pra `/pedido/{id}` com o pedido criado no `state`. Sem
  `state` (reload, link), a página busca em `GET /orders` e acha pelo id; se não achar, mostra a
  `MensagemPagina` "Pedido não encontrado".
- Conteúdo: "Pedido recebido", o número `#` + 8 primeiros caracteres em maiúsculo (igual ao
  `AbaCompras`), "Pagamento confirmado" com a forma (Pix, Cartão de crédito, Boleto), os itens com
  preço unitário e subtotal, total, endereço de entrega, e os botões "Ver minhas compras"
  (`/perfil`, aba Compras) e "Continuar comprando" (`/loja`).

### Trocar senha

- Aba nova **"Senha"** no menu do `/perfil`.
- Campos: senha atual, nova senha e confirmar nova senha; validação pura
  (`crud/usuarios/validarTrocaSenha.ts`): obrigatórias, nova com no mínimo 8, confirmação igual,
  nova diferente da atual.
- `api/usuarios.ts` ganha `alterarSenha(token, id, senhaAtual, senha)` (`PUT /users/:id` com
  `{ senha, senhaAtual }`). O "Senha atual incorreta." (400) do backend aparece embaixo do campo da
  senha atual.
- Sucesso: limpa o formulário e mostra um aviso.

### Piscinator por diagnóstico

- Função pura **`crud/produtos/recomendacaoPiscinator.ts`**:
  `recomendarPorDiagnostico(respostas, produtos, categorias)` devolve até 4 produtos.
- Para cada "Sim", na ordem das perguntas, procura produtos ativos cujo nome ou descrição
  (normalizados com o `normalizar` que já existe) contenham os termos:

  | Resposta "Sim" | Termos |
  |---|---|
  | Água verde | algicida, choque, cloro |
  | Água turva | clarificante, floculante, floc, decantador |
  | Vários dias sem manutenção | escova, peneira, aspirador, 3 em 1 |
  | Nenhum "Sim" | manutenção, 3 em 1, ph |

- Sem repetir produto; com estoque primeiro (esgotado só se faltar). Se não fechar 4, completa
  com a categoria "Tratamento da água" e, por último, com os primeiros produtos ativos.
- O título da seção vira "Recomendados para o seu diagnóstico". O texto do diagnóstico não muda.

## Parte 3 · Painel admin

### Gestão de pagamentos (`/admin/pagamentos`)

- Funções puras em **`crud/pagamentos/lancamentos.ts`**:
  - `lancamentosDePagamento(atendimentos, pedidosComCliente)` (os pedidos já com o nome do
    cliente, do `usePedidosAdmin`) → lista única de
    lançamentos `{ id, origem: "os" | "pedido", codigo, cliente, data, valor, situacao:
    "a-receber" | "recebido", formaPagamento }` (a tela monta o link de cada linha):
    - OS `concluido` sem `pagoEm` → a receber (valor = `totalOs`, data = dia da visita);
    - OS `concluido` com `pagoEm` → recebido (data = `pagoEm`);
    - pedido `PAGO`, `ENVIADO` ou `ENTREGUE` → recebido (data = `criadoEm`);
    - pedido `PENDENTE` → a receber, sem ação; `CANCELADO` fica de fora.
  - `resumoPagamentos(lancamentos, hoje)` → total e quantidade a receber (OS e pedidos
    `PENDENTE`); total recebido no mês corrente, com a quantidade de pedidos e de OS.
  - `filtrarLancamentos(lancamentos, { situacao, busca })`, do mais recente pro mais antigo.
- Tela: título "Gestão de pagamentos", chips "A receber", "Recebidos" e "Todos" com contagem,
  `BarraBusca` (cliente ou código), lista no padrão do `lista-admin` (tipo, código, cliente, data,
  valor à direita, situação). OS a receber têm "Marcar como pago": `window.confirm` com o valor
  (mesmo padrão da tela da OS) → `PATCH /appointments/:id/pagamento` → aviso e a linha passa pra
  "Recebido". Linha de OS leva à OS; linha de pedido abre o detalhe do pedido.

### Pedidos (`/admin/pedidos`)

- `Pedido` ganha `usuarioId` (o `paraPedido` passa a guardar `usuario_id`).
- **`crud/pedidos/usePedidosAdmin.ts`**: `GET /orders` + `GET /users` pra montar o nome do cliente.
- **`crud/pedidos/filtrarPedidos.ts`**: busca (cliente, número, produto), forma de pagamento,
  ordem (mais recentes, mais antigos, maior valor).
- Tela: título "Pedidos", `BarraBusca` + `PainelFiltros`, cards ou lista
  (`AlternarVisualizacao`, `useModoVisualizacao("pedidos")`), "Carregar mais" (`useCarregarMais`).
  Cada pedido: número, cliente, data, resumo dos itens, forma de pagamento, total e status. O
  detalhe abre no `Modal` (itens com preço e subtotal, endereço, forma, status, data). Só leitura.

### Números na home do admin

- Faixa no topo de `/admin`, num único bloco dividido (rótulo em cima, número embaixo, sem ícone):
  **A receber** (valor e quantidade, do `resumoPagamentos`) → `/admin/pagamentos`; **Recebido no mês** (valor;
  pedidos e OS) → `/admin/pagamentos`; **Atendimentos aguardando** → `/admin/atendimentos`;
  **Estoque baixo** (quantidade; quantos esgotados) → `/admin/produtos?estoque=baixo`.
- Enquanto carrega, o número mostra "—"; se uma busca falhar, só aquele número some e o resto
  funciona.
- `AREAS_ADMIN` ganha "Pedidos" e "Pagamentos"; o cartão "Em breve" sai.

### Estoque baixo

- **`crud/produtos/estoque.ts`**: `POUCO_ESTOQUE = 3` e
  `situacaoEstoque(estoque) → "esgotado" | "baixo" | "ok"`; a página do produto passa a importar
  daqui.
- Gestão de produtos: selos "Estoque baixo" e "Esgotado" (no padrão dos selos do `lista-admin`) em
  cards e lista; filtro "Estoque" no `PainelFiltros` (Todos, Estoque baixo, Esgotado), também lido
  de `?estoque=baixo` na URL.
- Excluir produto que responde 409: `window.confirm` oferecendo desativar → `PUT /products/:id`
  com `ativo: false` → aviso.

## Arquivos principais

- Novos: `estilos/movimento.css`, `hooks/usePresenca.ts`, `componentes/ui/Recolhivel/`,
  `componentes/ui/Avisos/`, `contexto/ContextoAvisos.tsx`, `contexto/useAvisos.ts`,
  `crud/carrinho/`, `crud/produtos/estoque.ts`, `crud/produtos/recomendacaoPiscinator.ts`,
  `crud/usuarios/validarTrocaSenha.ts`, `crud/pagamentos/`, `crud/pedidos/usePedidosAdmin.ts`,
  `crud/pedidos/filtrarPedidos.ts`, `paginas/portal/pedido/`, `paginas/admin/pagamentos/`,
  `paginas/admin/pedidos/`.
- Alterados: `App.tsx` (rotas e `ProvedorAvisos`), `App.css`, `estilos/tokens.css`, `Modal`,
  `MenuUsuario`, `Cabecalho` (selo), `Faq`, `PainelFiltros`, `Icones`, `CardProduto`,
  `ItemCarrinho`, `ContextoCarrinho`, `FinalizarCompra`, `produto.tsx`, Piscinator (página,
  questionário, resultado), `perfil.tsx`, `api/usuarios.ts`, `api/pedidos.ts`, `tipos/pedido.ts`,
  `paginas/admin/inicio/`, `paginas/admin/produtos/`, `crud/produtos/filtrarProdutos.ts`, e os CSS
  dos componentes que ganham transição.

## Testes e verificação

- **Vitest (TDD)** nas funções puras (os hooks e componentes ficam pro navegador, porque o projeto
  não tem jsdom nem testing-library): regras do carrinho (adicionar, limite, leitura do salvo), `validarTrocaSenha`,
  `recomendarPorDiagnostico`, `situacaoEstoque`, filtro de estoque em `filtrarProdutos`,
  `lancamentosDePagamento`, `resumoPagamentos`, `filtrarLancamentos`, `filtrarPedidos`,
  `paraPedido` com `usuarioId`.
- **Antes de cada commit:** `npm run test`, `npm run lint` e `npm run build` no `frontend/`.
- **No navegador** (Browser pane, dev server do `launch.json`), em 1440 e 390px: cada animação da
  tabela da Parte 1; o carrinho sobrevivendo ao reload e travando no estoque; a compra até
  `/pedido/:id` e o reload dessa página; a troca de senha com senha atual errada e certa; o
  Piscinator com combinações de respostas; as telas novas do admin com dados reais; o "Desativar"
  no 409. Reduced motion conferido pela emulação do DevTools (ou, se não der no Browser pane, pela
  regra aplicada via `matchMedia`).
- Lembrete do OneDrive: dar `touch` nos arquivos editados se o Vite servir versão antiga.

## Entrega

Três commits na `eduardo`, um por parte (motion e avisos; fluxo do cliente; painel admin), e um PR
único pra `main` no fim, com este recado no texto.

## Recado pro backend

1. **`PATCH /orders/:id/status`** (admin): avançar o pedido (`PAGO → ENVIADO → ENTREGUE`, ou
   `CANCELADO`). Com isso a tela de Pedidos deixa de ser só leitura.
2. **`GET /orders` com o nome do cliente** (`users: { nome }` no `include`), pra o front não
   precisar buscar todos os usuários só pra mostrar o nome.
3. **`concluido_em` na OS**, gravado na transição pra `CONCLUIDO`: a tela de pagamentos hoje usa o
   dia da visita como data do "a receber".
4. (Opcional) **forma de pagamento na OS**, pra o recebimento de serviço mostrar como foi pago.
