# Gestão de atendimentos e OS no painel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O admin vê todos os pedidos de atendimento em `/admin/atendimentos`, decide cada um (confirmar, recusar ou cancelar com mensagem pro cliente) e acompanha o serviço pela OS em `/admin/atendimentos/:id` (observações, produtos do estoque, mão de obra, total, concluído e pago).

**Architecture:** Regras puras novas em `frontend/src/crud/atendimentos/` (andamento, valor da OS, filtros, WhatsApp), com Vitest. O `ProvedorAtendimentos` passa a guardar uma lista só (com os exemplos) e ganha `todosAtendimentos` e `atualizarAtendimento`. Duas páginas novas no painel no molde da gestão de usuários; o cliente passa a ver a mensagem da recusa e o total no Minha conta. Tudo em memória; o backend não é tocado.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Vite 8, Vitest 5, CSS BEM em pt-BR.

**Spec:** `docs/superpowers/specs/2026-10-13-gestao-atendimentos-design.md`

## Global Constraints

- **Não mexer em nada de `backend/`.** O que o backend precisa está no "Recado pro backend" do spec.
- Branch `feat/gestao-atendimentos`. Nunca commit na `eduardo`, nunca push, nunca `--amend`.
- Todo commit termina com a linha em branco + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Textos de tela e comentários em pt-BR com acentos corretos, iguais aos deste plano.
- React Hooks lint v7: nada de `setState` no corpo de `useEffect`; nada de ler/escrever ref durante o render; `new Date()`/`Date.now()` só em handler ou inicializador do `useState`.
- Arquivo de componente (`.tsx`) exporta só componentes (Fast Refresh); funções e constantes compartilhadas ficam em `.ts`.
- Vitest só pra funções puras (sem teste de componente).
- Comandos: `npm test --prefix frontend`, `npm run build --prefix frontend`, `npm run lint --prefix frontend`. Linha de base do lint: **1 erro** em `src/contexto/ContextoCarrinho.tsx` 107:17 (`react-refresh/only-export-components`); qualquer erro a mais é problema.
- CSS: classes BEM em pt-BR; cores pelos tokens de `src/estilos/tokens.css` ou pelos hex já usados no projeto e repetidos neste plano.

## Review Focus

1. **Mensagem curta ou só com espaços na recusa/cancelamento** — deve dar o erro "Escreva a mensagem pro cliente (pelo menos 10 caracteres)." e não mudar nada. Teste na Task 2 (`validarMensagemCliente` e `recusar` lançando erro).
2. **Mesmo produto adicionado duas vezes passando do estoque** (2 + 3 com estoque 4) — deve dar "Só tem 4 em estoque." Teste na Task 3 (`validarQuantidade` com `jaNaOs`).
3. **Mão de obra digitada como "1.500,00", "-10", "abc" ou vazia** — os três primeiros dão "Informe um valor em reais, ex.: 150,00."; vazio vale como "sem mão de obra". Testes na Task 3.
4. **Mexer na OS depois de paga** — `atualizarOs` recusa (lança) e a tela mostra só leitura. Teste na Task 2.
5. **Pedido recusado continuar ocupando a agenda** — recusado e cancelado liberam o horário. Teste na Task 1 (`ocupacoesDosAtendimentos`).

---

## Mapa de arquivos

| Arquivo | Task | Responsabilidade |
|---|---|---|
| `frontend/src/tipos/atendimento.ts` | 1 | status `recusado`, `ProdutoUsado`, campos da gestão |
| `frontend/src/crud/atendimentos/atendimentoDeTeste.ts` | 1 | fixture dos testes |
| `frontend/src/crud/atendimentos/novoAtendimento.ts` (+test) | 1 | pedido nasce com a OS vazia |
| `frontend/src/crud/atendimentos/opcoesAtendimento.ts` | 1 | rótulo "Recusado" |
| `frontend/src/crud/atendimentos/agenda.ts` (+test) | 1 | recusado não ocupa |
| `frontend/src/dados/atendimentos.ts` | 1 | exemplos com os campos novos |
| `frontend/src/crud/atendimentos/andamento.ts` (+test) | 2 | ações e transições de status, edição da OS |
| `frontend/src/crud/atendimentos/valorOs.ts` (+test) | 3 | totais, estoque, mão de obra, reais |
| `frontend/src/crud/atendimentos/whatsapp.ts` (+test) | 3 | link e textos do WhatsApp |
| `frontend/src/crud/atendimentos/datasAtendimento.ts` (+test) | 3 | `formatarDataHora` |
| `frontend/src/dados/produtos.ts` | 3 | estoque de exemplo |
| `frontend/src/crud/atendimentos/filtrarAtendimentos.ts` (+test) | 4 | chips, filtros, contagens |
| `frontend/src/contexto/ContextoAtendimentos.tsx`, `useAtendimentos.ts` | 5 | lista única, `todosAtendimentos`, `atualizarAtendimento` |
| `frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/*` | 5 | mensagem e total pro cliente |
| `frontend/src/paginas/admin/atendimentos/*` | 6 | lista + selos |
| `frontend/src/paginas/admin/inicio/inicio.tsx`, `frontend/src/App.tsx` | 6, 7 | card do painel e rotas |
| `frontend/src/paginas/admin/atendimento/*` | 7, 8 | página da OS, cartão, galeria, modal, produtos |

---

### Task 1: Dados da gestão no tipo do atendimento

**Files:**
- Modify: `frontend/src/tipos/atendimento.ts`
- Create: `frontend/src/crud/atendimentos/atendimentoDeTeste.ts`
- Modify: `frontend/src/crud/atendimentos/novoAtendimento.ts`, `novoAtendimento.test.ts`
- Modify: `frontend/src/crud/atendimentos/opcoesAtendimento.ts`
- Modify: `frontend/src/crud/atendimentos/agenda.ts`, `agenda.test.ts`
- Modify: `frontend/src/dados/atendimentos.ts`

**Interfaces:**
- Produces: `StatusAtendimento` com `"recusado"`; `interface ProdutoUsado { produtoId: string; nome: string; precoUnitario: number; quantidade: number }`; `Atendimento` com `mensagemCliente: string | null`, `observacoesTecnico: string`, `produtosUsados: ProdutoUsado[]`, `valorMaoDeObra: number | null`, `pagoEm: string | null`; `DadosSolicitacao` sem esses campos; `atendimentoDeTeste(campos?: Partial<Atendimento>): Atendimento`; `STATUS_LABELS.recusado = "Recusado"`.

- [ ] **Step 1: Escrever os testes que falham**

Em `novoAtendimento.test.ts`, troque o segundo teste por:

```ts
  it("começa aguardando confirmação, com a data do envio, os dados do formulário e a OS vazia", () => {
    expect(novoAtendimento(DADOS, 2, AGORA)).toEqual({
      ...DADOS,
      id: "AT-2026-0003",
      status: "aguardando",
      criadoEm: AGORA.toISOString(),
      mensagemCliente: null,
      observacoesTecnico: "",
      produtosUsados: [],
      valorMaoDeObra: null,
      pagoEm: null,
    });
  });
```

Em `agenda.test.ts`, dentro do `describe("ocupacoesDosAtendimentos")`, acrescente:

```ts
  it("pedido recusado também libera o horário", () => {
    const pedidos = [
      { tecnicoId: "rafael", data: "2026-10-21", horario: "13:30" as const, status: "recusado" as const },
      { tecnicoId: "rafael", data: "2026-10-21", horario: "15:30" as const, status: "agendado" as const },
    ];
    expect(ocupacoesDosAtendimentos(pedidos)).toEqual([
      { tecnicoId: "rafael", data: "2026-10-21", horario: "15:30" },
    ]);
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test --prefix frontend -- novoAtendimento agenda`
Expected: FAIL — o `toEqual` do novoAtendimento não tem os campos novos, e o teste da agenda falha de tipo/valor (`"recusado"` ainda ocupa).

- [ ] **Step 3: Tipos (`frontend/src/tipos/atendimento.ts`)**

Troque a linha do `StatusAtendimento` por:

```ts
/** Situação do atendimento; também vira o sufixo da classe CSS da etiqueta de status. */
export type StatusAtendimento =
  | "aguardando"
  | "agendado"
  | "em-andamento"
  | "concluido"
  | "cancelado"
  | "recusado";
```

Logo antes de `export interface Atendimento`, acrescente:

```ts
/** Produto da loja usado no serviço; nome e preço ficam guardados como eram na hora. */
export interface ProdutoUsado {
  produtoId: string;
  nome: string;
  /** preço da loja na hora em que foi lançado na OS, em reais */
  precoUnitario: number;
  quantidade: number;
}
```

Dentro de `Atendimento`, depois de `criadoEm: string;`, acrescente:

```ts
  /** texto que o cliente vê quando o pedido é recusado ou cancelado; null = sem mensagem */
  mensagemCliente: string | null;
  /** o que o técnico anotou na OS (diagnóstico, peças, reparos) */
  observacoesTecnico: string;
  produtosUsados: ProdutoUsado[];
  /** valor do serviço em reais, sem os produtos; null = ainda não informado */
  valorMaoDeObra: number | null;
  /** data e hora do pagamento, em ISO; null = a pagar */
  pagoEm: string | null;
```

Troque o `DadosSolicitacao` por:

```ts
/** Campos que só a gestão (painel) preenche; o pedido nasce com eles vazios. */
type CamposDaGestao = "mensagemCliente" | "observacoesTecnico" | "produtosUsados" | "valorMaoDeObra" | "pagoEm";

/** O que o formulário envia; id, status, criadoEm e os campos da gestão quem define é o contexto. */
export type DadosSolicitacao = Omit<Atendimento, "id" | "status" | "criadoEm" | CamposDaGestao>;
```

- [ ] **Step 4: `novoAtendimento.ts`**

Troque o `return` por:

```ts
  return {
    ...dados,
    id: `AT-${agora.getFullYear()}-${sequencia}`,
    status: "aguardando",
    criadoEm: agora.toISOString(),
    // a OS começa vazia: quem preenche é o painel, depois que o atendimento começa
    mensagemCliente: null,
    observacoesTecnico: "",
    produtosUsados: [],
    valorMaoDeObra: null,
    pagoEm: null,
  };
```

- [ ] **Step 5: `opcoesAtendimento.ts` e `agenda.ts`**

Em `opcoesAtendimento.ts`, troque o comentário e o objeto do `STATUS_LABELS` por:

```ts
// texto da etiqueta de cada status (aba "Atendimentos" do /perfil e painel admin)
export const STATUS_LABELS: Record<StatusAtendimento, string> = {
  aguardando: "Aguardando confirmação",
  agendado: "Agendado",
  "em-andamento": "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  recusado: "Recusado",
};
```

Em `agenda.ts`, troque o comentário e o `.filter` de `ocupacoesDosAtendimentos` por:

```ts
/** Os horários que os pedidos ocupam; pedido cancelado ou recusado libera o horário. */
export function ocupacoesDosAtendimentos(
  pedidos: (Ocupacao & { status: StatusAtendimento })[]
): Ocupacao[] {
  return pedidos
    .filter((pedido) => pedido.status !== "cancelado" && pedido.status !== "recusado")
    .map(({ tecnicoId, data, horario }) => ({ tecnicoId, data, horario }));
}
```

- [ ] **Step 6: Exemplos (`frontend/src/dados/atendimentos.ts`)**

No `AT-2026-0002` (agendado), depois de `criadoEm: "2026-10-08T14:35:00.000Z",`, acrescente:

```ts
    mensagemCliente: null,
    observacoesTecnico: "",
    produtosUsados: [],
    valorMaoDeObra: null,
    pagoEm: null,
```

No `AT-2026-0001` (concluído), depois de `criadoEm: "2026-09-10T10:00:00.000Z",`, acrescente:

```ts
    mensagemCliente: null,
    observacoesTecnico: "Aspiração e escovação completas, filtro retrolavado e pH corrigido. Água voltou a ficar cristalina.",
    produtosUsados: [
      {
        produtoId: "hidrofloc-1l",
        nome: "Hidroall Clarificante Hidrofloc Tripla Ação 1L",
        precoUnitario: 21.5,
        quantidade: 2,
      },
    ],
    valorMaoDeObra: 150,
    pagoEm: "2026-09-15T18:00:00.000Z",
```

- [ ] **Step 7: Fixture dos testes (`frontend/src/crud/atendimentos/atendimentoDeTeste.ts`)**

```ts
import type { Atendimento } from "../../tipos/atendimento";

/**
 * Atendimento completo pros testes das regras da gestão: um pedido aguardando,
 * com a OS vazia. Cada teste troca só o que importa pra ele.
 */
export function atendimentoDeTeste(campos: Partial<Atendimento> = {}): Atendimento {
  return {
    id: "AT-2026-0003",
    tipo: "vazamento",
    descricao: "Está vazando água perto da escada.",
    fotos: [],
    cliente: { id: "u1", nome: "Ana Souza" },
    abertoNaLoja: false,
    tecnicoId: "rafael",
    data: "2026-10-21",
    horario: "13:30",
    contato: {
      telefone: "51998765432",
      rua: "Rua das Flores",
      numero: "120",
      bairro: "Centro",
      cidade: "Lajeado",
      estado: "RS",
      cep: "95900000",
    },
    status: "aguardando",
    criadoEm: "2026-10-13T17:35:00.000Z",
    mensagemCliente: null,
    observacoesTecnico: "",
    produtosUsados: [],
    valorMaoDeObra: null,
    pagoEm: null,
    ...campos,
  };
}
```

- [ ] **Step 8: Rodar tudo**

Run: `npm test --prefix frontend` → todos verdes (os 2 testes mexidos passam).
Run: `npm run build --prefix frontend` → exit 0. Se o build apontar outro lugar que monta um `Atendimento` inteiro, acrescente lá os 5 campos com os valores iniciais do Step 4.
Run: `npm run lint --prefix frontend` → só a linha de base.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/tipos/atendimento.ts frontend/src/crud/atendimentos/atendimentoDeTeste.ts frontend/src/crud/atendimentos/novoAtendimento.ts frontend/src/crud/atendimentos/novoAtendimento.test.ts frontend/src/crud/atendimentos/opcoesAtendimento.ts frontend/src/crud/atendimentos/agenda.ts frontend/src/crud/atendimentos/agenda.test.ts frontend/src/dados/atendimentos.ts
git commit -m "feat: atendimento guarda recusa, OS e pagamento (com Vitest)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Regras do andamento (`andamento.ts`)

