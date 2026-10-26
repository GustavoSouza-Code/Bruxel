# Atendimentos, OS e pedidos vindos da API (sem mocks)

- **Data:** 26/10/2026
- **Branch:** `eduardo` (atualizada com a `main`)

## Objetivo

O backend da `main` já tem `appointments` (pedido de visita + Ordem de Serviço) e `orders`
(compras), mas o front ainda roda atendimentos 100% em memória (`dados/atendimentos.ts`,
`dados/tecnicos.ts`, `ContextoAtendimentos`), as compras do perfil são `MOCK_ORDERS` e o botão
"Finalizar compra" não faz nada. A ideia é ligar tudo na API da `main` e tirar do front o que o
back não suporta. O backend não muda: o que faltar vai no recado no fim deste documento.

## Regra: o site nunca fica quebrado

Cada commit deixa o site funcionando. O usuário continua conseguindo fazer tudo o que já fazia:
navegar, entrar e criar conta, editar o perfil, ver a loja, montar o carrinho e pedir atendimento.
O admin continua gerindo usuários, produtos e atendimentos.

- **Fatias verticais:** cada passo troca uma funcionalidade inteira (API, hook e todas as telas que
  a usam). Atendimentos é uma fatia só: cliente e painel passam pra API juntos, senão o pedido do
  cliente iria pro banco e o painel continuaria mostrando o mock.
- **Ordem:** merge da `main`, depois pedidos (independente), depois atendimentos e, por último, a
  limpeza dos mocks.
- **Nada some sem substituto:**
  - sem escolha de atendente, o pedido vai "sem preferência";
  - sem "cliente sem cadastro", o seletor ganha um link pra cadastrar o cliente em `/admin/usuarios`;
  - sem várias fotos, fica um link de imagem opcional.
- **Toda tela que busca dados tem os estados de carregando, erro (com "Tentar de novo") e lista
  vazia.** O botão de salvar desabilita enquanto salva, e um erro não apaga o que foi digitado.

## Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Fonte dos dados | Só a API, sem cair no mock | Mesmo critério da integração de produtos |
| Id do atendimento | UUID do banco; a tela mostra `#` + os 8 primeiros caracteres em maiúsculo | O banco não tem numeração sequencial |
| Status e tipo | O back usa `EM_ANDAMENTO` e `BOMBA_FILTRO`; o front mantém `"em-andamento"` e `"bomba-filtro"` (classes CSS) e converte na borda | Muda pouca coisa nas telas |
| Dia e horário | Os blocos de 2h continuam; `data_hora` vai em ISO, a partir do horário local | É a regra de funcionamento da loja, não é mock |
| Atendente | Some a escolha e a agenda. O técnico é só exibido, se o back mandar | Não há rota que liste técnicos ou horários ocupados |
| Cliente sem cadastro (balcão) | Sai. O admin escolhe um cliente cadastrado, com link pra cadastrar | O POST não aceita `nome_cliente` |
| Fotos | Um link opcional (`foto_url`) com prévia | O back guarda uma URL; o upload espera a VM |
| Ações da OS | Os botões chamam `PATCH /status`, `PUT /os` e `PATCH /pagamento`; a tela troca o atendimento pela resposta | A transição de verdade é do back |
| Observações e mão de obra | Rascunho local e botão "Salvar OS" | Evita um PUT a cada tecla |
| Checkout | Forma de pagamento + endereço de entrega (vem preenchido do perfil) → `POST /orders` | É o que o `CreateOrderDTO` pede |
| Compras do perfil | `GET /orders`, com os status do banco | Tira o `MOCK_ORDERS` |

## Camada de API (`frontend/src/api/`)

- `cliente.ts`: aceita `PATCH`.
- `atendimentos.ts`: `AtendimentoApi` (resposta crua), `paraAtendimento`,
  `paraCorpoAtendimento`, `listarAtendimentos`, `buscarAtendimento`, `criarAtendimento`,
  `mudarStatusAtendimento`, `salvarOs`, `marcarAtendimentoPago`. Para o cliente, a resposta não
  traz `observacoes_tecnico`, `valor_mao_de_obra` nem `pago_em`; a conversão completa com valores
  vazios.
- `pedidos.ts`: `PedidoApi`, `paraPedido`, `criarPedido`, `listarPedidos`.

## Hooks

- `crud/atendimentos/useAtendimentos.ts`: lista (o back já filtra: o admin vê todos, o cliente vê os
  dele), com carregando, erro e recarregar.
- `crud/atendimentos/useAtendimento.ts`: o detalhe da OS, com as ações e o estado de salvando.
- `crud/pedidos/usePedidos.ts`: as compras do perfil.
- Sai o `ProvedorAtendimentos` do `App.tsx`.

## Telas

- **Solicitar atendimento:**
  - sem o seletor de atendente e sem a checagem de horário ocupado;
  - campo opcional de link da foto, com prévia;
  - seletor de cliente (admin) só com clientes cadastrados.
- **Painel (lista, OS e início):** usam os hooks e saem o filtro e a coluna de técnico. A OS tem
  "Salvar OS", e a galeria mostra 0 ou 1 foto.
- **Perfil:**
  - a aba Atendimentos usa o hook;
  - a aba Compras lista `GET /orders`.
- **Carrinho:** um bloco de checkout. Sem login, manda pro `/entrar`. Com sucesso, limpa o carrinho
  e abre a aba Compras do perfil.

## O que sai

`dados/atendimentos.ts`, `dados/tecnicos.ts`, `tipos/tecnico.ts`, `contexto/ContextoAtendimentos.tsx`,
`contexto/useAtendimentos.ts`, `crud/atendimentos/novoAtendimento.ts`, o `SeletorAtendente`, a
ocupação de horário em `agenda.ts`, as transições locais de `andamento.ts` (ficam `acoesDoStatus`,
`osEditavel` e `validarMensagemCliente`) e o `MOCK_ORDERS`.

## Testes e verificação

- Unitários (Vitest): as conversões de `api/atendimentos.ts` e `api/pedidos.ts` (status, tipo, fuso,
  campos ausentes na resposta do cliente, decimais em string).
- Em cada fatia: `npm test`, `npm run build` e um teste no navegador com o backend da `main` rodando.
- Ponta a ponta:
  - o cliente pede um atendimento e ele aparece no perfil depois de recarregar;
  - o admin confirma, inicia, lança produtos e mão de obra, conclui (o estoque baixa) e marca pago;
  - recusar exige uma mensagem;
  - comprar pelo carrinho cria o pedido, que aparece em Compras;
  - comprar sem estoque mostra o erro.

## Recado pro backend

1. **Técnicos:** uma rota que o cliente possa ler com a lista de técnicos e os horários ocupados
   (hoje `GET /users` é só pra admin), mais uma rota pra atribuir ou trocar o técnico de uma OS já
   criada.
2. **Balcão:** aceitar `nome_cliente` (sem `usuario_id`) no `POST /appointments` quando quem abre é um
   administrador. A coluna já existe.
3. **Fotos:** upload de imagem quando a VM existir; hoje vai um link só (`foto_url`).
4. **Pedidos:** uma rota pro admin mudar o status de um pedido (`PENDENTE` → `PAGO` → `ENVIADO` →
   `ENTREGUE`).
5. **(Opcional)** um código curto e sequencial pra OS, que o cliente consiga falar por telefone.
