# Gestão de atendimentos e OS no painel — design

Issue: GustavoSouza-Code/Bruxel#22 (tela de lançamento e acompanhamento de serviços).
Branch: `feat/gestao-atendimentos`, criada a partir da `feat/solicitar-atendimento` (que traz o pedido do
cliente, a agenda de atendente e o atendimento aberto pela loja).

## Objetivo

Hoje o cliente pede atendimento e o admin abre pedido pela loja, mas ninguém vê nem decide esses pedidos.
Esta entrega cria o lado da gestão, cobrindo a issue #22 inteira:

- o admin (ou o piscineiro, que por enquanto usa conta de administrador) vê todos os pedidos;
- confirma ou **recusa escrevendo uma mensagem que chega ao cliente**;
- acompanha o serviço pela OS: observações do técnico, produtos usados do estoque, mão de obra e total;
- marca como concluído e como pago, e a situação de cada serviço fica clara na lista.

**Sem backend:** tudo continua em memória no `ProvedorAtendimentos`. Nada em `backend/` é alterado; o que o
backend precisa está no "Recado pro backend" no fim deste documento, pra passar pro grupo.

## Decisões

| Tema | Decisão |
|---|---|
| Escopo | A issue #22 inteira: lista, andamento, recusa com mensagem, produtos do estoque, valor, pago. |
| Andamento | Aguardando → **Agendado** (confirmar) ou **Recusado** (com mensagem). Agendado → **Em andamento** ou **Cancelado** (com mensagem). Em andamento → **Concluído**. Concluído → **Pago**. |
| Recusar/Cancelar | Mensagem obrigatória (pelo menos 10 caracteres depois do trim); libera o horário na agenda. |
| Notificar o cliente | A mensagem aparece no Minha conta, no card do pedido ("Mensagem da Bruxel: …"), e a OS tem "Mandar pelo WhatsApp" (link `wa.me` com o número do cliente e o texto pronto). |
| Estoque | Só registra: a quantidade não passa do estoque atual do produto, mas o estoque do banco não muda. |
| Valor | Mão de obra (digitada) + produtos (preço da loja × quantidade) = total. |
| Edição da OS | Observações, produtos e mão de obra só podem mudar em Em andamento ou em Concluído ainda não pago. Pago trava tudo. |
| Layout | Lista `/admin/atendimentos` + página da OS `/admin/atendimentos/:id`, no molde da imagem da issue. |
| Quem usa | Perfil ADMINISTRADOR (rotas dentro do `RotaAdmin`). Perfil de técnico fica pro backend. |

## Fora do escopo

- Anexos nas observações do técnico (o clipe da imagem da issue).
- Remarcar dia, horário ou atendente de um pedido.
- Perfil próprio de técnico.
- Guardar os dados ao recarregar a página (é tudo em memória até o backend existir).

## Dados (`frontend/src/tipos/atendimento.ts`)

- `StatusAtendimento` ganha `"recusado"`. Como `STATUS_LABELS` é `Record<StatusAtendimento, string>`, ganha
  `recusado: "Recusado"`; os CSS de selo do cliente e do admin ganham a variante `--recusado`.
- Tipo novo:
  ```ts
  /** Produto da loja usado no serviço; nome e preço ficam guardados como eram na hora. */
  export interface ProdutoUsado {
    produtoId: string;
    nome: string;
    precoUnitario: number;
    quantidade: number;
  }
  ```
- `Atendimento` ganha:
  - `mensagemCliente: string | null` — o texto da recusa ou do cancelamento;
  - `observacoesTecnico: string` — começa `""`;
  - `produtosUsados: ProdutoUsado[]` — começa `[]`;
  - `valorMaoDeObra: number | null` — `null` = ainda não informado;
  - `pagoEm: string | null` — data ISO do pagamento; `null` = a pagar.
- `DadosSolicitacao` continua sem esses campos (o pedido nasce sem OS): `novoAtendimento` preenche os
  valores iniciais. Os 2 exemplos de `dados/atendimentos.ts` ganham os campos (o concluído pode trazer uma OS
  de exemplo com mão de obra e produto, pra o "Total" aparecer).

## Regras puras, com testes (`frontend/src/crud/atendimentos/`)