**Files:**
- Create: `frontend/src/crud/atendimentos/andamento.ts`
- Test: `frontend/src/crud/atendimentos/andamento.test.ts`

**Interfaces:**
- Consumes: `Atendimento`, `StatusAtendimento` (Task 1); `atendimentoDeTeste` (Task 1).
- Produces: `type AcaoAtendimento = "confirmar" | "recusar" | "iniciar" | "cancelar" | "concluir" | "marcar-pago"`; `MENSAGEM_CLIENTE_MIN = 10`; `MENSAGEM_CLIENTE_MAX = 500`; `acoesDoStatus(at): AcaoAtendimento[]`; `confirmar(at)`, `recusar(at, mensagem)`, `iniciar(at)`, `cancelar(at, mensagem)`, `concluir(at)`, `marcarPago(at, agora: Date)` — todos `=> Atendimento`; `osEditavel(at): boolean`; `type CamposOs = Partial<Pick<Atendimento, "observacoesTecnico" | "produtosUsados" | "valorMaoDeObra">>`; `atualizarOs(at, campos: CamposOs): Atendimento`; `validarMensagemCliente(texto): string | null`.

- [ ] **Step 1: Escrever o teste que falha (`andamento.test.ts`)**

```ts
import { describe, expect, it } from "vitest";
import { atendimentoDeTeste } from "./atendimentoDeTeste";
import {
  acoesDoStatus,
  atualizarOs,
  cancelar,
  concluir,
  confirmar,
  iniciar,
  marcarPago,
  osEditavel,
  recusar,
  validarMensagemCliente,
} from "./andamento";

const MENSAGEM = "Não atendemos o seu bairro nesse dia.";

describe("acoesDoStatus", () => {
  it("cada status mostra só as ações que valem pra ele", () => {
    expect(acoesDoStatus(atendimentoDeTeste({ status: "aguardando" }))).toEqual(["confirmar", "recusar"]);
    expect(acoesDoStatus(atendimentoDeTeste({ status: "agendado" }))).toEqual(["iniciar", "cancelar"]);
    expect(acoesDoStatus(atendimentoDeTeste({ status: "em-andamento" }))).toEqual(["concluir"]);
    expect(acoesDoStatus(atendimentoDeTeste({ status: "concluido" }))).toEqual(["marcar-pago"]);
  });

  it("pago, recusado e cancelado não têm mais ações", () => {
    expect(acoesDoStatus(atendimentoDeTeste({ status: "concluido", pagoEm: "2026-10-22T12:00:00.000Z" }))).toEqual([]);
    expect(acoesDoStatus(atendimentoDeTeste({ status: "recusado" }))).toEqual([]);
    expect(acoesDoStatus(atendimentoDeTeste({ status: "cancelado" }))).toEqual([]);
  });
});

describe("transições", () => {
  it("confirmar, iniciar e concluir andam um passo e não mexem no original", () => {
    const original = atendimentoDeTeste();
    const agendado = confirmar(original);
    expect(agendado.status).toBe("agendado");
    expect(original.status).toBe("aguardando");
    expect(iniciar(agendado).status).toBe("em-andamento");
    expect(concluir(iniciar(agendado)).status).toBe("concluido");
  });

  it("recusar e cancelar guardam a mensagem sem espaços nas pontas", () => {
    const recusado = recusar(atendimentoDeTeste(), `  ${MENSAGEM}  `);
    expect(recusado.status).toBe("recusado");
    expect(recusado.mensagemCliente).toBe(MENSAGEM);
    const cancelado = cancelar(atendimentoDeTeste({ status: "agendado" }), MENSAGEM);
    expect(cancelado.status).toBe("cancelado");
    expect(cancelado.mensagemCliente).toBe(MENSAGEM);
  });

  it("recusar sem uma mensagem de verdade é bug: lança erro", () => {
    expect(() => recusar(atendimentoDeTeste(), "          ")).toThrow();
    expect(() => cancelar(atendimentoDeTeste({ status: "agendado" }), "curta")).toThrow();
  });

  it("ação fora de hora é bug: lança erro", () => {
    expect(() => confirmar(atendimentoDeTeste({ status: "agendado" }))).toThrow();
    expect(() => iniciar(atendimentoDeTeste())).toThrow();
    expect(() => recusar(atendimentoDeTeste({ status: "em-andamento" }), MENSAGEM)).toThrow();
  });

  it("marcar como pago guarda a hora e só vale uma vez, depois de concluído", () => {
    const agora = new Date("2026-10-22T12:00:00.000Z");
    const pago = marcarPago(atendimentoDeTeste({ status: "concluido" }), agora);
    expect(pago.pagoEm).toBe("2026-10-22T12:00:00.000Z");
    expect(() => marcarPago(pago, agora)).toThrow();
    expect(() => marcarPago(atendimentoDeTeste({ status: "em-andamento" }), agora)).toThrow();
  });
});

describe("OS", () => {
  it("só dá pra mexer em andamento ou concluída sem pagamento", () => {
    expect(osEditavel(atendimentoDeTeste({ status: "em-andamento" }))).toBe(true);
    expect(osEditavel(atendimentoDeTeste({ status: "concluido" }))).toBe(true);
    expect(osEditavel(atendimentoDeTeste({ status: "concluido", pagoEm: "2026-10-22T12:00:00.000Z" }))).toBe(false);
    expect(osEditavel(atendimentoDeTeste({ status: "agendado" }))).toBe(false);
  });

  it("atualizarOs troca só os campos da OS e recusa OS fechada", () => {
    const emAndamento = atendimentoDeTeste({ status: "em-andamento" });
    expect(atualizarOs(emAndamento, { observacoesTecnico: "Troca do anel da bomba." })).toEqual({
      ...emAndamento,
      observacoesTecnico: "Troca do anel da bomba.",
    });
    const pago = atendimentoDeTeste({ status: "concluido", pagoEm: "2026-10-22T12:00:00.000Z" });
    expect(() => atualizarOs(pago, { valorMaoDeObra: 100 })).toThrow();
  });
});

describe("validarMensagemCliente", () => {
  it("pede pelo menos 10 caracteres, sem contar os espaços das pontas", () => {
    const erro = "Escreva a mensagem pro cliente (pelo menos 10 caracteres).";
    expect(validarMensagemCliente("")).toBe(erro);
    expect(validarMensagemCliente("   curta   ")).toBe(erro);
    expect(validarMensagemCliente("123456789")).toBe(erro);
    expect(validarMensagemCliente("1234567890")).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test --prefix frontend -- andamento`
Expected: FAIL — `Cannot find module './andamento'`.

- [ ] **Step 3: Implementar (`andamento.ts`)**

```ts
import type { Atendimento, StatusAtendimento } from "../../tipos/atendimento";

/** O que o painel pode fazer com um atendimento; cada uma vira um botão na OS. */
export type AcaoAtendimento = "confirmar" | "recusar" | "iniciar" | "cancelar" | "concluir" | "marcar-pago";

export const MENSAGEM_CLIENTE_MIN = 10;
export const MENSAGEM_CLIENTE_MAX = 500;

/** Os campos da OS que o técnico preenche. */
export type CamposOs = Partial<Pick<Atendimento, "observacoesTecnico" | "produtosUsados" | "valorMaoDeObra">>;

/** As ações que valem pro status atual (a tela só mostra essas). */
export function acoesDoStatus(atendimento: Atendimento): AcaoAtendimento[] {
  switch (atendimento.status) {
    case "aguardando":
      return ["confirmar", "recusar"];
    case "agendado":
      return ["iniciar", "cancelar"];
    case "em-andamento":
      return ["concluir"];
    case "concluido":
      return atendimento.pagoEm ? [] : ["marcar-pago"];
    default:
      // recusado e cancelado já terminaram
      return [];
  }
}

/** null se a mensagem serve; senão, o texto do erro. */
export function validarMensagemCliente(texto: string): string | null {
  return texto.trim().length >= MENSAGEM_CLIENTE_MIN
    ? null
    : "Escreva a mensagem pro cliente (pelo menos 10 caracteres).";
}

// a tela só oferece as ações do acoesDoStatus; chegar aqui com outro status é bug
function exigirStatus(atendimento: Atendimento, esperado: StatusAtendimento, acao: string) {
  if (atendimento.status !== esperado) {
    throw new Error(`Não dá pra ${acao} o atendimento ${atendimento.id} com status "${atendimento.status}".`);
  }
}

function exigirMensagem(mensagem: string) {
  const problema = validarMensagemCliente(mensagem);
  if (problema) throw new Error(problema);
}

export function confirmar(atendimento: Atendimento): Atendimento {
  exigirStatus(atendimento, "aguardando", "confirmar");
  return { ...atendimento, status: "agendado" };
}

export function recusar(atendimento: Atendimento, mensagem: string): Atendimento {
  exigirStatus(atendimento, "aguardando", "recusar");
  exigirMensagem(mensagem);
  return { ...atendimento, status: "recusado", mensagemCliente: mensagem.trim() };
}

export function iniciar(atendimento: Atendimento): Atendimento {
  exigirStatus(atendimento, "agendado", "iniciar");
  return { ...atendimento, status: "em-andamento" };
}

export function cancelar(atendimento: Atendimento, mensagem: string): Atendimento {
  exigirStatus(atendimento, "agendado", "cancelar");
  exigirMensagem(mensagem);
  return { ...atendimento, status: "cancelado", mensagemCliente: mensagem.trim() };
}

export function concluir(atendimento: Atendimento): Atendimento {
  exigirStatus(atendimento, "em-andamento", "concluir");
  return { ...atendimento, status: "concluido" };
}

/** `agora` vem de fora pra a função continuar pura (o contexto usa ela dentro do setState). */
export function marcarPago(atendimento: Atendimento, agora: Date): Atendimento {
  exigirStatus(atendimento, "concluido", "marcar como pago");
  if (atendimento.pagoEm) throw new Error(`O atendimento ${atendimento.id} já está pago.`);
  return { ...atendimento, pagoEm: agora.toISOString() };
}

/** A OS (observações, produtos, mão de obra) só muda em andamento ou concluída sem pagamento. */
export function osEditavel(atendimento: Atendimento) {
  return (
    atendimento.status === "em-andamento" ||
    (atendimento.status === "concluido" && atendimento.pagoEm === null)
  );
}

export function atualizarOs(atendimento: Atendimento, campos: CamposOs): Atendimento {
  if (!osEditavel(atendimento)) {
    throw new Error(`A OS do atendimento ${atendimento.id} está fechada.`);
  }
  return { ...atendimento, ...campos };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test --prefix frontend -- andamento` → PASS. Depois `npm test --prefix frontend`, `npm run build --prefix frontend`, `npm run lint --prefix frontend` (só a linha de base).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/crud/atendimentos/andamento.ts frontend/src/crud/atendimentos/andamento.test.ts
git commit -m "feat: regras do andamento do atendimento (com Vitest)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Valor da OS, WhatsApp, data e hora, e estoque de exemplo

**Files:**
- Create: `frontend/src/crud/atendimentos/valorOs.ts`, `valorOs.test.ts`
- Create: `frontend/src/crud/atendimentos/whatsapp.ts`, `whatsapp.test.ts`
- Modify: `frontend/src/crud/atendimentos/datasAtendimento.ts`, `datasAtendimento.test.ts`
- Modify: `frontend/src/dados/produtos.ts`

**Interfaces:**
- Consumes: `Atendimento`, `ProdutoUsado` (Task 1); `Produto` (`tipos/produto.ts`).
- Produces (`valorOs.ts`): `subtotalProduto(p: ProdutoUsado): number`; `totalProdutos(produtos: ProdutoUsado[]): number`; `totalOs(at: Pick<Atendimento, "produtosUsados" | "valorMaoDeObra">): number`; `quantidadeNaOs(produtos, produtoId): number`; `validarQuantidade(quantidade: number, estoque: number, jaNaOs?: number): string | null`; `adicionarProduto(produtos, produto: Pick<Produto, "id" | "nome" | "preco">, quantidade): ProdutoUsado[]`; `removerProduto(produtos, produtoId): ProdutoUsado[]`; `validarMaoDeObra(texto): string | null`; `paraValorEmReais(texto): number | null`; `maoDeObraParaTexto(valor: number | null): string`; `formatarReais(valor: number): string`.
- Produces (`whatsapp.ts`): `linkWhatsApp(telefone, texto): string | null`; `textoSaudacao(at: Pick<Atendimento, "id" | "cliente">): string`; `textoMensagemCliente(at: Pick<Atendimento, "id" | "cliente" | "mensagemCliente">): string`.
- Produces (`datasAtendimento.ts`): `formatarDataHora(iso: string): string` → `"13/10/2026 às 14:35"` (relógio local).

- [ ] **Step 1: Testes que falham**

