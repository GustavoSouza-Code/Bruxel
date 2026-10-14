# Agenda de atendente — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No `/solicitar-atendimento`, o cliente escolhe o atendente (ou "Sem preferência") e depois um dia e horário livres na agenda dele, no lugar de "data + manhã/tarde".

**Architecture:** A agenda é calculada por funções puras em `frontend/src/crud/atendimentos/agenda.ts` (testadas com Vitest), a partir de três coisas: as regras de horário (blocos de 2h), as indisponibilidades fixas de exemplo e os pedidos já feitos por qualquer conta. O `ProvedorAtendimentos` expõe essa ocupação. Dois componentes novos (`SeletorAtendente` e `SeletorDiaHorario`) substituem o `SeletorQuando`. O pedido passa a guardar `tecnicoId`, `data` e `horario`.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Vite 8, Vitest 5, CSS puro (BEM em português)

**Spec:** `docs/superpowers/specs/2026-10-13-agenda-atendente-design.md` (parte de `docs/superpowers/specs/2026-10-12-solicitar-atendimento-design.md`)

## Global Constraints

- Nenhuma dependência nova. Os testes automáticos cobrem só as funções puras; a interface é conferida no navegador pelo controller.
- Branch `feat/solicitar-atendimento`. Nunca commitar nem dar push na `eduardo`, nunca dar push nesta branch, nunca fazer amend.
- Lint: não pode surgir erro novo. Linha de base: 1 erro que já existe (`react-refresh/only-export-components` em `src/contexto/ContextoCarrinho.tsx`).
- Fast Refresh: arquivo `.tsx` de componente exporta só componentes (exportar tipo pode).
- React Hooks v7 (lint): nada de `setState` direto no corpo de `useEffect`, nada de ler ou escrever `ref.current` durante a renderização, nada de função impura (`new Date()`) direto no render (usar o inicializador do `useState`).
- Identificadores, comentários e textos em pt-BR, no estilo do projeto: comentários curtos que explicam o porquê, pensando num estudante lendo.
- CSS: classes BEM `bloco__elemento--modificador`, com cores de `src/estilos/tokens.css`. Os hex literais permitidos são só `#f7f7fa`, `#e2effa`, `#e3f5e8`, `#1e7a3c`, `#f1f1f4` e `#c0392b`.
- Horários de visita (blocos de 2h): segunda a sexta 08:00, 10:00, 13:30 e 15:30; sábado 08:00 e 10:00; domingo fechado.
- Dias mostrados: os próximos 14 dias corridos a partir de amanhã, sem domingo, calculados no fuso local.
- Atendentes de exemplo, nesta ordem: `carlos` (Carlos, "Bombas e filtros"), `marcos` (Marcos, "Limpeza e manutenção"), `rafael` (Rafael, "Instalação e vazamentos").
- Indisponibilidades fixas: Carlos terça 10:00 e quinta 13:30; Marcos quarta 08:00 e 10:00, sábado 08:00 e 10:00; Rafael segunda 15:30, sexta 13:30 e 15:30.
- Valor da escolha "Sem preferência": `SEM_PREFERENCIA = "qualquer"`. É o valor inicial do formulário. Ao enviar, vira o primeiro atendente livre (na ordem acima).
- O pedido continua com status inicial `"aguardando"`. Um horário de pedido não cancelado, de qualquer conta, fica ocupado pra todo mundo.
- Textos exatos:
  - "Escolha o dia."
  - "Escolha um dia da lista."
  - "Escolha um horário."
  - "Esse horário acabou de ser ocupado. Escolha outro."
  - "Escolha um dia pra ver os horários."
  - "Horários livres em {ter, 14/10}"
  - "O horário fica reservado e a Bruxel confirma a visita com você."
  - aviso: "Pedido enviado! Horário reservado pra {21/10/2026 às 13:30 com Carlos}. A Bruxel confirma a visita com você."
  - aba: "Visita: {21/10/2026} às {13:30} · {Carlos}"
- Todo commit termina com `-m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`.
- Os comandos rodam a partir da raiz do repositório (`Bruxel/`).
- Vite no OneDrive: se o dev server servir arquivo antigo, dar `touch` no arquivo editado.

## Review Focus

1. **Trocar de atendente depois de escolher o horário.** Se o horário escolhido deixar de estar livre pro novo atendente, ele precisa ser limpo, e nunca dá pra enviar um horário ocupado. Coberto pelo teste "horário que o atendente escolhido não tem livre é recusado" (Task 3), pela limpeza no `escolherTecnico` (Task 3) e pela checagem no navegador.
2. **Pedido feito tarde da noite.** A faixa começa "amanhã" pelo relógio local, não pelo UTC. Coberto pelo teste "usa o dia do relógio local, mesmo tarde da noite" (Task 1).
3. **Domingo e virada de mês.** Domingo nunca aparece, e 31/10 → 02/11 pula o domingo 01/11. Coberto pelos testes "não mostra domingo" e "vira o mês pulando o domingo" (Task 1).
4. **Pedido de outra conta.** Um horário pedido por outra conta tem que aparecer ocupado. Coberto pelo teste "pedido ocupa o horário só daquele atendente" (Task 1) e pela ocupação que junta todas as contas no provedor (Task 3).
5. **Pedido cancelado** libera o horário. Coberto pelo teste "pedido cancelado não ocupa o horário" (Task 1).

---

## Mapa de arquivos

| Arquivo | Responsabilidade | Task |
|---|---|---|
| `frontend/src/tipos/atendimento.ts` | `HorarioVisita` (T1); troca `dataPreferida`/`periodo` por `tecnicoId`/`data`/`horario` e remove `PeriodoAtendimento` (T3) | 1, 3 |
| `frontend/src/tipos/tecnico.ts` | `Tecnico`, `Ocupacao` | 1 |
| `frontend/src/dados/tecnicos.ts` | `TECNICOS`, `INDISPONIBILIDADES_FIXAS` | 1 |
| `frontend/src/crud/atendimentos/datasAtendimento.ts` (+ `.test.ts`) | exporta `paraDataIso` (T1); remove `dataMinima` e `formatarPreferencia` (T3) | 1, 3 |
| `frontend/src/crud/atendimentos/agenda.ts` (+ `.test.ts`) | Regras da agenda | 1 |
| `frontend/src/componentes/ui/Icones/Icones.tsx` | `IconePessoas` | 2 |
| `.../solicitar-atendimento/componentes/SeletorAtendente/*` | Cards de atendente | 2 |
| `.../solicitar-atendimento/componentes/SeletorDiaHorario/*` | Faixa de dias + horários | 2 |
| `frontend/src/crud/atendimentos/opcoesAtendimento.ts` | Remove `PERIODO_LABELS`/`PERIODOS` | 3 |
| `frontend/src/crud/atendimentos/validarSolicitacao.ts` (+ `.test.ts`) | Valida dia/horário livre | 3 |
| `frontend/src/crud/atendimentos/novoAtendimento.test.ts` | Dados de teste novos | 3 |
| `frontend/src/dados/atendimentos.ts` | Exemplos com atendente/dia/horário | 3 |
| `frontend/src/contexto/useAtendimentos.ts` + `ContextoAtendimentos.tsx` | `ocupacoes` de todas as contas | 3 |
| `frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx` | Linha "Visita: …" | 3 |
| `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx` | Usa os seletores novos | 3 |
| `.../solicitar-atendimento/componentes/SeletorQuando/*` | Apagado | 3 |
| `docs/superpowers/specs/2026-10-12-solicitar-atendimento-design.md` | Aponta pro spec novo | 3 |

---

### Task 1: Regras da agenda (funções puras)

**Files:**
- Modify: `frontend/src/tipos/atendimento.ts` (só acrescenta `HorarioVisita`)
- Create: `frontend/src/tipos/tecnico.ts`
- Create: `frontend/src/dados/tecnicos.ts`
- Modify: `frontend/src/crud/atendimentos/datasAtendimento.ts` (exporta `paraDataIso`)
- Modify: `frontend/src/crud/atendimentos/datasAtendimento.test.ts` (teste do `paraDataIso`)
- Create: `frontend/src/crud/atendimentos/agenda.ts`
- Test: `frontend/src/crud/atendimentos/agenda.test.ts`

