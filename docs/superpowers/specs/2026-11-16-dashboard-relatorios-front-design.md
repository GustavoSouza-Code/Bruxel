# Dashboard e relatórios no painel (frontend)

## Por quê

O Gabriel subiu no PR #98 (`feat/dashboard-relatorios`) as rotas `/api/dashboard/*` e `/api/reports/*`, só para o administrador, e pediu que o front implementasse a tela com gráfico de barras e de rosca, além da geração dos relatórios. O dono precisa ver de relance quanto entrou, quanto falta receber e de quem, e conseguir baixar o relatório (PDF ou planilha) de um período.

## Objetivos

- **Home do painel (`/admin`) com dashboard leve:** os 4 números vêm do back (`/dashboard/kpis`) com cores por significado, mais um mini gráfico de barras (6 meses) e uma mini rosca (loja por categoria), lado a lado no computador.
- **Tela nova `/admin/relatorios`:** gráficos grandes, "Quem cobrar" e "Gerar relatório" com prévia e download em PDF/CSV.
- **Cartão "Relatórios"** nas áreas da home do painel.

## Não-objetivos

- Não mexer no backend (ver "Recado pro backend").
- Não restilizar o resto do painel. A tela nova segue os tokens e o visual dos blocos que já existem.
- Sem biblioteca de gráficos.

## Anti-objetivos

- A home virar um relatório pesado: os gráficos da home são pequenos e levam pra tela de Relatórios.
- No celular, nada lado a lado: cada bloco sozinho na linha, com espaço entre eles.
- Número da home diferente do da tela de Relatórios. As duas usam as mesmas rotas.

## Abordagens consideradas

1. **Gráficos em SVG próprio (escolhida).** Componentes React pequenos (`GraficoBarras`, `GraficoRosca`) desenhando SVG. Não adiciona dependência, o controle do visual é total e são só dois tipos de gráfico.
2. **Biblioteca (Recharts).** Tooltip e eixos prontos, mas adiciona cerca de 100 kB e o visual padrão foge do Figma.
3. **Manter os números da home calculados no front.** Descartada: já existe `/kpis` com a regra oficial (receita = pedidos PAGO/ENVIADO/ENTREGUE + OS pelo `pago_em`). Duas fontes dariam números diferentes.

## Decisões de design (aprovadas nos mockups)

### Cores por significado (tons dos selos que o painel já usa)
- **Receita do mês:** verde `#1e7a3c`. A variação vem num selo verde (▲) ou vermelho (▼). Quando `variacaoPercentual` é `null`, aparece "sem receita em <mês anterior>".
- **A receber:** amarelo (faixa `#f5a623`, valor `#8a6100`). As atrasadas aparecem num selo vermelho (`#c0392b` sobre `#fdecea`).
- **Atendimentos aguardando:** azul (faixa `--color-accent`).
- **Estoque baixo:** vermelho.
- **Estilo:** bloco branco com uma faixa de 4px colorida no topo e o número colorido (opção "1" dos mockups).
- **Barras:** loja `--color-primary` e serviços `--color-accent`, empilhadas.
- **Rosca:** `--color-primary`, `--color-accent`, `--color-wave`, `--color-accent-light` e um cinza para "Outras" (a partir da 5ª categoria, as menores são agrupadas).

### Home (`/admin`)
- `NumerosPainel` passa a usar só o `/dashboard/kpis`. Hoje ele busca atendimentos, pedidos e produtos e calcula tudo no front. Os links continuam os mesmos: A receber vai pra `/admin/pagamentos` (ou `?situacao=atrasadas` quando houver atrasadas), aguardando vai pra `/admin/atendimentos` e estoque baixo pra `/admin/produtos`. A receita vai pra `/admin/relatorios`.
- **Computador:** números numa faixa de 4, como hoje, mas com as cores. Embaixo, barras (6 meses) e rosca lado a lado (proporção 1.6 : 1). O título das barras tem o link "Ver relatórios →".
- **Celular (< 600px):** todos os blocos em coluna e separados (gap ~12px), cada número no seu cartão, depois as barras, depois a rosca.
- Se uma das buscas falhar, só o bloco dela some, como já acontece no `NumerosPainel`.