`valorOs.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ProdutoUsado } from "../../tipos/atendimento";
import {
  adicionarProduto,
  formatarReais,
  maoDeObraParaTexto,
  paraValorEmReais,
  quantidadeNaOs,
  removerProduto,
  subtotalProduto,
  totalOs,
  totalProdutos,
  validarMaoDeObra,
  validarQuantidade,
} from "./valorOs";

const CLORO: ProdutoUsado = { produtoId: "propool-3kg", nome: "Cloro 3kg", precoUnitario: 210, quantidade: 1 };
const CLARIFICANTE: ProdutoUsado = { produtoId: "hidrofloc-1l", nome: "Hidrofloc 1L", precoUnitario: 21.5, quantidade: 2 };

describe("totais", () => {
  it("subtotal é preço × quantidade e o total soma a mão de obra", () => {
    expect(subtotalProduto(CLARIFICANTE)).toBe(43);
    expect(totalProdutos([CLORO, CLARIFICANTE])).toBe(253);
    expect(totalOs({ produtosUsados: [CLORO, CLARIFICANTE], valorMaoDeObra: 150 })).toBe(403);
  });

  it("sem mão de obra informada, conta só os produtos; sem nada, é zero", () => {
    expect(totalOs({ produtosUsados: [CLORO], valorMaoDeObra: null })).toBe(210);
    expect(totalOs({ produtosUsados: [], valorMaoDeObra: null })).toBe(0);
  });

  it("arredonda pros centavos", () => {
    const barato: ProdutoUsado = { produtoId: "x", nome: "X", precoUnitario: 0.1, quantidade: 3 };
    expect(totalProdutos([barato])).toBe(0.3);
  });
});

describe("estoque", () => {
  it("quantidade tem que ser inteira e pelo menos 1", () => {
    const erro = "Informe uma quantidade de pelo menos 1.";
    expect(validarQuantidade(0, 10)).toBe(erro);
    expect(validarQuantidade(1.5, 10)).toBe(erro);
    expect(validarQuantidade(Number.NaN, 10)).toBe(erro);
  });

  it("não passa do estoque, somando o que já está na OS", () => {
    expect(validarQuantidade(4, 4)).toBeNull();
    expect(validarQuantidade(5, 4)).toBe("Só tem 4 em estoque.");
    expect(validarQuantidade(3, 4, 2)).toBe("Só tem 4 em estoque.");
    expect(validarQuantidade(1, 0)).toBe("Produto sem estoque.");
  });

  it("o mesmo produto soma na mesma linha; outro produto vira uma linha nova", () => {
    const produto = { id: "hidrofloc-1l", nome: "Hidrofloc 1L", preco: 21.5 };
    const uma = adicionarProduto([], produto, 2);
    expect(uma).toEqual([CLARIFICANTE]);
    expect(adicionarProduto(uma, produto, 1)).toEqual([{ ...CLARIFICANTE, quantidade: 3 }]);
    expect(quantidadeNaOs(uma, "hidrofloc-1l")).toBe(2);
    expect(quantidadeNaOs(uma, "outro")).toBe(0);
    expect(removerProduto([CLORO, CLARIFICANTE], "propool-3kg")).toEqual([CLARIFICANTE]);
  });
});

describe("mão de obra", () => {
  it("aceita reais com vírgula ou ponto; vazio é sem mão de obra", () => {
    expect(validarMaoDeObra("150")).toBeNull();
    expect(validarMaoDeObra("150,50")).toBeNull();
    expect(validarMaoDeObra(" 150.5 ")).toBeNull();
    expect(validarMaoDeObra("")).toBeNull();
    expect(paraValorEmReais("150,50")).toBe(150.5);
    expect(paraValorEmReais("")).toBeNull();
  });

  it("recusa negativo, texto e milhar com ponto", () => {
    const erro = "Informe um valor em reais, ex.: 150,00.";
    expect(validarMaoDeObra("-10")).toBe(erro);
    expect(validarMaoDeObra("abc")).toBe(erro);
    expect(validarMaoDeObra("1.500,00")).toBe(erro);
    expect(paraValorEmReais("abc")).toBeNull();
  });

  it("volta pro campo com vírgula e 2 casas", () => {
    expect(maoDeObraParaTexto(150.5)).toBe("150,50");
    expect(maoDeObraParaTexto(null)).toBe("");
  });
});

describe("formatarReais", () => {
  it("usa o formato brasileiro com espaço comum depois do R$", () => {
    expect(formatarReais(1234.5)).toBe("R$ 1.234,50");
    expect(formatarReais(0)).toBe("R$ 0,00");
  });
});
```

`whatsapp.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { atendimentoDeTeste } from "./atendimentoDeTeste";
import { linkWhatsApp, textoMensagemCliente, textoSaudacao } from "./whatsapp";

describe("linkWhatsApp", () => {
  it("monta o link com o 55 do Brasil e o texto codificado", () => {
    expect(linkWhatsApp("(51) 99876-5432", "Olá, Ana!")).toBe(
      "https://wa.me/5551998765432?text=Ol%C3%A1%2C%20Ana!"
    );
    expect(linkWhatsApp("5133334444", "Oi")).toBe("https://wa.me/555133334444?text=Oi");
  });

  it("telefone que já vem com 55 não ganha outro", () => {
    expect(linkWhatsApp("+55 51 99876-5432", "Oi")).toBe("https://wa.me/5551998765432?text=Oi");
  });

  it("telefone sem DDD ou incompleto não vira link", () => {
    expect(linkWhatsApp("99876-5432", "Oi")).toBeNull();
    expect(linkWhatsApp("", "Oi")).toBeNull();
  });
});

describe("textos do WhatsApp", () => {
  it("chamam o cliente pelo primeiro nome e citam o pedido", () => {
    const atendimento = atendimentoDeTeste({
      cliente: { id: "u1", nome: "Ana Paula Souza" },
      mensagemCliente: "Não atendemos o seu bairro nesse dia.",
    });
    expect(textoSaudacao(atendimento)).toBe(
      "Olá, Ana! Aqui é da Bruxel Piscinas, sobre o seu pedido de atendimento #AT-2026-0003."
    );
    expect(textoMensagemCliente(atendimento)).toBe(
      "Olá, Ana! Sobre o seu pedido de atendimento #AT-2026-0003 na Bruxel Piscinas: Não atendemos o seu bairro nesse dia."
    );
  });
});
```

Em `datasAtendimento.test.ts`, troque o import por `import { formatarData, formatarDataHora, paraDataIso } from "./datasAtendimento";` e acrescente:

```ts
describe("formatarDataHora", () => {
  it("mostra dia e hora no relógio local", () => {
    expect(formatarDataHora(new Date(2026, 9, 13, 14, 35).toISOString())).toBe("13/10/2026 às 14:35");
    expect(formatarDataHora(new Date(2026, 9, 3, 8, 5).toISOString())).toBe("03/10/2026 às 08:05");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test --prefix frontend -- valorOs whatsapp datasAtendimento`
Expected: FAIL — módulos `./valorOs` e `./whatsapp` não existem; `formatarDataHora` não é exportada.

- [ ] **Step 3: `valorOs.ts`**

```ts
import type { Atendimento, ProdutoUsado } from "../../tipos/atendimento";
import type { Produto } from "../../tipos/produto";

// "150", "150,5", "150.50": só dígitos, com até 2 casas depois da vírgula ou do ponto
const FORMATO_REAIS = /^\d+([.,]\d{1,2})?$/;

const FORMATADOR_REAIS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// conta com centavos sem lixo de ponto flutuante (0.1 * 3 = 0.30000000000000004)
function emCentavos(valor: number) {
  return Math.round(valor * 100) / 100;
}

export function subtotalProduto(produto: ProdutoUsado) {
  return emCentavos(produto.precoUnitario * produto.quantidade);
}

export function totalProdutos(produtos: ProdutoUsado[]) {
  return emCentavos(produtos.reduce((soma, produto) => soma + produto.precoUnitario * produto.quantidade, 0));
}

/** Mão de obra (null conta 0) + produtos. */
export function totalOs(atendimento: Pick<Atendimento, "produtosUsados" | "valorMaoDeObra">) {
  return emCentavos((atendimento.valorMaoDeObra ?? 0) + totalProdutos(atendimento.produtosUsados));
}

/** Quanto desse produto a OS já tem (0 se não tem). */
export function quantidadeNaOs(produtos: ProdutoUsado[], produtoId: string) {
  return produtos.find((produto) => produto.produtoId === produtoId)?.quantidade ?? 0;
}

/**
 * null se dá pra lançar; senão, o erro. `jaNaOs` é o que a OS já tem do mesmo
 * produto: a soma não pode passar do estoque.
 * TODO: o estoque só é conferido aqui; a baixa de verdade é do backend (ver o spec).
 */
export function validarQuantidade(quantidade: number, estoque: number, jaNaOs = 0): string | null {
  if (!Number.isInteger(quantidade) || quantidade < 1) return "Informe uma quantidade de pelo menos 1.";
  if (estoque <= 0) return "Produto sem estoque.";
  if (quantidade + jaNaOs > estoque) return `Só tem ${estoque} em estoque.`;
  return null;
}

/** Lança o produto na OS; se ele já está lá, soma na mesma linha (com o preço da primeira vez). */
export function adicionarProduto(
  produtos: ProdutoUsado[],
  produto: Pick<Produto, "id" | "nome" | "preco">,
  quantidade: number
): ProdutoUsado[] {
  if (produtos.some((usado) => usado.produtoId === produto.id)) {
    return produtos.map((usado) =>
      usado.produtoId === produto.id ? { ...usado, quantidade: usado.quantidade + quantidade } : usado
    );
  }
  return [...produtos, { produtoId: produto.id, nome: produto.nome, precoUnitario: produto.preco, quantidade }];
}

export function removerProduto(produtos: ProdutoUsado[], produtoId: string) {
  return produtos.filter((produto) => produto.produtoId !== produtoId);
}

/** null se o texto é um valor em reais (ou vazio = sem mão de obra); senão, o erro. */
export function validarMaoDeObra(texto: string): string | null {
  const limpo = texto.trim();
  if (limpo === "" || FORMATO_REAIS.test(limpo)) return null;
  return "Informe um valor em reais, ex.: 150,00.";
}

/** "150,50" → 150.5; vazio ou inválido → null. */
export function paraValorEmReais(texto: string): number | null {
  const limpo = texto.trim();
  if (!FORMATO_REAIS.test(limpo)) return null;
  return Number(limpo.replace(",", "."));
}

/** 150.5 → "150,50" (pro campo); null → "". */
export function maoDeObraParaTexto(valor: number | null) {
  return valor === null ? "" : valor.toFixed(2).replace(".", ",");
}

/** 1234.5 → "R$ 1.234,50". O Intl põe um espaço especial depois do R$; aqui vira espaço comum. */
export function formatarReais(valor: number) {
  return FORMATADOR_REAIS.format(valor).replace(/\s/g, " ");
}
```

- [ ] **Step 4: `whatsapp.ts`**

```ts
import type { Atendimento } from "../../tipos/atendimento";

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? "";
}

/**
 * Link que abre o WhatsApp com o número do cliente e o texto já escrito; quem
 * envia é o atendente. null se o telefone não tem DDD + número (10 ou 11 dígitos).
 */
export function linkWhatsApp(telefone: string, texto: string): string | null {
  let digitos = telefone.replace(/\D/g, "");
  // telefone salvo com o código do Brasil na frente
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }
  if (digitos.length !== 10 && digitos.length !== 11) return null;
  return `https://wa.me/55${digitos}?text=${encodeURIComponent(texto)}`;
}

/** Abertura da conversa a partir do cartão do cliente na OS. */
export function textoSaudacao(atendimento: Pick<Atendimento, "id" | "cliente">) {
  return `Olá, ${primeiroNome(atendimento.cliente.nome)}! Aqui é da Bruxel Piscinas, sobre o seu pedido de atendimento #${atendimento.id}.`;
}

/** A mensagem da recusa ou do cancelamento, pronta pra mandar no WhatsApp. */
export function textoMensagemCliente(atendimento: Pick<Atendimento, "id" | "cliente" | "mensagemCliente">) {
  return `Olá, ${primeiroNome(atendimento.cliente.nome)}! Sobre o seu pedido de atendimento #${atendimento.id} na Bruxel Piscinas: ${atendimento.mensagemCliente ?? ""}`;
}
```

- [ ] **Step 5: `formatarDataHora` (em `datasAtendimento.ts`)**

Acrescente ao fim do arquivo (a função usa `paraDataIso` e `formatarData`, que já estão nele):

```ts
/** "2026-10-13T17:35:00.000Z" → "13/10/2026 às 14:35", no relógio de quem está usando. */
export function formatarDataHora(iso: string) {
  const data = new Date(iso);
  const hora = `${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`;
  return `${formatarData(paraDataIso(data))} às ${hora}`;
}
```

- [ ] **Step 6: Estoque de exemplo (`frontend/src/dados/produtos.ts`)**

Todos os produtos de exemplo estão com `estoque: 0`, o que impediria lançar qualquer produto na OS. Troque o `estoque: 0,` de cada produto (identificado pelo `id`) por estes valores — é só dado de exemplo do front, o banco não muda:

| id | estoque |
|---|---|
| `hidrofloc-1l` | 12 |
| `cadeira-espreguicadeira` | 3 |
| `propool-10kg` | 6 |
| `propool-3kg` | 10 |
| `filtro-dancor` | 2 |
| `bomba-dancor` | 2 |
| `guarda-sol` | 4 |
| `hidroall-penta-200g` | 15 |
| `hiperclor-60` | 5 |
| `kit-algicidas` | 8 |
| `algicida-choque` | 9 |
| `algicida-manutencao` | 11 |
| `ph-mais` | 7 |
| `escova-piscina` | 6 |
| `peneira-piscina` | 0 (fica sem estoque de propósito, pra testar a mensagem) |

- [ ] **Step 7: Rodar e ver passar**

Run: `npm test --prefix frontend -- valorOs whatsapp datasAtendimento` → PASS. Depois a suíte inteira, build e lint (só a linha de base).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/crud/atendimentos/valorOs.ts frontend/src/crud/atendimentos/valorOs.test.ts frontend/src/crud/atendimentos/whatsapp.ts frontend/src/crud/atendimentos/whatsapp.test.ts frontend/src/crud/atendimentos/datasAtendimento.ts frontend/src/crud/atendimentos/datasAtendimento.test.ts frontend/src/dados/produtos.ts
git commit -m "feat: valor da OS, link do WhatsApp e estoque de exemplo (com Vitest)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Filtros e contagens da lista (`filtrarAtendimentos.ts`)

**Files:**
- Create: `frontend/src/crud/atendimentos/filtrarAtendimentos.ts`
- Test: `frontend/src/crud/atendimentos/filtrarAtendimentos.test.ts`

**Interfaces:**
- Consumes: `Atendimento` (Task 1), `atendimentoDeTeste` (Task 1), `contemTexto` (`crud/busca.ts`).
- Produces: `type FiltroStatus = "aguardando" | "agendado" | "em-andamento" | "concluido" | "encerrados" | "todos"`; `type FiltroPagamento = "" | "a-pagar" | "pago"`; `type OrdemAtendimento = "visita" | "visita-desc"`; `interface FiltrosAtendimento { busca: string; status: FiltroStatus; tecnico: string; pagamento: FiltroPagamento; ordem: OrdemAtendimento }`; `FILTROS_ATENDIMENTO_INICIAIS`; `filtrarAtendimentos(lista, filtros): Atendimento[]`; `contarPorStatus(lista): Record<FiltroStatus, number>`; `contarFiltrosAtivosAtendimento(filtros): number`.

- [ ] **Step 1: Teste que falha (`filtrarAtendimentos.test.ts`)**

```ts
import { describe, expect, it } from "vitest";
import { atendimentoDeTeste } from "./atendimentoDeTeste";
import {
  FILTROS_ATENDIMENTO_INICIAIS,
  contarFiltrosAtivosAtendimento,
  contarPorStatus,
  filtrarAtendimentos,
} from "./filtrarAtendimentos";
import type { FiltrosAtendimento } from "./filtrarAtendimentos";

