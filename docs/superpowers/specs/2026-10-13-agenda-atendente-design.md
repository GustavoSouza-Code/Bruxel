# Escolher atendente, dia e horário (agenda)

- **Issue:** [GustavoSouza-Code/Bruxel#22](https://github.com/GustavoSouza-Code/Bruxel/issues/22) (lado do cliente; continua sem fechar a issue)
- **Data:** 13/10/2026
- **Branch:** `feat/solicitar-atendimento` (a mesma da tela de solicitar atendimento; ainda não foi enviada)
- **Parte de:** [2026-10-12-solicitar-atendimento-design.md](2026-10-12-solicitar-atendimento-design.md) — esta mudança realiza a seção "Futuro" daquele spec

## Objetivo

Hoje o bloco "Quando você prefere?" do `/solicitar-atendimento` pede só uma data e um
turno (manhã/tarde), e a Bruxel combina o resto depois. O Eduardo quer que o cliente
**escolha o atendente (piscineiro) e depois um dia e horário livres na agenda dele**,
sem conseguir pegar um horário que já tem outro atendimento.

## Escopo

**Entra:**

- Bloco 4 do formulário vira "Atendente e horário": cards de atendente (com "Sem
  preferência"), faixa de dias e horários livres.
- Agenda calculada no front a partir de regras fixas + pedidos já feitos (em memória).
- O pedido guarda `tecnicoId`, `data` e `horario` no lugar de `dataPreferida` e `periodo`.
- Aba "Atendimentos" e aviso de sucesso mostram dia, horário e atendente.
- Funções puras da agenda com testes Vitest.

**Fica pra depois:**

- Cadastro de atendentes e da agenda pelo painel admin.
- Feriados, férias e mudança de horário de funcionamento.
- Garantia real de "ninguém pega o mesmo horário": isso é do backend (ver "Recado pro backend").

## Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Formato dos horários | Blocos fixos de 2h: segunda a sexta 08:00, 10:00, 13:30 e 15:30; sábado 08:00 e 10:00; domingo fechado | Escolhido pelo Eduardo; segue o horário do rodapé (seg–sex 8h–11h45 e 13h30–18h, sáb 8h–12h); poucos botões, bom no celular |
| Status depois de enviar | Continua "Aguardando confirmação", mas o horário já fica reservado (some pra quem vier depois) | Escolhido pelo Eduardo: a Bruxel ainda confirma a visita |
| "Sem preferência" | Card próprio, já marcado; mostra os horários em que pelo menos um atendente está livre; ao enviar, o pedido vai pro primeiro atendente livre naquele horário (na ordem da lista) | Escolhido pelo Eduardo; a maioria dos clientes não liga pra quem vem |
| Layout | A: cards de atendente → faixa de dias que rola pro lado → horários em pílulas | Escolhido pelo Eduardo entre 2 previews; mesmo visual dos cards de tipo de serviço |
| Como a agenda é montada | Por regras (abordagem 1): horários do dia pela regra acima, indisponibilidades fixas de exemplo por dia da semana, e os pedidos não cancelados de **todas** as contas ocupando o horário | Funções puras e testáveis; o formato `tecnicoId + data + horario` é o mesmo que o backend vai guardar |
| Dias mostrados | Os próximos 14 dias corridos a partir de amanhã, sem domingo | Duas semanas cobrem o caso comum sem uma faixa enorme |
| Atendentes | 3 de exemplo: Carlos (Bombas e filtros), Marcos (Limpeza e manutenção), Rafael (Instalação e vazamentos) | Sem tabela de técnicos no banco ainda; nomes de exemplo |
| Ocupação entre contas | O contexto guarda os pedidos de cada conta separados, mas a ocupação junta todos | A agenda do atendente é uma só, seja quem for o cliente |

## Dados

```ts
// tipos/atendimento.ts
type HorarioVisita = "08:00" | "10:00" | "13:30" | "15:30";

interface Atendimento {
  id: string;
  tipo: TipoServico;
  descricao: string;
  fotos: string[];
  tecnicoId: string;        // sempre um atendente de verdade ("Sem preferência" é resolvido no envio)
  data: string;             // "aaaa-mm-dd"
  horario: HorarioVisita;   // início do bloco de 2h
  contato: ContatoAtendimento;
  status: StatusAtendimento;
  criadoEm: string;
}
// sai: PeriodoAtendimento, dataPreferida, periodo

// tipos/tecnico.ts
interface Tecnico { id: string; nome: string; especialidade: string; }

/** Um horário ocupado na agenda de um atendente. */
interface Ocupacao { tecnicoId: string; data: string; horario: HorarioVisita; }
```

- `dados/tecnicos.ts`: `TECNICOS` (os 3 acima, ids `"carlos"`, `"marcos"`, `"rafael"`) e
  `INDISPONIBILIDADES_FIXAS: { tecnicoId; diaSemana (0 = domingo … 6 = sábado); horario }[]`
  — compromissos que se repetem toda semana, só pra a agenda de exemplo não parecer vazia:
  Carlos terça 10:00 e quinta 13:30; Marcos quarta 08:00 e 10:00 e sábado 08:00 e 10:00
  (o sábado inteiro, pra dar pra ver um dia apagado); Rafael segunda 15:30 e sexta 13:30 e 15:30.
- `dados/atendimentos.ts`: os 2 exemplos ganham `tecnicoId`, `data` e `horario` (no lugar de
  `dataPreferida`/`periodo`).
- `SEM_PREFERENCIA = "qualquer"`: valor da escolha de atendente quando o cliente não liga pra quem vem.

## Lógica (`crud/atendimentos/agenda.ts`, funções puras)

| Função | O que faz |
|---|---|
| `diasDaAgenda(hoje, quantidade = 14)` | Os próximos `quantidade` dias corridos a partir de amanhã, sem domingos, em "aaaa-mm-dd" (no fuso local) |
| `horariosDoDia(data)` | Os horários daquele dia pela regra (seg–sex 4, sábado 2, domingo nenhum) |
| `ocupacoesDosAtendimentos(atendimentos)` | Os horários ocupados por pedidos, ignorando os cancelados |
| `tecnicoEstaLivre(tecnicoId, data, horario, ocupacoes)` | false se tem indisponibilidade fixa naquele dia da semana/horário ou um pedido ocupando |
| `primeiroTecnicoLivre(data, horario, ocupacoes)` | O id do primeiro atendente livre (ordem de `TECNICOS`), ou null |
| `horarioEstaLivre(escolha, data, horario, ocupacoes)` | Pra um atendente: `tecnicoEstaLivre`; pra `SEM_PREFERENCIA`: se existe algum livre |
| `diaTemHorarioLivre(escolha, data, ocupacoes)` | Se algum horário do dia está livre pra escolha (decide se o dia fica apagado) |
| `formatarAgendamento(data, horario, nomeTecnico)` | "21/10/2026 às 13:30 com Carlos" |

`datasAtendimento.ts` fica com `formatarData` e passa a exportar `paraDataIso` (usada pela
agenda). Saem `dataMinima` e `formatarPreferencia` (e `PERIODO_LABELS`/`PERIODOS`), que só
serviam ao bloco antigo; o teste de "tarde da noite" passa a valer pro `diasDaAgenda`.

## Validação

`RascunhoSolicitacao` troca `dataPreferida`/`periodo` por `tecnico: string` (id ou
`SEM_PREFERENCIA`, começa em `SEM_PREFERENCIA`), `data: string` ("" = não escolheu) e
`horario: HorarioVisita | null`. `validarSolicitacao(rascunho, hoje, ocupacoes)`:

- data vazia → "Escolha o dia."; data fora de `diasDaAgenda(hoje)` → "Escolha um dia da lista.";
- horário vazio → "Escolha um horário.";
- horário não livre pra escolha → "Esse horário acabou de ser ocupado. Escolha outro.";
- o resto (tipo, descrição, contato) continua igual.

## Tela

**Bloco 4 — "Atendente e horário"** (substitui o `SeletorQuando`, que é apagado):

- `SeletorAtendente`: cards (radios escondidos só visualmente, como os de tipo de
  serviço) com "Sem preferência" (ícone, "quem estiver livre") + um card por atendente
  (círculo com as 2 primeiras letras do nome, nome e especialidade).
- `SeletorDiaHorario`:
  - faixa de dias (radios) que rola pro lado, com "Ter" em cima e "14" embaixo; dia sem
    nenhum horário livre pra escolha fica apagado e desabilitado; reaproveita o
    `useBordasRolagem` (o mesmo do menu do cabeçalho) pra esmaecer as bordas quando há
    dias escondidos;
  - antes de escolher o dia: "Escolha um dia pra ver os horários.";
  - depois: "Horários livres em ter, 14/10" e pílulas (radios) com os horários do dia;
    ocupado fica desabilitado e riscado, com o nome acessível "13:30, ocupado".
- Trocar de atendente: se o horário escolhido deixar de estar livre, ele é limpo; se o
  dia escolhido ficar sem horário livre, o dia também é limpo. Trocar de dia limpa o horário.
- Dica embaixo: "O horário fica reservado e a Bruxel confirma a visita com você."

**Envio:** com "Sem preferência", o `tecnicoId` do pedido é o `primeiroTecnicoLivre`
naquele dia/horário. O aviso no `/perfil` vira
"Pedido enviado! Horário reservado pra 21/10/2026 às 13:30 com Carlos. A Bruxel confirma a visita com você."

**Aba Atendimentos:** a linha "Preferência: …" vira "Visita: 21/10/2026 às 13:30 · Carlos".

## Contexto

`ProvedorAtendimentos` passa a guardar **só os pedidos novos** de cada conta
(`Record<idUsuario, Atendimento[]>`); a lista da conta é `[...próprios, ...ATENDIMENTOS_EXEMPLO]`
e a numeração conta os dois. Expõe também `ocupacoes`: os pedidos novos de **todas** as
contas + os exemplos, passados por `ocupacoesDosAtendimentos`. A interface
`ValorContextoAtendimentos` ganha `ocupacoes: Ocupacao[]`.

## Recado pro backend

- Técnicos: uma tabela própria ou o perfil `TECNICO` em `users`.
- `appointments` com `tecnico_id` e `data_hora` (início do bloco), e uma regra de
  unicidade pra `tecnico_id + data_hora` quando o status não for cancelado — **a checagem
  de conflito de verdade é do backend**; o front só esconde o que já sabe que está ocupado.
- Uma rota de horários livres (por técnico e período) pra substituir as regras do front.

## Testes

Vitest em `agenda.test.ts`: domingo fora e quantidade de dias; virada de mês; dia
calculado no fuso local tarde da noite; sábado só com 08:00 e 10:00; indisponibilidade
fixa; pedido de outra conta ocupando; pedido cancelado liberando; "Sem preferência" livre
quando ao menos um está livre e pegando o primeiro livre; dia apagado quando nada está
livre; `formatarAgendamento`. Ajustes em `validarSolicitacao.test.ts` (dia, horário,
horário ocupado), `datasAtendimento.test.ts` (sai o que foi removido) e
`novoAtendimento.test.ts` (dados novos).

## Verificação

- `npm test --prefix frontend`, `npm run build --prefix frontend`, `npm run lint --prefix frontend` (só o erro antigo do `ContextoCarrinho.tsx`).
- No navegador (logado com a conta de teste, backend na porta 3000), desktop e 375px:
  - "Sem preferência" marcado de cara;
  - domingos fora da faixa;
  - escolhendo o Marcos, os sábados aparecem apagados (o sábado dele está todo ocupado);
  - horário ocupado riscado;
  - trocar de atendente limpa o horário quando ele deixa de estar livre;
  - enviar → aviso com dia, horário e atendente, e o card novo;
  - abrir o formulário de novo → aquele horário aparece ocupado pro mesmo atendente;
  - sem rolagem horizontal da página no celular.