**Interfaces:**
- Consumes: `formatarData(dataIso: string): string` e `paraDataIso(data: Date): string` de `datasAtendimento.ts`; `StatusAtendimento` de `tipos/atendimento.ts`
- Produces:
  - `type HorarioVisita = "08:00" | "10:00" | "13:30" | "15:30"` (em `tipos/atendimento.ts`)
  - `interface Tecnico { id: string; nome: string; especialidade: string }` e `interface Ocupacao { tecnicoId: string; data: string; horario: HorarioVisita }` (em `tipos/tecnico.ts`)
  - `TECNICOS: Tecnico[]`, `INDISPONIBILIDADES_FIXAS: IndisponibilidadeFixa[]`, `interface IndisponibilidadeFixa { tecnicoId: string; diaSemana: number; horario: HorarioVisita }` (em `dados/tecnicos.ts`)
  - Em `agenda.ts`:
    - `SEM_PREFERENCIA = "qualquer"`
    - `diasDaAgenda(hoje: Date, quantidade = 14): string[]`
    - `horariosDoDia(data: string): HorarioVisita[]`
    - `ocupacoesDosAtendimentos(pedidos: (Ocupacao & { status: StatusAtendimento })[]): Ocupacao[]`
    - `tecnicoEstaLivre(tecnicoId: string, data: string, horario: HorarioVisita, ocupacoes: Ocupacao[]): boolean`
    - `primeiroTecnicoLivre(data: string, horario: HorarioVisita, ocupacoes: Ocupacao[]): string | null`
    - `horarioEstaLivre(escolha: string, data: string, horario: HorarioVisita, ocupacoes: Ocupacao[]): boolean`
    - `diaTemHorarioLivre(escolha: string, data: string, ocupacoes: Ocupacao[]): boolean`
    - `formatarAgendamento(data: string, horario: HorarioVisita, nomeTecnico: string): string`
    - `nomeDoTecnico(tecnicoId: string): string`
    - `partesDoDia(data: string): { semana: string; dia: string }`
    - `formatarDiaCurto(data: string): string`

Referência de calendário pros testes: 12/10/2026 é uma **segunda-feira**. Então 13 = ter, 14 = qua, 15 = qui, 16 = sex, 17 = sáb, 18 = dom, 19 = seg, 20 = ter, 21 = qua, 24 = sáb, 25 = dom, 26 = seg, 31/10 = sáb, 01/11 = dom, 02/11 = seg.

- [ ] **Step 1: Tipos e dados (sem lógica)**

Em `frontend/src/tipos/atendimento.ts`, logo depois do tipo `PeriodoAtendimento`, acrescente:

```ts
/** Início de um bloco de visita de 2h na agenda do atendente. */
export type HorarioVisita = "08:00" | "10:00" | "13:30" | "15:30";
```

`frontend/src/tipos/tecnico.ts`:

```ts
import type { HorarioVisita } from "./atendimento";

/**
 * Atendente (piscineiro) que faz as visitas. Ainda não existe no backend: os de
 * exemplo estão em dados/tecnicos.ts.
 */
export interface Tecnico {
  id: string;
  nome: string;
  /** o que ele mais faz; aparece no card, embaixo do nome */
  especialidade: string;
}

/** Um horário ocupado na agenda de um atendente. */
export interface Ocupacao {
  tecnicoId: string;
  /** "aaaa-mm-dd" */
  data: string;
  horario: HorarioVisita;
}
```

`frontend/src/dados/tecnicos.ts`:

```ts
import type { HorarioVisita } from "../tipos/atendimento";
import type { Tecnico } from "../tipos/tecnico";

/**
 * Atendentes de exemplo, na ordem em que aparecem no formulário (e em que o
 * "Sem preferência" procura alguém livre).
 * TODO: trocar pela lista de técnicos do backend quando ela existir.
 */
export const TECNICOS: Tecnico[] = [
  { id: "carlos", nome: "Carlos", especialidade: "Bombas e filtros" },
  { id: "marcos", nome: "Marcos", especialidade: "Limpeza e manutenção" },
  { id: "rafael", nome: "Rafael", especialidade: "Instalação e vazamentos" },
];

/** Compromisso que se repete toda semana na agenda de um atendente. */
export interface IndisponibilidadeFixa {
  tecnicoId: string;
  /** 0 = domingo … 6 = sábado (o mesmo número do Date.getDay()) */
  diaSemana: number;
  horario: HorarioVisita;
}

/**
 * Horários que cada atendente nunca tem livres, só pra a agenda de exemplo não
 * parecer vazia. O sábado do Marcos está todo ocupado de propósito: assim dá pra
 * ver um dia apagado na faixa de dias.
 * TODO: vem da agenda do backend quando ela existir.
 */
export const INDISPONIBILIDADES_FIXAS: IndisponibilidadeFixa[] = [
  { tecnicoId: "carlos", diaSemana: 2, horario: "10:00" },
  { tecnicoId: "carlos", diaSemana: 4, horario: "13:30" },
  { tecnicoId: "marcos", diaSemana: 3, horario: "08:00" },
  { tecnicoId: "marcos", diaSemana: 3, horario: "10:00" },
  { tecnicoId: "marcos", diaSemana: 6, horario: "08:00" },
  { tecnicoId: "marcos", diaSemana: 6, horario: "10:00" },
  { tecnicoId: "rafael", diaSemana: 1, horario: "15:30" },
  { tecnicoId: "rafael", diaSemana: 5, horario: "13:30" },
  { tecnicoId: "rafael", diaSemana: 5, horario: "15:30" },
];
```

Em `frontend/src/crud/atendimentos/datasAtendimento.ts`, troque

```ts
// "aaaa-mm-dd" no fuso do navegador (o toISOString usaria UTC e, à noite no Brasil,
// já daria o dia seguinte)
function paraDataIso(data: Date) {
```

por

```ts
/**
 * Data no formato "aaaa-mm-dd", no fuso do navegador (o toISOString usaria UTC e,
 * à noite no Brasil, já daria o dia seguinte).
 */
export function paraDataIso(data: Date) {
```

- [ ] **Step 2: Escrever os testes (falhando)**

Em `frontend/src/crud/atendimentos/datasAtendimento.test.ts`:
- acrescente `paraDataIso` ao import (`import { dataMinima, formatarData, formatarPreferencia, paraDataIso } from "./datasAtendimento";`);
- acrescente no fim do arquivo:

```ts
describe("paraDataIso", () => {
  it("usa o dia do relógio local, mesmo tarde da noite", () => {
    expect(paraDataIso(new Date(2026, 9, 12, 23, 30))).toBe("2026-10-12");
  });
});
```