### `andamento.ts`
- `type AcaoAtendimento = "confirmar" | "recusar" | "iniciar" | "cancelar" | "concluir" | "marcar-pago"`.
- `acoesDoStatus(atendimento): AcaoAtendimento[]`
  - aguardando → `["confirmar", "recusar"]`
  - agendado → `["iniciar", "cancelar"]`
  - em-andamento → `["concluir"]`
  - concluido sem `pagoEm` → `["marcar-pago"]`; concluído pago, recusado e cancelado → `[]`.
- Transições puras (devolvem um novo `Atendimento`; não mexem no original):
  `confirmar`, `recusar(at, mensagem)`, `iniciar`, `cancelar(at, mensagem)`, `concluir`, `marcarPago(at, agora: Date)`.
  `recusar` e `cancelar` guardam a mensagem com trim. Uma transição chamada num status que não a permite lança
  `Error` (a tela só mostra as ações válidas, então isso só pega bug).
- `osEditavel(at)`: `true` em em-andamento, ou em concluído sem `pagoEm`.
- `validarMensagemCliente(texto): string | null` → `"Escreva a mensagem pro cliente (pelo menos 10 caracteres)."`
  quando tem menos de 10 caracteres depois do trim; `MENSAGEM_CLIENTE_MAX = 500`.

### `valorOs.ts`
- `subtotalProduto(p)` = `precoUnitario × quantidade`.
- `totalProdutos(at)`, `totalOs(at)` = mão de obra (`null` conta 0) + produtos. Arredondar pra centavos.
- `validarQuantidade(quantidade, estoque): string | null`:
  - não inteiro ou menor que 1 → `"Informe uma quantidade de pelo menos 1."`;
  - acima do estoque → `"Só tem {estoque} em estoque."` (estoque 0 → `"Produto sem estoque."`).
- `adicionarProduto(lista, produto, quantidade)`: se o produto já está na OS, soma a quantidade na mesma linha
  (e a validação considera a soma); senão, acrescenta uma linha com nome e preço da hora.
- `validarMaoDeObra(texto): string | null` aceita "150", "150,50", "150.5"; negativo ou não número →
  `"Informe um valor em reais, ex.: 150,00."`; vazio = sem mão de obra (vale).
- `formatarReais(valor)` → `"R$ 230,00"` (`Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`).

### `filtrarAtendimentos.ts` (molde de `crud/usuarios/filtrarUsuarios.ts`)
- `type FiltroStatus = "aguardando" | "agendado" | "em-andamento" | "concluido" | "encerrados" | "todos"`
  (`encerrados` = recusado + cancelado).
- `FiltrosAtendimento { busca: string; status: FiltroStatus; tecnico: string; pagamento: "" | "a-pagar" | "pago"; ordem: "visita" | "visita-desc" }`.
- `FILTROS_ATENDIMENTO_INICIAIS`: `status: "aguardando"`, `ordem: "visita"`, o resto vazio.
- `filtrarAtendimentos(lista, filtros)`: busca (com `contemTexto` de `crud/busca.ts`) no nome do cliente, no
  número do pedido e no bairro; `pagamento` só olha concluídos; ordena pela data + horário da visita.
- `contarPorStatus(lista): Record<FiltroStatus, number>` (pros números nos chips e no card do painel).
- `contarFiltrosAtivosAtendimento(filtros)`: conta `tecnico`, `pagamento` e `ordem` fora do padrão (como o de usuários, sem busca e chip).

### `whatsapp.ts`
- `linkWhatsApp(telefone, texto): string | null` → `https://wa.me/55{DDD}{número}?text={texto codificado}`;
  `null` se o telefone não tiver 10 ou 11 dígitos.

## Provedor (`contexto/ContextoAtendimentos.tsx` + `contexto/useAtendimentos.ts`)

- Os pedidos passam a ser **uma lista só** em estado, que já começa com os exemplos (assim o admin também
  consegue mudar o status de um exemplo). Novo pedido entra no topo; a numeração continua global.
- O que expõe:
  - `atendimentos`: os da conta logada (`cliente.id === usuario.id`) + os exemplos — igual ao de hoje pro cliente;
  - `todosAtendimentos`: todos (inclusive os de balcão), pro painel;
  - `ocupacoes`: recusado **e** cancelado não ocupam horário (`ocupacoesDosAtendimentos` passa a ignorar os dois);
  - `solicitarAtendimento(dados)`;
  - `atualizarAtendimento(id, transformar: (atual: Atendimento) => Atendimento)`.

