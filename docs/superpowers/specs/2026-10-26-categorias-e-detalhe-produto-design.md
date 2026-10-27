# CRUD de categorias e detalhe do produto

- Branch: `eduardo`
- Data: 2026-10-26

## Objetivo
Dar ao gestor um CRUD de categorias e deixar o cliente navegar da loja até a página de cada produto.

## Decisões
| Decisão | Escolha | Motivo |
|---|---|---|
| Onde gerenciar categorias | Modal "Gerenciar categorias" na tela de produtos | Pequeno CRUD, sem página nova |
| Modal duplo | `Modal` usa `useId()` no título | O `id="modal-title"` fixo conflitaria com o modal do formulário |
| Navegação na loja | Página `/produto/:id` | Link compartilhável e voltar do navegador funcionam |
| Card clicável | Link esticado sobre o card; ♡ e "Adicionar ao carrinho" ficam acima (z-index) | Imagem, nome e preço viram clicáveis sem aninhar botão em link |
| Produto inativo | Tratado como "não encontrado" | A loja só lista ativos |
| Layout do detalhe | Opção A, "loja completa": trilha Home › Loja › Categoria › Produto, foto em moldura, selo de estoque, quantidade + botão, aviso "adicionado", link de atendimento, descrição e "Mais de {categoria}" | Escolhida entre 3 mockups; segue o padrão de e-commerce e mantém o cliente navegando |
| Código do produto | Não aparece na página | O nome já identifica o produto pro cliente |
| Dados do detalhe | `useCatalogo` (mesma lista da loja), sem `GET /products/:id` | Reaproveita o hook e já traz os relacionados |
| Quantidade | Limitada ao estoque menos o que já está no carrinho (`quantidadeDisponivel`) | Evita pedido acima do estoque |

## Camadas
- `api/categorias.ts`: `criarCategoria`, `atualizarCategoria`, `excluirCategoria` (POST/PUT/DELETE `/categories`, admin).
- `crud/produtos/useCategorias.ts`: expõe as três operações; a lista só muda após a resposta da API.
- `crud/produtos/GerenciarCategorias`: lista, renomear, excluir e criar; erros 409 (nome repetido, categoria com produtos) aparecem na tela.
- `crud/produtos/selecaoProdutos.ts`: `produtosRelacionados` e `quantidadeDisponivel` (com testes).
- `paginas/portal/produto`: página de detalhe.
- `paginas/portal/loja/loja.tsx`: abrir `/loja#<categoria>` rola até a seção da categoria.
- `SecaoProdutos.css`: grade com `minmax(0, 1fr)`; com `1fr` os cards estouravam a largura no celular (bug que já existia na loja).

## Fora do escopo
Favoritos (♡ continua sem ação) e upload de imagem.

## Recado pro backend
Nenhum: as rotas de categoria e `GET /products/:id` já existem.