`frontend/src/crud/atendimentos/agenda.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Ocupacao } from "../../tipos/tecnico";
import {
  SEM_PREFERENCIA,
  diaTemHorarioLivre,
  diasDaAgenda,
  formatarAgendamento,
  formatarDiaCurto,
  horarioEstaLivre,
  horariosDoDia,
  nomeDoTecnico,
  ocupacoesDosAtendimentos,
  partesDoDia,
  primeiroTecnicoLivre,
  tecnicoEstaLivre,
} from "./agenda";

// 12/10/2026, uma segunda-feira (no Date o mês começa em 0)
const HOJE = new Date(2026, 9, 12);

describe("diasDaAgenda", () => {
  it("são os próximos 14 dias a partir de amanhã, sem domingo", () => {
    const dias = diasDaAgenda(HOJE);
    expect(dias[0]).toBe("2026-10-13");
    expect(dias[dias.length - 1]).toBe("2026-10-26");
    // 14 dias corridos menos os domingos 18 e 25
    expect(dias).toHaveLength(12);
  });

  it("não mostra domingo", () => {
    const dias = diasDaAgenda(HOJE);
    expect(dias).not.toContain("2026-10-18");
    expect(dias).not.toContain("2026-10-25");
  });

  it("vira o mês pulando o domingo", () => {
    // sexta 30/10: amanhã é sábado 31, depois domingo 01/11 (fora) e segunda 02/11
    expect(diasDaAgenda(new Date(2026, 9, 30), 3)).toEqual(["2026-10-31", "2026-11-02"]);
  });

  it("usa o dia do relógio local, mesmo tarde da noite", () => {
    // às 23h30 no Brasil já é o dia seguinte em UTC; o primeiro dia continua sendo "amanhã" daqui
    expect(diasDaAgenda(new Date(2026, 9, 12, 23, 30))[0]).toBe("2026-10-13");
  });
});

describe("horariosDoDia", () => {
  it("segunda a sexta tem 4 horários", () => {
    expect(horariosDoDia("2026-10-13")).toEqual(["08:00", "10:00", "13:30", "15:30"]);
  });

  it("sábado só tem os da manhã", () => {
    expect(horariosDoDia("2026-10-17")).toEqual(["08:00", "10:00"]);
  });

  it("domingo não tem nenhum", () => {
    expect(horariosDoDia("2026-10-18")).toEqual([]);
  });
});

describe("ocupacoesDosAtendimentos", () => {
  it("pedido cancelado não ocupa o horário", () => {
    const pedidos = [
      { tecnicoId: "carlos", data: "2026-10-20", horario: "08:00" as const, status: "aguardando" as const },
      { tecnicoId: "marcos", data: "2026-10-20", horario: "13:30" as const, status: "cancelado" as const },
    ];
    expect(ocupacoesDosAtendimentos(pedidos)).toEqual([
      { tecnicoId: "carlos", data: "2026-10-20", horario: "08:00" },
    ]);
  });
});

describe("tecnicoEstaLivre", () => {
  it("compromisso fixo deixa o horário ocupado toda semana", () => {
    // o Carlos nunca está livre terça às 10:00 (13 e 20 são terças)
    expect(tecnicoEstaLivre("carlos", "2026-10-13", "10:00", [])).toBe(false);
    expect(tecnicoEstaLivre("carlos", "2026-10-20", "10:00", [])).toBe(false);
    expect(tecnicoEstaLivre("carlos", "2026-10-13", "08:00", [])).toBe(true);
  });

  it("pedido ocupa o horário só daquele atendente", () => {
    const ocupacoes: Ocupacao[] = [{ tecnicoId: "carlos", data: "2026-10-13", horario: "08:00" }];
    expect(tecnicoEstaLivre("carlos", "2026-10-13", "08:00", ocupacoes)).toBe(false);
    expect(tecnicoEstaLivre("marcos", "2026-10-13", "08:00", ocupacoes)).toBe(true);
    expect(tecnicoEstaLivre("carlos", "2026-10-14", "08:00", ocupacoes)).toBe(true);
  });
});

describe("primeiroTecnicoLivre", () => {
  it("pula quem está ocupado e devolve o próximo da lista", () => {
    // terça 10:00: o Carlos tem compromisso fixo, então vai o Marcos
    expect(primeiroTecnicoLivre("2026-10-13", "10:00", [])).toBe("marcos");
  });

  it("devolve null quando ninguém está livre", () => {
    const ocupacoes: Ocupacao[] = [
      { tecnicoId: "marcos", data: "2026-10-13", horario: "10:00" },
      { tecnicoId: "rafael", data: "2026-10-13", horario: "10:00" },
    ];
    expect(primeiroTecnicoLivre("2026-10-13", "10:00", ocupacoes)).toBeNull();
  });
});

describe("horarioEstaLivre", () => {
  const todosOcupados: Ocupacao[] = [
    { tecnicoId: "carlos", data: "2026-10-14", horario: "13:30" },
    { tecnicoId: "marcos", data: "2026-10-14", horario: "13:30" },
    { tecnicoId: "rafael", data: "2026-10-14", horario: "13:30" },
  ];

  it("com atendente escolhido, olha só a agenda dele", () => {
    expect(horarioEstaLivre("carlos", "2026-10-13", "10:00", [])).toBe(false);
    expect(horarioEstaLivre("marcos", "2026-10-13", "10:00", [])).toBe(true);
  });

  it("sem preferência, basta um atendente livre", () => {
    expect(horarioEstaLivre(SEM_PREFERENCIA, "2026-10-13", "10:00", [])).toBe(true);
    expect(horarioEstaLivre(SEM_PREFERENCIA, "2026-10-14", "13:30", todosOcupados)).toBe(false);
  });
});

describe("diaTemHorarioLivre", () => {
  it("o sábado do Marcos fica apagado, mas não o dos outros", () => {
    expect(diaTemHorarioLivre("marcos", "2026-10-17", [])).toBe(false);
    expect(diaTemHorarioLivre("carlos", "2026-10-17", [])).toBe(true);
    expect(diaTemHorarioLivre(SEM_PREFERENCIA, "2026-10-17", [])).toBe(true);
  });

  it("domingo nunca tem horário livre", () => {
    expect(diaTemHorarioLivre(SEM_PREFERENCIA, "2026-10-18", [])).toBe(false);
  });
});

describe("textos da agenda", () => {
  it("formatarAgendamento junta dia, horário e atendente", () => {
    expect(formatarAgendamento("2026-10-21", "13:30", "Carlos")).toBe("21/10/2026 às 13:30 com Carlos");
  });

  it("nomeDoTecnico acha o nome pelo id", () => {
    expect(nomeDoTecnico("rafael")).toBe("Rafael");
  });

  it("partesDoDia separa o dia da semana e o número, sem zero à esquerda", () => {
    expect(partesDoDia("2026-10-14")).toEqual({ semana: "Qua", dia: "14" });
    expect(partesDoDia("2026-11-02")).toEqual({ semana: "Seg", dia: "2" });
  });

  it("formatarDiaCurto é o dia da semana em minúsculas com dia/mês", () => {
    expect(formatarDiaCurto("2026-10-17")).toBe("sáb, 17/10");
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test --prefix frontend -- agenda datasAtendimento`
Expected: FAIL. O `agenda.test.ts` falha com `Failed to resolve import "./agenda"` (ou "Cannot find module"). O `datasAtendimento.test.ts` passa, porque o `paraDataIso` já foi exportado no Step 1.

- [ ] **Step 4: Implementar `agenda.ts`**

`frontend/src/crud/atendimentos/agenda.ts`:

