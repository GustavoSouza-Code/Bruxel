# Painel de gestão: dashboard como tela principal + lista lateral

## Intenção

O `/admin` era uma saudação, uma faixa de números, dois gráficos pequenos e uma
grade de 7 cartões de atalho. A análise de verdade ficava em `/admin/relatorios`
e cada página do painel só tinha a barra de cima e um "← Painel" pra voltar.
A dashboard passa a ser o assunto principal do painel e os atalhos viram uma
lista lateral de navegação, presente em todas as páginas `/admin/*`.

## Decisões (do Eduardo)

- A lateral aparece em todas as páginas do painel, não só na inicial.
- Relatórios é absorvido pela dashboard: o `/admin` mostra números, receita por
  mês (com 3/6/12 meses), loja por categoria, quem cobrar e gerar relatório
  (CSV/PDF). "Relatórios" sai da lista e `/admin/relatorios` redireciona pro
  `/admin`, mantendo o `?meses=`.
- Layout B: a `NavAdmin` escura de cima continua igual; embaixo dela uma
  lateral clara e o conteúdo.
- Montagem por layout de rota (`LayoutAdmin` + `<Outlet />`), pendurado no
  `RotaAdmin` do `App.tsx`.

## Abordagens consideradas

1. **Layout de rota (escolhida):** a barra e a lateral não remontam ao navegar,
   a gaveta do celular e o item ativo vivem num lugar só, e uma página nova já
   nasce dentro do painel.
2. **Componente envolvendo cada página:** mesmo número de arquivos tocados, mas
   remonta a cada navegação e é fácil uma página nova esquecer de usar.

## Calls minhas (conferir)

- Itens: Início, Atendimentos, Pedidos, Pagamentos, Produtos, Clientes.
  "Abrir atendimento" vira o botão de ação no pé da lateral.
- Celular (< 900px): a lateral some; um botão ☰ na `NavAdmin` abre a lista
  como gaveta. Fecha com Esc, clique fora ou ao trocar de página.
- O botão "Exportar" no topo da dashboard rola até o bloco "Gerar relatório".
- O número "Receita" da faixa rola até o gráfico de receita em vez de abrir
  outra página.
- O visual do Figma fica: mesmos tokens, Montserrat, cores dos números.

## Fora do escopo

Backend (nada muda), restilizar as páginas internas.