const LISTA = [
  atendimentoDeTeste({ id: "AT-2026-0001", status: "aguardando", data: "2026-10-22", horario: "08:00", cliente: { id: "u1", nome: "João Silva" } }),
  atendimentoDeTeste({ id: "AT-2026-0002", status: "aguardando", data: "2026-10-20", horario: "15:30", tecnicoId: "carlos" }),
  atendimentoDeTeste({ id: "AT-2026-0003", status: "concluido", pagoEm: null, data: "2026-10-01" }),
  atendimentoDeTeste({ id: "AT-2026-0004", status: "concluido", pagoEm: "2026-10-02T12:00:00.000Z", data: "2026-10-02" }),
  atendimentoDeTeste({ id: "AT-2026-0005", status: "recusado", data: "2026-10-23" }),
  atendimentoDeTeste({ id: "AT-2026-0006", status: "cancelado", data: "2026-10-24", contato: { ...atendimentoDeTeste().contato, bairro: "Moinhos" } }),
];

const ids = (lista: { id: string }[]) => lista.map((atendimento) => atendimento.id);
const filtros = (campos: Partial<FiltrosAtendimento>) => ({ ...FILTROS_ATENDIMENTO_INICIAIS, ...campos });

describe("filtrarAtendimentos", () => {
  it("abre nos aguardando, com a visita mais próxima primeiro", () => {
    expect(ids(filtrarAtendimentos(LISTA, FILTROS_ATENDIMENTO_INICIAIS))).toEqual(["AT-2026-0002", "AT-2026-0001"]);
  });

  it("'encerrados' junta recusados e cancelados; 'todos' mostra tudo", () => {
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "encerrados" })))).toEqual(["AT-2026-0005", "AT-2026-0006"]);
    expect(filtrarAtendimentos(LISTA, filtros({ status: "todos" }))).toHaveLength(6);
  });

  it("busca pelo cliente sem acento, pelo número e pelo bairro", () => {
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", busca: "joao" })))).toEqual(["AT-2026-0001"]);
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", busca: "0004" })))).toEqual(["AT-2026-0004"]);
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", busca: "moinhos" })))).toEqual(["AT-2026-0006"]);
  });

  it("filtra pelo atendente", () => {
    expect(ids(filtrarAtendimentos(LISTA, filtros({ tecnico: "carlos" })))).toEqual(["AT-2026-0002"]);
  });

  it("pagamento só olha os concluídos", () => {
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", pagamento: "a-pagar" })))).toEqual(["AT-2026-0003"]);
    expect(ids(filtrarAtendimentos(LISTA, filtros({ status: "todos", pagamento: "pago" })))).toEqual(["AT-2026-0004"]);
  });

  it("ordem inversa põe a visita mais distante primeiro, e não altera a lista original", () => {
    const copia = [...LISTA];
    expect(ids(filtrarAtendimentos(LISTA, filtros({ ordem: "visita-desc" })))).toEqual(["AT-2026-0001", "AT-2026-0002"]);
    expect(LISTA).toEqual(copia);
  });
});

describe("contarPorStatus", () => {
  it("conta cada chip, com recusado e cancelado juntos", () => {
    expect(contarPorStatus(LISTA)).toEqual({
      aguardando: 2,
      agendado: 0,
      "em-andamento": 0,
      concluido: 2,
      encerrados: 2,
      todos: 6,
    });
  });
});

