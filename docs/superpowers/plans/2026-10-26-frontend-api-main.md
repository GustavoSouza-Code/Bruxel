# Plano: atendimentos, OS e pedidos pela API

Spec: [2026-10-26-frontend-api-main-design.md](../specs/2026-10-26-frontend-api-main-design.md)

## Regras gerais

- O backend não muda; o que faltar vai no recado do spec e do PR.
- Cada task termina com o site funcionando: `npm test` e `npm run build` no `frontend/` e um teste no
  navegador do fluxo mexido e de um vizinho. Só então o commit.
- TDD nas funções puras e de conversão (`api/*.ts`, `crud/**`).
- Código em português, no padrão de `api/produtos.ts` e `crud/produtos/useProdutos.ts`.

## Task 1: Pedidos

1. Teste e depois `api/pedidos.ts`: `paraPedido` (`valor_total` em string vira número; `order_items`
   viram itens com nome), `criarPedido` e `listarPedidos`.
2. `crud/pedidos/usePedidos.ts` (carregando, erro, recarregar).
3. Perfil: a aba Compras deixa o `MOCK_ORDERS` e passa a usar `usePedidos`, com os rótulos de status
   do banco e os estados de vazio, erro e carregando.
4. Carrinho: mostrar 2 alternativas visuais de checkout pro Eduardo escolher e implementar a
   escolhida. Sem login vai pro `/entrar`; com sucesso, limpa o carrinho e abre a aba Compras.
5. Commit.

## Task 2: Base dos atendimentos (não muda nenhuma tela)

1. `cliente.ts` aceita `PATCH`.
2. Teste e depois `api/atendimentos.ts`: tipos crus, conversão nos dois sentidos (status, tipo, fuso,
   campos ausentes) e as seis funções de rota.
3. `crud/atendimentos/useAtendimentos.ts` e `useAtendimento.ts`.
4. `codigoAtendimento(id)`.
5. Commit.

## Task 3: Telas de atendimento na API (um commit só)

1. `tipos/atendimento.ts`: `fotoUrl`, `tecnico` só pra exibir, cliente sempre com conta.
2. Solicitar atendimento:
   - sem atendente e sem ocupação;
   - link da foto;
   - `SeletorCliente` sem balcão e com link pro cadastro;
   - envio pela API, com erros por campo.
3. Painel, lista e início usam `useAtendimentos`; sai o filtro de técnico.
4. OS (`/admin/atendimentos/:id`):
   - usa `useAtendimento`;
   - "Salvar OS";
   - produtos vão no PUT;
   - galeria com 0 ou 1 foto.
5. A aba Atendimentos do perfil usa o hook.
6. Sai o `ProvedorAtendimentos` do `App.tsx`.
7. Os testes de `crud/atendimentos` acompanham as mudanças.
8. Commit.

## Task 4: Limpeza

Apagar `dados/`, `tipos/tecnico.ts`, os contextos de atendimento, `novoAtendimento`, a ocupação em
`agenda.ts`, as transições locais de `andamento.ts` e o `SeletorAtendente`. Depois, fazer um `grep`
por "exemplo", "mock" e "TODO" de atendimento e rodar `npm run lint`. Commit.

## Task 5: Verificação e PR

Fazer o roteiro ponta a ponta do spec com o backend da `main` e abrir o PR `eduardo` → `main` com o
recado pro backend.
