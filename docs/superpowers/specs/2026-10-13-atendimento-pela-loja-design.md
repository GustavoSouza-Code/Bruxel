# Atendimento aberto pela loja (admin)

- **Issue:** [GustavoSouza-Code/Bruxel#22](https://github.com/GustavoSouza-Code/Bruxel/issues/22) (critério "vincular o serviço a um cliente cadastrado")
- **Data:** 13/10/2026
- **Branch:** `feat/solicitar-atendimento`
- **Depende de:** [2026-10-13-agenda-atendente-design.md](2026-10-13-agenda-atendente-design.md), que é implementado antes

## Objetivo

Hoje só o cliente logado abre um atendimento, pelo `/solicitar-atendimento`. O pedido fica
com quem está logado, e o contato vem do perfil dele. O Eduardo quer que **administradores
também abram atendimentos**. O caso típico é o cliente que vai até a loja e pede pro atendente
abrir o pedido. Pra isso, o admin precisa dizer quem é o cliente.

## Escopo

**Entra:**

- Na mesma página `/solicitar-atendimento`: quando quem está logado é admin, aparece o bloco
  "Cliente" no topo, com a etiqueta "Abrindo pela loja".
- O cliente é buscado entre as contas cadastradas (nome, e-mail ou CPF). Se a pessoa não tem
  conta, o admin digita só o nome ("sem cadastro").
- O contato do pedido vem da conta escolhida, nunca do perfil do admin.
- Depois de enviar, o admin fica na página: aparece um aviso no topo e o formulário volta limpo.
- O pedido guarda de quem é (`cliente`) e se foi aberto pela loja (`abertoNaLoja`).
- Card "Abrir atendimento" no painel `/admin`.

**Fica pra depois:**

- A lista e a gestão de atendimentos no painel (a OS da issue #22).
- Criar a conta do cliente dentro deste fluxo: quem não tem conta vai de "sem cadastro".

## Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Como identificar o cliente | Busca entre os cadastrados + link "Cliente sem cadastro? Digitar o nome" | Escolhido pelo Eduardo; cumpre o "vincular a um cliente cadastrado" da issue sem travar quem só passou na loja |
| Onde | Mesma página `/solicitar-atendimento`; o bloco "Cliente" só aparece pra admin | Escolhido pelo Eduardo |
| Layout do bloco | A: campo de busca com sugestões; cliente escolhido vira um card com "Trocar"; link do "sem cadastro" embaixo | Escolhido pelo Eduardo entre 2 previews |
| Depois de enviar | Fica na página, com aviso no topo e o formulário limpo | Escolhido pelo Eduardo; no balcão o atendente abre vários seguidos |
| De quem é o pedido | Fica guardado no cliente escolhido (aparece no Minha conta dele); o de cliente sem cadastro fica na chave `"balcao"` (não aparece pra ninguém no site, mas ocupa a agenda) | A agenda é uma só, e o cliente com conta deve ver o pedido que a loja abriu pra ele |
| Busca | Reaproveita `filtrarUsuarios` (nome, e-mail ou CPF, sem acento), só perfil CLIENTE, a partir de 2 caracteres, até 6 sugestões | Já testado na gestão de usuários |
| Lista de contas | `useUsuarios()`, só montado quando é admin | Cliente comum nunca chama `GET /users` (que é só de admin) |

## Dados

```ts
interface ClienteDoAtendimento {
  /** id da conta do cliente; null = cliente sem cadastro (atendido no balcão) */
  id: string | null;
  nome: string;
}

// Atendimento (e DadosSolicitacao) ganham:
cliente: ClienteDoAtendimento;
abertoNaLoja: boolean;
```

- Quando o cliente pede pelo site: `cliente = { id: usuario.id, nome: usuario.nome }` e `abertoNaLoja = false`.
- Os 2 exemplos ficam com `cliente: { id: null, nome: "Cliente de exemplo" }` e `abertoNaLoja: false`.

## Regras (`crud/atendimentos/clienteDaLoja.ts`, funções puras)

```ts
type EscolhaCliente =
  | { tipo: "cadastrado"; usuario: Usuario | null }
  | { tipo: "sem-cadastro"; nome: string };
```

| Função | O que faz |
|---|---|
| `buscarClientes(usuarios, termo)` | Termo com menos de 2 caracteres (depois do trim) → `[]`; senão `filtrarUsuarios(usuarios, { ...FILTROS_USUARIO_INICIAIS, busca: termo, perfil: "CLIENTE" })`, cortado em 6 |
| `validarClienteDaLoja(escolha)` | Cadastrado sem usuário → "Escolha o cliente ou digite o nome de quem não tem cadastro."; sem cadastro com nome de menos de 3 letras depois do trim → "Informe o nome do cliente (pelo menos 3 letras)."; senão `null` |
| `clienteDoAtendimento(escolha)` | `{ id: usuario.id, nome: usuario.nome }` ou `{ id: null, nome: nome.trim() }` |
| `mascararCpf(cpf)` | "12345678901" → "•••.456.789-••" (pro card do cliente escolhido) |

## Tela

**Bloco "Cliente"** (`SeletorCliente`, só pra admin, é o bloco 1):

- Sem escolha: campo "Buscar cliente por nome, e-mail ou CPF" e, embaixo dele, a lista
  de sugestões (nome em negrito e e-mail), quando há termo. Clicar numa sugestão escolhe o cliente.
- Estados da lista: "Carregando clientes…"; erro com o botão "Tentar novamente";
  "Nenhum cliente encontrado. Se ele não tiver conta, use 'Cliente sem cadastro'.".
- Escolhido: card com as 2 primeiras letras do nome num círculo, o nome, "e-mail · CPF •••.456.789-••"
  e o botão "Trocar" (volta pra busca vazia).
- Embaixo: o link "Cliente sem cadastro? Digitar o nome" troca a busca por um campo
  "Nome do cliente". Com ele aparece o link "Buscar cliente cadastrado" pra voltar.

**Resto da página quando é admin:**

- Etiqueta "Abrindo pela loja" acima do título.
- Subtítulo: "Preencha com os dados do cliente que está sendo atendido."
- O bloco de contato vira "Onde e como falar com o cliente".
- A dica do bloco de contato vira "Vale só pra este atendimento.".
- O contato vem do cliente escolhido (`contatoDoUsuario`). Sem cadastro, os campos abrem vazios.
  Trocar de cliente descarta o contato que tinha sido editado.
- O botão "Enviar solicitação" não espera o perfil do admin carregar. Só o cliente comum espera.

**Envio do admin:**

- O erro de cliente aparece no bloco 1, junto com os outros erros do formulário.
- Grava com `cliente = clienteDoAtendimento(escolha)` e `abertoNaLoja = true`.
- Fica na página e mostra no topo (`role="status"`) "Atendimento aberto para João Silva: 21/10/2026 às 13:30 com Carlos.".
- Limpa rascunho, cliente, contato, fotos e erros, libera o envio seguinte e rola pro topo.
- As URLs das fotos enviadas não são revogadas, porque foram pro pedido.

**Envio do cliente:** igual a hoje (vai pro `/perfil`, aba Atendimentos), agora com
`cliente = { id, nome }` de quem está logado e `abertoNaLoja = false`.

## Contexto

`solicitarAtendimento(dados)` guarda pelo `dados.cliente.id`, ou pela chave `"balcao"`
quando é `null`, e não mais pelo usuário logado. A lista de cada conta e as `ocupacoes`
seguem como no spec da agenda: os pedidos novos daquela conta + os exemplos, e a ocupação
junta todas as chaves.

## Outras telas

- **Aba Atendimentos:** se `abertoNaLoja`, a linha "Enviado em …" ganha " · aberto na loja".
- **Painel `/admin`:** um item novo em `AREAS_ADMIN`, "Abrir atendimento", com o texto
  "Para um cliente que está na loja", link pra `/solicitar-atendimento` e o ícone de ferramenta.

## Recado pro backend

- `POST /appointments` aceito também pra administrador, com `usuario_id` do cliente escolhido ou nulo,
  e um campo de nome pro cliente sem cadastro.
- Registrar que o pedido foi aberto pela loja e, de preferência, por qual administrador.

## Testes

Vitest em `clienteDaLoja.test.ts`:

- busca por nome sem acento, por e-mail e por pedaço do CPF;
- só perfil CLIENTE;
- termo curto → vazio;
- no máximo 6;
- validação sem escolha, com nome curto e válida;
- `clienteDoAtendimento` com e sem cadastro;
- `mascararCpf`.

Ajustes nos testes que usam `DadosSolicitacao` (`novoAtendimento.test.ts`).

## Verificação

- `npm test --prefix frontend`, `npm run build --prefix frontend` e `npm run lint --prefix frontend` (só o erro antigo do `ContextoCarrinho.tsx`).
- No navegador:
  - como cliente, nada muda no formulário;
  - como admin, aparecem a etiqueta e o bloco 1 "Cliente";
  - buscar "joao" sem acento acha a conta, e escolher preenche o contato;
  - "Trocar" volta pra busca;
  - "sem cadastro" com nome curto dá erro;
  - um envio válido mostra o aviso e limpa o formulário, e um segundo envio seguido funciona;
  - o horário pego aparece ocupado;
  - o pedido aparece no Minha conta do cliente escolhido com "· aberto na loja";
  - o card "Abrir atendimento" aparece no `/admin`;
  - 375px sem rolagem horizontal.