```ts
import type { HorarioVisita, StatusAtendimento } from "../../tipos/atendimento";
import type { Ocupacao } from "../../tipos/tecnico";
import { INDISPONIBILIDADES_FIXAS, TECNICOS } from "../../dados/tecnicos";
import { formatarData, paraDataIso } from "./datasAtendimento";

/** Valor da escolha de atendente quando o cliente não liga pra quem vem. */
export const SEM_PREFERENCIA = "qualquer";

// blocos de 2h dentro do horário de funcionamento (o mesmo do rodapé)
const HORARIOS_SEMANA: HorarioVisita[] = ["08:00", "10:00", "13:30", "15:30"];
const HORARIOS_SABADO: HorarioVisita[] = ["08:00", "10:00"];

// abreviação de cada dia da semana; a posição é o número do Date.getDay() (0 = domingo)
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// dia da semana de uma data "aaaa-mm-dd" (0 = domingo), no fuso local
function diaDaSemana(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia).getDay();
}

/** Os próximos `quantidade` dias corridos a partir de amanhã, sem domingos, em "aaaa-mm-dd". */
export function diasDaAgenda(hoje: Date, quantidade = 14): string[] {
  const dias: string[] = [];
  for (let i = 1; i <= quantidade; i++) {
    // o Date ajusta sozinho a virada de mês e de ano (31/10 + 1 → 01/11)
    const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    if (dia.getDay() !== 0) dias.push(paraDataIso(dia));
  }
  return dias;
}

/** Horários de visita de um dia: 4 de segunda a sexta, 2 no sábado e nenhum no domingo. */
export function horariosDoDia(data: string): HorarioVisita[] {
  const diaSemana = diaDaSemana(data);
  if (diaSemana === 0) return [];
  return diaSemana === 6 ? HORARIOS_SABADO : HORARIOS_SEMANA;
}

/** Os horários que os pedidos ocupam; pedido cancelado libera o horário. */
export function ocupacoesDosAtendimentos(
  pedidos: (Ocupacao & { status: StatusAtendimento })[]
): Ocupacao[] {
  return pedidos
    .filter((pedido) => pedido.status !== "cancelado")
    .map(({ tecnicoId, data, horario }) => ({ tecnicoId, data, horario }));
}

/** Se o atendente pode ir naquele dia e horário: sem compromisso fixo e sem pedido ocupando. */
export function tecnicoEstaLivre(
  tecnicoId: string,
  data: string,
  horario: HorarioVisita,
  ocupacoes: Ocupacao[]
) {
  const diaSemana = diaDaSemana(data);
  const temCompromissoFixo = INDISPONIBILIDADES_FIXAS.some(
    (fixa) => fixa.tecnicoId === tecnicoId && fixa.diaSemana === diaSemana && fixa.horario === horario
  );
  if (temCompromissoFixo) return false;
  return !ocupacoes.some(
    (ocupacao) =>
      ocupacao.tecnicoId === tecnicoId && ocupacao.data === data && ocupacao.horario === horario
  );
}

/** O primeiro atendente livre (na ordem de TECNICOS) naquele dia e horário, ou null se nenhum está. */
export function primeiroTecnicoLivre(data: string, horario: HorarioVisita, ocupacoes: Ocupacao[]) {
  return TECNICOS.find((tecnico) => tecnicoEstaLivre(tecnico.id, data, horario, ocupacoes))?.id ?? null;
}

/** Se o horário serve pra escolha: o atendente escolhido está livre ou, sem preferência, algum está. */
export function horarioEstaLivre(
  escolha: string,
  data: string,
  horario: HorarioVisita,
  ocupacoes: Ocupacao[]
) {
  return escolha === SEM_PREFERENCIA
    ? primeiroTecnicoLivre(data, horario, ocupacoes) !== null
    : tecnicoEstaLivre(escolha, data, horario, ocupacoes);
}

/** Se o dia tem pelo menos um horário livre pra escolha (senão ele fica apagado na faixa de dias). */
export function diaTemHorarioLivre(escolha: string, data: string, ocupacoes: Ocupacao[]) {
  return horariosDoDia(data).some((horario) => horarioEstaLivre(escolha, data, horario, ocupacoes));
}

/** "21/10/2026 às 13:30 com Carlos" */
export function formatarAgendamento(data: string, horario: HorarioVisita, nomeTecnico: string) {
  return `${formatarData(data)} às ${horario} com ${nomeTecnico}`;
}

/** Nome do atendente pelo id; se não achar (ex.: dado antigo), mostra o próprio id. */
export function nomeDoTecnico(tecnicoId: string) {
  return TECNICOS.find((tecnico) => tecnico.id === tecnicoId)?.nome ?? tecnicoId;
}

/** Pedaços de um dia pra faixa de dias: "2026-10-14" → { semana: "Qua", dia: "14" }. */
export function partesDoDia(data: string) {
  const dia = Number(data.split("-")[2]);
  return { semana: DIAS_SEMANA[diaDaSemana(data)], dia: String(dia) };
}

/** "2026-10-17" → "sáb, 17/10" (título dos horários). */
export function formatarDiaCurto(data: string) {
  const [, mes, dia] = data.split("-");
  return `${DIAS_SEMANA[diaDaSemana(data)].toLowerCase()}, ${dia}/${mes}`;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test --prefix frontend -- agenda datasAtendimento`
Expected: PASS (agenda: 20 testes; datasAtendimento: 6)

Run: `npm test --prefix frontend`
Expected: PASS em todos os arquivos

Run: `npm run build --prefix frontend` e `npm run lint --prefix frontend`
Expected: build sem erro; lint só com o erro da linha de base

- [ ] **Step 6: Commit**

```bash
git add frontend/src/tipos/atendimento.ts frontend/src/tipos/tecnico.ts frontend/src/dados/tecnicos.ts frontend/src/crud/atendimentos/datasAtendimento.ts frontend/src/crud/atendimentos/datasAtendimento.test.ts frontend/src/crud/atendimentos/agenda.ts frontend/src/crud/atendimentos/agenda.test.ts
git commit -m "feat: regras da agenda dos atendentes (com Vitest)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Componentes de atendente e de dia/horário

**Files:**
- Modify: `frontend/src/componentes/ui/Icones/Icones.tsx` (ícone novo no fim)
- Create: `frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorAtendente/SeletorAtendente.tsx` + `.css`
- Create: `frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorDiaHorario/SeletorDiaHorario.tsx` + `.css`

**Interfaces:**
- Consumes: da Task 1, `SEM_PREFERENCIA`, `diaTemHorarioLivre`, `horarioEstaLivre`, `horariosDoDia`, `partesDoDia`, `formatarDiaCurto`, `Tecnico`, `Ocupacao` e `HorarioVisita`; `useBordasRolagem(ref)` de `frontend/src/hooks/useBordasRolagem.ts` (devolve `{ canScrollLeft, canScrollRight }`)
- Produces (usados pela página na Task 3):
  - `IconePessoas()`
  - `SeletorAtendente({ tecnicos: Tecnico[]; valor: string; onChange: (escolha: string) => void })`
  - `SeletorDiaHorario({ dias: string[]; escolha: string; ocupacoes: Ocupacao[]; data: string; horario: HorarioVisita | null; onChangeData: (data: string) => void; onChangeHorario: (horario: HorarioVisita) => void })`

Os componentes ainda não são usados por nenhuma página nesta task. A Task 3 é que liga eles no formulário.

- [ ] **Step 1: Ícone do "Sem preferência"**

No fim de `frontend/src/componentes/ui/Icones/Icones.tsx` (traço do Tabler Icons, licença MIT, como os outros):

```tsx
/** Duas pessoas: "Sem preferência" de atendente (quem estiver livre). */
export function IconePessoas() {
  return (
    <Icone>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
    </Icone>
  );
}
```

- [ ] **Step 2: `SeletorAtendente`**

`frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorAtendente/SeletorAtendente.tsx`:

```tsx
import type { Tecnico } from "../../../../../tipos/tecnico";
import { SEM_PREFERENCIA } from "../../../../../crud/atendimentos/agenda";
import { IconePessoas } from "../../../../../componentes/ui/Icones/Icones";
import "./SeletorAtendente.css";

interface SeletorAtendenteProps {
  tecnicos: Tecnico[];
  /** id do atendente escolhido, ou SEM_PREFERENCIA */
  valor: string;
  onChange: (escolha: string) => void;
}

/**
 * Primeira parte do bloco "Atendente e horário": o card "Sem preferência" e um
 * card por atendente. Por baixo são radios (escondidos só visualmente), como os
 * cards de tipo de serviço: dá pra escolher com Tab + setas.
 */