### Tela `/admin/relatorios` (nova, dentro da `RotaAdmin`)
Um bloco por linha em todas as larguras, inclusive no computador: nada lado a lado, cada bloco com a largura toda e espaço entre eles. A rosca fica centralizada no bloco dela, com largura máxima de 280px.

1. **Receita por mês:** barras grandes com eixo de valores, seletor 3/6/12 meses (`?meses=`) e balão com loja/serviços ao passar o mouse, tocar ou focar pelo teclado.
2. **Loja por categoria:** rosca com o total no meio e a legenda com nome e porcentagem. Vale para o mês atual.
3. **Quem cobrar:** `/dashboard/a-receber`. Três faixas: menos de 7 dias (amarelo), 7 a 29 dias (laranja) e 30 ou mais (vermelho). Depois a tabela das OS mais antigas (OS, cliente, telefone, visita, atraso, valor). O código da OS leva para `/admin/atendimentos/:id`. Tem o link "Ver pagamentos →".
4. **Gerar relatório:** abas "Pedidos da loja" e "Ordens de serviço". Filtros: De, Até, Situação, e Pagamento (pago / a receber) só nas OS. A prévia mostra a tabela do JSON (`colunas`, `linhas`, `totais`) e os botões "Baixar PDF" e "Baixar planilha (CSV)" usam os mesmos filtros.
   - O período padrão vai do 1º dia do mês atual até hoje.
   - Escolher "A receber" fixa a situação em "Concluído" (é a regra do back).
   - Erros do back (400: período invertido, mais de 5000 linhas) aparecem embaixo dos filtros.
   - Na prévia, as colunas `moeda` chegam em centavos e são formatadas em R$.
- No celular, as tabelas rolam na horizontal dentro do próprio bloco.

### Download
- Função nova `baixarArquivo(caminho, token, nomeArquivo)` no `api/cliente.ts`: faz `fetch` com o `Authorization`, recebe um `blob` e clica num `<a download>` temporário. Em caso de erro, lê o JSON `{ mensagem }` como as outras chamadas.
- O nome do arquivo é montado no front (`relatorio-pedidos-AAAA-MM-DD.pdf`), porque o `cors()` padrão não expõe o `Content-Disposition`.

## Estrutura (sugestão para o builder)

- `api/dashboard.ts` e `api/relatorios.ts`: chamadas e tipos de resposta.
- `crud/dashboard/`: hooks (`useKpis`, `useReceitaMensal`, `useReceitaPorCategoria`, `useAReceber`) no padrão do `usePedidosAdmin` (carregando, erro, recarregar), mais funções puras testáveis: escala das barras, fatias da rosca com agrupamento em "Outras", rótulo do mês (`2026-11` vira "nov"), formatação de centavos.
- `crud/relatorios/`: hook da prévia e montagem da query string a partir dos filtros.
- `componentes/graficos/GraficoBarras` e `GraficoRosca`, reaproveitados na home (versão compacta) e na tela de Relatórios.
- `paginas/admin/relatorios/`.
- Testes com Vitest para as funções puras e as chamadas da api, no padrão dos `*.test.ts` que já existem.

## Restrições

- Depende do PR #98. Até o merge, rodar o back pela branch `feat/dashboard-relatorios` para testar.
- React + TypeScript, comportamento em `.tsx`/hooks e CSS só para layout.
- Acessibilidade: cada gráfico tem `role="img"` com um `aria-label` resumindo os dados, e as barras dão foco pelo teclado para abrir o balão.

## Recado pro backend

Nada bloqueia. Opcional: se quiserem que o front use o nome do arquivo que o back gera, coloquem `exposedHeaders: ["Content-Disposition"]` no `cors()`.

## Fica para o builder

Tamanhos exatos, animação de entrada dos gráficos (seguindo `movimento.css` e respeitando `prefers-reduced-motion`) e os textos dos estados vazios ("Nenhuma venda este mês ainda").
