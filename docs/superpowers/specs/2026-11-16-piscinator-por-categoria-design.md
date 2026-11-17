# Piscinator: recomendação por palavra + categoria

## Por quê
Hoje a recomendação só olha palavras no nome/descrição do produto. O dono
pode criar categorias novas no painel e quer que elas contem na indicação,
sem depender só de como ele escreve o nome do produto.

## Objetivo / não-objetivos
- Objetivo: cada "Sim" pontua produtos por palavra (produto e categoria) e
  por categoria geral ligada à pergunta.
- Não-objetivo: mexer no backend ou no painel (sem ligação pergunta ↔
  categoria pelo painel).
- Anti-objetivo: o produto específico (ex.: algicida para água verde) perder
  pra um genérico da mesma categoria ampla.

## Abordagens
- **A (escolhida):** palavras da pergunta procuradas também no nome da
  categoria + peso menor pra categorias gerais ligadas à pergunta. Categoria
  nova com nome descritivo ("Algicidas") já entra sem mexer em código.
- B: lista fixa de categorias por pergunta — toda categoria nova exige código.
- C: dono liga categoria ↔ pergunta no painel — exige backend; fora do escopo.

## Design
Em `frontend/src/crud/produtos/recomendacaoPiscinator.ts`:
- `PerguntaPiscinator` ganha `categorias: string[]` (nomes das categorias gerais).
- Pontos por "Sim":
  - palavra no nome/descrição do produto → 2
  - senão, palavra no nome da categoria do produto → 2
  - senão, produto numa das `categorias` da pergunta → 1
  (cada pergunta soma no máximo 2 pontos por produto)
- Ordem: maior pontuação; empate mantém a ordem do catálogo; com estoque
  antes de esgotado; reserva igual a hoje.
- Motivo ("Indicado para ..."): rótulo da pergunta que mais pontuou no
  produto (empate: a primeira na ordem do questionário). Só conta pergunta
  que pontuou.
- Comparação de nomes sem acento/maiúscula (`normalizar`), como hoje.

Ligação proposta pergunta → categorias gerais:
| Pergunta | Categorias |
|---|---|
| água verde | Tratamento da água |
| água turva | Tratamento da água |
| vários dias sem manutenção | Limpeza da Piscina |
| paredes escorregadias/manchadas | Tratamento da água, Limpeza da Piscina |
| olhos/pele ardendo, cheiro de cloro | Tratamento da água |
| folhas e sujeira | Limpeza da Piscina |
| filtro ou bomba fracos | Filtração e circulação |
| chuva ou muito uso | Tratamento da água |
| nenhum "Sim" | só as palavras de manutenção, como hoje |

## Fica com quem implementar
- Testes novos em `recomendacaoPiscinator.test.ts`: categoria nova com nome
  descritivo pontua; produto específico vence genérico da mesma categoria;
  categoria geral sozinha pontua 1.
