# OS atrasadas e cobrança pelo WhatsApp

- **Data:** 28/10/2026
- **Branch:** `eduardo`
- **Spec anterior:** `docs/superpowers/specs/2026-10-28-motion-e-experiencia-design.md`


## Context

Hoje o painel mostra as OS concluídas e não pagas só como "A receber", sem dizer há quanto tempo
estão abertas, e não há um jeito rápido de cobrar o cliente. O Eduardo quer que o admin veja quais
OS passaram de 1 semana ou de 1 mês sem pagamento, e que, ao abrir a OS, possa mandar ao cliente
uma mensagem de cobrança com o link da OS. O texto vem pronto, mas dá pra editar antes de mandar.
O cliente precisa de uma página própria pra ver aquela OS.

Decisões do Eduardo nesta conversa:
- **Pedidos da loja ficam de fora.** Marcar pedido como pago exigiria rota nova no backend e
  desfazer a simulação "pedido já nasce pago". Além disso, o cliente só recebe o produto se pagar.
- **O atraso conta a partir do dia da visita** (`data` + `horario` da OS), que não muda depois.
- **O link leva a uma página própria da OS**: `/minha-conta/atendimentos/:id`.
- **A cobrança fica dentro do detalhe**: a linha mantém os botões, e "Ver OS" abre um modal com o
  resumo e a caixa de cobrança editável. A mesma caixa aparece na tela da OS do painel.
- **A caixa de cobrança só aparece nas OS atrasadas** (7 dias ou mais desde a visita).
- **A cobrança também fica disponível em `/admin/atendimentos`**: selo de atraso, filtro e
  botão "Cobrar" que abre o mesmo modal.
- **"Cobrado em" fica guardado só no navegador** de quem cobrou (localStorage). Um campo oficial
  vai pro recado do backend.

Regras de sempre: nada em `backend/`, branch `eduardo`, comportamento em `.tsx`, motion só nos
padrões já criados (Modal, Recolhivel, avisos), visual do Figma intocado, TDD nas funções puras.

## Processo depois da aprovação

1. Salvar este desenho como spec em
   `docs/superpowers/specs/2026-10-28-cobranca-os-atrasadas-design.md` e o plano em
   `docs/superpowers/plans/2026-10-28-cobranca-os-atrasadas.md`, num commit de docs.
2. Implementar task a task (TDD), no modo Native, como na rodada anterior.
3. Um commit `feat:` na `eduardo`, revisão final do branch e depois a decisão sobre o PR.

## Desenho

### A · Atraso das OS

- **`crud/pagamentos/atraso.ts`** (novo, puro):
  - `LIMITE_SEMANA = 7`, `LIMITE_MES = 30`;
  - `diasDesdeVisita(atendimento: Pick<Atendimento, "data" | "horario">, hoje: Date): number`,
    em dias corridos e no relógio local; antes da visita dá 0;
  - `type NivelAtraso = "em-dia" | "semana" | "mes"` e `nivelAtraso(dias: number): NivelAtraso`;
  - `estaAtrasada(atendimento: Atendimento, hoje: Date): boolean`, que vale para status
    `concluido`, sem `pagoEm` e com 7 dias ou mais;
  - `rotuloAtraso(dias: number): string`: "Atrasada há 10 dias", "Atrasada há 1 mês",
    "Atrasada há 2 meses" (meses = `Math.floor(dias / 30)`).
- **`crud/pagamentos/lancamentos.ts`**:
  - `Lancamento` ganha `diasEmAberto: number | null`, preenchido só em OS a receber;
  - `lancamentosDePagamento(atendimentos, pedidos, hoje = new Date())`;
  - `FiltroSituacao` ganha `"atrasadas"` (OS a receber com `diasEmAberto >= 7`);
  - `contarPorSituacao` passa a contar as atrasadas;
  - `resumoPagamentos` devolve também `aReceber.atrasadas`.
- **`/admin/pagamentos`** (`paginas/admin/pagamentos/pagamentos.tsx` + `.css`):
  - chip "Atrasadas (n)" entre "A receber" e "Recebidos";
  - o chip inicial vem de `?situacao=` na URL;
  - **um selo só por linha**: "A receber" em cinza neutro (`#f1f1f4`/`#5f6368`), "Atrasada há N
    dias" em amarelo (as cores de `selo-atendimento--a-pagar`) e "Atrasada há N mês/meses" em
    vermelho (`#fdecea`/`#c0392b`);
  - linha de OS: botões "Ver OS" (contorno, abre o modal) e, se a receber, "Marcar como pago";
  - linha de pedido: continua só com "Ver pedido".
