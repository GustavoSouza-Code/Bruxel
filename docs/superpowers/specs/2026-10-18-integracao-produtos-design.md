# Produtos e categorias vindos da API

- **Issues relacionadas:** [GustavoSouza-Code/Bruxel#41](https://github.com/GustavoSouza-Code/Bruxel/issues/41), [GustavoSouza-Code/Bruxel#43](https://github.com/GustavoSouza-Code/Bruxel/issues/43)
- **Data:** 18/10/2026
- **Branch:** `eduardo`

## Objetivo

Trocar o catálogo de exemplo do front (`src/dados/produtos.ts` e a lista fixa
`CATEGORIAS`) pelos dados do banco, via API. Hoje a Loja, a Início, o
Piscinator, o admin de produtos e os "Produtos da OS" leem uma lista fixa, e o
admin só altera a memória do navegador: recarregar a página desfaz tudo. É o
maior buraco do front pra Parcial 2 (28/10), quando o cliente vê o sistema.

## Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Dependência do backend | Usar só a API, sem cair no mock | Mais limpo; mostra se a integração funciona de verdade. O que falta no back vai no recado |
| O que o back já tem e está torto | O front se adapta (preço em string, POST que ignora campos, PUT que não filtra o corpo) | Regra do grupo: o front não mexe no backend |
| Categorias | `GET /categories` (pedido no recado). Sem a rota, a Loja mostra os produtos numa seção única | Dá pra testar os produtos antes de a rota existir |
| Imagens do catálogo atual | Ficam em `frontend/public/produtos/`; o banco guarda `url_imagem = "/produtos/<arquivo>.png"` | Não depende de upload; funciona em dev e no deploy |
| Imagem de produto novo | Campo "URL da imagem" com preview | O upload espera a VM da Univates (issue separada) |
| Destaques ("mais vendidos") | Os 4 primeiros produtos ativos | O banco não tem campo de destaque nem de vendas |
| Recomendados do Piscinator | Os 4 primeiros da categoria "Tratamento da água" (achada pelo nome); se não houver, os 4 primeiros do catálogo | Os ids agora são UUIDs, então não dá pra fixar um id |
| Atualização da lista do admin | Só depois da resposta da API | Mesmo padrão do `useUsuarios` |

## Fora do escopo

- Upload de imagem (vai numa issue, pra depois que a VM estiver configurada).
- Página de detalhe do produto, favoritos, checkout.
- Recomendação do Piscinator de acordo com as respostas (continua fixa).

## Camada de API (`frontend/src/api/`)

### `produtos.ts` (molde de `api/usuarios.ts`)

| Função | Rota | Token |
|---|---|---|
| `listarProdutos()` | `GET /products` | não |
| `criarProduto(token, dados)` | `POST /products` + `PUT /products/:id` | admin |
| `atualizarProduto(token, id, dados)` | `PUT /products/:id` | admin |
| `excluirProduto(token, id)` | `DELETE /products/:id` | admin |

Funções puras (com testes):

- `paraProduto(bruto)`: converte o que a API devolve pro tipo `Produto`.
  `preco` vem como string (`Decimal` do Prisma), então vira `Number`;
  `descricao` e `url_imagem` `null` viram `undefined`; `criado_em` e
  `atualizado_em` são descartados.
- `paraCorpoProduto(dados)`: monta o corpo só com `categoria_id, codigo,
  nome, descricao, preco, estoque, url_imagem, ativo`. O `PUT` do back passa
  o corpo inteiro pro Prisma, então um campo a mais (ex.: `id`) quebraria.

`criarProduto` faz o `POST` (que só grava categoria, nome, código e preço) e
logo depois um `PUT` com o resto. Quando o back aceitar tudo no `POST`, o
`PUT` sai.

### `categorias.ts`

`listarCategorias()` → `GET /categories`, público, `[{ id, nome }]`.

## Hooks (`frontend/src/crud/produtos/`)

| Hook | Usado em | Devolve |
|---|---|---|
| `useCategorias()` | `useCatalogo`, admin de produtos | `{ categorias, carregando, erro }` |
| `useCatalogo()` | Loja, Início, Piscinator | `{ produtos (só ativos), categorias, carregando, erro, recarregar }`. Se só as categorias falharem, `erro` fica null e `categorias` vazia |
| `useProdutos()` | admin de produtos, `ProdutosDaOs` | `{ produtos (todos), carregando, erro, recarregar, criarProduto, atualizarProduto, excluirProduto }`, com `sair()` em 401 |

`crud/produtos/categorias.ts` perde a lista fixa `CATEGORIAS`.
`nomeDaCategoria(categorias, id)` passa a receber a lista.

Funções puras de seleção em `crud/produtos/selecaoProdutos.ts` (com testes):
`produtosEmDestaque(produtos)` e `produtosRecomendados(produtos, categorias)`.

## Telas

- **Loja:** seções a partir das categorias da API. Estados: "Carregando
  produtos…", erro com "Tentar novamente" e "Nenhum produto cadastrado ainda."
  Sem categorias, uma seção única "Produtos".
- **NavCategorias:** recebe as categorias por prop. O ícone sai de um mapa
  nome → SVG (os 4 de hoje), com um ícone padrão pra categoria nova.
- **Início:** destaques do `useCatalogo`; enquanto carrega ou se der erro, a
  seção some (a página continua de pé).
- **Piscinator:** recomendados com `produtosRecomendados`.
- **Admin de produtos:** carregando/erro como em `usuarios.tsx`, erro ao
  excluir acima da lista, filtro de categoria com as categorias da API.
  "+ Novo produto" desabilitado com aviso se as categorias não carregarem.
- **FormularioProduto:** recebe `categorias`; `onEnviar` devolve uma promessa
  e o erro aparece no formulário (padrão do `FormularioEdicaoUsuario`), com
  "Salvando…" no botão. Preço com mínimo de R$ 0,01 (o banco exige
  `preco > 0`). Preview da imagem ao lado da URL, que some se a imagem não
  carregar.

## Imagens e mock

- As 15 imagens saem de `src/assets/images/produtos/` e vão pra
  `frontend/public/produtos/`.
- `src/dados/produtos.ts` é apagado; o conteúdo vira a tabela do seed abaixo.

## Testes e verificação

- Vitest: `paraProduto`, `paraCorpoProduto`, `nomeDaCategoria`,
  `produtosEmDestaque`, `produtosRecomendados`. `filtrarProdutos.test.ts`
  continua valendo.
- `npm run lint`, `npm test` e `npm run build` em `frontend/`.
- No navegador, com o backend local:
  - com produtos no banco: Loja, Início e Piscinator mostram os dados do banco;
    o admin cria, edita e exclui, e o F5 mantém;
  - sem `/categories` (situação atual): Loja mostra os produtos numa seção
    única e o admin avisa que não dá pra cadastrar;
  - backend desligado: mensagens de erro com "Tentar novamente".

## Recado pro backend

**Pedido necessário:**

1. `GET /categories`, público, devolvendo `[{ id, nome }]`. Sem ela a Loja não
   sabe o nome das seções e o admin não consegue escolher a categoria ao
   cadastrar produto (o campo é obrigatório e é um UUID).

**Ajudaria (não bloqueia o front):**

2. Seed com as categorias e os produtos abaixo. O banco exige `preco > 0`,
   então os produtos marcados "a definir" precisam de preço (com o cliente)
   antes de entrar; sem seed, o admin cadastra pela tela.

| Categoria |
|---|
| Tratamento da água |
| Limpeza da Piscina |
| Filtração e circulação |
| Acessórios & Lazer |

| Código | Nome | Categoria | Preço | Estoque | `url_imagem` |
|---|---|---|---|---|---|
| hidrofloc-1l | Hidroall Clarificante Hidrofloc Tripla Ação 1L | Tratamento da água | 21,50 | 12 | /produtos/hidroall-hidrofloc-1l.png |
| cadeira-espreguicadeira | Cadeira Espreguiçadeira em Alumínio Mor | Acessórios & Lazer | 395,00 | 3 | /produtos/cadeira-espreguicadeira-rosa.png |
| propool-10kg | Cloro Propool Hidroall 3 em 1 10 KG/3KG/1KG | Tratamento da água | 210,00 | 6 | /produtos/propool-3em1-10kg.png |
| propool-3kg | Cloro Propool Hidroall 3 em 1 Multi Função 10 KG/3KG/1KG | Tratamento da água | 210,00 | 10 | /produtos/propool-3em1-3kg.png |
| filtro-dancor | Filtro de Piscina Dancor | Filtração e circulação | a definir | 2 | /produtos/filtro-piscina-dancor.png |
| bomba-dancor | Motobomba Dancor PM-1/30R | Filtração e circulação | a definir | 2 | /produtos/bomba-piscina-dancor.png |
| guarda-sol | Guarda-sol Listrado | Acessórios & Lazer | a definir | 4 | /produtos/guarda-sol-listrado.png |
| hidroall-penta-200g | Hidroall HCL Penta 5 Funções 200g | Tratamento da água | a definir | 15 | /produtos/hidroall-penta-200g.png |
| hiperclor-60 | Hidroall Hiperclor 60 Dicloro Estabilizado 10kg | Tratamento da água | a definir | 5 | /produtos/hidroall-hiperclor60-10kg.png |
| kit-algicidas | Kit Hidroall Algicidas + Floculante 1L cada | Tratamento da água | a definir | 8 | /produtos/hidroall-kit-algicidas.png |
| algicida-choque | Hidroall HCL Algicida de Choque 1L | Tratamento da água | a definir | 9 | /produtos/hidroall-algicida-choque-1l.png |
| algicida-manutencao | Hidroall HCL Algicida de Manutenção 1L | Tratamento da água | a definir | 11 | /produtos/hidroall-algicida-manutencao-1l.png |
| ph-mais | Hidroall Hidro pH+ Barrilha Leve 2kg | Tratamento da água | a definir | 7 | /produtos/hidroall-ph-mais-2kg.png |
| escova-piscina | Escova para Piscina | Limpeza da Piscina | a definir | 6 | /produtos/escova-piscina.png |
| peneira-piscina | Peneira para Piscina | Limpeza da Piscina | a definir | 0 | /produtos/peneira-piscina.png |

**Observações (o front já contorna, sem pedido):**

- `POST /products` só grava categoria, nome, código e preço; o front manda o
  resto num `PUT` logo depois.
- `productsService.update` filtra os campos em `dados`, mas passa `data` (o
  corpo cru) pro repository; o front manda só os campos aceitos.
- Erro de validação no `POST /products` volta como 500 "Dados inválidos." (o
  controller tenta `JSON.parse` na mensagem do `AppError`) em vez de 400 com
  os campos.
- `GET /products` devolve também os inativos; o front filtra na Loja.