export function SeletorAtendente({ tecnicos, valor, onChange }: SeletorAtendenteProps) {
  // "Sem preferência" vem primeiro e mostra um ícone no lugar das iniciais
  const opcoes = [
    { id: SEM_PREFERENCIA, nome: "Sem preferência", detalhe: "quem estiver livre", iniciais: null },
    ...tecnicos.map((tecnico) => ({
      id: tecnico.id,
      nome: tecnico.nome,
      detalhe: tecnico.especialidade,
      iniciais: tecnico.nome.slice(0, 2).toUpperCase(),
    })),
  ];

  return (
    <div className="seletor-atendente">
      {opcoes.map((opcao) => {
        const ativo = valor === opcao.id;
        return (
          <label
            key={opcao.id}
            className={`seletor-atendente__card${ativo ? " seletor-atendente__card--ativo" : ""}`}
          >
            <input
              type="radio"
              name="atendente"
              value={opcao.id}
              checked={ativo}
              onChange={() => onChange(opcao.id)}
              className="seletor-atendente__radio"
            />
            <span className="seletor-atendente__avatar" aria-hidden="true">
              {opcao.iniciais ?? <IconePessoas />}
            </span>
            <span className="seletor-atendente__textos">
              <strong>{opcao.nome}</strong>
              <span>{opcao.detalhe}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default SeletorAtendente;
```

`frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorAtendente/SeletorAtendente.css`:

```css
/* quantos cards couberem: os 4 numa linha no computador, um embaixo do outro no celular */
.seletor-atendente {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}

.seletor-atendente__card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--color-white);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  color: var(--color-primary);
  cursor: pointer;
}

.seletor-atendente__card:hover {
  border-color: var(--color-accent);
}

/* selecionado: borda azul mais grossa (box-shadow, pra o card não mudar de tamanho) */
.seletor-atendente__card--ativo {
  border-color: var(--color-accent);
  box-shadow: inset 0 0 0 1px var(--color-accent);
  background-color: #e2effa;
}

/* foco do teclado no radio escondido aparece no card */
.seletor-atendente__card:has(.seletor-atendente__radio:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* o radio continua existindo (teclado e leitor de tela), só não aparece */
.seletor-atendente__radio {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
  pointer-events: none;
}

/* círculo com as iniciais (ou o ícone, no "Sem preferência") */
.seletor-atendente__avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-store-button);
  font-weight: 700;
  font-size: var(--font-size-small);
}

.seletor-atendente__textos {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.seletor-atendente__textos strong {
  font-size: var(--font-size-small);
}

.seletor-atendente__textos span {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
```

- [ ] **Step 3: `SeletorDiaHorario`**

`frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorDiaHorario/SeletorDiaHorario.tsx`:

```tsx
import { useRef } from "react";
import type { HorarioVisita } from "../../../../../tipos/atendimento";
import type { Ocupacao } from "../../../../../tipos/tecnico";
import {
  diaTemHorarioLivre,
  formatarDiaCurto,
  horarioEstaLivre,
  horariosDoDia,
  partesDoDia,
} from "../../../../../crud/atendimentos/agenda";
import { useBordasRolagem } from "../../../../../hooks/useBordasRolagem";
import "./SeletorDiaHorario.css";

interface SeletorDiaHorarioProps {
  /** dias que aparecem na faixa ("aaaa-mm-dd"), já sem domingo */
  dias: string[];
  /** id do atendente escolhido, ou SEM_PREFERENCIA */
  escolha: string;
  ocupacoes: Ocupacao[];
  /** dia escolhido; "" = nenhum */
  data: string;
  horario: HorarioVisita | null;
  onChangeData: (data: string) => void;
  onChangeHorario: (horario: HorarioVisita) => void;
}

/**
 * Segunda parte do bloco "Atendente e horário": uma faixa de dias que rola pro
 * lado e, depois de escolher o dia, os horários dele. Dia sem nenhum horário livre
 * fica apagado; horário ocupado fica riscado. Tudo depende do atendente escolhido
 * (ou de qualquer um, no "Sem preferência").
 */
export function SeletorDiaHorario({
  dias,
  escolha,
  ocupacoes,
  data,
  horario,
  onChangeData,
  onChangeHorario,
}: SeletorDiaHorarioProps) {
  const faixaRef = useRef<HTMLDivElement>(null);
  // esmaece as bordas da faixa quando tem dia escondido (o mesmo efeito do menu do cabeçalho no celular)
  const { canScrollLeft, canScrollRight } = useBordasRolagem(faixaRef);

  return (
    <div className="seletor-dia-horario">
      <p className="seletor-dia-horario__titulo" id="titulo-dias">
        Escolha o dia
      </p>
      <div
        ref={faixaRef}
        className={[
          "seletor-dia-horario__dias",
          canScrollLeft && "seletor-dia-horario__dias--esmaecer-esquerda",
          canScrollRight && "seletor-dia-horario__dias--esmaecer-direita",
        ]
          .filter(Boolean)
          .join(" ")}
        role="radiogroup"
        aria-labelledby="titulo-dias"
      >
        {dias.map((dia) => {
          const { semana, dia: numero } = partesDoDia(dia);
          const livre = diaTemHorarioLivre(escolha, dia, ocupacoes);
          const ativo = data === dia;
          return (
            <label
              key={dia}
              className={[
                "seletor-dia-horario__dia",
                ativo && "seletor-dia-horario__dia--ativo",
                !livre && "seletor-dia-horario__dia--lotado",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name="dia"
                value={dia}
                checked={ativo}
                disabled={!livre}
                onChange={() => onChangeData(dia)}
                className="seletor-dia-horario__radio"
                aria-label={livre ? formatarDiaCurto(dia) : `${formatarDiaCurto(dia)}, sem horário livre`}
              />
              <span>{semana}</span>
              <strong>{numero}</strong>
            </label>
          );
        })}
      </div>

      {data ? (
        <>
          <p className="seletor-dia-horario__titulo" id="titulo-horarios">
            Horários livres em {formatarDiaCurto(data)}
          </p>
          <div className="seletor-dia-horario__horarios" role="radiogroup" aria-labelledby="titulo-horarios">
            {horariosDoDia(data).map((opcao) => {
              const livre = horarioEstaLivre(escolha, data, opcao, ocupacoes);
              const ativo = horario === opcao;
              return (
                <label
                  key={opcao}
                  className={[
                    "seletor-dia-horario__horario",
                    ativo && "seletor-dia-horario__horario--ativo",
                    !livre && "seletor-dia-horario__horario--ocupado",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <input
                    type="radio"
                    name="horario"
                    value={opcao}
                    checked={ativo}
                    disabled={!livre}
                    onChange={() => onChangeHorario(opcao)}
                    className="seletor-dia-horario__radio"
                    aria-label={livre ? opcao : `${opcao}, ocupado`}
                  />
                  {opcao}
                </label>
              );
            })}
          </div>
        </>
      ) : (
        <p className="seletor-dia-horario__vazio">Escolha um dia pra ver os horários.</p>
      )}
    </div>
  );
}

export default SeletorDiaHorario;
```

`frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorDiaHorario/SeletorDiaHorario.css`:

```css
.seletor-dia-horario__titulo {
  margin: 1.25rem 0 0.6rem;
  font-weight: 600;
  font-size: var(--font-size-small);
  color: var(--color-primary);
}

/* faixa de dias: uma linha só, rolando pro lado; o padding deixa espaço pro contorno de foco */
.seletor-dia-horario__dias {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 4px;
}

/* esconde a barra de rolagem no Chrome/Safari (no Firefox é o scrollbar-width: none acima) */
.seletor-dia-horario__dias::-webkit-scrollbar {
  display: none;
}

/* fades controlados pelo useBordasRolagem: só aparecem quando tem dia escondido naquele lado */
.seletor-dia-horario__dias--esmaecer-direita {
  mask-image: linear-gradient(90deg, #000 85%, transparent);
}

.seletor-dia-horario__dias--esmaecer-esquerda {
  mask-image: linear-gradient(90deg, transparent, #000 15%);
}

.seletor-dia-horario__dias--esmaecer-esquerda.seletor-dia-horario__dias--esmaecer-direita {
  mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
}

.seletor-dia-horario__dia {
  position: relative;
  flex: 0 0 auto;
  width: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.5rem 0;
  background-color: var(--color-white);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.seletor-dia-horario__dia strong {
  font-size: 1.1rem;
}

.seletor-dia-horario__dia:hover {
  border-color: var(--color-accent);
}

.seletor-dia-horario__dia--ativo {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

/* dia sem nenhum horário livre: apagado e sem clique */
.seletor-dia-horario__dia--lotado {
  opacity: 0.35;
  cursor: not-allowed;
}

.seletor-dia-horario__dia--lotado:hover {
  border-color: var(--color-border-soft);
}

.seletor-dia-horario__horarios {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* cada horário é uma pílula, no mesmo estilo dos turnos de antes */
.seletor-dia-horario__horario {
  position: relative;
  border: 1px solid var(--color-primary);
  border-radius: 999px;
  padding: 0.6rem 1.3rem;
  background-color: var(--color-white);
  color: var(--color-primary);
  font-weight: 600;
  font-size: var(--font-size-small);
  cursor: pointer;
}

.seletor-dia-horario__horario--ativo {
  background-color: var(--color-primary);
  color: var(--color-white);
}

/* horário ocupado: riscado, apagado e sem clique */
.seletor-dia-horario__horario--ocupado {
  border-color: var(--color-border-soft);
  color: var(--color-text-muted);
  text-decoration: line-through;
  opacity: 0.6;
  cursor: not-allowed;
}

/* foco do teclado nos radios escondidos aparece no dia ou na pílula */
.seletor-dia-horario__dia:has(.seletor-dia-horario__radio:focus-visible),
.seletor-dia-horario__horario:has(.seletor-dia-horario__radio:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.seletor-dia-horario__radio {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
  pointer-events: none;
}

.seletor-dia-horario__vazio {
  margin-top: 1rem;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}
```

- [ ] **Step 4: Conferir tipos, lint e testes**

Run: `npm run build --prefix frontend`
Expected: sem erro

Run: `npm run lint --prefix frontend`
Expected: só o erro da linha de base (1 problem)

Run: `npm test --prefix frontend`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/componentes/ui/Icones/Icones.tsx frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorAtendente/ frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorDiaHorario/
git commit -m "feat: seletores de atendente e de dia/horário da agenda" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Trocar "data + turno" pela agenda no pedido e na tela

**Files:**
- Modify: `frontend/src/tipos/atendimento.ts`
- Modify: `frontend/src/crud/atendimentos/opcoesAtendimento.ts`
- Modify: `frontend/src/crud/atendimentos/datasAtendimento.ts` + `.test.ts`
- Modify: `frontend/src/crud/atendimentos/validarSolicitacao.ts` + `.test.ts`
- Modify: `frontend/src/crud/atendimentos/novoAtendimento.test.ts`
- Modify: `frontend/src/dados/atendimentos.ts`
- Modify: `frontend/src/contexto/useAtendimentos.ts`
- Modify: `frontend/src/contexto/ContextoAtendimentos.tsx`
- Modify: `frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx`
- Modify: `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx`
- Delete: `frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorQuando/` (`.tsx` e `.css`)
- Modify: `docs/superpowers/specs/2026-10-12-solicitar-atendimento-design.md`

**Interfaces:**
- Consumes: tudo da Task 1 e da Task 2
- Produces:
  - `Atendimento` com `tecnicoId: string`, `data: string` e `horario: HorarioVisita`. Saem `dataPreferida`, `periodo` e o tipo `PeriodoAtendimento`.
  - `RascunhoSolicitacao` com `tecnico: string`, `data: string` e `horario: HorarioVisita | null`.
  - `ErrosSolicitacao` com as chaves `data` e `horario`.
  - `validarSolicitacao(rascunho, hoje: Date, ocupacoes: Ocupacao[])`
  - `ValorContextoAtendimentos` ganha `ocupacoes: Ocupacao[]`.

Esta task é uma troca só: tipos, validação, provedor, aba e página mudam juntos, senão o TypeScript não compila no meio do caminho.

- [ ] **Step 1: Atualizar os testes (falhando)**

Em `frontend/src/crud/atendimentos/validarSolicitacao.test.ts`:

1. Troque o import de tipos e acrescente os da agenda:
   ```ts
   import type { RascunhoSolicitacao } from "./validarSolicitacao";
   import type { Ocupacao } from "../../tipos/tecnico";
   import { SEM_PREFERENCIA } from "./agenda";
   ```
2. Troque o comentário e a constante `HOJE` por:
   ```ts
   // 12/10/2026, uma segunda-feira (no Date o mês começa em 0)
   const HOJE = new Date(2026, 9, 12);
   ```
3. Na função `rascunho`, troque as linhas `dataPreferida: "2026-10-20",` e `periodo: "manha",` por:
   ```ts
       tecnico: SEM_PREFERENCIA,
       data: "2026-10-20",
       horario: "13:30",
   ```
4. Em **todas** as chamadas `validarSolicitacao(…, HOJE)` do `describe("validarSolicitacao")`, acrescente o terceiro argumento `[]`, ficando `validarSolicitacao(…, HOJE, [])`.
5. Apague os três testes antigos: "exige a data", "só aceita data a partir de amanhã" e "exige o período". No lugar deles, ponha:
   ```ts
   it("exige o dia", () => {
     expect(validarSolicitacao(rascunho({ data: "" }), HOJE, []).data).toBe("Escolha o dia.");
   });

   it("só aceita um dia da faixa (amanhã em diante, sem domingo, até 14 dias)", () => {
     const erro = "Escolha um dia da lista.";
     expect(validarSolicitacao(rascunho({ data: "2026-10-12" }), HOJE, []).data).toBe(erro); // hoje
     expect(validarSolicitacao(rascunho({ data: "2026-10-18" }), HOJE, []).data).toBe(erro); // domingo
     expect(validarSolicitacao(rascunho({ data: "2026-10-27" }), HOJE, []).data).toBe(erro); // depois de 14 dias
     expect(validarSolicitacao(rascunho({ data: "2026-10-13" }), HOJE, []).data).toBeUndefined();
   });

   it("exige o horário", () => {
     expect(validarSolicitacao(rascunho({ horario: null }), HOJE, []).horario).toBe("Escolha um horário.");
   });

   it("horário que o atendente escolhido não tem livre é recusado", () => {
     const erro = "Esse horário acabou de ser ocupado. Escolha outro.";
     // o Carlos tem compromisso fixo toda terça às 10:00 (20/10 é terça)
     expect(
       validarSolicitacao(rascunho({ tecnico: "carlos", horario: "10:00" }), HOJE, []).horario
     ).toBe(erro);
     // o Rafael já tem um pedido nesse horário
     const ocupacoes: Ocupacao[] = [{ tecnicoId: "rafael", data: "2026-10-20", horario: "13:30" }];
     expect(validarSolicitacao(rascunho({ tecnico: "rafael" }), HOJE, ocupacoes).horario).toBe(erro);
   });

   it("sem preferência só recusa quando todos os atendentes estão ocupados", () => {
     const doisOcupados: Ocupacao[] = [
       { tecnicoId: "carlos", data: "2026-10-20", horario: "13:30" },
       { tecnicoId: "marcos", data: "2026-10-20", horario: "13:30" },
     ];
     expect(validarSolicitacao(rascunho(), HOJE, doisOcupados).horario).toBeUndefined();
     const todosOcupados: Ocupacao[] = [
       ...doisOcupados,
       { tecnicoId: "rafael", data: "2026-10-20", horario: "13:30" },
     ];
     expect(validarSolicitacao(rascunho(), HOJE, todosOcupados).horario).toBe(
       "Esse horário acabou de ser ocupado. Escolha outro."
     );
   });
   ```

Em `frontend/src/crud/atendimentos/novoAtendimento.test.ts`, no `DADOS`, troque `dataPreferida: "2026-10-20",` e `periodo: "tarde",` por:

```ts
  tecnicoId: "rafael",
  data: "2026-10-20",
  horario: "13:30",
```

Em `frontend/src/crud/atendimentos/datasAtendimento.test.ts`:
- troque o import por `import { formatarData, paraDataIso } from "./datasAtendimento";`;
- apague os blocos `describe("dataMinima", …)` e `describe("formatarPreferencia", …)` inteiros. O caso "tarde da noite" agora é testado pelo `paraDataIso` e pelo `diasDaAgenda`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test --prefix frontend -- validarSolicitacao novoAtendimento`
Expected: FAIL nos testes novos de dia e horário do `validarSolicitacao`, porque ele ainda olha `dataPreferida`/`periodo`. O Vitest não checa tipos, então os casos falham pelos valores. O `novoAtendimento` já passa, porque só espalha os dados que recebe.

- [ ] **Step 3: Tipos, opções e datas**

`frontend/src/tipos/atendimento.ts`:
- apague o tipo `PeriodoAtendimento` e o comentário dele (`/** Turno preferido pra visita. */`);
- na `interface Atendimento`, troque as linhas
  ```ts
    /** "aaaa-mm-dd", o mesmo formato do <input type="date"> */
    dataPreferida: string;
    periodo: PeriodoAtendimento;
  ```
  por
  ```ts
    /** id do atendente (dados/tecnicos.ts); o "Sem preferência" já vira um atendente de verdade no envio */
    tecnicoId: string;
    /** dia da visita, "aaaa-mm-dd" */
    data: string;
    /** início do bloco de 2h da visita */
    horario: HorarioVisita;
  ```

`frontend/src/crud/atendimentos/opcoesAtendimento.ts`:
- o import passa a ser `import type { StatusAtendimento, TipoServico } from "../../tipos/atendimento";`;
- apague `PERIODO_LABELS` e `PERIODOS`.

`frontend/src/crud/atendimentos/datasAtendimento.ts`:
- apague o import de `PeriodoAtendimento` e o de `PERIODO_LABELS`;
- apague as funções `dataMinima` e `formatarPreferencia`, com os comentários delas. Ficam `paraDataIso` e `formatarData`.

- [ ] **Step 4: Validação**

Em `frontend/src/crud/atendimentos/validarSolicitacao.ts`:

1. Troque os imports do topo por:
   ```ts
   import type { ContatoAtendimento, HorarioVisita, TipoServico } from "../../tipos/atendimento";
   import type { Ocupacao } from "../../tipos/tecnico";
   import { validarContato } from "./contatoAtendimento";
   import type { ErrosContato } from "./contatoAtendimento";
   import { diasDaAgenda, horarioEstaLivre } from "./agenda";
   ```
2. Troque a `interface RascunhoSolicitacao` (com o comentário) por:
   ```ts
   /**
    * O formulário enquanto a pessoa preenche: o tipo e o horário começam sem
    * escolha (null), o dia começa vazio ("") e o atendente começa em "Sem preferência".
    */
   export interface RascunhoSolicitacao {
     tipo: TipoServico | null;
     descricao: string;
     /** id do atendente, ou SEM_PREFERENCIA */
     tecnico: string;
     /** "aaaa-mm-dd"; "" = ainda não escolheu */
     data: string;
     horario: HorarioVisita | null;
     contato: ContatoAtendimento;
   }
   ```
3. No `ErrosSolicitacao`, troque `"tipo" | "descricao" | "dataPreferida" | "periodo"` por `"tipo" | "descricao" | "data" | "horario"`.
4. Troque o comentário e a assinatura da função por:
   ```ts
   /**
    * Confere o rascunho e devolve os erros por campo. Objeto vazio = pode enviar.
    * `hoje` vem de fora pra os testes não dependerem do relógio; `ocupacoes` são os
    * horários já tomados na agenda dos atendentes.
    */
   export function validarSolicitacao(
     rascunho: RascunhoSolicitacao,
     hoje: Date,
     ocupacoes: Ocupacao[]
   ): ErrosSolicitacao {
   ```
5. Troque os blocos da data e do período (do `if (!rascunho.dataPreferida)` até `if (!rascunho.periodo) …`) por:
   ```ts
     if (!rascunho.data) {
       erros.data = "Escolha o dia.";
     } else if (!diasDaAgenda(hoje).includes(rascunho.data)) {
       erros.data = "Escolha um dia da lista.";
     }

     if (!rascunho.horario) {
       erros.horario = "Escolha um horário.";
     } else if (
       rascunho.data &&
       !horarioEstaLivre(rascunho.tecnico, rascunho.data, rascunho.horario, ocupacoes)
     ) {
       // outro pedido pode ter pego o horário enquanto a pessoa preenchia o resto
       erros.horario = "Esse horário acabou de ser ocupado. Escolha outro.";
     }
   ```

- [ ] **Step 5: Exemplos e provedor**

Em `frontend/src/dados/atendimentos.ts`:
- no `AT-2026-0002`, troque `dataPreferida: "2026-10-16",` e `periodo: "manha",` por
  ```ts
      tecnicoId: "carlos",
      data: "2026-10-16",
      horario: "08:00",
  ```
- no `AT-2026-0001`, troque `dataPreferida: "2026-09-15",` e `periodo: "tarde",` por
  ```ts
      tecnicoId: "marcos",
      data: "2026-09-15",
      horario: "13:30",
  ```

Em `frontend/src/contexto/useAtendimentos.ts`:
- acrescente `import type { Ocupacao } from "../tipos/tecnico";`;
- na `interface ValorContextoAtendimentos`, depois de `atendimentos`, acrescente:
  ```ts
    /** horários ocupados na agenda dos atendentes, juntando os pedidos de todas as contas */
    ocupacoes: Ocupacao[];
  ```

Substitua o conteúdo de `frontend/src/contexto/ContextoAtendimentos.tsx` por:

```tsx
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ATENDIMENTOS_EXEMPLO } from "../dados/atendimentos";
import { novoAtendimento } from "../crud/atendimentos/novoAtendimento";
import { ocupacoesDosAtendimentos } from "../crud/atendimentos/agenda";
import { ContextoAtendimentos } from "./useAtendimentos";
import { useAutenticacao } from "./useAutenticacao";
import type { ValorContextoAtendimentos } from "./useAtendimentos";
import type { Atendimento, DadosSolicitacao } from "../tipos/atendimento";

/**
 * Guarda os atendimentos que o cliente pediu e disponibiliza pro formulário
 * (/solicitar-atendimento) e pra aba "Atendimentos" do /perfil. Precisa envolver
 * o app — ver App.tsx.
 *
 * Cada conta vê os próprios pedidos (pelo id do usuário logado) e os exemplos.
 * A agenda dos atendentes é uma só, então os horários ocupados juntam os pedidos
 * de todas as contas. Tudo vive só na memória: recarregar a página volta aos exemplos.
 * TODO: trocar pelas rotas de appointments quando o backend tiver (ele devolve só
 * os atendimentos do próprio usuário e confere os conflitos de horário).
 */
export function ProvedorAtendimentos({ children }: { children: ReactNode }) {
  // pedidos novos de cada conta, pelo id do usuário logado (os exemplos ficam de fora)
  const [novosPorUsuario, setNovosPorUsuario] = useState<Record<string, Atendimento[]>>({});
  const { usuario } = useAutenticacao();
  const idUsuario = usuario?.id ?? null;

  // a lista da conta: os pedidos dela (mais novo primeiro) e depois os exemplos
  const atendimentos = useMemo(
    () => [...((idUsuario ? novosPorUsuario[idUsuario] : undefined) ?? []), ...ATENDIMENTOS_EXEMPLO],
    [idUsuario, novosPorUsuario]
  );

  // um horário pedido por qualquer conta fica ocupado pra todas
  const ocupacoes = useMemo(
    () => ocupacoesDosAtendimentos([...Object.values(novosPorUsuario).flat(), ...ATENDIMENTOS_EXEMPLO]),
    [novosPorUsuario]
  );

  const solicitarAtendimento = useCallback(
    (dados: DadosSolicitacao) => {
      // sem ninguém logado não há de quem guardar (a rota do formulário já exige login)
      if (!idUsuario) return;
      // a data do envio é pega aqui fora: a função do setState deve ser pura (o StrictMode chama ela 2 vezes)
      const agora = new Date();
      setNovosPorUsuario((atual) => {
        const proprios = atual[idUsuario] ?? [];
        // a numeração conta os exemplos também, que são os primeiros da lista
        const novo = novoAtendimento(dados, proprios.length + ATENDIMENTOS_EXEMPLO.length, agora);
        return { ...atual, [idUsuario]: [novo, ...proprios] };
      });
    },
    [idUsuario]
  );

  // useMemo: só cria um objeto novo quando algo muda, pra não re-renderizar à toa quem usa o contexto
  const valor = useMemo<ValorContextoAtendimentos>(
    () => ({ atendimentos, ocupacoes, solicitarAtendimento }),
    [atendimentos, ocupacoes, solicitarAtendimento]
  );

  return <ContextoAtendimentos.Provider value={valor}>{children}</ContextoAtendimentos.Provider>;
}

export default ProvedorAtendimentos;
```

- [ ] **Step 6: Aba Atendimentos**

Em `frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx`:
- troque `import { formatarPreferencia } from "../../../../../crud/atendimentos/datasAtendimento";` por
  ```tsx
  import { formatarData } from "../../../../../crud/atendimentos/datasAtendimento";
  import { nomeDoTecnico } from "../../../../../crud/atendimentos/agenda";
  ```
- troque o `<span>` com "Preferência: …" por
  ```tsx
                    <span>
                      Visita: {formatarData(atendimento.data)} às {atendimento.horario} ·{" "}
                      {nomeDoTecnico(atendimento.tecnicoId)}
                    </span>
  ```

- [ ] **Step 7: Página do formulário**

Em `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx`:

1. Imports:
   - apague `import { dataMinima } from "../../../crud/atendimentos/datasAtendimento";` e `import { SeletorQuando } from "./componentes/SeletorQuando/SeletorQuando";`;
   - troque `import type { ContatoAtendimento } from "../../../tipos/atendimento";` por `import type { ContatoAtendimento, HorarioVisita } from "../../../tipos/atendimento";`;
   - depois do import do `validarSolicitacao`, acrescente:
     ```tsx
     import {
       SEM_PREFERENCIA,
       diaTemHorarioLivre,
       diasDaAgenda,
       formatarAgendamento,
       horarioEstaLivre,
       nomeDoTecnico,
       primeiroTecnicoLivre,
     } from "../../../crud/atendimentos/agenda";
     import { TECNICOS } from "../../../dados/tecnicos";
     ```
   - depois do import do `SeletorTipoServico`, acrescente:
     ```tsx
     import { SeletorAtendente } from "./componentes/SeletorAtendente/SeletorAtendente";
     import { SeletorDiaHorario } from "./componentes/SeletorDiaHorario/SeletorDiaHorario";
     ```
2. Troque a constante `RASCUNHO_INICIAL` por:
   ```tsx
   const RASCUNHO_INICIAL: CamposRascunho = {
     tipo: null,
     descricao: "",
     tecnico: SEM_PREFERENCIA,
     data: "",
     horario: null,
   };
   ```
3. Apague a constante `MENSAGEM_ENVIADO` e o comentário acima dela. O aviso agora é montado no envio, com o dia, o horário e o atendente.
4. No comentário do componente, troque "Cinco blocos — tipo, descrição, fotos, quando e contato —" por "Cinco blocos — tipo, descrição, fotos, atendente e horário, e contato —".
5. Troque `const { solicitarAtendimento } = useAtendimentos();` por `const { solicitarAtendimento, ocupacoes } = useAtendimentos();`.
6. Troque a linha do `minimo` (e o comentário acima) por:
   ```tsx
     // dias da faixa (amanhã em diante, sem domingo); o inicializador roda uma vez só (o render não pode chamar new Date())
     const [dias] = useState(() => diasDaAgenda(new Date()));
   ```
7. Logo depois da função `atualizarCampo`, acrescente:
   ```tsx
     // trocar de atendente pode deixar o dia ou o horário escolhidos sem vaga: aí eles são limpos
     function escolherTecnico(escolha: string) {
       setRascunho((atual) => {
         const diaContinua = atual.data !== "" && diaTemHorarioLivre(escolha, atual.data, ocupacoes);
         const horarioContinua =
           diaContinua &&
           atual.horario !== null &&
           horarioEstaLivre(escolha, atual.data, atual.horario, ocupacoes);
         return {
           ...atual,
           tecnico: escolha,
           data: diaContinua ? atual.data : "",
           horario: horarioContinua ? atual.horario : null,
         };
       });
     }

     // outro dia, outros horários: o horário escolhido antes é limpo
     function escolherDia(data: string) {
       setRascunho((atual) => ({ ...atual, data, horario: null }));
       limparErro("data");
     }
   ```
8. No `enviar`:
   - troque `const encontrados = validarSolicitacao(completo, new Date());` por `const encontrados = validarSolicitacao(completo, new Date(), ocupacoes);`;
   - troque tudo do `const { tipo, periodo } = completo;` até o `navigate(...)` (inclusive) por:
     ```tsx
         const { tipo, horario } = completo;
         // a validação já garante os dois; o if é só pro TypeScript saber que não são null
         if (!tipo || !horario) return;
         // "Sem preferência" vira o primeiro atendente livre naquele dia e horário
         const tecnicoId =
           completo.tecnico === SEM_PREFERENCIA
             ? primeiroTecnicoLivre(completo.data, horario, ocupacoes)
             : completo.tecnico;
         // a validação também já garantiu que tem alguém livre
         if (!tecnicoId) return;

         enviadoRef.current = true;
         solicitarAtendimento({
           tipo,
           descricao: completo.descricao.trim(),
           fotos: fotos.map((foto) => foto.url),
           tecnicoId,
           data: completo.data,
           horario,
           contato,
         });
         const agendamento = formatarAgendamento(completo.data, horario, nomeDoTecnico(tecnicoId));
         const mensagem = `Pedido enviado! Horário reservado pra ${agendamento}. A Bruxel confirma a visita com você.`;
         // o /perfil abre na mesma rolagem desta página (lá embaixo); volta pro topo pra o aviso aparecer
         window.scrollTo(0, 0);
         // replace: o botão Voltar do navegador não retorna pro formulário que já foi enviado
         navigate("/perfil", { replace: true, state: { aba: "atendimentos", mensagem } });
     ```
9. Troque o `<fieldset>` inteiro do "Quando você prefere?" por:
   ```tsx
               <fieldset className="pagina-atendimento__bloco">
                 <legend className="pagina-atendimento__titulo-bloco">Atendente e horário</legend>
                 <SeletorAtendente tecnicos={TECNICOS} valor={rascunho.tecnico} onChange={escolherTecnico} />
                 <SeletorDiaHorario
                   dias={dias}
                   escolha={rascunho.tecnico}
                   ocupacoes={ocupacoes}
                   data={rascunho.data}
                   horario={rascunho.horario}
                   onChangeData={escolherDia}
                   onChangeHorario={(horario: HorarioVisita) => atualizarCampo("horario", horario)}
                 />
                 <p className="pagina-atendimento__dica">
                   O horário fica reservado e a Bruxel confirma a visita com você.
                 </p>
                 {erros.data && (
                   <p className="pagina-atendimento__erro" role="alert">
                     {erros.data}
                   </p>
                 )}
                 {erros.horario && (
                   <p className="pagina-atendimento__erro" role="alert">
                     {erros.horario}
                   </p>
                 )}
               </fieldset>
   ```

Apague o componente antigo:

```bash
git rm -r frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorQuando
```

- [ ] **Step 8: Spec antigo aponta pro novo**

Em `docs/superpowers/specs/2026-10-12-solicitar-atendimento-design.md`:
- logo depois da linha `- **Branch:** …` do cabeçalho, acrescente:
  ```markdown
  - **Atualização 13/10/2026:** o bloco de data e período virou a escolha de atendente, dia e horário — ver [2026-10-13-agenda-atendente-design.md](2026-10-13-agenda-atendente-design.md). As partes deste spec sobre `dataPreferida`, `periodo`, `dataMinima`, `formatarPreferencia` e `SeletorQuando` ficaram pra trás.
  ```
- logo abaixo do título `## Futuro`, acrescente a linha:
  ```markdown
  **Feito em 13/10/2026** (sem backend ainda) — ver [2026-10-13-agenda-atendente-design.md](2026-10-13-agenda-atendente-design.md).
  ```

- [ ] **Step 9: Rodar tudo**

Run: `npm test --prefix frontend`
Expected: PASS em todos os arquivos (validarSolicitacao com os casos novos; agenda; novoAtendimento; datasAtendimento sem os casos removidos)

Run: `npm run build --prefix frontend`
Expected: sem erro. Se o `tsc` acusar algum uso esquecido de `dataPreferida`, `periodo`, `PeriodoAtendimento`, `dataMinima`, `formatarPreferencia` ou `SeletorQuando`, troque pelo equivalente desta task.

Run: `npm run lint --prefix frontend`
Expected: só o erro da linha de base

Run: `grep -rn "dataPreferida\|periodo\|PeriodoAtendimento\|PERIODO\|dataMinima\|formatarPreferencia\|SeletorQuando" frontend/src`
Expected: nenhuma linha

- [ ] **Step 10: Commit**

```bash
git add -A frontend/src docs/superpowers/specs/2026-10-12-solicitar-atendimento-design.md
git commit -m "feat: pedido de atendimento com atendente, dia e horário da agenda" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Verificação no navegador (controller, depois da Task 3)

Use o backend na porta 3000, o frontend na 5173 e a conta de cliente de teste.

1. Em `/solicitar-atendimento`, o bloco 4 se chama "Atendente e horário", com "Sem preferência" marcado e 3 cards de atendente.
2. Na faixa só aparecem dias de amanhã em diante, sem domingo. Ela rola pro lado, com as bordas esmaecidas.
3. Com o Marcos marcado, os sábados aparecem apagados e sem clique.
4. Escolhendo o Carlos e uma terça, o horário 10:00 aparece riscado.
5. Escolha "Sem preferência", uma terça e 10:00. Depois troque pro Carlos: o horário é limpo. Escolha um sábado e depois o Marcos: o dia é limpo.
6. Enviar vazio mostra "Escolha o dia." e "Escolha um horário.".
7. Um envio válido abre o `/perfil` no topo, com o aviso "Pedido enviado! Horário reservado pra … com …" e o card "Visita: … às … · …".
8. Ao abrir o formulário de novo, o horário que acabou de ser pedido aparece ocupado pro mesmo atendente.
9. Em 375px não há rolagem horizontal da página: os cards de atendente ficam em 1 coluna e a faixa de dias rola.
10. O console fica sem erros de código (o 403 do perfil do cliente é esperado).