## Lista `/admin/atendimentos` (`paginas/admin/atendimentos/`)

- Molde da `paginas/admin/usuarios/usuarios.tsx`: `NavAdmin`, `BarraBusca`, `PainelFiltros`, `ChipsFiltro`,
  `AlternarVisualizacao` com `useModoVisualizacao("admin-atendimentos")`, `useCarregarMais` e o `lista-admin.css`.
- Chips, cada um com a quantidade entre parênteses: "Aguardando (n)" (marcado ao abrir), "Agendados",
  "Em andamento", "Concluídos", "Recusados e cancelados", "Todos".
- Busca: "Buscar por cliente, número ou bairro". Painel de filtros: atendente (`TECNICOS`), pagamento, ordem.
- Contador "N atendimentos" / "X de N atendimentos"; vazio: "Nenhum atendimento por aqui." com dica pra trocar o filtro.
- Cada item (card ou linha): "#AT-2026-0003 · Vazamento", nome do cliente (+ selo "loja" se `abertoNaLoja`),
  "21/10/2026 às 13:30 · Rafael", selo do status e, se concluído, selo "Pago" ou "A pagar". O item inteiro é um
  link pra OS.
- `App.tsx`: rotas `/admin/atendimentos` e `/admin/atendimentos/:id` dentro do `RotaAdmin`.
- Painel `/admin` (`paginas/admin/inicio/inicio.tsx`): item novo em `AREAS_ADMIN`, "Atendimentos", com a
  descrição "{n} aguardando confirmação" (ou "Pedidos e ordens de serviço" quando não tem nenhum aguardando).

## Página da OS `/admin/atendimentos/:id` (`paginas/admin/atendimento/`)

- Topo: link "← Atendimentos", título "#AT-2026-0003", selo do status, "Pedido em 13/10/2026 às 14:35"
  (e "· aberto na loja").
- `CartaoClienteOs`: iniciais, nome, telefone, endereço (`formatarEndereco`), botão "WhatsApp" (link do
  `linkWhatsApp` com uma saudação; some se o telefone for inválido).
- Bloco "Visita": "21/10/2026 às 13:30 com Rafael" (`formatarAgendamento`) + tipo do serviço.
- `GaleriaFotosOs`: primeira foto grande, as outras em miniatura (clicar troca a grande); sem fotos, "O cliente
  não mandou fotos.". Bloco "Descrição do problema".
- "Observações do técnico" (aparece a partir de Em andamento, junto com os produtos): textarea, editável só
  com `osEditavel`; senão, o texto (ou "Sem observações.").
- `ProdutosDaOs` (aparece a partir de Em andamento):
  - lista de escolha dos produtos (`useProdutos()`, só ativos, em ordem alfabética, mostrando
    "nome · R$ · N em estoque"; o catálogo de hoje é pequeno, então um `<select>` basta), quantidade e
    "Adicionar", com o erro do `validarQuantidade`;
  - linhas: nome, quantidade, preço unitário, subtotal e "Remover" (só com `osEditavel`);
  - "Mão de obra (R$)" com o erro do `validarMaoDeObra`;
  - "Total: R$ …";
  - o `useProdutos()` de hoje é uma lista em memória (`TODOS_PRODUTOS`), sem carregando nem erro; quando ele
    passar a usar a API, a seção ganha esses estados.
- Barra de ações (rodapé) com `acoesDoStatus`:
  - principal verde: "Confirmar visita", "Iniciar atendimento", "Marcar como concluído", "Marcar como pago",
    cada uma com `window.confirm` (padrão do painel);
  - "Recusar" e "Cancelar atendimento" em vermelho contorno, abrindo o `ModalMensagemCliente`.