- **`ModalCobrancaOs`** (`paginas/admin/atendimento/componentes/ModalCobrancaOs/`, compartilhado
  por pagamentos e atendimentos): `<Modal titulo="OS #código">` com
  `{ atendimento, onFechar, onMarcarPago?, pagando? }`:
  - dados: cliente, visita (`formatarDataHora`), total (`totalOs`) e situação (o mesmo selo);
  - `CaixaCobranca` quando `estaAtrasada`;
  - ações: "Marcar como pago" (só quando a página passa `onMarcarPago`; em pagamentos é o
    `marcarPago` que já existe, com `perguntaPagamento`) e o link "Abrir a OS completa"
    (`/admin/atendimentos/:id`).
- **`SeloAtraso({ dias })`**, junto do `SeloStatusAtendimento`
  (`paginas/admin/atendimentos/componentes/SeloStatusAtendimento/`): mostra o `rotuloAtraso`,
  em amarelo pra "semana" e em vermelho pra "mês". Quando a OS está atrasada, as duas telas usam
  esse selo; fora isso, cada uma mantém o próprio texto ("A receber"/"Recebido" em pagamentos,
  "A pagar"/"Pago" em atendimentos).
- **Home do painel** (`NumerosPainel.tsx`): o detalhe do "A receber" vira
  "3 a receber · 2 atrasadas" quando há atrasadas, e o link passa a ser
  `/admin/pagamentos?situacao=atrasadas` nesse caso.
- **Tela da OS** (`paginas/admin/atendimento/atendimento.tsx`): quando `estaAtrasada`, um bloco
  "Pagamento atrasado há N dias" com a `CaixaCobranca`, logo antes do `CartaoClienteOs`.
- **Lista `/admin/atendimentos`** (`paginas/admin/atendimentos/atendimentos.tsx` + `.css`):
  - `SeloAtraso` no lugar do "A pagar" nas OS concluídas atrasadas;
  - o filtro Pagamento do `PainelFiltros` ganha "Atrasados" (`FiltroPagamento` passa a
    `"" | "a-pagar" | "pago" | "atrasado"`, e `filtrarAtendimentos(atendimentos, filtros, hoje = new Date())`);
  - também lê `?pagamento=atrasado` da URL;
  - OS atrasada ganha o botão "Cobrar" (contorno), que abre o `ModalCobrancaOs`, sem
    "Marcar como pago" ali (o modal leva à OS completa);
  - como hoje o card e a linha inteiros são um `<Link>` (botão dentro de link é inválido), passam
    a usar o "link esticado" do `CardProduto`: um `<div>` com um `<Link>` absoluto cobrindo tudo
    (com `aria-label` "Abrir OS #código") e o "Cobrar" por cima (`position: relative; z-index: 1`).
    Na lista compacta, o "Cobrar" fica na célula de status, ao lado dos selos.

### B · Cobrança pelo WhatsApp

- **`crud/atendimentos/whatsapp.ts`**:
  - `linkOsCliente(id: string, origem: string): string` →
    `${origem}/minha-conta/atendimentos/${id}`;
  - `textoCobranca(atendimento, linkOs: string): string`, com este texto exato:
    `Olá, {primeiro nome}! Aqui é da Bruxel Piscinas. O pagamento da ordem de serviço #{código}
    ({tipo}, visita em {dd/mm}), no valor de {R$ total}, ainda está em aberto. Você pode ver a OS
    aqui: {link}` + quebra de linha + `Qualquer dúvida, é só responder esta mensagem.`;
  - reaproveita `primeiroNome`, `codigoAtendimento`, `TIPO_SERVICO_LABELS`, `totalOs` e
    `formatarReais`.
- **`crud/pagamentos/cobrancasLocais.ts`** (puro) e **`hooks/useCobrancasLocais.ts`**:
  - `CHAVE_COBRANCAS = "bruxel:cobrancas"`;
  - `lerCobrancas(texto: string | null): Record<string, string>`: id → ISO, descarta o que
    vier quebrado;
  - `registrarCobranca(mapa, id, quando: Date)`;
  - o hook expõe `cobradoEm(id): string | null` e `registrar(id)`, com localStorage em `try/catch`.
- **`CaixaCobranca`** (`paginas/admin/atendimento/componentes/CaixaCobranca/`, usada pelo modal
  e pela tela da OS):
  - `<textarea>` com `textoCobranca(...)`, que o admin pode editar;
  - "Voltar ao texto padrão";
  - "Para {telefone formatado}";
  - "Abrir no WhatsApp": um `<a target="_blank">` com `linkWhatsApp(telefone, textoEditado)`,
    no estilo do botão de WhatsApp do `CartaoClienteOs`. Ao clicar, chama `registrar(id)` e
    avisa "Cobrança aberta no WhatsApp.";
  - telefone inválido (`linkWhatsApp` devolve `null`): sem botão, com a frase
    "Esta OS não tem telefone com DDD. Cobre o cliente por outro canal.";
  - "Cobrado em dd/mm (neste navegador)" quando existe registro.