describe("contarFiltrosAtivosAtendimento", () => {
  it("conta só o painel (atendente, pagamento e ordem), sem a busca e o chip", () => {
    expect(contarFiltrosAtivosAtendimento(FILTROS_ATENDIMENTO_INICIAIS)).toBe(0);
    expect(contarFiltrosAtivosAtendimento(filtros({ busca: "ana", status: "todos" }))).toBe(0);
    expect(contarFiltrosAtivosAtendimento(filtros({ tecnico: "carlos", pagamento: "pago", ordem: "visita-desc" }))).toBe(3);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test --prefix frontend -- filtrarAtendimentos`
Expected: FAIL — `Cannot find module './filtrarAtendimentos'`.

- [ ] **Step 3: Implementar (`filtrarAtendimentos.ts`)**

```ts
import type { Atendimento } from "../../tipos/atendimento";
import { contemTexto } from "../busca";

/** Os chips da lista: um por status, "encerrados" (recusado + cancelado) e "todos". */
export type FiltroStatus = "aguardando" | "agendado" | "em-andamento" | "concluido" | "encerrados" | "todos";

/** "" = qualquer; só os concluídos têm pagamento. */
export type FiltroPagamento = "" | "a-pagar" | "pago";

export type OrdemAtendimento = "visita" | "visita-desc";

/** O que está escolhido na busca, nos chips e no painel de filtros da lista de atendimentos. */
export interface FiltrosAtendimento {
  busca: string;
  status: FiltroStatus;
  /** id do atendente (dados/tecnicos.ts); "" = qualquer */
  tecnico: string;
  pagamento: FiltroPagamento;
  ordem: OrdemAtendimento;
}

// a lista abre no que precisa de decisão: os pedidos aguardando confirmação
export const FILTROS_ATENDIMENTO_INICIAIS: FiltrosAtendimento = {
  busca: "",
  status: "aguardando",
  tecnico: "",
  pagamento: "",
  ordem: "visita",
};

function encerrado(atendimento: Atendimento) {
  return atendimento.status === "recusado" || atendimento.status === "cancelado";
}

function combinaComStatus(atendimento: Atendimento, status: FiltroStatus) {
  if (status === "todos") return true;
  if (status === "encerrados") return encerrado(atendimento);
  return atendimento.status === status;
}

function combinaComBusca(atendimento: Atendimento, busca: string) {
  return (
    contemTexto(atendimento.cliente.nome, busca) ||
    contemTexto(atendimento.id, busca) ||
    contemTexto(atendimento.contato.bairro, busca)
  );
}

function combinaComPagamento(atendimento: Atendimento, pagamento: FiltroPagamento) {
  if (!pagamento) return true;
  if (atendimento.status !== "concluido") return false;
  return pagamento === "pago" ? atendimento.pagoEm !== null : atendimento.pagoEm === null;
}

// "2026-10-21 13:30": no formato aaaa-mm-dd hh:mm, a ordem do texto é a ordem do tempo
function momentoDaVisita(atendimento: Atendimento) {
  return `${atendimento.data} ${atendimento.horario}`;
}

/** Aplica os filtros e a ordenação; devolve uma lista nova (não altera a original). */
export function filtrarAtendimentos(atendimentos: Atendimento[], filtros: FiltrosAtendimento) {
  const sentido = filtros.ordem === "visita-desc" ? -1 : 1;
  return atendimentos
    .filter(
      (atendimento) =>
        combinaComStatus(atendimento, filtros.status) &&
        combinaComBusca(atendimento, filtros.busca) &&
        (!filtros.tecnico || atendimento.tecnicoId === filtros.tecnico) &&
        combinaComPagamento(atendimento, filtros.pagamento)
    )
    .sort((a, b) => sentido * momentoDaVisita(a).localeCompare(momentoDaVisita(b)));
}

/** Quantos atendimentos cada chip mostra (os números dos chips e do card do painel). */
export function contarPorStatus(atendimentos: Atendimento[]): Record<FiltroStatus, number> {
  const contagem: Record<FiltroStatus, number> = {
    aguardando: 0,
    agendado: 0,
    "em-andamento": 0,
    concluido: 0,
    encerrados: 0,
    todos: atendimentos.length,
  };
  for (const atendimento of atendimentos) {
    if (encerrado(atendimento)) contagem.encerrados += 1;
    else contagem[atendimento.status as Exclude<FiltroStatus, "encerrados" | "todos">] += 1;
  }
  return contagem;
}

/**
 * Quantos filtros do painel estão em uso (o número do botão "Filtros (n)").
 * A busca e o chip de status ficam de fora porque já aparecem na tela.
 */
export function contarFiltrosAtivosAtendimento(filtros: FiltrosAtendimento) {
  return [
    filtros.tecnico !== "",
    filtros.pagamento !== "",
    filtros.ordem !== FILTROS_ATENDIMENTO_INICIAIS.ordem,
  ].filter(Boolean).length;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test --prefix frontend -- filtrarAtendimentos` → PASS. Depois suíte inteira, build e lint (só a linha de base).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/crud/atendimentos/filtrarAtendimentos.ts frontend/src/crud/atendimentos/filtrarAtendimentos.test.ts
git commit -m "feat: filtros e contagens da lista de atendimentos (com Vitest)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Provedor com todos os pedidos e o que o cliente vê

**Files:**
- Modify: `frontend/src/contexto/ContextoAtendimentos.tsx`
- Modify: `frontend/src/contexto/useAtendimentos.ts`
- Modify: `frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx`, `AbaAtendimentos.css`

**Interfaces:**
- Consumes: `novoAtendimento`, `ocupacoesDosAtendimentos` (Task 1); `totalOs`, `formatarReais` (Task 3).
- Produces: `useAtendimentos()` devolve também `todosAtendimentos: Atendimento[]` e `atualizarAtendimento(id: string, transformar: (atual: Atendimento) => Atendimento): void` (o `transformar` precisa ser puro: roda dentro do setState).

- [ ] **Step 1: `useAtendimentos.ts`**

Troque a `interface ValorContextoAtendimentos` por:

```ts
/** Tudo que os componentes conseguem ler e usar dos atendimentos via useAtendimentos(). */
export interface ValorContextoAtendimentos {
  /** atendimentos da conta logada (inclusive os abertos pela loja pra ela) e os exemplos, do mais novo pro mais antigo */
  atendimentos: Atendimento[];
  /** todos os pedidos, de todas as contas e do balcão (painel admin), do mais novo pro mais antigo */
  todosAtendimentos: Atendimento[];
  /** horários ocupados na agenda dos atendentes, juntando os pedidos de todas as contas */
  ocupacoes: Ocupacao[];
  /** guarda uma solicitação nova no topo da lista, com status "aguardando" */
  solicitarAtendimento: (dados: DadosSolicitacao) => void;
  /**
   * Troca um pedido pelo que `transformar` devolver (ex.: `confirmar`, `recusar` de andamento.ts).
   * `transformar` precisa ser pura: roda dentro do setState, que o StrictMode chama 2 vezes.
   */
  atualizarAtendimento: (id: string, transformar: (atual: Atendimento) => Atendimento) => void;
}
```

- [ ] **Step 2: `ContextoAtendimentos.tsx` inteiro**

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

// os exemplos aparecem pra toda conta, pra aba "Atendimentos" não abrir vazia
const IDS_EXEMPLO = new Set(ATENDIMENTOS_EXEMPLO.map((atendimento) => atendimento.id));

/**
 * Guarda os atendimentos e disponibiliza pro formulário (/solicitar-atendimento),
 * pra aba "Atendimentos" do /perfil e pro painel (/admin/atendimentos). Precisa
 * envolver o app — ver App.tsx.
 *
 * É uma lista só, com os pedidos de todas as contas, os de balcão (cliente sem
 * cadastro) e os exemplos. Cada conta vê os próprios pedidos e os exemplos; o
 * painel vê todos e muda o status deles. A agenda dos atendentes é uma só, então
 * os horários ocupados juntam todos os pedidos. Tudo vive só na memória:
 * recarregar a página volta aos exemplos.
 * TODO: trocar pelas rotas de appointments quando o backend tiver (ver o recado
 * pro backend em docs/superpowers/specs/2026-10-13-gestao-atendimentos-design.md).
 */
export function ProvedorAtendimentos({ children }: { children: ReactNode }) {
  // do mais novo pro mais antigo; a função inicial copia os exemplos pra eles também poderem mudar de status
  const [todosAtendimentos, setTodosAtendimentos] = useState<Atendimento[]>(() => [...ATENDIMENTOS_EXEMPLO]);
  const { usuario } = useAutenticacao();
  const idUsuario = usuario?.id ?? null;

  // a lista da conta: os pedidos em que ela é o cliente (inclusive os abertos pela loja) e os exemplos
  const atendimentos = useMemo(
    () =>
      todosAtendimentos.filter(
        (atendimento) =>
          (idUsuario !== null && atendimento.cliente.id === idUsuario) || IDS_EXEMPLO.has(atendimento.id)
      ),
    [idUsuario, todosAtendimentos]
  );

  // um horário pedido por qualquer conta fica ocupado pra todas
  const ocupacoes = useMemo(() => ocupacoesDosAtendimentos(todosAtendimentos), [todosAtendimentos]);

  const solicitarAtendimento = useCallback((dados: DadosSolicitacao) => {
    // a data do envio é pega aqui fora: a função do setState deve ser pura (o StrictMode chama ela 2 vezes)
    const agora = new Date();
    // numeração única entre todas as contas (como seria no banco), contando os exemplos
    setTodosAtendimentos((atual) => [novoAtendimento(dados, atual.length, agora), ...atual]);
  }, []);

  const atualizarAtendimento = useCallback(
    (id: string, transformar: (atual: Atendimento) => Atendimento) => {
      setTodosAtendimentos((atual) =>
        atual.map((atendimento) => (atendimento.id === id ? transformar(atendimento) : atendimento))
      );
    },
    []
  );

  // useMemo: só cria um objeto novo quando algo muda, pra não re-renderizar à toa quem usa o contexto
  const valor = useMemo<ValorContextoAtendimentos>(
    () => ({ atendimentos, todosAtendimentos, ocupacoes, solicitarAtendimento, atualizarAtendimento }),
    [atendimentos, todosAtendimentos, ocupacoes, solicitarAtendimento, atualizarAtendimento]
  );

  return <ContextoAtendimentos.Provider value={valor}>{children}</ContextoAtendimentos.Provider>;
}

export default ProvedorAtendimentos;
```

- [ ] **Step 3: O cliente vê a mensagem e o total (`AbaAtendimentos.tsx`)**

Acrescente os imports:

```tsx
import { formatarReais, totalOs } from "../../../../../crud/atendimentos/valorOs";
```

Dentro do `map`, troque `const quantidadeFotos = atendimento.fotos.length;` por:

```tsx
            const quantidadeFotos = atendimento.fotos.length;
            const total = totalOs(atendimento);
            const encerrado = atendimento.status === "recusado" || atendimento.status === "cancelado";
```

E, dentro de `<div className="aba-atendimentos__principal">`, logo depois do `<span>` do "Enviado em …", acrescente:

```tsx
                  {encerrado && atendimento.mensagemCliente && (
                    <span className="aba-atendimentos__mensagem">
                      Mensagem da Bruxel: {atendimento.mensagemCliente}
                    </span>
                  )}
                  {atendimento.status === "concluido" && total > 0 && (
                    <span>Total: {formatarReais(total)}</span>
                  )}
```

- [ ] **Step 4: CSS (`AbaAtendimentos.css`)**

Depois do bloco `.aba-atendimentos__status--cancelado { … }`, acrescente:

```css
.aba-atendimentos__status--recusado {
  background-color: #fdecea;
  color: #c0392b;
}
```

E depois do bloco `.aba-atendimentos__principal span { … }`, acrescente:

```css
/* a mensagem da recusa/cancelamento é pra ler: cor de texto normal e quebra de linha mantida */
.aba-atendimentos__principal .aba-atendimentos__mensagem {
  color: var(--color-text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
```

- [ ] **Step 5: Verificar**

Run: `npm test --prefix frontend`, `npm run build --prefix frontend`, `npm run lint --prefix frontend` (só a linha de base). Sem teste novo (componentes e provedor); o comportamento é conferido no navegador depois da Task 8.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/contexto/ContextoAtendimentos.tsx frontend/src/contexto/useAtendimentos.ts frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.css
git commit -m "feat: provedor com todos os pedidos e cliente vê recusa e total

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Lista `/admin/atendimentos` e card no painel

**Files:**
- Create: `frontend/src/paginas/admin/atendimentos/componentes/SeloStatusAtendimento/SeloStatusAtendimento.tsx`, `SeloStatusAtendimento.css`
- Create: `frontend/src/paginas/admin/atendimentos/atendimentos.tsx`, `atendimentos.css`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/paginas/admin/inicio/inicio.tsx`

**Interfaces:**
- Consumes: `useAtendimentos().todosAtendimentos` (Task 5); `filtrarAtendimentos`, `contarPorStatus`, `contarFiltrosAtivosAtendimento`, `FILTROS_ATENDIMENTO_INICIAIS` e tipos (Task 4); `STATUS_LABELS`, `TIPO_SERVICO_LABELS`; `formatarData`; `nomeDoTecnico`; `TECNICOS`.
- Produces: `SeloStatusAtendimento({ status: StatusAtendimento })` e `SeloPagamento({ pagoEm: string | null })` (usados também pela Task 7); `PaginaAdminAtendimentos`; rota `/admin/atendimentos`.

- [ ] **Step 1: Selos (`SeloStatusAtendimento.tsx`)**

```tsx
import { STATUS_LABELS } from "../../../../../crud/atendimentos/opcoesAtendimento";
import type { StatusAtendimento } from "../../../../../tipos/atendimento";
import "./SeloStatusAtendimento.css";

/** Etiqueta colorida do status do atendimento (lista e OS do painel). */
export function SeloStatusAtendimento({ status }: { status: StatusAtendimento }) {
  return <span className={`selo-atendimento selo-atendimento--${status}`}>{STATUS_LABELS[status]}</span>;
}

/** "Pago" ou "A pagar", pros atendimentos concluídos. */
export function SeloPagamento({ pagoEm }: { pagoEm: string | null }) {
  return pagoEm ? (
    <span className="selo-atendimento selo-atendimento--pago">Pago</span>
  ) : (
    <span className="selo-atendimento selo-atendimento--a-pagar">A pagar</span>
  );
}
```

`SeloStatusAtendimento.css`:

```css
/* etiqueta de status do atendimento no painel; o sufixo da classe é o valor de StatusAtendimento */
.selo-atendimento {
  display: inline-block;
  border-radius: 999px;
  padding: 0.15rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.selo-atendimento--aguardando {
  background-color: #fdf3d7;
  color: #8a6100;
}

.selo-atendimento--agendado {
  background-color: #e2effa;
  color: #1f5f99;
}

.selo-atendimento--em-andamento {
  background-color: #dcdcff;
  color: var(--color-primary);
}

.selo-atendimento--concluido,
.selo-atendimento--pago {
  background-color: #e3f5e8;
  color: #1e7a3c;
}

.selo-atendimento--cancelado {
  background-color: #f1f1f4;
  color: #5c5c66;
}

.selo-atendimento--recusado {
  background-color: #fdecea;
  color: #c0392b;
}

.selo-atendimento--a-pagar {
  background-color: #fdf2d8;
  color: #8a5a00;
}
```

- [ ] **Step 2: Página (`atendimentos.tsx`)**

```tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { BarraBusca } from "../../../componentes/ui/BarraBusca/BarraBusca";
import { PainelFiltros } from "../../../componentes/ui/PainelFiltros/PainelFiltros";
import { ChipsFiltro } from "../../../componentes/ui/ChipsFiltro/ChipsFiltro";
import { AlternarVisualizacao } from "../../../componentes/ui/AlternarVisualizacao/AlternarVisualizacao";
import { useAtendimentos } from "../../../contexto/useAtendimentos";
import {
  FILTROS_ATENDIMENTO_INICIAIS,
  contarFiltrosAtivosAtendimento,
  contarPorStatus,
  filtrarAtendimentos,
} from "../../../crud/atendimentos/filtrarAtendimentos";
import type {
  FiltroPagamento,
  FiltroStatus,
  FiltrosAtendimento,
  OrdemAtendimento,
} from "../../../crud/atendimentos/filtrarAtendimentos";
import { TIPO_SERVICO_LABELS } from "../../../crud/atendimentos/opcoesAtendimento";
import { formatarData } from "../../../crud/atendimentos/datasAtendimento";
import { nomeDoTecnico } from "../../../crud/atendimentos/agenda";
import { TECNICOS } from "../../../dados/tecnicos";
import { useCarregarMais } from "../../../hooks/useCarregarMais";
import { useModoVisualizacao } from "../../../hooks/useModoVisualizacao";
import type { Atendimento } from "../../../tipos/atendimento";
import { SeloPagamento, SeloStatusAtendimento } from "./componentes/SeloStatusAtendimento/SeloStatusAtendimento";
import "../lista-admin.css";
import "./atendimentos.css";

// texto de cada chip, na ordem em que aparecem
const ROTULOS_STATUS: Record<FiltroStatus, string> = {
  aguardando: "Aguardando",
  agendado: "Agendados",
  "em-andamento": "Em andamento",
  concluido: "Concluídos",
  encerrados: "Recusados e cancelados",
  todos: "Todos",
};

// quantos itens aparecem de cada vez (a lista compacta cabe mais na tela)
const POR_VEZ = { cards: 12, lista: 20 };

const ID_PAINEL = "filtros-atendimentos";

// "21/10/2026 às 13:30 · Rafael"
function quandoEQuem(atendimento: Atendimento) {
  return `${formatarData(atendimento.data)} às ${atendimento.horario} · ${nomeDoTecnico(atendimento.tecnicoId)}`;
}

/**
 * Gestão de atendimentos do painel admin (rota "/admin/atendimentos"): todos os
 * pedidos, de todas as contas e do balcão, com busca, chips de status, painel de
 * filtros e a lista em cards ou compacta. Cada pedido abre a OS
 * (/admin/atendimentos/:id), onde o admin decide e acompanha o serviço.
 */
export function PaginaAdminAtendimentos() {
  const { todosAtendimentos } = useAtendimentos();
  const [filtros, setFiltros] = useState<FiltrosAtendimento>(FILTROS_ATENDIMENTO_INICIAIS);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [modo, setModo] = useModoVisualizacao("admin-atendimentos");

  const filtrados = useMemo(() => filtrarAtendimentos(todosAtendimentos, filtros), [todosAtendimentos, filtros]);
  const contagem = useMemo(() => contarPorStatus(todosAtendimentos), [todosAtendimentos]);
  // a chave muda com os filtros e o modo: aí a lista volta a mostrar só o começo
  const { visiveis, temMais, carregarMais } = useCarregarMais(
    filtrados,
    JSON.stringify(filtros) + modo,
    POR_VEZ[modo]
  );

  // cada chip com a quantidade, ex.: "Aguardando (2)"
  const opcoesStatus = (Object.keys(ROTULOS_STATUS) as FiltroStatus[]).map((valor) => ({
    valor,
    rotulo: `${ROTULOS_STATUS[valor]} (${contagem[valor]})`,
  }));

  // genérico pra o TypeScript garantir que o valor combina com o campo
  function atualizarFiltro<K extends keyof FiltrosAtendimento>(campo: K, valor: FiltrosAtendimento[K]) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  }

  // "Limpar filtros" do painel: zera o painel e mantém a busca e o chip, que a pessoa vê na tela
  function limparFiltros() {
    setFiltros((atuais) => ({ ...FILTROS_ATENDIMENTO_INICIAIS, busca: atuais.busca, status: atuais.status }));
  }

  const contador =
    filtrados.length === todosAtendimentos.length
      ? `${todosAtendimentos.length} ${todosAtendimentos.length === 1 ? "atendimento" : "atendimentos"}`
      : `${filtrados.length} de ${todosAtendimentos.length} atendimentos`;

  return (
    <>
      <NavAdmin />

      <section className="pagina-admin-atendimentos">
        <Container>
          <div className="lista-admin__topo">
            <h1 className="lista-admin__titulo">Atendimentos</h1>
            <Link to="/solicitar-atendimento" className="lista-admin__botao pagina-admin-atendimentos__novo">
              + Abrir atendimento
            </Link>
          </div>

          <BarraBusca
            valor={filtros.busca}
            onMudar={(valor) => atualizarFiltro("busca", valor)}
            placeholder="Buscar por cliente, número ou bairro"
            rotulo="Buscar atendimentos"
            filtrosAbertos={filtrosAbertos}
            onAlternarFiltros={() => setFiltrosAbertos((aberto) => !aberto)}
            qtdFiltrosAtivos={contarFiltrosAtivosAtendimento(filtros)}
            idPainel={ID_PAINEL}
          />

          <PainelFiltros id={ID_PAINEL} aberto={filtrosAbertos} onLimpar={limparFiltros}>
            <label>
              Atendente
              <select value={filtros.tecnico} onChange={(e) => atualizarFiltro("tecnico", e.target.value)}>
                <option value="">Qualquer</option>
                {TECNICOS.map((tecnico) => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pagamento
              <select
                value={filtros.pagamento}
                onChange={(e) => atualizarFiltro("pagamento", e.target.value as FiltroPagamento)}
              >
                <option value="">Qualquer</option>
                <option value="a-pagar">A pagar</option>
                <option value="pago">Pago</option>
              </select>
            </label>
            <label>
              Ordenar por
              <select
                value={filtros.ordem}
                onChange={(e) => atualizarFiltro("ordem", e.target.value as OrdemAtendimento)}
              >
                <option value="visita">Visita mais próxima</option>
                <option value="visita-desc">Visita mais distante</option>
              </select>
            </label>
          </PainelFiltros>

          <div className="lista-admin__linha-chips">
            <ChipsFiltro
              opcoes={opcoesStatus}
              selecionado={filtros.status}
              onSelecionar={(valor) => atualizarFiltro("status", valor)}
              rotulo="Status"
            />
            <AlternarVisualizacao modo={modo} onMudar={setModo} />
          </div>

          {/* aria-live: leitores de tela anunciam o novo total quando um filtro muda */}
          <p className="lista-admin__contador" aria-live="polite">
            {contador}
          </p>

          {filtrados.length === 0 && (
            <div className="lista-admin__vazio">
              <p>Nenhum atendimento por aqui. Troque o status ou limpe os filtros.</p>
              <button
                type="button"
                className="lista-admin__botao lista-admin__botao--contorno"
                onClick={() => setFiltros({ ...FILTROS_ATENDIMENTO_INICIAIS, status: "todos" })}
              >
                Ver todos os atendimentos
              </button>
            </div>
          )}

          {filtrados.length > 0 && modo === "cards" && (
            <ul className="lista-admin__grade">
              {visiveis.map((atendimento) => (
                <li key={atendimento.id}>
                  <Link
                    to={`/admin/atendimentos/${atendimento.id}`}
                    className="lista-admin__card pagina-admin-atendimentos__card"
                  >
                    <span className="lista-admin__card-titulo">
                      #{atendimento.id} · {TIPO_SERVICO_LABELS[atendimento.tipo]}
                    </span>
                    <span className="lista-admin__card-corpo">
                      <span className="lista-admin__card-detalhe">
                        {atendimento.cliente.nome}
                        {atendimento.abertoNaLoja && <SeloLoja />}
                      </span>
                      <span className="lista-admin__card-detalhe">{quandoEQuem(atendimento)}</span>
                    </span>
                    <SelosDoAtendimento atendimento={atendimento} />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {filtrados.length > 0 && modo === "lista" && (
            <ul className="lista-admin__compacta pagina-admin-atendimentos__compacta">
              {/* títulos das colunas; aria-hidden porque cada linha já é lida inteira */}
              <li className="lista-admin__linha lista-admin__linha--titulos" aria-hidden="true">
                <span>Cliente</span>
                <span className="lista-admin__so-largo">Pedido</span>
                <span className="lista-admin__so-largo">Visita</span>
                <span>Status</span>
              </li>
              {visiveis.map((atendimento) => (
                <li key={atendimento.id}>
                  <Link
                    to={`/admin/atendimentos/${atendimento.id}`}
                    className="lista-admin__linha pagina-admin-atendimentos__linha"
                  >
                    <span title={atendimento.cliente.nome}>
                      {atendimento.cliente.nome}
                      {atendimento.abertoNaLoja && <SeloLoja />}
                    </span>
                    <span className="lista-admin__so-largo">
                      #{atendimento.id} · {TIPO_SERVICO_LABELS[atendimento.tipo]}
                    </span>
                    <span className="lista-admin__so-largo">{quandoEQuem(atendimento)}</span>
                    <SelosDoAtendimento atendimento={atendimento} />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {temMais && (
            <div className="lista-admin__carregar-mais">
              <button
                type="button"
                className="lista-admin__botao lista-admin__botao--contorno"
                onClick={carregarMais}
              >
                Carregar mais ({filtrados.length - visiveis.length} restantes)
              </button>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

// <div> e não <span>: no celular, o CSS da lista compacta mexe no display de todo <span> filho da linha
function SelosDoAtendimento({ atendimento }: { atendimento: Atendimento }) {
  return (
    <div className="pagina-admin-atendimentos__selos">
      <SeloStatusAtendimento status={atendimento.status} />
      {atendimento.status === "concluido" && <SeloPagamento pagoEm={atendimento.pagoEm} />}
    </div>
  );
}

function SeloLoja() {
  return <span className="lista-admin__selo lista-admin__selo--destaque">loja</span>;
}

export default PaginaAdminAtendimentos;
```

- [ ] **Step 3: CSS da lista (`atendimentos.css`)**

```css
/* o que é comum com as outras listas do painel (topo, cards, lista compacta, botões) está em ../lista-admin.css */
.pagina-admin-atendimentos {
  padding: clamp(1.5rem, 1rem + 2vw, 2.5rem) 0 var(--space-section);
}

/* "+ Abrir atendimento" é um link com cara de botão */
.pagina-admin-atendimentos__novo {
  text-decoration: none;
}

/* o card inteiro é o link pra OS */
.pagina-admin-atendimentos__card {
  height: 100%;
  box-sizing: border-box;
  color: inherit;
  text-decoration: none;
}

.pagina-admin-atendimentos__card:hover {
  border-color: var(--color-primary);
}

.pagina-admin-atendimentos__card:focus-visible,
.pagina-admin-atendimentos__linha:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* os selos ficam no pé do card, alinhando cards de alturas diferentes */
.pagina-admin-atendimentos__card .pagina-admin-atendimentos__selos {
  margin-top: auto;
}

.pagina-admin-atendimentos__selos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

/* colunas da lista compacta: cliente | pedido | visita | status; no celular: cliente | status */
.pagina-admin-atendimentos__compacta {
  --colunas-lista: minmax(0, 1.4fr) minmax(0, 1.4fr) minmax(0, 1.5fr) minmax(0, 1.1fr);
  --colunas-lista-celular: minmax(0, 1fr) auto;
}

.pagina-admin-atendimentos__linha {
  color: inherit;
  text-decoration: none;
}

.pagina-admin-atendimentos__linha:hover {
  background-color: #f7f7fb;
}
```

- [ ] **Step 4: Rota (`App.tsx`)**

Acrescente o import junto dos outros do admin:

```tsx
import { PaginaAdminAtendimentos } from "./paginas/admin/atendimentos/atendimentos";
```

E, dentro do `<Route element={<RotaAdmin />}>`, depois da rota de produtos:

```tsx
                <Route path="/admin/atendimentos" element={<PaginaAdminAtendimentos />} />
```

- [ ] **Step 5: Card no painel (`inicio.tsx`)**

Acrescente os imports:

```tsx
import { useAtendimentos } from "../../../contexto/useAtendimentos";
import { contarPorStatus } from "../../../crud/atendimentos/filtrarAtendimentos";
```

No `AREAS_ADMIN`, antes do item `atendimento` ("Abrir atendimento"), acrescente:

```tsx
  {
    id: "atendimentos",
    titulo: "Atendimentos",
    descricao: "Pedidos e ordens de serviço",
    rota: "/admin/atendimentos",
    icone: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    ),
  },
```

Dentro de `PaginaAdminInicio`, depois de `const { usuario } = useAutenticacao();`:

```tsx
  // o card de atendimentos avisa quantos pedidos esperam confirmação
  const { todosAtendimentos } = useAtendimentos();
  const aguardando = contarPorStatus(todosAtendimentos).aguardando;
```

E troque `<span>{area.descricao}</span>` por:

```tsx
                  <span>
                    {area.id === "atendimentos" && aguardando > 0
                      ? `${aguardando} aguardando confirmação`
                      : area.descricao}
                  </span>
```

- [ ] **Step 6: Verificar**

Run: `npm test --prefix frontend`, `npm run build --prefix frontend`, `npm run lint --prefix frontend` (só a linha de base).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/paginas/admin/atendimentos frontend/src/App.tsx frontend/src/paginas/admin/inicio/inicio.tsx
git commit -m "feat: lista de atendimentos no painel admin

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Página da OS com as ações e a mensagem pro cliente

**Files:**
- Create: `frontend/src/paginas/admin/atendimento/atendimento.tsx`, `atendimento.css`
- Create: `frontend/src/paginas/admin/atendimento/componentes/CartaoClienteOs/CartaoClienteOs.tsx`, `.css`
- Create: `frontend/src/paginas/admin/atendimento/componentes/GaleriaFotosOs/GaleriaFotosOs.tsx`, `.css`
- Create: `frontend/src/paginas/admin/atendimento/componentes/ModalMensagemCliente/ModalMensagemCliente.tsx`, `.css`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useAtendimentos().todosAtendimentos`, `atualizarAtendimento` (Task 5); `acoesDoStatus`, `confirmar`, `recusar`, `iniciar`, `cancelar`, `concluir`, `marcarPago`, `validarMensagemCliente`, `MENSAGEM_CLIENTE_MAX` (Task 2); `totalOs`, `formatarReais` (Task 3); `linkWhatsApp`, `textoSaudacao`, `textoMensagemCliente` (Task 3); `formatarDataHora` (Task 3); `SeloStatusAtendimento`, `SeloPagamento` (Task 6); `formatarAgendamento`, `nomeDoTecnico`; `TIPO_SERVICO_LABELS`; `formatarEndereco` (`crud/usuarios/camposUsuario.ts`); `Modal`.
- Produces: `PaginaAdminAtendimento` (rota `/admin/atendimentos/:id`); dentro dela, o componente interno `ConteudoOs({ atendimento })` com um `<div className="pagina-admin-atendimento__blocos">` em que o último bloco é o "Descrição do problema" — a Task 8 acrescenta os blocos da OS logo depois dele.

- [ ] **Step 1: `CartaoClienteOs.tsx`**

```tsx
import { formatarEndereco } from "../../../../../crud/usuarios/camposUsuario";
import { linkWhatsApp, textoSaudacao } from "../../../../../crud/atendimentos/whatsapp";
import type { Atendimento } from "../../../../../tipos/atendimento";
import "./CartaoClienteOs.css";

/** "Ana Paula Souza" → "AS": primeira letra do primeiro e do último nome. */
function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

/** Quem é o cliente, onde é o serviço e o atalho pro WhatsApp dele (topo da OS). */
export function CartaoClienteOs({ atendimento }: { atendimento: Atendimento }) {
  const { cliente, contato } = atendimento;
  const whatsapp = linkWhatsApp(contato.telefone, textoSaudacao(atendimento));

  return (
    <section className="cartao-cliente-os" aria-label="Cliente">
      <span className="cartao-cliente-os__avatar" aria-hidden="true">
        {iniciais(cliente.nome)}
      </span>
      <div className="cartao-cliente-os__dados">
        <strong>
          {cliente.nome}
          {cliente.id === null && <span className="cartao-cliente-os__sem-cadastro"> · sem cadastro</span>}
        </strong>
        <span>{contato.telefone}</span>
        <span>{formatarEndereco(contato)}</span>
        {/* o banco guarda só os 8 dígitos; na tela vai com hífen (95900-000) */}
        {contato.cep && <span>CEP {contato.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</span>}
      </div>
      {whatsapp && (
        <a className="cartao-cliente-os__whatsapp" href={whatsapp} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      )}
    </section>
  );
}

export default CartaoClienteOs;
```

`CartaoClienteOs.css`:

```css
.cartao-cliente-os {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  min-width: 0;
}

.cartao-cliente-os__avatar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #dcdcff;
  color: var(--color-primary);
  font-weight: 600;
  font-size: var(--font-size-small);
}

.cartao-cliente-os__dados {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  overflow-wrap: anywhere;
}

.cartao-cliente-os__dados span {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

.cartao-cliente-os__dados .cartao-cliente-os__sem-cadastro {
  font-weight: 400;
}

.cartao-cliente-os__whatsapp {
  flex-shrink: 0;
  border: 1px solid #1e7a3c;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  color: #1e7a3c;
  font-weight: 600;
  font-size: var(--font-size-small);
  text-decoration: none;
}

.cartao-cliente-os__whatsapp:hover {
  background-color: #e3f5e8;
}

.cartao-cliente-os__whatsapp:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* celular: o botão do WhatsApp desce pra baixo dos dados */
@media (max-width: 599px) {
  .cartao-cliente-os {
    flex-wrap: wrap;
  }

  .cartao-cliente-os__whatsapp {
    margin-left: calc(44px + 0.85rem);
  }
}
```

- [ ] **Step 2: `GaleriaFotosOs.tsx`**

```tsx
import { useState } from "react";
import "./GaleriaFotosOs.css";

/** Fotos que o cliente mandou: a escolhida em tamanho grande e as outras em miniatura. */
export function GaleriaFotosOs({ fotos }: { fotos: string[] }) {
  const [indice, setIndice] = useState(0);

  if (fotos.length === 0) {
    return <p className="galeria-fotos-os__vazio">O cliente não mandou fotos.</p>;
  }

  const escolhida = Math.min(indice, fotos.length - 1);

  return (
    <div className="galeria-fotos-os">
      <img
        className="galeria-fotos-os__principal"
        src={fotos[escolhida]}
        alt={`Foto ${escolhida + 1} de ${fotos.length} do problema`}
      />
      {fotos.length > 1 && (
        <ul className="galeria-fotos-os__miniaturas">
          {fotos.map((foto, posicao) => (
            <li key={foto}>
              <button
                type="button"
                className={`galeria-fotos-os__miniatura${posicao === escolhida ? " galeria-fotos-os__miniatura--ativa" : ""}`}
                aria-label={`Ver a foto ${posicao + 1}`}
                aria-pressed={posicao === escolhida}
                onClick={() => setIndice(posicao)}
              >
                <img src={foto} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GaleriaFotosOs;
```

`GaleriaFotosOs.css`:

```css
.galeria-fotos-os {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.galeria-fotos-os__principal {
  width: 100%;
  max-height: 360px;
  object-fit: cover;
  border-radius: 10px;
  background-color: #f4f5f8;
}

.galeria-fotos-os__miniaturas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 0.5rem;
}

.galeria-fotos-os__miniatura {
  display: block;
  width: 100%;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  overflow: hidden;
}

.galeria-fotos-os__miniatura img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.galeria-fotos-os__miniatura--ativa {
  border-color: var(--color-primary);
}

.galeria-fotos-os__miniatura:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.galeria-fotos-os__vazio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}
```

- [ ] **Step 3: `ModalMensagemCliente.tsx`**

```tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../../../../../componentes/ui/Modal/Modal";
import { MENSAGEM_CLIENTE_MAX, validarMensagemCliente } from "../../../../../crud/atendimentos/andamento";
import "../../../lista-admin.css";
import "./ModalMensagemCliente.css";

interface ModalMensagemClienteProps {
  acao: "recusar" | "cancelar";
  idAtendimento: string;
  /** recebe a mensagem já validada */
  onEnviar: (mensagem: string) => void;
  onFechar: () => void;
}

/**
 * Janela pra recusar um pedido ou cancelar um atendimento: a mensagem é
 * obrigatória, porque é ela que avisa o cliente (no Minha conta e no WhatsApp).
 */
export function ModalMensagemCliente({ acao, idAtendimento, onEnviar, onFechar }: ModalMensagemClienteProps) {
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const recusando = acao === "recusar";

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const problema = validarMensagemCliente(mensagem);
    if (problema) {
      setErro(problema);
      return;
    }
    onEnviar(mensagem);
  }

  return (
    <Modal
      titulo={recusando ? `Recusar o pedido #${idAtendimento}` : `Cancelar o atendimento #${idAtendimento}`}
      onFechar={onFechar}
    >
      {/* noValidate: o erro vem do validarMensagemCliente, não dos balões do navegador */}
      <form className="modal-mensagem-cliente" onSubmit={enviar} noValidate>
        <label className="modal-mensagem-cliente__campo">
          Mensagem pro cliente
          <textarea
            value={mensagem}
            onChange={(e) => {
              setMensagem(e.target.value);
              setErro(null);
            }}
            maxLength={MENSAGEM_CLIENTE_MAX}
            rows={5}
            aria-invalid={Boolean(erro)}
            aria-describedby="dica-mensagem-cliente"
            placeholder={
              recusando
                ? "Ex.: Não atendemos o seu bairro nesse dia. Podemos ir na sexta às 10:00?"
                : "Ex.: O técnico teve um imprevisto. Vamos ligar pra combinar outro horário."
            }
          />
        </label>
        <div className="modal-mensagem-cliente__rodape-campo">
          <span id="dica-mensagem-cliente">O cliente vai ver esta mensagem no Minha conta.</span>
          <span>
            {mensagem.length}/{MENSAGEM_CLIENTE_MAX}
          </span>
        </div>
        {erro && (
          <p className="modal-mensagem-cliente__erro" role="alert">
            {erro}
          </p>
        )}
        <div className="modal-mensagem-cliente__acoes">
          <button type="button" className="lista-admin__botao lista-admin__botao--contorno" onClick={onFechar}>
            Voltar
          </button>
          <button type="submit" className="modal-mensagem-cliente__confirmar">
            {recusando ? "Recusar pedido" : "Cancelar atendimento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ModalMensagemCliente;
```

`ModalMensagemCliente.css`:

```css
.modal-mensagem-cliente {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-mensagem-cliente__campo {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-weight: 600;
  font-size: var(--font-size-small);
}

.modal-mensagem-cliente__campo textarea {
  font-family: inherit;
  font-size: var(--font-size-body);
  font-weight: 400;
  padding: 0.75rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  resize: vertical;
}

.modal-mensagem-cliente__campo textarea[aria-invalid="true"] {
  border-color: #c0392b;
}

.modal-mensagem-cliente__rodape-campo {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

.modal-mensagem-cliente__erro {
  margin: 0;
  color: #c0392b;
  font-weight: 600;
  font-size: var(--font-size-small);
}

.modal-mensagem-cliente__acoes {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.modal-mensagem-cliente__confirmar {
  background-color: #c0392b;
  color: var(--color-white);
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-family: inherit;
  font-weight: 600;
  font-size: var(--font-size-small);
  cursor: pointer;
}

.modal-mensagem-cliente__confirmar:hover {
  background-color: #a93226;
}

.modal-mensagem-cliente__confirmar:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Página da OS (`atendimento.tsx`)**

```tsx
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { useAtendimentos } from "../../../contexto/useAtendimentos";
import {
  acoesDoStatus,
  cancelar,
  concluir,
  confirmar,
  iniciar,
  marcarPago,
  recusar,
} from "../../../crud/atendimentos/andamento";
import { TIPO_SERVICO_LABELS } from "../../../crud/atendimentos/opcoesAtendimento";
import { formatarAgendamento, nomeDoTecnico } from "../../../crud/atendimentos/agenda";
import { formatarDataHora } from "../../../crud/atendimentos/datasAtendimento";
import { formatarReais, totalOs } from "../../../crud/atendimentos/valorOs";
import { linkWhatsApp, textoMensagemCliente } from "../../../crud/atendimentos/whatsapp";
import type { Atendimento } from "../../../tipos/atendimento";
import { SeloPagamento, SeloStatusAtendimento } from "../atendimentos/componentes/SeloStatusAtendimento/SeloStatusAtendimento";
import { CartaoClienteOs } from "./componentes/CartaoClienteOs/CartaoClienteOs";
import { GaleriaFotosOs } from "./componentes/GaleriaFotosOs/GaleriaFotosOs";
import { ModalMensagemCliente } from "./componentes/ModalMensagemCliente/ModalMensagemCliente";
import "../lista-admin.css";
import "./atendimento.css";

type AcaoDireta = "confirmar" | "iniciar" | "concluir";
type AcaoComMensagem = "recusar" | "cancelar";

// ações que mudam o status sem mensagem: texto do botão, pergunta de confirmação e aviso depois
const ACOES_DIRETAS: Record<AcaoDireta, { botao: string; pergunta: string; aviso: string; aplicar: (at: Atendimento) => Atendimento }> = {
  confirmar: {
    botao: "Confirmar visita",
    pergunta: "Confirmar a visita deste pedido?",
    aviso: "Visita confirmada.",
    aplicar: confirmar,
  },
  iniciar: {
    botao: "Iniciar atendimento",
    pergunta: "Marcar que o atendimento começou?",
    aviso: "Atendimento iniciado. Agora dá pra lançar as observações, os produtos e a mão de obra.",
    aplicar: iniciar,
  },
  concluir: {
    botao: "Marcar como concluído",
    pergunta: "Marcar o atendimento como concluído?",
    aviso: "Atendimento concluído. Falta registrar o pagamento.",
    aplicar: concluir,
  },
};

const ORDEM_ACOES_DIRETAS: AcaoDireta[] = ["confirmar", "iniciar", "concluir"];

/**
 * OS de um atendimento no painel (rota "/admin/atendimentos/:id"): dados do
 * cliente, visita, fotos e descrição, a OS (observações, produtos e valor) e os
 * botões do andamento. Se o id não existe (ex.: a página foi recarregada e os
 * pedidos em memória sumiram), mostra um aviso com o caminho de volta.
 */
export function PaginaAdminAtendimento() {
  const { id } = useParams();
  const { todosAtendimentos } = useAtendimentos();
  const atendimento = todosAtendimentos.find((item) => item.id === id) ?? null;

  if (!atendimento) {
    return (
      <>
        <NavAdmin />
        <section className="pagina-admin-atendimento">
          <Container>
            <div className="lista-admin__vazio">
              <p>Atendimento não encontrado.</p>
              <Link to="/admin/atendimentos" className="lista-admin__botao pagina-admin-atendimento__link-botao">
                Ver os atendimentos
              </Link>
            </div>
          </Container>
        </section>
      </>
    );
  }

  // key: trocar de OS pela URL começa a tela do zero (aviso, modal)
  return <ConteudoOs key={atendimento.id} atendimento={atendimento} />;
}

function ConteudoOs({ atendimento }: { atendimento: Atendimento }) {
  const { atualizarAtendimento } = useAtendimentos();
  // aviso depois de cada ação; null = sem aviso
  const [aviso, setAviso] = useState<string | null>(null);
  // qual janela de mensagem está aberta; null = nenhuma
  const [mensagemAberta, setMensagemAberta] = useState<AcaoComMensagem | null>(null);

  const acoes = acoesDoStatus(atendimento);
  const encerrado = atendimento.status === "recusado" || atendimento.status === "cancelado";
  const whatsappMensagem = atendimento.mensagemCliente
    ? linkWhatsApp(atendimento.contato.telefone, textoMensagemCliente(atendimento))
    : null;

  function fazerAcaoDireta(acao: AcaoDireta) {
    const { pergunta, aviso: textoAviso, aplicar } = ACOES_DIRETAS[acao];
    if (!window.confirm(pergunta)) return;
    atualizarAtendimento(atendimento.id, aplicar);
    setAviso(textoAviso);
  }

  function registrarPagamento() {
    const total = formatarReais(totalOs(atendimento));
    if (!window.confirm(`Registrar o pagamento de ${total}? Depois disso a OS não pode mais mudar.`)) return;
    // a hora é pega aqui fora: o transformar roda dentro do setState e precisa ser puro
    const agora = new Date();
    atualizarAtendimento(atendimento.id, (atual) => marcarPago(atual, agora));
    setAviso("Pagamento registrado. A OS está fechada.");
  }

  function enviarMensagem(mensagem: string) {
    if (!mensagemAberta) return;
    const acao = mensagemAberta;
    atualizarAtendimento(atendimento.id, (atual) =>
      acao === "recusar" ? recusar(atual, mensagem) : cancelar(atual, mensagem)
    );
    setMensagemAberta(null);
    setAviso(
      acao === "recusar"
        ? "Pedido recusado. O cliente vê a mensagem no Minha conta."
        : "Atendimento cancelado. O cliente vê a mensagem no Minha conta."
    );
  }

  return (
    <>
      <NavAdmin />

      <section className="pagina-admin-atendimento">
        <Container>
          <Link to="/admin/atendimentos" className="pagina-admin-atendimento__voltar">
            ← Atendimentos
          </Link>

          <div className="pagina-admin-atendimento__topo">
            <h1 className="pagina-admin-atendimento__titulo">#{atendimento.id}</h1>
            <SeloStatusAtendimento status={atendimento.status} />
            {atendimento.status === "concluido" && <SeloPagamento pagoEm={atendimento.pagoEm} />}
          </div>
          <p className="pagina-admin-atendimento__subtitulo">
            Pedido em {formatarDataHora(atendimento.criadoEm)}
            {atendimento.abertoNaLoja && " · aberto na loja"}
            {atendimento.pagoEm && ` · pago em ${formatarDataHora(atendimento.pagoEm)}`}
          </p>

          {/* a região fica sempre montada: o leitor de tela anuncia o texto quando ele entra */}
          <div role="status">{aviso && <p className="pagina-admin-atendimento__aviso">{aviso}</p>}</div>

          <div className="pagina-admin-atendimento__blocos">
            <CartaoClienteOs atendimento={atendimento} />

            <section className="pagina-admin-atendimento__bloco">
              <h2>Visita</h2>
              <p>{formatarAgendamento(atendimento.data, atendimento.horario, nomeDoTecnico(atendimento.tecnicoId))}</p>
              <p className="pagina-admin-atendimento__detalhe">{TIPO_SERVICO_LABELS[atendimento.tipo]}</p>
            </section>

            {encerrado && atendimento.mensagemCliente && (
              <section className="pagina-admin-atendimento__bloco pagina-admin-atendimento__bloco--mensagem">
                <h2>Mensagem enviada ao cliente</h2>
                <p className="pagina-admin-atendimento__texto">{atendimento.mensagemCliente}</p>
                {whatsappMensagem && (
                  <a
                    className="pagina-admin-atendimento__whatsapp"
                    href={whatsappMensagem}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mandar pelo WhatsApp
                  </a>
                )}
              </section>
            )}

            <section className="pagina-admin-atendimento__bloco">
              <h2>Fotos do problema</h2>
              <GaleriaFotosOs fotos={atendimento.fotos} />
            </section>

            <section className="pagina-admin-atendimento__bloco">
              <h2>Descrição do problema</h2>
              <p className="pagina-admin-atendimento__descricao">{atendimento.descricao}</p>
            </section>
          </div>

          {acoes.length > 0 && (
            <div className="pagina-admin-atendimento__acoes">
              {acoes.includes("recusar") && (
                <button
                  type="button"
                  className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--perigo"
                  onClick={() => setMensagemAberta("recusar")}
                >
                  Recusar
                </button>
              )}
              {acoes.includes("cancelar") && (
                <button
                  type="button"
                  className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--perigo"
                  onClick={() => setMensagemAberta("cancelar")}
                >
                  Cancelar atendimento
                </button>
              )}
              {ORDEM_ACOES_DIRETAS.filter((acao) => acoes.includes(acao)).map((acao) => (
                <button
                  key={acao}
                  type="button"
                  className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--principal"
                  onClick={() => fazerAcaoDireta(acao)}
                >
                  {ACOES_DIRETAS[acao].botao}
                </button>
              ))}
              {acoes.includes("marcar-pago") && (
                <button
                  type="button"
                  className="pagina-admin-atendimento__botao pagina-admin-atendimento__botao--principal"
                  onClick={registrarPagamento}
                >
                  Marcar como pago
                </button>
              )}
            </div>
          )}
        </Container>
      </section>

      {mensagemAberta && (
        <ModalMensagemCliente
          acao={mensagemAberta}
          idAtendimento={atendimento.id}
          onEnviar={enviarMensagem}
          onFechar={() => setMensagemAberta(null)}
        />
      )}
    </>
  );
}

export default PaginaAdminAtendimento;
```

- [ ] **Step 5: CSS da OS (`atendimento.css`)**

```css
.pagina-admin-atendimento {
  padding: clamp(1.5rem, 1rem + 2vw, 2.5rem) 0 var(--space-section);
}

.pagina-admin-atendimento__voltar {
  display: inline-block;
  margin-bottom: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: var(--font-size-small);
  text-decoration: none;
}

.pagina-admin-atendimento__voltar:hover {
  color: var(--color-primary);
}

.pagina-admin-atendimento__link-botao {
  display: inline-block;
  margin-top: 0.75rem;
  text-decoration: none;
}

.pagina-admin-atendimento__topo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
}

.pagina-admin-atendimento__titulo {
  margin: 0;
  font-weight: 600;
  font-size: var(--font-size-h2);
  color: var(--color-primary);
}

.pagina-admin-atendimento__subtitulo {
  margin: 0.25rem 0 1rem;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

/* aviso verde depois de cada ação */
.pagina-admin-atendimento__aviso {
  margin: 0 0 1rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background-color: #e3f5e8;
  color: #1e7a3c;
  font-weight: 600;
  font-size: var(--font-size-small);
}

/* uma coluna só, como a OS da imagem da issue; no desktop fica com largura de leitura */
.pagina-admin-atendimento__blocos {
  display: grid;
  gap: 1rem;
  max-width: 760px;
}

.pagina-admin-atendimento__bloco {
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  min-width: 0;
}

.pagina-admin-atendimento__bloco h2 {
  margin: 0 0 0.75rem;
  font-weight: 600;
  font-size: var(--font-size-body);
}

.pagina-admin-atendimento__bloco p {
  margin: 0;
}

.pagina-admin-atendimento__detalhe {
  margin-top: 0.2rem;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

.pagina-admin-atendimento__texto {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.pagina-admin-atendimento__descricao {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background-color: #f4f5f8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.pagina-admin-atendimento__bloco--mensagem {
  border-color: #f5c6c1;
  background-color: #fdf6f5;
}

.pagina-admin-atendimento__whatsapp {
  display: inline-block;
  margin-top: 0.75rem;
  border: 1px solid #1e7a3c;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  color: #1e7a3c;
  font-weight: 600;
  font-size: var(--font-size-small);
  text-decoration: none;
}

.pagina-admin-atendimento__whatsapp:hover {
  background-color: #e3f5e8;
}

/* barra de ações presa no pé da tela enquanto a OS rola, como o botão da imagem da issue */
.pagina-admin-atendimento__acoes {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
  max-width: 760px;
  margin-top: 1.5rem;
  padding: 0.75rem 0;
  border-top: 1px solid var(--color-border-soft);
  background-color: var(--color-white);
}

.pagina-admin-atendimento__botao {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.65rem 1.25rem;
  font-family: inherit;
  font-weight: 600;
  font-size: var(--font-size-small);
  cursor: pointer;
}

.pagina-admin-atendimento__botao--principal {
  background-color: #1e7a3c;
  color: var(--color-white);
}

.pagina-admin-atendimento__botao--principal:hover {
  background-color: #17602f;
}

.pagina-admin-atendimento__botao--perigo {
  background: none;
  border-color: #e3a39b;
  color: #c0392b;
}

.pagina-admin-atendimento__botao--perigo:hover {
  background-color: #fdecea;
}

.pagina-admin-atendimento__botao:focus-visible,
.pagina-admin-atendimento__whatsapp:focus-visible,
.pagina-admin-atendimento__voltar:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* celular: cada botão ocupa a largura toda */
@media (max-width: 599px) {
  .pagina-admin-atendimento__botao {
    flex: 1 1 100%;
  }
}
```

- [ ] **Step 6: Rota (`App.tsx`)**

Import:

```tsx
import { PaginaAdminAtendimento } from "./paginas/admin/atendimento/atendimento";
```

Dentro do `<Route element={<RotaAdmin />}>`, depois da rota `/admin/atendimentos`:

```tsx
                <Route path="/admin/atendimentos/:id" element={<PaginaAdminAtendimento />} />
```

- [ ] **Step 7: Verificar**

Run: `npm test --prefix frontend`, `npm run build --prefix frontend`, `npm run lint --prefix frontend` (só a linha de base).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/paginas/admin/atendimento frontend/src/App.tsx
git commit -m "feat: OS do atendimento com confirmar, recusar e cancelar com mensagem

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Observações, produtos do estoque e mão de obra na OS

**Files:**
- Create: `frontend/src/paginas/admin/atendimento/componentes/ProdutosDaOs/ProdutosDaOs.tsx`, `ProdutosDaOs.css`
- Modify: `frontend/src/paginas/admin/atendimento/atendimento.tsx`, `atendimento.css`

**Interfaces:**
- Consumes: `osEditavel`, `atualizarOs`, `CamposOs` (Task 2); `adicionarProduto`, `removerProduto`, `quantidadeNaOs`, `validarQuantidade`, `validarMaoDeObra`, `paraValorEmReais`, `maoDeObraParaTexto`, `subtotalProduto`, `totalOs`, `formatarReais` (Task 3); `useProdutos()` (`crud/produtos/useProdutos.ts`, lista em memória de `TODOS_PRODUTOS`, sem carregando/erro); `ConteudoOs` (Task 7).
- Produces: `ProdutosDaOs({ atendimento, editavel, onMudar: (campos: CamposOs) => void })`.

- [ ] **Step 1: `ProdutosDaOs.tsx`**

```tsx
import { useMemo, useState } from "react";
import { useProdutos } from "../../../../../crud/produtos/useProdutos";
import {
  adicionarProduto,
  formatarReais,
  maoDeObraParaTexto,
  paraValorEmReais,
  quantidadeNaOs,
  removerProduto,
  subtotalProduto,
  totalOs,
  validarMaoDeObra,
  validarQuantidade,
} from "../../../../../crud/atendimentos/valorOs";
import type { CamposOs } from "../../../../../crud/atendimentos/andamento";
import type { Atendimento } from "../../../../../tipos/atendimento";
import "../../../lista-admin.css";
import "./ProdutosDaOs.css";

interface ProdutosDaOsProps {
  atendimento: Atendimento;
  /** false = OS fechada (paga) ou ainda não começou: só leitura */
  editavel: boolean;
  onMudar: (campos: CamposOs) => void;
}

/**
 * Produtos da loja usados no serviço, a mão de obra e o total da OS. O estoque
 * só é conferido (não dá pra lançar mais do que tem); a baixa é do backend.
 */
export function ProdutosDaOs({ atendimento, editavel, onMudar }: ProdutosDaOsProps) {
  const { produtos } = useProdutos();
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [erroProduto, setErroProduto] = useState<string | null>(null);
  // o campo guarda o texto digitado; o valor só vai pra OS quando é um valor válido
  const [textoMaoDeObra, setTextoMaoDeObra] = useState(() => maoDeObraParaTexto(atendimento.valorMaoDeObra));
  const [erroMaoDeObra, setErroMaoDeObra] = useState<string | null>(null);

  // só os produtos ativos, em ordem alfabética
  const disponiveis = useMemo(
    () => produtos.filter((produto) => produto.ativo).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [produtos]
  );
  const usados = atendimento.produtosUsados;

  function adicionar() {
    const produto = disponiveis.find((item) => item.id === produtoId);
    if (!produto) {
      setErroProduto("Escolha um produto.");
      return;
    }
    const qtd = Number(quantidade);
    const problema = validarQuantidade(qtd, produto.estoque, quantidadeNaOs(usados, produto.id));
    if (problema) {
      setErroProduto(problema);
      return;
    }
    onMudar({ produtosUsados: adicionarProduto(usados, produto, qtd) });
    setProdutoId("");
    setQuantidade("1");
    setErroProduto(null);
  }

  function mudarMaoDeObra(texto: string) {
    setTextoMaoDeObra(texto);
    const problema = validarMaoDeObra(texto);
    setErroMaoDeObra(problema);
    if (!problema) onMudar({ valorMaoDeObra: paraValorEmReais(texto) });
  }

  return (
    <div className="produtos-os">
      {usados.length === 0 ? (
        <p className="produtos-os__vazio">Nenhum produto lançado.</p>
      ) : (
        <ul className="produtos-os__lista">
          {usados.map((usado) => (
            <li key={usado.produtoId} className="produtos-os__item">
              <span className="produtos-os__nome">{usado.nome}</span>
              <span className="produtos-os__conta">
                {usado.quantidade} × {formatarReais(usado.precoUnitario)}
              </span>
              <strong className="produtos-os__subtotal">{formatarReais(subtotalProduto(usado))}</strong>
              {editavel && (
                <button
                  type="button"
                  className="produtos-os__remover"
                  onClick={() => onMudar({ produtosUsados: removerProduto(usados, usado.produtoId) })}
                  aria-label={`Remover ${usado.nome}`}
                >
                  Remover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editavel && (
        <div className="produtos-os__adicionar">
          <label className="produtos-os__campo produtos-os__campo--produto">
            Produto
            <select
              value={produtoId}
              onChange={(e) => {
                setProdutoId(e.target.value);
                setErroProduto(null);
              }}
            >
              <option value="">Escolha um produto</option>
              {disponiveis.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome} · {formatarReais(produto.preco)} · {produto.estoque} em estoque
                </option>
              ))}
            </select>
          </label>
          <label className="produtos-os__campo produtos-os__campo--quantidade">
            Quantidade
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={quantidade}
              onChange={(e) => {
                setQuantidade(e.target.value);
                setErroProduto(null);
              }}
            />
          </label>
          <button type="button" className="lista-admin__botao produtos-os__botao-adicionar" onClick={adicionar}>
            Adicionar
          </button>
          {erroProduto && (
            <p className="produtos-os__erro" role="alert">
              {erroProduto}
            </p>
          )}
        </div>
      )}

      <div className="produtos-os__mao-de-obra">
        {editavel ? (
          <label className="produtos-os__campo">
            Mão de obra (R$)
            <input
              type="text"
              inputMode="decimal"
              placeholder="150,00"
              value={textoMaoDeObra}
              onChange={(e) => mudarMaoDeObra(e.target.value)}
              aria-invalid={Boolean(erroMaoDeObra)}
            />
          </label>
        ) : (
          <p>
            Mão de obra:{" "}
            {atendimento.valorMaoDeObra === null ? "não informada" : formatarReais(atendimento.valorMaoDeObra)}
          </p>
        )}
        {erroMaoDeObra && (
          <p className="produtos-os__erro" role="alert">
            {erroMaoDeObra}
          </p>
        )}
      </div>

      <p className="produtos-os__total">
        Total <strong>{formatarReais(totalOs(atendimento))}</strong>
      </p>
    </div>
  );
}

export default ProdutosDaOs;
```

- [ ] **Step 2: `ProdutosDaOs.css`**

```css
.produtos-os {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.produtos-os__vazio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

.produtos-os__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--color-border-soft);
}

/* nome | quantidade × preço | subtotal | remover */
.produtos-os__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--color-border-soft);
  font-size: var(--font-size-small);
}

.produtos-os__nome {
  min-width: 0;
  overflow-wrap: anywhere;
}

.produtos-os__conta {
  color: var(--color-text-muted);
  white-space: nowrap;
}

.produtos-os__subtotal {
  white-space: nowrap;
}

.produtos-os__remover {
  background: none;
  border: none;
  padding: 0.25rem;
  color: #c0392b;
  font-family: inherit;
  font-weight: 600;
  font-size: var(--font-size-small);
  cursor: pointer;
}

.produtos-os__remover:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* produto (largo) | quantidade (estreita) | Adicionar; o erro desce pra linha de baixo */
.produtos-os__adicionar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 6.5rem auto;
  align-items: end;
  gap: 0.75rem;
}

.produtos-os__campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  font-weight: 600;
  font-size: var(--font-size-small);
}

.produtos-os__campo select,
.produtos-os__campo input {
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  font-size: var(--font-size-small);
  font-weight: 400;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  background-color: var(--color-white);
}

.produtos-os__campo input[aria-invalid="true"] {
  border-color: #c0392b;
}

.produtos-os__botao-adicionar {
  padding: 0.6rem 1.1rem;
}

.produtos-os__erro {
  grid-column: 1 / -1;
  margin: 0;
  color: #c0392b;
  font-weight: 600;
  font-size: var(--font-size-small);
}

.produtos-os__mao-de-obra {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 14rem;
}

.produtos-os__mao-de-obra p {
  margin: 0;
}

.produtos-os__total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 0;
  padding-top: 0.75rem;
  border-top: 2px solid var(--color-border-soft);
  font-weight: 600;
}

.produtos-os__total strong {
  font-size: var(--font-size-h2);
  color: var(--color-primary);
}

/* celular: produto numa linha; quantidade e Adicionar embaixo; subtotal e remover descem */
@media (max-width: 599px) {
  .produtos-os__adicionar {
    grid-template-columns: 6.5rem 1fr;
  }

  .produtos-os__campo--produto {
    grid-column: 1 / -1;
  }

  .produtos-os__item {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .produtos-os__mao-de-obra {
    max-width: none;
  }
}
```

- [ ] **Step 3: Ligar na OS (`atendimento.tsx`)**

Troque o import do andamento por:

```tsx
import {
  acoesDoStatus,
  atualizarOs,
  cancelar,
  concluir,
  confirmar,
  iniciar,
  marcarPago,
  osEditavel,
  recusar,
} from "../../../crud/atendimentos/andamento";
import type { CamposOs } from "../../../crud/atendimentos/andamento";
```

E acrescente:

```tsx
import { ProdutosDaOs } from "./componentes/ProdutosDaOs/ProdutosDaOs";
```

No `ConteudoOs`, depois de `const whatsappMensagem = …;`, acrescente:

```tsx
  // a OS (observações, produtos, mão de obra) aparece a partir do início do atendimento
  const mostrarOs = atendimento.status === "em-andamento" || atendimento.status === "concluido";
  const editavel = osEditavel(atendimento);

  function mudarOs(campos: CamposOs) {
    atualizarAtendimento(atendimento.id, (atual) => atualizarOs(atual, campos));
  }
```

E, dentro de `<div className="pagina-admin-atendimento__blocos">`, logo depois do bloco "Descrição do problema" (antes do `</div>` que fecha os blocos), acrescente:

```tsx
            {mostrarOs && (
              <section className="pagina-admin-atendimento__bloco">
                <h2 id="titulo-observacoes">Observações do técnico</h2>
                {editavel ? (
                  <textarea
                    className="pagina-admin-atendimento__observacoes"
                    aria-labelledby="titulo-observacoes"
                    placeholder="Descreva o diagnóstico, as peças e os reparos feitos na visita."
                    value={atendimento.observacoesTecnico}
                    onChange={(e) => mudarOs({ observacoesTecnico: e.target.value })}
                    maxLength={2000}
                    rows={5}
                  />
                ) : (
                  <p className="pagina-admin-atendimento__texto">
                    {atendimento.observacoesTecnico || "Sem observações."}
                  </p>
                )}
              </section>
            )}

            {mostrarOs && (
              <section className="pagina-admin-atendimento__bloco">
                <h2>Produtos e valor</h2>
                <ProdutosDaOs atendimento={atendimento} editavel={editavel} onMudar={mudarOs} />
              </section>
            )}
```

- [ ] **Step 4: CSS do campo de observações (`atendimento.css`)**

Depois do bloco `.pagina-admin-atendimento__descricao { … }`, acrescente:

```css
.pagina-admin-atendimento__observacoes {
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  font-size: var(--font-size-body);
  padding: 0.75rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  resize: vertical;
}
```

- [ ] **Step 5: Verificar**

Run: `npm test --prefix frontend`, `npm run build --prefix frontend`, `npm run lint --prefix frontend` (só a linha de base).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/paginas/admin/atendimento
git commit -m "feat: observações, produtos do estoque e mão de obra na OS

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Passada no navegador (controller, depois da Task 8)

Backend na 3000 e frontend na 5173 (`preview_start` com `backend-dev` e `frontend-dev`); conta de cliente de teste e conta admin de teste (credenciais no scratchpad; só localhost). Sem recarregar a página entre os passos (tudo é memória).

1. Como cliente, pedir um atendimento. Sair, entrar como admin: o `/admin` mostra "1 aguardando confirmação" no card "Atendimentos"; `/admin/atendimentos` abre no chip "Aguardando (n)" com o pedido.
2. Abrir a OS: cartão do cliente, link do WhatsApp com `wa.me/55…` e a saudação, visita, fotos, descrição; botões "Recusar" e "Confirmar visita".
3. Recusar com "curta" → erro; com uma mensagem de verdade → selo "Recusado", quadro da mensagem com "Mandar pelo WhatsApp", aviso. No `/solicitar-atendimento`, aquele horário volta a ficar livre.
4. Entrar como o cliente: Minha conta › Atendimentos mostra "Recusado" e "Mensagem da Bruxel: …".
5. Outro pedido: confirmar → iniciar → aparecem "Observações do técnico" e "Produtos e valor"; Peneira (estoque 0) → "Produto sem estoque."; Hidrofloc 10 + 3 → "Só tem 12 em estoque."; Hidrofloc 2 + mão de obra "150,00" → total "R$ 193,00"; mão de obra "abc" → erro e o total não muda; concluir → "Marcar como pago" → selo "Pago" e tudo só leitura. O cliente vê "Total: R$ 193,00".
6. Chips com contagens, filtros de atendente/pagamento/ordem, busca por bairro; cards e lista compacta; `/admin/atendimentos/AT-9999-9999` → "Atendimento não encontrado.".
7. 375px: lista e OS sem rolagem horizontal; barra de ações com botões em largura total.
8. Console só com os 403 já conhecidos do perfil.