- Depois de cada ação, aviso `role="status"` no topo ("Visita confirmada.", "Pedido recusado. O cliente vê a
  mensagem no Minha conta.", etc.).
- Recusado/Cancelado: quadro "Mensagem enviada ao cliente" com o texto e "Mandar pelo WhatsApp".
- Pago: selo "Pago em 22/10/2026" e a OS só em leitura.
- Id que não existe (ex.: depois de recarregar): "Atendimento não encontrado." com link pra lista.

### `ModalMensagemCliente`
- Usa `componentes/ui/Modal/Modal.tsx`. Título "Recusar o pedido #AT-2026-0003" ou "Cancelar o atendimento #…".
- Dica: "O cliente vai ver esta mensagem no Minha conta."
- Textarea com contador (`0/500`) e o erro do `validarMensagemCliente`.
- Botões "Voltar" e "Recusar pedido" / "Cancelar atendimento".

## Estoque de exemplo

Os produtos de exemplo do front (`frontend/src/dados/produtos.ts`) estão todos com `estoque: 0`, o que
impediria lançar qualquer produto na OS. Eles ganham estoques de exemplo (um fica em 0 de propósito, pra mostrar
"Produto sem estoque."). É só dado de exemplo do front; o banco não muda.

## Lado do cliente (`paginas/portal/perfil/componentes/AbaAtendimentos/`)
- Selo "Recusado" (`--recusado`).
- Recusado ou cancelado com mensagem: linha "Mensagem da Bruxel: …".
- Concluído com total maior que zero: linha "Total: R$ 230,00". O pagamento não aparece pro cliente.

## Testes e verificação
- Vitest (só funções puras): `andamento.test.ts`, `valorOs.test.ts`, `filtrarAtendimentos.test.ts`,
  `whatsapp.test.ts`, e o teste da agenda ganha "recusado não ocupa".
- `npm run build --prefix frontend` e `npm run lint --prefix frontend` (só a linha de base do `ContextoCarrinho.tsx`).
- Navegador, com a conta admin de teste:
  1. o cliente pede; o admin vê o pedido em "Aguardando" e no card do painel;
  2. recusar sem mensagem dá erro; com mensagem, vira Recusado, o horário volta livre e o cliente vê a mensagem;
  3. outro pedido: confirmar → iniciar → produto com quantidade acima do estoque dá erro → produto + mão de obra
     → total certo → concluir → marcar pago trava a OS; o cliente vê o "Total";
  4. chips, contagens e filtros; link do WhatsApp com número e texto; OS inexistente; 375px sem rolagem horizontal.

## Recado pro backend

Nada disto foi feito no backend; é o que o frontend vai precisar quando as telas forem ligadas na API.

- **Tabela `appointments`**, além do que já existe:
  - tipo do serviço, descrição, fotos (URLs), técnico (`tecnico_id`), data e horário da visita;
  - contato copiado no pedido (telefone, rua, número, bairro, cidade, estado, CEP);
  - nome do cliente sem cadastro (quando `usuario_id` é nulo) e `aberto_na_loja` (de preferência com o id do admin);
  - `mensagem_cliente`, `observacoes_tecnico`, `valor_mao_de_obra` (Decimal), `pago_em` (Timestamptz, nulo = a pagar);
  - enum de status com `AGUARDANDO`, `AGENDADO`, `EM_ANDAMENTO`, `CONCLUIDO`, `CANCELADO`, `RECUSADO`.
- **Itens da OS**: tabela `appointment_items` (`appointment_id`, `produto_id`, `quantidade`, `preco_unitario`
  guardado na hora).
- **Estoque**: dar baixa no `products.estoque` ao concluir a OS, numa transação, e recusar se não tiver estoque;
  devolver se a OS for reaberta (hoje o front só confere, não baixa).
- **Rotas de admin** (`verificaToken` + `verificaAdmin`):
  - `GET /appointments` (todos, com filtros de status, técnico, pagamento e busca) e `GET /appointments/:id`;
  - `PATCH /appointments/:id/status` — só transições válidas; mensagem obrigatória (mín. 10 caracteres) pra
    recusar e cancelar;
  - `PUT /appointments/:id/os` (observações, itens, mão de obra) — só em andamento ou concluído não pago;
  - `PATCH /appointments/:id/pagamento` (marca `pago_em`).
- **Cliente**: `GET /appointments` do cliente devolve os pedidos em que ele é o `usuario_id` (inclusive os
  abertos pela loja), com `mensagem_cliente` e o total, mas sem dados internos.
- **Notificação** de verdade ao recusar/cancelar (e-mail ou WhatsApp pela API), no lugar do link manual.
- **Perfil `TECNICO`** no enum `perfil_usuario`, pra o piscineiro não precisar de conta de administrador.
- Continuam valendo os pontos do recado em `2026-10-13-atendimento-pela-loja-design.md`.