### C · Página da OS para o cliente

- **Rota** `/minha-conta/atendimentos/:id` dentro do `RotaLogado` (`App.tsx`). Depois do login, o
  `RotaLogado` já devolve a pessoa pra página certa.
- **`paginas/portal/minha-os/minha-os.tsx`** + `.css`, no visual do resumo de `/pedido/:id`:
  - usa `useAtendimento(id)`; no hook, o 403 também vira `naoEncontrado` (o backend responde 403
    pra OS de outra conta);
  - conteúdo:
    - h1 "Ordem de serviço #{código}";
    - "{tipo} · visita em {dd/mm/aaaa às hh:mm}" (`formatarAgendamento`);
    - situação (`STATUS_LABELS`);
    - descrição;
    - materiais (`produtosUsados`);
    - total (`valorTotal`, que o backend calcula pro cliente; some se vier `null`);
    - "Mensagem da Bruxel", se houver;
    - "Dúvidas sobre o pagamento? Responda a mensagem da Bruxel no WhatsApp.";
    - link "Ver meus atendimentos" (`/perfil`, `state={{ aba: "atendimentos" }}`);
  - estados: carregando; erro com "Tentar novamente"; não encontrada → `MensagemPagina`
    "OS não encontrada".
- **`AbaAtendimentos.tsx`**: cada card ganha o link "Ver OS" pra essa página.

## Testes (TDD, vitest)

- **`atraso.test.ts`**:
  - `diasDesdeVisita`: 0 antes ou no dia da visita; 7 no 7º dia; virada de mês no relógio local;
  - `nivelAtraso`: 6 → em-dia, 7 → semana, 29 → semana, 30 → mes;
  - `estaAtrasada`: só concluída, sem `pagoEm` e com 7 dias ou mais;
  - `rotuloAtraso`: 10 → "Atrasada há 10 dias", 30 → "Atrasada há 1 mês", 65 → "Atrasada há 2 meses".
- **`lancamentos.test.ts`**:
  - `diasEmAberto` só em OS a receber;
  - filtro "atrasadas";
  - `contarPorSituacao` com atrasadas;
  - `resumoPagamentos.aReceber.atrasadas`.
- **`whatsapp.test.ts`** (novo):
  - `textoCobranca` com o texto exato acima;
  - `linkOsCliente`;
  - `linkWhatsApp` de um texto com quebra de linha codifica o `%0A`.
- **`cobrancasLocais.test.ts`**: JSON quebrado → `{}`; registrar sobrescreve a data; valores que
  não são string são descartados.
- **`filtrarAtendimentos.test.ts`**: "atrasado" traz só concluídas não pagas com 7 dias ou mais;
  "a-pagar" continua trazendo todas as não pagas; o filtro conta como ativo.

## Verificação

- `npm run test`, `npm run lint` e `npm run build` no `frontend/`.
- No Browser pane, a 1440 e a 390px:
  - em `/admin/pagamentos`: o chip "Atrasadas", os selos de 10 dias e de 1 mês e o modal "Ver OS";
  - a caixa de cobrança: editar o texto → o link `wa.me` leva o texto editado; "Voltar ao texto
    padrão"; "Cobrado em" depois de clicar;
  - sem telefone, a frase no lugar do botão;
  - o aviso de atraso na tela da OS;
  - em `/admin/atendimentos`, nos dois modos (cards e lista): selos de atraso, o filtro
    "Atrasados" e o "Cobrar" abrindo o modal sem navegar; clicar no resto do card ainda abre a OS;
    Tab passa pelo link e pelo botão;
  - a home com "N atrasadas" levando ao filtro;
  - `/minha-conta/atendimentos/:id` deslogado (vai pro login e volta), OS de outra conta (não
    encontrada) e o "Ver OS" do perfil.
- Os dados de teste ficam como na rodada anterior: sessão falsa e respostas simuladas só na aba,
  limpando o `localStorage` no fim. Com login real, quem confere é o Eduardo.

## Recado pro backend (vai na spec e no PR)

1. Campo `cobrado_em` na OS, gravado por uma rota tipo `PATCH /appointments/:id/cobranca` (admin),
   pra a cobrança valer pra todos os admins e não só no navegador de quem cobrou.
2. `concluido_em` na OS (já pedido antes): com ele, o atraso conta da conclusão, não da visita.
3. Pra quando o grupo quiser pedidos não pagos: o pedido voltar a nascer `PENDENTE` e uma rota
   `PATCH /orders/:id/pagamento`.
