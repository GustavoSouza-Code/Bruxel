# Solicitar atendimento (cliente) — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O cliente logado pede uma visita técnica pela página `/solicitar-atendimento` (pílula no cabeçalho) e acompanha o status na aba "Atendimentos" do `/perfil`.

**Architecture:** Toda a regra fica em funções puras em `frontend/src/crud/atendimentos/`, testadas com Vitest: validação, datas, contato e criação do registro. Um contexto em memória (`ProvedorAtendimentos`, no molde do `ContextoAutenticacao`) guarda a lista e é compartilhado pela página do formulário e pela aba do perfil. Ainda não há backend pra isso; os pontos de troca pela API estão marcados com `TODO`.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Vite 8, Vitest 5, CSS puro (BEM em português)

**Spec:** `docs/superpowers/specs/2026-10-12-solicitar-atendimento-design.md`

## Global Constraints

- Nenhuma dependência nova (sem Testing Library). Os testes automáticos cobrem só as funções puras; a interface é conferida no navegador.
- Branch `feat/solicitar-atendimento`. **Nunca** commitar nem dar push na `eduardo`, que é a branch do PR #57, ainda aberto.
- Lint: não pode surgir erro novo. Linha de base: 1 erro que já existe (`react-refresh/only-export-components` em `src/contexto/ContextoCarrinho.tsx`).
- Fast Refresh: arquivo `.tsx` de componente exporta só componentes (exportar tipo pode). Por isso contexto e hook ficam em arquivos separados, como `ContextoAutenticacao.tsx` + `useAutenticacao.ts`.
- React Hooks v7 (lint): nada de `setState` direto no corpo de `useEffect`, nada de ler ou escrever `ref.current` durante a renderização, e nada de função impura (`new Date()`, `Math.random()`) direto no render. Pra isso, usar o inicializador do `useState`.
- Identificadores, comentários e textos em pt-BR, no estilo do projeto: comentários curtos que explicam o porquê, pensando num estudante lendo.
- CSS: classes BEM `bloco__elemento--modificador`. As cores vêm de `src/estilos/tokens.css`. Os hex literais permitidos são só os que o `perfil.css` já usa: `#f7f7fa`, `#e2effa`, `#e3f5e8`, `#1e7a3c`, `#f1f1f4`, `#c0392b`, além de `#fdf3d7`/`#8a6100` (amarelo do status "aguardando") e `#8ddcff` (o azul-claro do cabeçalho).
- A pílula do cabeçalho segue o estilo "B · sólida clara": fundo `var(--color-store-button)`, texto `var(--color-primary)`.
- O layout da página segue o "A · coluna única": blocos numerados com fundo `#f7f7fa`.
- Todo commit termina com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Os comandos rodam a partir da raiz do repositório (`Bruxel/`).
- O Vite roda no OneDrive: se o dev server servir arquivo antigo, dar `touch` no arquivo editado.
- Diferença em relação ao spec: as funções de data e de contato ficam em arquivos próprios (`datasAtendimento.ts`, `contatoAtendimento.ts`) em vez de juntas no `validarSolicitacao.ts`, pra cada arquivo ter uma responsabilidade só.

## Review Focus

1. **Perfil que não carrega ou não tem endereço.** Na main de hoje um cliente recebe 403 no GET /users/:id, até o PR #55 entrar. Nesse caso o bloco 5 tem que abrir com os campos vazios, sem mensagem de erro, e o envio tem que funcionar digitando. Coberto pelo teste "contato vazio tem erros, então o formulário abre os campos" (Task 1) e pela checagem no navegador (Task 5).
2. **Pedido feito tarde da noite.** "Amanhã" tem que ser o do relógio local; às 23h30 no Brasil, o UTC já está no dia seguinte. Coberto pelo teste "usa o dia do relógio local" (Task 1).
3. **Telefone colado com máscara ou com +55**, como "(51) 99999-0000" ou "+55 51 99999-0000": tem que ser aceito. Coberto pelo teste "telefone aceita máscara e o +55 colado" (Task 1).
4. **Duplo clique em "Enviar solicitação".** Tem que criar um atendimento só. Garantido pelo `enviadoRef` (Task 5) e conferido no navegador (Task 8).
5. **Remover uma foto e escolher o mesmo arquivo de novo.** A foto tem que voltar. Uma 6ª foto tem que ser recusada sem perder as 5. Garantido pelo `input.value = ""` (Task 6), pelo teste "não passa do máximo de fotos" (Task 2) e pela checagem no navegador (Task 8).

---

## Mapa de arquivos

| Arquivo | Responsabilidade | Task |
|---|---|---|
| `frontend/src/tipos/atendimento.ts` | Tipos do atendimento | 1 |
| `frontend/src/crud/atendimentos/opcoesAtendimento.ts` | Rótulos de tipo, período e status | 1 |
| `frontend/src/crud/atendimentos/datasAtendimento.ts` (+ `.test.ts`) | Data mínima e formatação de datas | 1 |
| `frontend/src/crud/atendimentos/contatoAtendimento.ts` (+ `.test.ts`) | Contato vindo do perfil + validação do contato | 1 |
| `frontend/src/crud/atendimentos/validarSolicitacao.ts` (+ `.test.ts`) | Validação do formulário e das fotos | 2 |
| `frontend/src/crud/atendimentos/novoAtendimento.ts` (+ `.test.ts`) | Monta o registro novo (id, status, data) | 3 |
| `frontend/src/dados/atendimentos.ts` | 2 atendimentos de exemplo | 3 |
| `frontend/src/contexto/useAtendimentos.ts` | Objeto do contexto + hook `useAtendimentos` | 3 |
| `frontend/src/contexto/ContextoAtendimentos.tsx` | `ProvedorAtendimentos` | 3 |
| `frontend/src/App.tsx` | Provedor (T3) e rota (T5) | 3, 5 |
| `frontend/src/componentes/ui/Icones/Icones.tsx` | Ícones novos | 4, 5, 6 |
| `frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/*` | Aba "Atendimentos" | 4 |
| `frontend/src/paginas/portal/perfil/perfil.tsx` + `perfil.css` | Aba nova + recado do `state` | 4 |
| `frontend/src/crud/usuarios/camposUsuario.ts` | Tipo `ParteEndereco` (reaproveitado no contato) | 5 |
| `frontend/src/paginas/portal/solicitar-atendimento/*` | Página + `SeletorTipoServico` + `SeletorQuando` | 5 |
| `frontend/src/paginas/portal/solicitar-atendimento/componentes/CampoFotos/*` | Upload das fotos | 6 |
| `frontend/src/componentes/layout/Cabecalho/Cabecalho.tsx` + `.css` | Pílula "Solicitar atendimento" | 7 |
| `README.md` | Rota nova na tabela | 5 |

---

### Task 1: Tipos, rótulos, datas e contato

**Files:**
- Create: `frontend/src/tipos/atendimento.ts`
- Create: `frontend/src/crud/atendimentos/opcoesAtendimento.ts`
- Create: `frontend/src/crud/atendimentos/datasAtendimento.ts`
- Create: `frontend/src/crud/atendimentos/contatoAtendimento.ts`
- Test: `frontend/src/crud/atendimentos/datasAtendimento.test.ts`
- Test: `frontend/src/crud/atendimentos/contatoAtendimento.test.ts`

**Interfaces:**
- Consumes: `Usuario` de `frontend/src/tipos/usuario.ts`
- Produces:
  - `TipoServico`, `PeriodoAtendimento`, `StatusAtendimento`, `ContatoAtendimento`, `Atendimento`, `DadosSolicitacao` (tipos)
  - `TIPO_SERVICO_LABELS: Record<TipoServico, string>`, `TIPOS_SERVICO: TipoServico[]`, `PERIODO_LABELS: Record<PeriodoAtendimento, string>`, `PERIODOS: PeriodoAtendimento[]`, `STATUS_LABELS: Record<StatusAtendimento, string>`
  - `dataMinima(hoje: Date): string`, `formatarData(dataIso: string): string`, `formatarPreferencia(dataIso: string, periodo: PeriodoAtendimento): string`
  - `CONTATO_VAZIO: ContatoAtendimento`, `contatoDoUsuario(usuario: Usuario | null): ContatoAtendimento`, `validarContato(contato: ContatoAtendimento): ErrosContato`, `type ErrosContato = Partial<Record<keyof ContatoAtendimento, string>>`

- [ ] **Step 1: Criar os tipos (sem lógica, não precisam de teste)**

`frontend/src/tipos/atendimento.ts`:

```ts
/**
 * Atendimento (visita técnica) que o cliente pede pela tela /solicitar-atendimento.
 * Ainda não existe no backend: os nomes seguem o que o front precisa e devem ser
 * alinhados com a tabela `appointments` quando a API ficar pronta.
 */

/** Tipo de serviço escolhido no bloco 1 do formulário. */
export type TipoServico = "limpeza" | "bomba-filtro" | "vazamento" | "instalacao" | "outro";

/** Turno preferido pra visita. */
export type PeriodoAtendimento = "manha" | "tarde";

/** Situação do atendimento; também vira o sufixo da classe CSS da etiqueta de status. */
export type StatusAtendimento = "aguardando" | "agendado" | "em-andamento" | "concluido" | "cancelado";

/** Onde fazer o serviço e como falar com o cliente; os nomes são os mesmos de `Usuario`. */
export interface ContatoAtendimento {
  telefone: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  /** sigla com 2 letras, ex.: "RS" */
  estado: string;
  /** só dígitos (8 caracteres) */
  cep: string;
}

export interface Atendimento {
  /** ex.: "AT-2026-0003" */
  id: string;
  tipo: TipoServico;
  descricao: string;
  /** URLs das fotos pra exibir (por enquanto blob:, criadas no navegador) */
  fotos: string[];
  /** "aaaa-mm-dd", o mesmo formato do <input type="date"> */
  dataPreferida: string;
  periodo: PeriodoAtendimento;
  contato: ContatoAtendimento;
  status: StatusAtendimento;
  /** data e hora do envio, em ISO */
  criadoEm: string;
}

/** O que o formulário envia; id, status e criadoEm quem define é o contexto. */
export type DadosSolicitacao = Omit<Atendimento, "id" | "status" | "criadoEm">;
```

`frontend/src/crud/atendimentos/opcoesAtendimento.ts`:

```ts
import type { PeriodoAtendimento, StatusAtendimento, TipoServico } from "../../tipos/atendimento";

// texto de cada tipo de serviço; a ordem das chaves é a ordem dos cards no formulário
export const TIPO_SERVICO_LABELS: Record<TipoServico, string> = {
  limpeza: "Limpeza e manutenção",
  "bomba-filtro": "Bomba e filtro",
  vazamento: "Vazamento",
  instalacao: "Instalação",
  outro: "Outro",
};

export const TIPOS_SERVICO = Object.keys(TIPO_SERVICO_LABELS) as TipoServico[];

export const PERIODO_LABELS: Record<PeriodoAtendimento, string> = {
  manha: "Manhã",
  tarde: "Tarde",
};

export const PERIODOS = Object.keys(PERIODO_LABELS) as PeriodoAtendimento[];

// texto da etiqueta de cada status na aba "Atendimentos" do /perfil
export const STATUS_LABELS: Record<StatusAtendimento, string> = {
  aguardando: "Aguardando confirmação",
  agendado: "Agendado",
  "em-andamento": "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};
```

- [ ] **Step 2: Escrever os testes de datas (falhando)**

`frontend/src/crud/atendimentos/datasAtendimento.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dataMinima, formatarData, formatarPreferencia } from "./datasAtendimento";

describe("dataMinima", () => {
  it("é o dia seguinte, no formato do input de data", () => {
    // no Date o mês começa em 0: 9 = outubro
    expect(dataMinima(new Date(2026, 9, 12))).toBe("2026-10-13");
  });

  it("vira o mês e o ano", () => {
    expect(dataMinima(new Date(2026, 11, 31))).toBe("2027-01-01");
  });

  it("usa o dia do relógio local, mesmo tarde da noite", () => {
    // às 23h30 no Brasil já é o dia seguinte em UTC; o mínimo continua sendo "amanhã" daqui
    expect(dataMinima(new Date(2026, 9, 12, 23, 30))).toBe("2026-10-13");
  });
});

describe("formatarData", () => {
  it("troca aaaa-mm-dd por dd/mm/aaaa", () => {
    expect(formatarData("2026-10-20")).toBe("20/10/2026");
  });
});

describe("formatarPreferencia", () => {
  it("junta a data e o período, em minúsculas", () => {
    expect(formatarPreferencia("2026-10-20", "manha")).toBe("20/10/2026, manhã");
    expect(formatarPreferencia("2026-10-20", "tarde")).toBe("20/10/2026, tarde");
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test --prefix frontend -- datasAtendimento`
Expected: FAIL com `Failed to resolve import "./datasAtendimento"`

- [ ] **Step 4: Implementar `datasAtendimento.ts`**

`frontend/src/crud/atendimentos/datasAtendimento.ts`:

```ts
import type { PeriodoAtendimento } from "../../tipos/atendimento";
import { PERIODO_LABELS } from "./opcoesAtendimento";

// "aaaa-mm-dd" no fuso do navegador (o toISOString usaria UTC e, à noite no Brasil,
// já daria o dia seguinte)
function paraDataIso(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** Primeiro dia que dá pra escolher (amanhã), no formato do <input type="date">. */
export function dataMinima(hoje: Date) {
  // o Date ajusta sozinho quando o dia passa do fim do mês (31/12 + 1 → 01/01)
  return paraDataIso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1));
}

/** "2026-10-20" → "20/10/2026". */
export function formatarData(dataIso: string) {
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Data e turno preferidos num texto só: "20/10/2026, manhã". */
export function formatarPreferencia(dataIso: string, periodo: PeriodoAtendimento) {
  return `${formatarData(dataIso)}, ${PERIODO_LABELS[periodo].toLowerCase()}`;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test --prefix frontend -- datasAtendimento`
Expected: PASS (5 testes)

- [ ] **Step 6: Escrever os testes de contato (falhando)**

`frontend/src/crud/atendimentos/contatoAtendimento.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Usuario } from "../../tipos/usuario";
import type { ContatoAtendimento } from "../../tipos/atendimento";
import { CONTATO_VAZIO, contatoDoUsuario, validarContato } from "./contatoAtendimento";

const CONTATO_OK: ContatoAtendimento = {
  telefone: "51999990000",
  rua: "Rua Bento Gonçalves",
  numero: "850",
  bairro: "Centro",
  cidade: "Lajeado",
  estado: "RS",
  cep: "95900000",
};

const contato = (mudancas: Partial<ContatoAtendimento>) => ({ ...CONTATO_OK, ...mudancas });

describe("contatoDoUsuario", () => {
  it("sem perfil (carregando ou deu erro) começa vazio", () => {
    expect(contatoDoUsuario(null)).toEqual(CONTATO_VAZIO);
  });

  it("copia telefone e endereço do perfil, trocando null por texto vazio", () => {
    const usuario: Usuario = {
      id: "u1",
      nome: "Ana Souza",
      email: "ana@exemplo.com",
      cpf: "12345678901",
      perfil: "CLIENTE",
      telefone: "51999990000",
      rua: "Rua Bento Gonçalves",
      numero: "850",
      bairro: null,
      cidade: "Lajeado",
      estado: "RS",
      cep: null,
    };
    expect(contatoDoUsuario(usuario)).toEqual({
      telefone: "51999990000",
      rua: "Rua Bento Gonçalves",
      numero: "850",
      bairro: "",
      cidade: "Lajeado",
      estado: "RS",
      cep: "",
    });
  });
});

describe("validarContato", () => {
  it("contato completo não tem erros", () => {
    expect(validarContato(CONTATO_OK)).toEqual({});
  });

  it("contato vazio tem erros, então o formulário abre os campos", () => {
    expect(Object.keys(validarContato(CONTATO_VAZIO)).sort()).toEqual([
      "cidade",
      "numero",
      "rua",
      "telefone",
    ]);
  });

  it("telefone aceita máscara e o +55 colado", () => {
    expect(validarContato(contato({ telefone: "(51) 99999-0000" }))).toEqual({});
    expect(validarContato(contato({ telefone: "(51) 3714-0000" }))).toEqual({});
    expect(validarContato(contato({ telefone: "+55 51 99999-0000" }))).toEqual({});
  });

  it("telefone sem DDD é recusado", () => {
    expect(validarContato(contato({ telefone: "99999-0000" })).telefone).toBe(
      "Informe um telefone com DDD (10 ou 11 dígitos)."
    );
  });

  it("exige rua, número e cidade; bairro é opcional", () => {
    expect(validarContato(contato({ rua: " ", numero: "", cidade: "", bairro: "" }))).toEqual({
      rua: "Informe a rua.",
      numero: "Informe o número.",
      cidade: "Informe a cidade.",
    });
  });

  it("UF e CEP são opcionais, mas se preenchidos precisam do formato certo", () => {
    expect(validarContato(contato({ estado: "", cep: "" }))).toEqual({});
    expect(validarContato(contato({ cep: "95900-000" }))).toEqual({});
    expect(validarContato(contato({ estado: "R", cep: "9590" }))).toEqual({
      estado: "Use a sigla do estado, com 2 letras (ex.: RS).",
      cep: "O CEP tem 8 dígitos.",
    });
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npm test --prefix frontend -- contatoAtendimento`
Expected: FAIL com `Failed to resolve import "./contatoAtendimento"`

- [ ] **Step 8: Implementar `contatoAtendimento.ts`**

`frontend/src/crud/atendimentos/contatoAtendimento.ts`:

```ts
import type { ContatoAtendimento } from "../../tipos/atendimento";
import type { Usuario } from "../../tipos/usuario";

/** Uma mensagem por campo do contato com problema; objeto vazio = contato ok. */
export type ErrosContato = Partial<Record<keyof ContatoAtendimento, string>>;

export const CONTATO_VAZIO: ContatoAtendimento = {
  telefone: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

/**
 * Contato inicial do formulário a partir do perfil. Sem perfil (ainda carregando
 * ou a busca falhou) começa vazio; coluna vazia no banco (null) vira "".
 */
export function contatoDoUsuario(usuario: Usuario | null): ContatoAtendimento {
  if (!usuario) return CONTATO_VAZIO;
  return {
    telefone: usuario.telefone ?? "",
    rua: usuario.rua ?? "",
    numero: usuario.numero ?? "",
    bairro: usuario.bairro ?? "",
    cidade: usuario.cidade ?? "",
    estado: usuario.estado ?? "",
    cep: usuario.cep ?? "",
  };
}

const somenteDigitos = (texto: string) => texto.replace(/\D/g, "");

// dígitos do telefone sem o código do país: "+55 51 99999-0000" colado vira "51999990000"
function digitosTelefone(telefone: string) {
  const digitos = somenteDigitos(telefone);
  const comCodigoPais = (digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55");
  return comCodigoPais ? digitos.slice(2) : digitos;
}

/**
 * Confere o mínimo pra visita: telefone com DDD, rua, número e cidade. Bairro,
 * UF e CEP são opcionais, mas UF e CEP preenchidos precisam do formato certo.
 */
export function validarContato(contato: ContatoAtendimento): ErrosContato {
  const erros: ErrosContato = {};

  const quantidadeDigitos = digitosTelefone(contato.telefone).length;
  if (quantidadeDigitos < 10 || quantidadeDigitos > 11) {
    erros.telefone = "Informe um telefone com DDD (10 ou 11 dígitos).";
  }
  if (!contato.rua.trim()) erros.rua = "Informe a rua.";
  if (!contato.numero.trim()) erros.numero = "Informe o número.";
  if (!contato.cidade.trim()) erros.cidade = "Informe a cidade.";
  if (contato.estado && !/^[A-Za-z]{2}$/.test(contato.estado)) {
    erros.estado = "Use a sigla do estado, com 2 letras (ex.: RS).";
  }
  if (contato.cep && somenteDigitos(contato.cep).length !== 8) {
    erros.cep = "O CEP tem 8 dígitos.";
  }

  return erros;
}
```

- [ ] **Step 9: Rodar e ver passar**

Run: `npm test --prefix frontend -- contatoAtendimento`
Expected: PASS (8 testes)

- [ ] **Step 10: Commit**

```bash
git add frontend/src/tipos/atendimento.ts frontend/src/crud/atendimentos/
git commit -m "feat: tipos, rótulos, datas e contato do atendimento (com Vitest)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Validação do formulário e das fotos

**Files:**
- Create: `frontend/src/crud/atendimentos/validarSolicitacao.ts`
- Test: `frontend/src/crud/atendimentos/validarSolicitacao.test.ts`

**Interfaces:**
- Consumes: `dataMinima` (Task 1), `validarContato` e `ErrosContato` (Task 1), tipos de `tipos/atendimento.ts`
- Produces:
  - `DESCRICAO_MIN = 10`, `DESCRICAO_MAX = 1000`, `MAX_FOTOS = 5`, `MAX_TAMANHO_FOTO = 5 * 1024 * 1024`
  - `interface RascunhoSolicitacao { tipo: TipoServico | null; descricao: string; dataPreferida: string; periodo: PeriodoAtendimento | null; contato: ContatoAtendimento }`
  - `type ErrosSolicitacao = ErrosContato & Partial<Record<"tipo" | "descricao" | "dataPreferida" | "periodo", string>>`
  - `validarSolicitacao(rascunho: RascunhoSolicitacao, hoje: Date): ErrosSolicitacao`
  - `interface ResultadoFotos { aceitas: File[]; erro: string | null }` e `validarFotos(quantidadeAtual: number, arquivos: File[]): ResultadoFotos`

- [ ] **Step 1: Escrever os testes (falhando)**

`frontend/src/crud/atendimentos/validarSolicitacao.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DESCRICAO_MAX,
  MAX_FOTOS,
  MAX_TAMANHO_FOTO,
  validarFotos,
  validarSolicitacao,
} from "./validarSolicitacao";
import type { RascunhoSolicitacao } from "./validarSolicitacao";

// 12/10/2026 (no Date o mês começa em 0)
const HOJE = new Date(2026, 9, 12);

function rascunho(mudancas: Partial<RascunhoSolicitacao> = {}): RascunhoSolicitacao {
  return {
    tipo: "bomba-filtro",
    descricao: "A bomba não desliga e está vazando pelo filtro.",
    dataPreferida: "2026-10-20",
    periodo: "manha",
    contato: {
      telefone: "51999990000",
      rua: "Rua Bento Gonçalves",
      numero: "850",
      bairro: "Centro",
      cidade: "Lajeado",
      estado: "RS",
      cep: "95900000",
    },
    ...mudancas,
  };
}

describe("validarSolicitacao", () => {
  it("rascunho completo pode ser enviado", () => {
    expect(validarSolicitacao(rascunho(), HOJE)).toEqual({});
  });

  it("exige o tipo de serviço", () => {
    expect(validarSolicitacao(rascunho({ tipo: null }), HOJE).tipo).toBe("Escolha o tipo de serviço.");
  });

  it("descrição precisa de 10 caracteres, sem contar os espaços das pontas", () => {
    expect(validarSolicitacao(rascunho({ descricao: "    vaza     " }), HOJE).descricao).toBe(
      "Descreva o problema com pelo menos 10 caracteres."
    );
    expect(validarSolicitacao(rascunho({ descricao: "1234567890" }), HOJE).descricao).toBeUndefined();
  });

  it("descrição acima do limite é recusada", () => {
    expect(
      validarSolicitacao(rascunho({ descricao: "a".repeat(DESCRICAO_MAX + 1) }), HOJE).descricao
    ).toBe("A descrição pode ter até 1000 caracteres.");
  });

  it("exige a data", () => {
    expect(validarSolicitacao(rascunho({ dataPreferida: "" }), HOJE).dataPreferida).toBe(
      "Escolha uma data."
    );
  });

  it("só aceita data a partir de amanhã", () => {
    const erro = "Escolha uma data a partir de amanhã.";
    expect(validarSolicitacao(rascunho({ dataPreferida: "2026-10-12" }), HOJE).dataPreferida).toBe(erro);
    expect(validarSolicitacao(rascunho({ dataPreferida: "2026-09-30" }), HOJE).dataPreferida).toBe(erro);
    expect(
      validarSolicitacao(rascunho({ dataPreferida: "2026-10-13" }), HOJE).dataPreferida
    ).toBeUndefined();
  });

  it("exige o período", () => {
    expect(validarSolicitacao(rascunho({ periodo: null }), HOJE).periodo).toBe("Escolha manhã ou tarde.");
  });

  it("inclui os erros do contato", () => {
    const semRua = rascunho({ contato: { ...rascunho().contato, rua: "" } });
    expect(validarSolicitacao(semRua, HOJE)).toEqual({ rua: "Informe a rua." });
  });
});

describe("validarFotos", () => {
  const imagem = (nome = "foto.png") => new File(["x"], nome, { type: "image/png" });

  it("aceita imagens dentro do limite", () => {
    const fotos = [imagem("a.png"), imagem("b.png")];
    expect(validarFotos(0, fotos)).toEqual({ aceitas: fotos, erro: null });
  });

  it("recusa o que não é imagem", () => {
    const pdf = new File(["x"], "orcamento.pdf", { type: "application/pdf" });
    expect(validarFotos(0, [pdf])).toEqual({ aceitas: [], erro: "Só dá pra enviar imagens." });
  });

  it("recusa foto acima de 5 MB", () => {
    const grande = new File([new Uint8Array(MAX_TAMANHO_FOTO + 1)], "grande.png", { type: "image/png" });
    expect(validarFotos(0, [grande])).toEqual({ aceitas: [], erro: "Cada foto pode ter até 5 MB." });
  });

  it("não passa do máximo de fotos, contando as que já estão no formulário", () => {
    const primeira = imagem("a.png");
    const segunda = imagem("b.png");
    expect(validarFotos(MAX_FOTOS - 1, [primeira, segunda])).toEqual({
      aceitas: [primeira],
      erro: "Você pode enviar até 5 fotos.",
    });
  });

  it("junta os motivos quando há mais de um problema", () => {
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    expect(validarFotos(MAX_FOTOS, [pdf, imagem()]).erro).toBe(
      "Só dá pra enviar imagens. Você pode enviar até 5 fotos."
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test --prefix frontend -- validarSolicitacao`
Expected: FAIL com `Failed to resolve import "./validarSolicitacao"`

- [ ] **Step 3: Implementar `validarSolicitacao.ts`**

`frontend/src/crud/atendimentos/validarSolicitacao.ts`:

```ts
import type { ContatoAtendimento, PeriodoAtendimento, TipoServico } from "../../tipos/atendimento";
import { validarContato } from "./contatoAtendimento";
import type { ErrosContato } from "./contatoAtendimento";
import { dataMinima } from "./datasAtendimento";

/** Limites da descrição do problema (o textarea usa o máximo no maxLength). */
export const DESCRICAO_MIN = 10;
export const DESCRICAO_MAX = 1000;

/** Limites das fotos do problema. */
export const MAX_FOTOS = 5;
export const MAX_TAMANHO_FOTO = 5 * 1024 * 1024; // 5 MB, em bytes

/**
 * O formulário enquanto a pessoa preenche: tipo e período começam sem
 * escolha (null) e a data começa vazia ("").
 */
export interface RascunhoSolicitacao {
  tipo: TipoServico | null;
  descricao: string;
  dataPreferida: string;
  periodo: PeriodoAtendimento | null;
  contato: ContatoAtendimento;
}

/** Uma mensagem por campo com problema; a página mostra cada uma no bloco do campo. */
export type ErrosSolicitacao = ErrosContato &
  Partial<Record<"tipo" | "descricao" | "dataPreferida" | "periodo", string>>;

/**
 * Confere o rascunho e devolve os erros por campo. Objeto vazio = pode enviar.
 * `hoje` vem de fora pra os testes não dependerem do relógio.
 */
export function validarSolicitacao(rascunho: RascunhoSolicitacao, hoje: Date): ErrosSolicitacao {
  const erros: ErrosSolicitacao = { ...validarContato(rascunho.contato) };

  if (!rascunho.tipo) erros.tipo = "Escolha o tipo de serviço.";

  const descricao = rascunho.descricao.trim();
  if (descricao.length < DESCRICAO_MIN) {
    erros.descricao = `Descreva o problema com pelo menos ${DESCRICAO_MIN} caracteres.`;
  } else if (descricao.length > DESCRICAO_MAX) {
    erros.descricao = `A descrição pode ter até ${DESCRICAO_MAX} caracteres.`;
  }

  if (!rascunho.dataPreferida) {
    erros.dataPreferida = "Escolha uma data.";
  } else if (rascunho.dataPreferida < dataMinima(hoje)) {
    // datas "aaaa-mm-dd" em ordem alfabética também estão em ordem de calendário
    erros.dataPreferida = "Escolha uma data a partir de amanhã.";
  }

  if (!rascunho.periodo) erros.periodo = "Escolha manhã ou tarde.";

  return erros;
}

/** Resultado do validarFotos: as fotos que entram e, se alguma ficou de fora, o porquê. */
export interface ResultadoFotos {
  aceitas: File[];
  erro: string | null;
}

/**
 * Filtra os arquivos escolhidos no input: só imagens, de até 5 MB, sem passar
 * de MAX_FOTOS contando as que já estão no formulário (`quantidadeAtual`).
 */
export function validarFotos(quantidadeAtual: number, arquivos: File[]): ResultadoFotos {
  const motivos: string[] = [];

  const imagens = arquivos.filter((arquivo) => arquivo.type.startsWith("image/"));
  if (imagens.length < arquivos.length) motivos.push("Só dá pra enviar imagens.");

  const leves = imagens.filter((arquivo) => arquivo.size <= MAX_TAMANHO_FOTO);
  if (leves.length < imagens.length) motivos.push("Cada foto pode ter até 5 MB.");

  const vagas = Math.max(0, MAX_FOTOS - quantidadeAtual);
  const aceitas = leves.slice(0, vagas);
  if (aceitas.length < leves.length) motivos.push(`Você pode enviar até ${MAX_FOTOS} fotos.`);

  return { aceitas, erro: motivos.length > 0 ? motivos.join(" ") : null };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test --prefix frontend -- validarSolicitacao`
Expected: PASS (13 testes)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/crud/atendimentos/validarSolicitacao.ts frontend/src/crud/atendimentos/validarSolicitacao.test.ts
git commit -m "feat: validação da solicitação de atendimento e das fotos (com Vitest)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Contexto de atendimentos (em memória)

**Files:**
- Create: `frontend/src/crud/atendimentos/novoAtendimento.ts`
- Test: `frontend/src/crud/atendimentos/novoAtendimento.test.ts`
- Create: `frontend/src/dados/atendimentos.ts`
- Create: `frontend/src/contexto/useAtendimentos.ts`
- Create: `frontend/src/contexto/ContextoAtendimentos.tsx`
- Modify: `frontend/src/App.tsx` (imports e provedores, linhas 1–31 e 53–55)

**Interfaces:**
- Consumes: `Atendimento`, `DadosSolicitacao` (Task 1)
- Produces:
  - `novoAtendimento(dados: DadosSolicitacao, quantidadeAtual: number, agora: Date): Atendimento`
  - `ATENDIMENTOS_EXEMPLO: Atendimento[]`
  - `interface ValorContextoAtendimentos { atendimentos: Atendimento[]; solicitarAtendimento: (dados: DadosSolicitacao) => void }`
  - `ContextoAtendimentos` (objeto do contexto), `useAtendimentos(): ValorContextoAtendimentos`
  - `ProvedorAtendimentos({ children })`, já montado no `App.tsx`

- [ ] **Step 1: Escrever o teste do `novoAtendimento` (falhando)**

`frontend/src/crud/atendimentos/novoAtendimento.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { DadosSolicitacao } from "../../tipos/atendimento";
import { novoAtendimento } from "./novoAtendimento";

const DADOS: DadosSolicitacao = {
  tipo: "vazamento",
  descricao: "Está vazando água perto da escada.",
  fotos: ["blob:foto-1"],
  dataPreferida: "2026-10-20",
  periodo: "tarde",
  contato: {
    telefone: "51999990000",
    rua: "Rua Bento Gonçalves",
    numero: "850",
    bairro: "Centro",
    cidade: "Lajeado",
    estado: "RS",
    cep: "95900000",
  },
};

const AGORA = new Date(2026, 9, 12, 14, 35);

describe("novoAtendimento", () => {
  it("numera em sequência, com o ano do envio", () => {
    expect(novoAtendimento(DADOS, 0, AGORA).id).toBe("AT-2026-0001");
    expect(novoAtendimento(DADOS, 2, AGORA).id).toBe("AT-2026-0003");
  });

  it("começa aguardando confirmação, com a data do envio e os dados do formulário", () => {
    expect(novoAtendimento(DADOS, 2, AGORA)).toEqual({
      ...DADOS,
      id: "AT-2026-0003",
      status: "aguardando",
      criadoEm: AGORA.toISOString(),
    });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test --prefix frontend -- novoAtendimento`
Expected: FAIL com `Failed to resolve import "./novoAtendimento"`

- [ ] **Step 3: Implementar `novoAtendimento.ts`**

`frontend/src/crud/atendimentos/novoAtendimento.ts`:

```ts
import type { Atendimento, DadosSolicitacao } from "../../tipos/atendimento";

/**
 * Monta o atendimento que o contexto guarda a partir do que o formulário enviou:
 * número em sequência com o ano (AT-2026-0003), status inicial "aguardando" e
 * a data do envio.
 * TODO: com a API, o id e o criadoEm vêm do backend.
 */
export function novoAtendimento(
  dados: DadosSolicitacao,
  quantidadeAtual: number,
  agora: Date
): Atendimento {
  const sequencia = String(quantidadeAtual + 1).padStart(4, "0");
  return {
    ...dados,
    id: `AT-${agora.getFullYear()}-${sequencia}`,
    status: "aguardando",
    criadoEm: agora.toISOString(),
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test --prefix frontend -- novoAtendimento`
Expected: PASS (2 testes)

- [ ] **Step 5: Criar os exemplos, o hook e o provedor**

`frontend/src/dados/atendimentos.ts`:

```ts
import type { Atendimento } from "../tipos/atendimento";

/**
 * Atendimentos de exemplo, do mais novo pro mais antigo, pra a aba
 * "Atendimentos" do /perfil não abrir vazia.
 * TODO: trocar pelo GET de appointments do próprio cliente quando o backend tiver a rota.
 */
export const ATENDIMENTOS_EXEMPLO: Atendimento[] = [
  {
    id: "AT-2026-0002",
    tipo: "bomba-filtro",
    descricao: "A bomba faz um barulho alto quando liga e o filtro está perdendo pressão.",
    fotos: [],
    dataPreferida: "2026-10-16",
    periodo: "manha",
    contato: {
      telefone: "51999990000",
      rua: "Rua Bento Gonçalves",
      numero: "850",
      bairro: "Centro",
      cidade: "Lajeado",
      estado: "RS",
      cep: "95900000",
    },
    status: "agendado",
    criadoEm: "2026-10-08T14:35:00.000Z",
  },
  {
    id: "AT-2026-0001",
    tipo: "limpeza",
    descricao: "Limpeza completa antes do verão: a água está turva e com folhas no fundo.",
    fotos: [],
    dataPreferida: "2026-09-15",
    periodo: "tarde",
    contato: {
      telefone: "51999990000",
      rua: "Rua Bento Gonçalves",
      numero: "850",
      bairro: "Centro",
      cidade: "Lajeado",
      estado: "RS",
      cep: "95900000",
    },
    status: "concluido",
    criadoEm: "2026-09-10T10:00:00.000Z",
  },
];
```

`frontend/src/contexto/useAtendimentos.ts`:

```ts
import { createContext, useContext } from "react";
import type { Atendimento, DadosSolicitacao } from "../tipos/atendimento";

/** Tudo que os componentes conseguem ler e usar dos atendimentos via useAtendimentos(). */
export interface ValorContextoAtendimentos {
  /** atendimentos do cliente, do mais novo pro mais antigo */
  atendimentos: Atendimento[];
  /** guarda uma solicitação nova no topo da lista, com status "aguardando" */
  solicitarAtendimento: (dados: DadosSolicitacao) => void;
}

// começa como null pra useAtendimentos() detectar o uso fora do ProvedorAtendimentos.
// Fica neste arquivo (e não no ContextoAtendimentos.tsx) pelo mesmo motivo do
// useAutenticacao.ts: o Fast Refresh do Vite pede que arquivos de componente exportem só componentes
export const ContextoAtendimentos = createContext<ValorContextoAtendimentos | null>(null);

/**
 * Atalho pra acessar os atendimentos: `const { atendimentos, solicitarAtendimento } = useAtendimentos()`.
 * Lança erro se for usado fora do ProvedorAtendimentos.
 */
export function useAtendimentos() {
  const contexto = useContext(ContextoAtendimentos);
  if (!contexto) {
    throw new Error("useAtendimentos deve ser usado dentro de um ProvedorAtendimentos");
  }
  return contexto;
}
```

`frontend/src/contexto/ContextoAtendimentos.tsx`:

```tsx
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ATENDIMENTOS_EXEMPLO } from "../dados/atendimentos";
import { novoAtendimento } from "../crud/atendimentos/novoAtendimento";
import { ContextoAtendimentos } from "./useAtendimentos";
import type { ValorContextoAtendimentos } from "./useAtendimentos";
import type { Atendimento, DadosSolicitacao } from "../tipos/atendimento";

/**
 * Guarda os atendimentos que o cliente pediu e disponibiliza pro formulário
 * (/solicitar-atendimento) e pra aba "Atendimentos" do /perfil. Precisa envolver
 * o app — ver App.tsx.
 *
 * Vive só na memória (recarregar a página volta aos exemplos) e ainda não separa
 * por usuário. TODO: trocar pelas rotas de appointments quando o backend tiver.
 */
export function ProvedorAtendimentos({ children }: { children: ReactNode }) {
  // a função inicial copia os exemplos, pra não alterar o ATENDIMENTOS_EXEMPLO
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(() => [...ATENDIMENTOS_EXEMPLO]);

  const solicitarAtendimento = useCallback((dados: DadosSolicitacao) => {
    // o mais novo entra no topo da lista
    setAtendimentos((atuais) => [novoAtendimento(dados, atuais.length, new Date()), ...atuais]);
  }, []);

  // useMemo: só cria um objeto novo quando a lista muda, pra não re-renderizar à toa quem usa o contexto
  const valor = useMemo<ValorContextoAtendimentos>(
    () => ({ atendimentos, solicitarAtendimento }),
    [atendimentos, solicitarAtendimento]
  );

  return <ContextoAtendimentos.Provider value={valor}>{children}</ContextoAtendimentos.Provider>;
}

export default ProvedorAtendimentos;
```

- [ ] **Step 6: Montar o provedor no `App.tsx`**

Em `frontend/src/App.tsx`, adicione o import logo depois do `ProvedorCarrinho`:

```tsx
import { ProvedorCarrinho } from "./contexto/ContextoCarrinho";
import { ProvedorAtendimentos } from "./contexto/ContextoAtendimentos";
```

Troque o comentário da função e os provedores:

```tsx
/**
 * Raiz da aplicação: define as rotas do site.
 *
 * Os provedores envolvem tudo pra que a sessão (ProvedorAutenticacao), o
 * carrinho (ProvedorCarrinho) e os atendimentos pedidos (ProvedorAtendimentos)
 * sejam estados únicos, compartilhados por todas as páginas e pelo Cabecalho.
 * Como ficam acima das rotas, não se perdem ao navegar entre elas.
 */
function App() {
  return (
    <ProvedorAutenticacao>
      <ProvedorCarrinho>
        <ProvedorAtendimentos>
          <BrowserRouter>
```

e feche na ordem certa no fim:

```tsx
          </BrowserRouter>
        </ProvedorAtendimentos>
      </ProvedorCarrinho>
    </ProvedorAutenticacao>
```

(o conteúdo do `<Routes>` não muda; só ganha um nível a mais de indentação)

- [ ] **Step 7: Conferir testes, tipos e lint**

Run: `npm test --prefix frontend`
Expected: PASS (todos os arquivos, incluindo os 4 novos)

Run: `npm run build --prefix frontend`
Expected: termina sem erro de TypeScript

Run: `npm run lint --prefix frontend`
Expected: só o erro que já existia em `ContextoCarrinho.tsx` (1 problem)

- [ ] **Step 8: Commit**

```bash
git add frontend/src/crud/atendimentos/novoAtendimento.ts frontend/src/crud/atendimentos/novoAtendimento.test.ts frontend/src/dados/atendimentos.ts frontend/src/contexto/useAtendimentos.ts frontend/src/contexto/ContextoAtendimentos.tsx frontend/src/App.tsx
git commit -m "feat: contexto de atendimentos em memória com exemplos" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Aba "Atendimentos" no Minha conta

**Files:**
- Modify: `frontend/src/componentes/ui/Icones/Icones.tsx` (comentário da linha 23 + ícone novo no fim)
- Create: `frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx`
- Create: `frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.css`
- Modify: `frontend/src/paginas/portal/perfil/perfil.tsx` (linhas 2, 11–15, 45–49, 73–86, 307–341)
- Modify: `frontend/src/paginas/portal/perfil/perfil.css` (bloco `@media (max-width: 768px)`)

**Interfaces:**
- Consumes: `useAtendimentos()` (Task 3); `STATUS_LABELS`, `TIPO_SERVICO_LABELS` (Task 1); `formatarPreferencia` (Task 1)
- Produces:
  - `IconeFerramenta()` (também usado na Task 5 e na Task 7)
  - `AbaAtendimentos({ mensagem }: { mensagem: string | null })`
  - O `/perfil` passa a aceitar `location.state = { aba?: string; mensagem?: string }`. A Task 5 navega com `{ aba: "atendimentos", mensagem }`.

- [ ] **Step 1: Ícone de ferramenta**

Em `frontend/src/componentes/ui/Icones/Icones.tsx`, troque o comentário `/** Ícones de traço usados nas listas do painel admin. */` por:

```tsx
/** Ícones de traço usados no painel admin e no portal (atendimento). */
```

e adicione no fim do arquivo:

```tsx
/** Chave inglesa: serviço técnico (pílula "Solicitar atendimento" e tipo "Instalação"). */
export function IconeFerramenta() {
  return (
    <Icone>
      <path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5" />
    </Icone>
  );
}
```

- [ ] **Step 2: Componente da aba**

`frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx`:

```tsx
import { Link } from "react-router-dom";
import { useAtendimentos } from "../../../../../contexto/useAtendimentos";
import { STATUS_LABELS, TIPO_SERVICO_LABELS } from "../../../../../crud/atendimentos/opcoesAtendimento";
import { formatarPreferencia } from "../../../../../crud/atendimentos/datasAtendimento";
import { IconeFerramenta } from "../../../../../componentes/ui/Icones/Icones";
import "./AbaAtendimentos.css";

interface AbaAtendimentosProps {
  /** aviso de sucesso que o formulário manda pelo state do navigate; null = sem aviso */
  mensagem: string | null;
}

/**
 * Aba "Atendimentos" do /perfil: os atendimentos que o cliente pediu, do mais
 * novo pro mais antigo, com o status de cada um, e o atalho pro formulário.
 * Usa as classes de card do perfil.css, porque só aparece dentro do /perfil.
 */
export function AbaAtendimentos({ mensagem }: AbaAtendimentosProps) {
  const { atendimentos } = useAtendimentos();

  return (
    <>
      <div className="pagina-perfil__cabecalho-conteudo">
        <h2>Atendimentos</h2>
        <Link to="/solicitar-atendimento" className="aba-atendimentos__solicitar">
          <IconeFerramenta />
          Solicitar atendimento
        </Link>
      </div>

      {mensagem && (
        <p className="aba-atendimentos__aviso" role="status">
          {mensagem}
        </p>
      )}

      {atendimentos.length === 0 ? (
        <p className="pagina-perfil__vazio">
          Você ainda não solicitou nenhum atendimento.{" "}
          <Link to="/solicitar-atendimento">Solicite o primeiro.</Link>
        </p>
      ) : (
        <ul className="aba-atendimentos__lista">
          {atendimentos.map((atendimento) => {
            const quantidadeFotos = atendimento.fotos.length;
            return (
              <li key={atendimento.id} className="pagina-perfil__card aba-atendimentos__item">
                <div className="aba-atendimentos__principal">
                  <strong>
                    #{atendimento.id} · {TIPO_SERVICO_LABELS[atendimento.tipo]}
                  </strong>
                  <span>
                    Preferência: {formatarPreferencia(atendimento.dataPreferida, atendimento.periodo)}
                  </span>
                  <span>
                    Enviado em {new Date(atendimento.criadoEm).toLocaleDateString("pt-BR")}
                    {quantidadeFotos > 0 &&
                      ` · ${quantidadeFotos} ${quantidadeFotos === 1 ? "foto" : "fotos"}`}
                  </span>
                </div>
                {/* o sufixo da classe é o próprio status (ver AbaAtendimentos.css) */}
                <span
                  className={`aba-atendimentos__status aba-atendimentos__status--${atendimento.status}`}
                >
                  {STATUS_LABELS[atendimento.status]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default AbaAtendimentos;
```

`frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.css`:

```css
/* atalho pro formulário, no mesmo lilás da pílula do cabeçalho */
.aba-atendimentos__solicitar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-store-button);
  color: var(--color-primary);
  border-radius: 999px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  font-size: var(--font-size-small);
  text-decoration: none;
  white-space: nowrap;
}

.aba-atendimentos__solicitar:hover {
  background-color: var(--color-white);
}

/* aviso verde que aparece depois de enviar uma solicitação */
.aba-atendimentos__aviso {
  margin: 0 0 1rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background-color: #e3f5e8;
  color: #1e7a3c;
  font-weight: 600;
  font-size: var(--font-size-small);
}

.aba-atendimentos__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.aba-atendimentos__item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.aba-atendimentos__principal {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.aba-atendimentos__principal span {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

.aba-atendimentos__status {
  border-radius: 999px;
  padding: 0.2rem 0.75rem;
  font-size: var(--font-size-small);
  font-weight: 600;
  white-space: nowrap;
}

/* cores por status (o sufixo da classe é o valor de StatusAtendimento) */
.aba-atendimentos__status--aguardando {
  background-color: #fdf3d7;
  color: #8a6100;
}

.aba-atendimentos__status--agendado {
  background-color: #e2effa;
  color: var(--color-accent);
}

.aba-atendimentos__status--em-andamento {
  background-color: var(--color-store-button);
  color: var(--color-primary);
}

.aba-atendimentos__status--concluido {
  background-color: #e3f5e8;
  color: #1e7a3c;
}

.aba-atendimentos__status--cancelado {
  background-color: #f1f1f4;
  color: var(--color-text-muted);
}

/* celular: os dados ocupam a linha toda e o status desce pra baixo */
@media (max-width: 768px) {
  .aba-atendimentos__item {
    flex-wrap: wrap;
  }

  .aba-atendimentos__principal {
    flex-basis: 100%;
  }
}
```

- [ ] **Step 3: Ligar a aba no `perfil.tsx`**

Em `frontend/src/paginas/portal/perfil/perfil.tsx`:

1. Linha 2: `import { Link, useLocation, useNavigate } from "react-router-dom";`
2. Depois do `import { usePerfil } from "./usePerfil";`, adicione:
   ```tsx
   import { AbaAtendimentos } from "./componentes/AbaAtendimentos/AbaAtendimentos";
   ```
3. O tipo das abas:
   ```tsx
   /** Abas do menu lateral da conta. */
   type ProfileSection = "perfil" | "enderecos" | "compras" | "atendimentos";
   ```
4. A lista `SECTIONS` ganha a quarta aba:
   ```tsx
   const SECTIONS: { id: ProfileSection; label: string }[] = [
     { id: "perfil", label: "Informações do perfil" },
     { id: "enderecos", label: "Endereços" },
     { id: "compras", label: "Compras" },
     { id: "atendimentos", label: "Atendimentos" },
   ];
   ```
5. No comentário do `PaginaPerfil`, troque "com três abas — dados do perfil e endereços (os dois vindos do banco e editáveis) e histórico de compras." por:
   ```
    * com quatro abas — dados do perfil e endereços (os dois vindos do banco e
    * editáveis), histórico de compras e os atendimentos pedidos.
   ```
6. Troque a linha do `activeSection` por:
   ```tsx
     // recado do /solicitar-atendimento (state do navigate): aba pra abrir e aviso de sucesso
     const recado = useLocation().state as { aba?: string; mensagem?: string } | null;
     // só aceita uma aba que existe; qualquer outra coisa abre "Informações do perfil"
     const abaDoRecado = SECTIONS.find((section) => section.id === recado?.aba)?.id;
     // aba selecionada no menu lateral
     const [activeSection, setActiveSection] = useState<ProfileSection>(abaDoRecado ?? "perfil");
   ```
7. Logo depois do bloco `{activeSection === "compras" && (...)}`, antes do `</div>` do `pagina-perfil__conteudo`:
   ```tsx
                 {activeSection === "atendimentos" && (
                   <AbaAtendimentos mensagem={recado?.mensagem ?? null} />
                 )}
   ```

Em `frontend/src/paginas/portal/perfil/perfil.css`, dentro do `@media (max-width: 768px)`, logo depois da regra `.pagina-perfil__layout`:

```css
  /* título + botão (Editar, Solicitar atendimento) quebram linha se não couberem */
  .pagina-perfil__cabecalho-conteudo {
    flex-wrap: wrap;
  }
```

- [ ] **Step 4: Conferir tipos e lint**

Run: `npm run build --prefix frontend`
Expected: sem erro

Run: `npm run lint --prefix frontend`
Expected: só o erro que já existia (1 problem)

- [ ] **Step 5: Conferir no navegador**

1. Abra o Browser pane com `preview_start` `backend-dev` e depois `preview_start` `frontend-dev` (porta 5173).
2. Entre com uma conta de cliente. Crie uma em `/criar-conta` no localhost, com dados de teste gerados na hora, ou peça pro Eduardo entrar no pane.
3. Vá em `/perfil` e clique em "Atendimentos". Devem aparecer 2 cards:
   - "#AT-2026-0002 · Bomba e filtro", com a etiqueta azul "Agendado" e "Preferência: 16/10/2026, manhã";
   - "#AT-2026-0001 · Limpeza e manutenção", com a etiqueta verde "Concluído".
4. Rode no console: `history.replaceState({ usr: { aba: "atendimentos", mensagem: "Teste" }, key: "x", idx: 0 }, "")` e recarregue a página. Ela deve abrir direto na aba "Atendimentos", com o aviso verde "Teste". O React Router guarda o `state` em `history.state.usr`.
5. Em 375px (`resize_window` `mobile`), o título e a pílula não podem estourar a largura. Depois, volte com `preset: "desktop"`.
6. `read_console_messages` com `onlyErrors`: nenhum erro.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/componentes/ui/Icones/Icones.tsx frontend/src/paginas/portal/perfil/
git commit -m "feat: aba Atendimentos no Minha conta com status de cada pedido" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Página `/solicitar-atendimento` (sem fotos ainda)

**Files:**
- Modify: `frontend/src/crud/usuarios/camposUsuario.ts` (tipo `ParteEndereco`, linhas 7–15 e 39–47)
- Modify: `frontend/src/componentes/ui/Icones/Icones.tsx` (4 ícones novos no fim)
- Create: `frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorTipoServico/SeletorTipoServico.tsx` + `.css`
- Create: `frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorQuando/SeletorQuando.tsx` + `.css`
- Create: `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx` + `.css`
- Modify: `frontend/src/App.tsx` (import + rota)
- Modify: `README.md` (tabela "Portal público")

**Interfaces:**
- Consumes: tudo das Tasks 1–3; `usePerfil()` de `paginas/portal/perfil/usePerfil.ts` (`{ dados: Usuario | null, carregando: boolean }`); `CAMPOS_ENDERECO`, `formatarEndereco` de `crud/usuarios/camposUsuario.ts`; `IconeFerramenta` (Task 4)
- Produces:
  - `type ParteEndereco = "rua" | "numero" | "bairro" | "cidade" | "estado" | "cep"` (o `CAMPOS_ENDERECO[i].campo` passa a ter esse tipo)
  - `SeletorTipoServico({ valor: TipoServico | null; onChange: (tipo: TipoServico) => void })`
  - `SeletorQuando({ data: string; periodo: PeriodoAtendimento | null; dataMinima: string; onChangeData: (data: string) => void; onChangePeriodo: (periodo: PeriodoAtendimento) => void })`
  - `PaginaSolicitarAtendimento()`, na rota `/solicitar-atendimento` dentro do `RotaLogado`
  - Ao enviar: `navigate("/perfil", { state: { aba: "atendimentos", mensagem } })`. Na Task 6 entram as fotos, no bloco 3.

- [ ] **Step 1: `ParteEndereco` no `camposUsuario.ts`**

Em `frontend/src/crud/usuarios/camposUsuario.ts`, logo depois do `CampoEditavelUsuario`:

```ts
/** Partes do endereço: cada uma é uma coluna da tabela users (e um campo do ContatoAtendimento). */
export type ParteEndereco = "rua" | "numero" | "bairro" | "cidade" | "estado" | "cep";
```

Na interface `CampoEndereco`, troque `campo: CampoEditavelUsuario;` por `campo: ParteEndereco;`.

Troque a assinatura do `formatarEndereco`. Agora ela aceita qualquer objeto com as partes do endereço, como o `Usuario` ou o `ContatoAtendimento`:

```ts
export function formatarEndereco(endereco: Pick<Usuario, Exclude<ParteEndereco, "cep">>) {
  const logradouro = [endereco.rua, endereco.numero].filter(Boolean).join(", ");
  const cidadeUf = [endereco.cidade, endereco.estado].filter(Boolean).join(" - ");
  return [logradouro, endereco.bairro, cidadeUf].filter(Boolean).join(" - ");
}
```

(Na linha de comentário acima dela, troque "Monta o endereço num texto só" por "Monta o endereço (do usuário ou de um atendimento) num texto só".)

Run: `npm run build --prefix frontend`
Expected: sem erro. O `perfil.tsx` e o `FormularioEdicaoUsuario.tsx` continuam compilando, porque `ParteEndereco` cabe dentro de `CampoEditavelUsuario`.

- [ ] **Step 2: Ícones dos tipos de serviço**

No fim de `frontend/src/componentes/ui/Icones/Icones.tsx` (os traços vêm do Tabler Icons, licença MIT):

```tsx
/** Brilhos: limpeza e manutenção. */
export function IconeLimpeza() {
  return (
    <Icone>
      <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
    </Icone>
  );
}

/** Funil: bomba e filtro da piscina (não confundir com o IconeFiltros das listas). */
export function IconeFiltroPiscina() {
  return (
    <Icone>
      <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z" />
    </Icone>
  );
}

/** Gota: vazamento. */
export function IconeGota() {
  return (
    <Icone>
      <path d="M7.502 19.423c2.602 2.105 6.395 2.105 8.996 0c2.602 -2.105 3.262 -5.708 1.566 -8.546l-4.89 -7.26c-.42 -.625 -1.287 -.803 -1.936 -.397a1.376 1.376 0 0 0 -.41 .397l-4.893 7.26c-1.695 2.838 -1.035 6.441 1.567 8.546z" />
    </Icone>
  );
}

/** Três pontos: outro tipo de serviço. */
export function IconeMaisOpcoes() {
  return (
    <Icone>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </Icone>
  );
}
```

- [ ] **Step 3: `SeletorTipoServico`**

`frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorTipoServico/SeletorTipoServico.tsx`:

```tsx
import type { ComponentType } from "react";
import type { TipoServico } from "../../../../../tipos/atendimento";
import { TIPOS_SERVICO, TIPO_SERVICO_LABELS } from "../../../../../crud/atendimentos/opcoesAtendimento";
import {
  IconeFerramenta,
  IconeFiltroPiscina,
  IconeGota,
  IconeLimpeza,
  IconeMaisOpcoes,
} from "../../../../../componentes/ui/Icones/Icones";
import "./SeletorTipoServico.css";

// ícone desenhado em cada card
const ICONES: Record<TipoServico, ComponentType> = {
  limpeza: IconeLimpeza,
  "bomba-filtro": IconeFiltroPiscina,
  vazamento: IconeGota,
  instalacao: IconeFerramenta,
  outro: IconeMaisOpcoes,
};

interface SeletorTipoServicoProps {
  valor: TipoServico | null;
  onChange: (tipo: TipoServico) => void;
}

/**
 * Bloco 1 do formulário: um card por tipo de serviço. Por baixo de cada card
 * há um radio, escondido só visualmente: dá pra escolher com Tab + setas e o
 * leitor de tela anuncia como um grupo de opções.
 */
export function SeletorTipoServico({ valor, onChange }: SeletorTipoServicoProps) {
  return (
    <div className="seletor-tipo">
      {TIPOS_SERVICO.map((tipo) => {
        const Icone = ICONES[tipo];
        const ativo = valor === tipo;
        return (
          <label key={tipo} className={`seletor-tipo__card${ativo ? " seletor-tipo__card--ativo" : ""}`}>
            <input
              type="radio"
              name="tipo-servico"
              value={tipo}
              checked={ativo}
              onChange={() => onChange(tipo)}
              className="seletor-tipo__radio"
            />
            <Icone />
            {TIPO_SERVICO_LABELS[tipo]}
          </label>
        );
      })}
    </div>
  );
}

export default SeletorTipoServico;
```

`frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorTipoServico/SeletorTipoServico.css`:

```css
/* quantas colunas couberem: 5 no computador, 2 no celular */
.seletor-tipo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.75rem;
}

.seletor-tipo__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 96px;
  padding: 1rem 0.75rem;
  background-color: var(--color-white);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  color: var(--color-primary);
  font-weight: 600;
  font-size: var(--font-size-small);
  text-align: center;
  cursor: pointer;
}

/* o svg do Icones.tsx tem 18px; aqui o ícone é o destaque do card */
.seletor-tipo__card svg {
  width: 28px;
  height: 28px;
}

.seletor-tipo__card:hover {
  border-color: var(--color-accent);
}

/* selecionado: borda azul mais grossa (box-shadow, pra o card não mudar de tamanho) */
.seletor-tipo__card--ativo {
  border-color: var(--color-accent);
  box-shadow: inset 0 0 0 1px var(--color-accent);
  background-color: #e2effa;
}

/* foco do teclado no radio escondido aparece no card */
.seletor-tipo__card:has(.seletor-tipo__radio:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* o radio continua existindo (teclado e leitor de tela), só não aparece */
.seletor-tipo__radio {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
  pointer-events: none;
}
```

- [ ] **Step 4: `SeletorQuando`**

`frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorQuando/SeletorQuando.tsx`:

```tsx
import type { PeriodoAtendimento } from "../../../../../tipos/atendimento";
import { PERIODOS, PERIODO_LABELS } from "../../../../../crud/atendimentos/opcoesAtendimento";
import "./SeletorQuando.css";

interface SeletorQuandoProps {
  /** "aaaa-mm-dd"; "" = ainda não escolheu */
  data: string;
  periodo: PeriodoAtendimento | null;
  /** primeiro dia aceito ("aaaa-mm-dd"); vai no min do calendário */
  dataMinima: string;
  onChangeData: (data: string) => void;
  onChangePeriodo: (periodo: PeriodoAtendimento) => void;
}

/**
 * Bloco "Quando você prefere?": data + turno. Fica num componente separado de
 * propósito: no futuro vira a escolha do piscineiro e de um horário livre na
 * agenda dele, sem mexer no resto do formulário.
 */
export function SeletorQuando({
  data,
  periodo,
  dataMinima,
  onChangeData,
  onChangePeriodo,
}: SeletorQuandoProps) {
  return (
    <div className="seletor-quando">
      <label className="seletor-quando__data">
        Data
        <input type="date" value={data} min={dataMinima} onChange={(e) => onChangeData(e.target.value)} />
      </label>

      <div className="seletor-quando__periodos" role="radiogroup" aria-label="Período">
        {PERIODOS.map((opcao) => {
          const ativo = periodo === opcao;
          return (
            <label
              key={opcao}
              className={`seletor-quando__periodo${ativo ? " seletor-quando__periodo--ativo" : ""}`}
            >
              <input
                type="radio"
                name="periodo"
                value={opcao}
                checked={ativo}
                onChange={() => onChangePeriodo(opcao)}
                className="seletor-quando__radio"
              />
              {PERIODO_LABELS[opcao]}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default SeletorQuando;
```

`frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorQuando/SeletorQuando.css`:

```css
.seletor-quando {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem 1.5rem;
}

.seletor-quando__data {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-weight: 600;
  font-size: var(--font-size-small);
}

.seletor-quando__data input {
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-family: inherit;
  font-size: var(--font-size-body);
  background-color: var(--color-white);
}

.seletor-quando__data input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.seletor-quando__periodos {
  display: flex;
  gap: 0.5rem;
}

/* cada turno é uma pílula; por baixo é um radio, escondido só visualmente */
.seletor-quando__periodo {
  position: relative;
  border: 1px solid var(--color-primary);
  border-radius: 999px;
  padding: 0.7rem 1.4rem;
  background-color: var(--color-white);
  color: var(--color-primary);
  font-weight: 600;
  font-size: var(--font-size-small);
  cursor: pointer;
}

.seletor-quando__periodo--ativo {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.seletor-quando__periodo:has(.seletor-quando__radio:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.seletor-quando__radio {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
  pointer-events: none;
}
```

- [ ] **Step 5: A página**

`frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx`:

```tsx
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { useAtendimentos } from "../../../contexto/useAtendimentos";
import { CAMPOS_ENDERECO, formatarEndereco } from "../../../crud/usuarios/camposUsuario";
import { contatoDoUsuario, validarContato } from "../../../crud/atendimentos/contatoAtendimento";
import { dataMinima } from "../../../crud/atendimentos/datasAtendimento";
import { DESCRICAO_MAX, validarSolicitacao } from "../../../crud/atendimentos/validarSolicitacao";
import type { ErrosSolicitacao, RascunhoSolicitacao } from "../../../crud/atendimentos/validarSolicitacao";
import type { ContatoAtendimento } from "../../../tipos/atendimento";
import { usePerfil } from "../perfil/usePerfil";
import { SeletorTipoServico } from "./componentes/SeletorTipoServico/SeletorTipoServico";
import { SeletorQuando } from "./componentes/SeletorQuando/SeletorQuando";
import "./solicitar-atendimento.css";

/** O rascunho sem o contato: o contato é calculado à parte, a partir do perfil. */
type CamposRascunho = Omit<RascunhoSolicitacao, "contato">;

const RASCUNHO_INICIAL: CamposRascunho = { tipo: null, descricao: "", dataPreferida: "", periodo: null };

// aviso que o /perfil mostra na aba Atendimentos depois do envio
const MENSAGEM_ENVIADO = "Solicitação enviada! A Bruxel vai entrar em contato pra confirmar a visita.";

/**
 * Formulário em que o cliente pede uma visita técnica (rota "/solicitar-atendimento",
 * só pra quem está logado). Os blocos são numerados pelo CSS (counter), então
 * dá pra incluir um bloco no meio sem renumerar nada.
 *
 * O contato vem do perfil: completo, aparece só um resumo com "Alterar";
 * incompleto (ou se a busca do perfil falhar), os campos já abrem pra digitar.
 * Mudar o contato aqui vale só pra este atendimento.
 *
 * Ao enviar, guarda no ProvedorAtendimentos (em memória, sem backend ainda) e
 * leva pra aba "Atendimentos" do /perfil com um aviso.
 */
export function PaginaSolicitarAtendimento() {
  const { solicitarAtendimento } = useAtendimentos();
  const navigate = useNavigate();
  // perfil de quem está logado, pra pré-preencher o contato; se a busca falhar
  // (ex.: 403 enquanto o backend não libera o próprio usuário), o cliente digita
  const { dados: perfil, carregando: carregandoPerfil } = usePerfil();

  const [rascunho, setRascunho] = useState<CamposRascunho>(RASCUNHO_INICIAL);
  // contato digitado aqui; null = não mexeu, então vale o do perfil
  const [contatoEditado, setContatoEditado] = useState<ContatoAtendimento | null>(null);
  // true depois de clicar em "Alterar" no resumo do contato
  const [editandoContato, setEditandoContato] = useState(false);
  // erros da última tentativa de envio; cada um some quando a pessoa mexe no campo
  const [erros, setErros] = useState<ErrosSolicitacao>({});
  // primeiro dia aceito no calendário; o inicializador roda uma vez só (o render não pode chamar new Date())
  const [minimo] = useState(() => dataMinima(new Date()));
  // trava contra duplo clique: um segundo submit antes de a página trocar não cria outro atendimento
  const enviadoRef = useRef(false);

  // o contato é derivado a cada renderização, em vez de um useEffect copiar o perfil pro estado
  const contatoPerfil = contatoDoUsuario(perfil);
  const contato = contatoEditado ?? contatoPerfil;
  const perfilTemContato = Object.keys(validarContato(contatoPerfil)).length === 0;
  const mostrarCamposContato = editandoContato || !perfilTemContato;

  function limparErro(campo: keyof ErrosSolicitacao) {
    setErros((atuais) => {
      if (!atuais[campo]) return atuais;
      const restantes = { ...atuais };
      delete restantes[campo];
      return restantes;
    });
  }

  // troca um campo do rascunho; o tipo genérico garante que o valor combina com o campo
  function atualizarCampo<C extends keyof CamposRascunho>(campo: C, valor: CamposRascunho[C]) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
    limparErro(campo);
  }

  function atualizarContato(campo: keyof ContatoAtendimento, valor: string) {
    // a primeira edição parte do contato do perfil
    setContatoEditado((atual) => ({ ...(atual ?? contatoPerfil), [campo]: valor }));
    limparErro(campo);
  }

  function alterarContato() {
    setContatoEditado(contato);
    setEditandoContato(true);
  }

  function usarContatoDoPerfil() {
    setContatoEditado(null);
    setEditandoContato(false);
    // erros do contato digitado não valem pro contato do perfil
    (Object.keys(contatoPerfil) as (keyof ContatoAtendimento)[]).forEach(limparErro);
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviadoRef.current) return;

    const completo: RascunhoSolicitacao = { ...rascunho, contato };
    const encontrados = validarSolicitacao(completo, new Date());
    if (Object.keys(encontrados).length > 0) {
      setErros(encontrados);
      // depois que o React mostrar as mensagens, rola até o primeiro bloco com erro
      requestAnimationFrame(() => {
        document
          .querySelector(".pagina-atendimento__erro")
          ?.closest("fieldset")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    const { tipo, periodo } = completo;
    // a validação já garante os dois; o if é só pro TypeScript saber que não são null
    if (!tipo || !periodo) return;

    enviadoRef.current = true;
    solicitarAtendimento({
      tipo,
      periodo,
      descricao: completo.descricao.trim(),
      dataPreferida: completo.dataPreferida,
      fotos: [],
      contato,
    });
    navigate("/perfil", { state: { aba: "atendimentos", mensagem: MENSAGEM_ENVIADO } });
  }

  return (
    <>
      <Cabecalho />

      <section className="pagina-atendimento">
        <Container>
          <nav className="pagina-atendimento__trilha" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <Link to="/perfil">Minha conta</Link>
            <span>›</span>
            <span>Solicitar atendimento</span>
          </nav>

          <h1 className="pagina-atendimento__titulo">Solicitar atendimento</h1>
          <p className="pagina-atendimento__subtitulo">
            Conte o que está acontecendo com a sua piscina e a Bruxel confirma a visita com você.
          </p>

          {/* noValidate: as mensagens vêm do validarSolicitacao, não dos balões do navegador */}
          <form className="pagina-atendimento__formulario" onSubmit={enviar} noValidate>
            <fieldset className="pagina-atendimento__bloco">
              <legend className="pagina-atendimento__titulo-bloco">Tipo de serviço</legend>
              <SeletorTipoServico valor={rascunho.tipo} onChange={(tipo) => atualizarCampo("tipo", tipo)} />
              {erros.tipo && (
                <p className="pagina-atendimento__erro" role="alert">
                  {erros.tipo}
                </p>
              )}
            </fieldset>

            <fieldset className="pagina-atendimento__bloco">
              <legend className="pagina-atendimento__titulo-bloco" id="titulo-descricao">
                Descreva o problema
              </legend>
              <textarea
                className="pagina-atendimento__descricao"
                aria-labelledby="titulo-descricao"
                aria-invalid={Boolean(erros.descricao)}
                placeholder="Ex.: a bomba não desliga e está vazando água pelo filtro."
                value={rascunho.descricao}
                onChange={(e) => atualizarCampo("descricao", e.target.value)}
                maxLength={DESCRICAO_MAX}
                rows={5}
              />
              <p className="pagina-atendimento__contador">
                {rascunho.descricao.length}/{DESCRICAO_MAX}
              </p>
              {erros.descricao && (
                <p className="pagina-atendimento__erro" role="alert">
                  {erros.descricao}
                </p>
              )}
            </fieldset>

            <fieldset className="pagina-atendimento__bloco">
              <legend className="pagina-atendimento__titulo-bloco">Quando você prefere?</legend>
              <SeletorQuando
                data={rascunho.dataPreferida}
                periodo={rascunho.periodo}
                dataMinima={minimo}
                onChangeData={(data) => atualizarCampo("dataPreferida", data)}
                onChangePeriodo={(periodo) => atualizarCampo("periodo", periodo)}
              />
              <p className="pagina-atendimento__dica">A Bruxel confirma o dia e o horário com você.</p>
              {erros.dataPreferida && (
                <p className="pagina-atendimento__erro" role="alert">
                  {erros.dataPreferida}
                </p>
              )}
              {erros.periodo && (
                <p className="pagina-atendimento__erro" role="alert">
                  {erros.periodo}
                </p>
              )}
            </fieldset>

            <fieldset className="pagina-atendimento__bloco">
              <legend className="pagina-atendimento__titulo-bloco">Onde e como falar com você</legend>

              {carregandoPerfil ? (
                <p className="pagina-atendimento__dica">Carregando seus dados…</p>
              ) : mostrarCamposContato ? (
                <div className="pagina-atendimento__campos-contato">
                  <label>
                    Telefone (com DDD)
                    <input
                      type="tel"
                      placeholder="(51) 99999-0000"
                      value={contato.telefone}
                      onChange={(e) => atualizarContato("telefone", e.target.value)}
                      maxLength={20}
                      aria-invalid={Boolean(erros.telefone)}
                    />
                    {erros.telefone && (
                      <span className="pagina-atendimento__erro" role="alert">
                        {erros.telefone}
                      </span>
                    )}
                  </label>
                  {/* mesmos campos (e mesmas normalizações de UF e CEP) do endereço do perfil */}
                  {CAMPOS_ENDERECO.map(({ campo, label, maxLength, normalizar }) => (
                    <label key={campo}>
                      {label}
                      <input
                        type="text"
                        value={contato[campo]}
                        onChange={(e) =>
                          atualizarContato(campo, normalizar ? normalizar(e.target.value) : e.target.value)
                        }
                        maxLength={maxLength}
                        aria-invalid={Boolean(erros[campo])}
                      />
                      {erros[campo] && (
                        <span className="pagina-atendimento__erro" role="alert">
                          {erros[campo]}
                        </span>
                      )}
                    </label>
                  ))}
                  {editandoContato && perfilTemContato && (
                    <button type="button" className="pagina-atendimento__usar-perfil" onClick={usarContatoDoPerfil}>
                      Usar o endereço do meu perfil
                    </button>
                  )}
                </div>
              ) : (
                <div className="pagina-atendimento__resumo-contato">
                  <div>
                    <p>{formatarEndereco(contato)}</p>
                    {/* o banco guarda só os 8 dígitos; na tela vai com hífen (95900-000) */}
                    {contato.cep && <p>CEP {contato.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</p>}
                    <p>{contato.telefone}</p>
                  </div>
                  <button type="button" className="pagina-atendimento__alterar" onClick={alterarContato}>
                    Alterar
                  </button>
                </div>
              )}

              <p className="pagina-atendimento__dica">
                Vale só pra este atendimento: o endereço do seu perfil não muda.
              </p>
            </fieldset>

            <div className="pagina-atendimento__acoes">
              <button type="submit" className="pagina-atendimento__enviar">
                Enviar solicitação
              </button>
              <Link to="/" className="pagina-atendimento__cancelar">
                Cancelar
              </Link>
            </div>
          </form>
        </Container>
      </section>

      <Rodape />
    </>
  );
}

export default PaginaSolicitarAtendimento;
```

`frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.css`:

```css
.pagina-atendimento {
  padding: clamp(1.5rem, 1rem + 2vw, 2.5rem) 0 var(--space-section);
}

/* mesma trilha do /perfil */
.pagina-atendimento__trilha {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  margin-bottom: 1.5rem;
}

.pagina-atendimento__trilha a {
  color: inherit;
  text-decoration: none;
}

.pagina-atendimento__trilha a:hover {
  text-decoration: underline;
}

.pagina-atendimento__titulo {
  font-weight: 600;
  font-size: var(--font-size-h2);
}

.pagina-atendimento__subtitulo {
  color: var(--color-text-muted);
  margin: 0.5rem 0 clamp(1.5rem, 1.2rem + 1vw, 2.25rem);
}

/* coluna única, com largura confortável de ler mesmo em monitor grande */
.pagina-atendimento__formulario {
  max-width: 820px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  counter-reset: bloco; /* numera os blocos sozinho: 1. Tipo, 2. Descrição... */
}

/* cada bloco é um <fieldset> com o fundo cinza do Minha conta */
.pagina-atendimento__bloco {
  counter-increment: bloco;
  margin: 0;
  border: 0;
  min-width: 0; /* o fieldset tem min-width: min-content por padrão e estouraria no celular */
  background-color: #f7f7fa;
  border-radius: 12px;
  padding: clamp(1rem, 0.8rem + 1vw, 1.5rem);
}

/* o <legend> fica "em cima da borda" do fieldset; com float ele vira um bloco comum, dentro do padding */
.pagina-atendimento__titulo-bloco {
  float: left;
  width: 100%;
  padding: 0;
  margin-bottom: 0.85rem;
  font-weight: 700;
  color: var(--color-primary);
}

.pagina-atendimento__titulo-bloco::before {
  content: counter(bloco) ". ";
}

/* o resto do bloco começa abaixo do legend flutuante */
.pagina-atendimento__bloco > :not(.pagina-atendimento__titulo-bloco) {
  clear: both;
}

.pagina-atendimento__opcional {
  font-weight: 500;
  color: var(--color-text-muted);
}

/* campos de texto no padrão do formulário do perfil */
.pagina-atendimento__descricao,
.pagina-atendimento__campos-contato input {
  width: 100%;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  padding: 0.8rem 1rem;
  font-family: inherit;
  font-size: var(--font-size-body);
  background-color: var(--color-white);
}

.pagina-atendimento__descricao {
  display: block;
  resize: vertical;
  min-height: 120px;
}

.pagina-atendimento__descricao:focus,
.pagina-atendimento__campos-contato input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.pagina-atendimento [aria-invalid="true"] {
  border-color: #c0392b;
}

.pagina-atendimento__contador {
  text-align: right;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  margin-top: 0.35rem;
}

.pagina-atendimento__dica {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  margin-top: 0.75rem;
}

.pagina-atendimento__erro {
  display: block;
  margin-top: 0.5rem;
  color: #c0392b;
  font-size: var(--font-size-small);
  font-weight: 600;
}

/* contato do perfil completo: só um resumo com "Alterar" */
.pagina-atendimento__resumo-contato {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  background-color: var(--color-white);
  border-radius: 10px;
  padding: 1rem 1.25rem;
}

.pagina-atendimento__resumo-contato p + p {
  margin-top: 0.25rem;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

/* contato incompleto ou em edição: os campos em 2 colunas */
.pagina-atendimento__campos-contato {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.5rem;
}

.pagina-atendimento__campos-contato label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-weight: 600;
  font-size: var(--font-size-small);
}

/* botões com cara de link (Alterar / Usar o endereço do meu perfil) */
.pagina-atendimento__alterar,
.pagina-atendimento__usar-perfil {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-accent);
  font-weight: 600;
  font-size: var(--font-size-small);
  cursor: pointer;
}

.pagina-atendimento__alterar:hover,
.pagina-atendimento__usar-perfil:hover {
  text-decoration: underline;
}

.pagina-atendimento__usar-perfil {
  grid-column: 1 / -1;
  justify-self: start;
}

.pagina-atendimento__acoes {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-top: 0.5rem;
}

.pagina-atendimento__enviar {
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: 999px;
  padding: 0.85rem 2rem;
  font-weight: 600;
  font-size: var(--font-size-body);
  cursor: pointer;
}

.pagina-atendimento__enviar:hover {
  background-color: var(--color-primary-dark);
}

.pagina-atendimento__cancelar {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

/* celular: campos do contato em 1 coluna e botão de enviar na largura toda */
@media (max-width: 640px) {
  .pagina-atendimento__campos-contato {
    grid-template-columns: 1fr;
  }

  .pagina-atendimento__acoes {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
}
```

- [ ] **Step 6: Rota e README**

Em `frontend/src/App.tsx`, adicione o import depois do `PaginaPerfil`:

```tsx
import { PaginaSolicitarAtendimento } from "./paginas/portal/solicitar-atendimento/solicitar-atendimento";
```

e, dentro do `<Route element={<RotaLogado />}>`, depois da rota `/perfil`:

```tsx
              <Route path="/solicitar-atendimento" element={<PaginaSolicitarAtendimento />} />
```

Em `README.md`, na tabela "Portal público", depois da linha do `/perfil`:

```markdown
| `/solicitar-atendimento` | Pedido de visita técnica (exige login) |
```

- [ ] **Step 7: Conferir tipos, lint e testes**

Run: `npm run build --prefix frontend`
Expected: sem erro

Run: `npm run lint --prefix frontend`
Expected: só o erro que já existia (1 problem)

Run: `npm test --prefix frontend`
Expected: PASS

- [ ] **Step 8: Conferir no navegador**

Use o Browser pane logado como cliente (ver Task 4, passo 5):

1. Vá em `/solicitar-atendimento`. Devem aparecer 4 blocos numerados: "1. Tipo de serviço", "2. Descreva o problema", "3. Quando você prefere?" e "4. Onde e como falar com você". O legend não pode encostar na borda de cima do bloco.
2. Clique em "Enviar solicitação" com tudo vazio. Devem aparecer as mensagens de tipo, descrição, data e período, e a página rola até o bloco 1. Se o contato estiver incompleto, aparecem também as mensagens do contato.
3. Escolha um tipo: a mensagem dele some na hora. Use Tab + setas nos cards: o foco aparece no card.
4. O calendário não deixa escolher hoje (`min` = amanhã).
5. Contato:
   - Com a main de hoje (cliente recebe 403), os campos abrem vazios e sem mensagem de erro.
   - Se o perfil tiver endereço (admin, ou depois do PR #55), aparece o resumo. "Alterar" abre os campos e "Usar o endereço do meu perfil" volta pro resumo.
6. Preencha tudo e envie. Deve ir pra `/perfil` na aba "Atendimentos", com o aviso verde e o "#AT-2026-0003" no topo, com a etiqueta amarela "Aguardando confirmação".
7. Em 375px, sem rolagem horizontal: tipos em 2 colunas, contato em 1 coluna, botão na largura toda.
8. `read_console_messages` com `onlyErrors`: nenhum erro.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/crud/usuarios/camposUsuario.ts frontend/src/componentes/ui/Icones/Icones.tsx frontend/src/paginas/portal/solicitar-atendimento/ frontend/src/App.tsx README.md
git commit -m "feat: página de solicitar atendimento com tipo, descrição, data e contato" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Fotos do problema

**Files:**
- Modify: `frontend/src/componentes/ui/Icones/Icones.tsx` (2 ícones no fim)
- Create: `frontend/src/paginas/portal/solicitar-atendimento/componentes/CampoFotos/CampoFotos.tsx` + `.css`
- Modify: `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx` (imports, estado, cleanup, bloco novo, envio)

**Interfaces:**
- Consumes: `validarFotos`, `MAX_FOTOS` (Task 2); a página da Task 5
- Produces:
  - `interface FotoSelecionada { id: string; arquivo: File; url: string }`
  - `CampoFotos({ fotos: FotoSelecionada[]; onChange: (fotos: FotoSelecionada[]) => void })`
  - As URLs das fotos passam a ir no `solicitarAtendimento({ ..., fotos })`, e a aba mostra "· N fotos".

- [ ] **Step 1: Ícones de adicionar e remover**

No fim de `frontend/src/componentes/ui/Icones/Icones.tsx`:

```tsx
/** Mais: adicionar foto. */
export function IconeMais() {
  return (
    <Icone>
      <path d="M12 5v14M5 12h14" />
    </Icone>
  );
}

/** X: remover foto. */
export function IconeFechar() {
  return (
    <Icone>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icone>
  );
}
```

- [ ] **Step 2: `CampoFotos`**

`frontend/src/paginas/portal/solicitar-atendimento/componentes/CampoFotos/CampoFotos.tsx`:

```tsx
import { useState } from "react";
import type { ChangeEvent } from "react";
import { MAX_FOTOS, validarFotos } from "../../../../../crud/atendimentos/validarSolicitacao";
import { IconeFechar, IconeMais } from "../../../../../componentes/ui/Icones/Icones";
import "./CampoFotos.css";

/** Uma foto escolhida: o arquivo e a URL temporária (blob:) da miniatura. */
export interface FotoSelecionada {
  id: string;
  arquivo: File;
  url: string;
}

interface CampoFotosProps {
  fotos: FotoSelecionada[];
  onChange: (fotos: FotoSelecionada[]) => void;
}

/**
 * Bloco "Fotos do problema": miniaturas das fotos escolhidas e um quadrado "+"
 * que abre o seletor de arquivos. As fotos ficam só no navegador
 * (URL.createObjectURL) até o backend ter onde guardar.
 */
export function CampoFotos({ fotos, onChange }: CampoFotosProps) {
  // por que alguma foto ficou de fora (não é imagem, grande demais, passou do limite)
  const [erro, setErro] = useState<string | null>(null);

  function adicionar(evento: ChangeEvent<HTMLInputElement>) {
    const escolhidos = Array.from(evento.target.files ?? []);
    // zera o input: sem isso, escolher de novo a mesma foto (depois de remover) não dispara o onChange
    evento.target.value = "";

    const { aceitas, erro: motivo } = validarFotos(fotos.length, escolhidos);
    setErro(motivo);
    if (aceitas.length === 0) return;

    const novas = aceitas.map((arquivo) => ({
      id: crypto.randomUUID(),
      arquivo,
      url: URL.createObjectURL(arquivo),
    }));
    onChange([...fotos, ...novas]);
  }

  function remover(foto: FotoSelecionada) {
    // a miniatura sai da tela, então a URL temporária pode ser liberada da memória
    URL.revokeObjectURL(foto.url);
    setErro(null);
    onChange(fotos.filter((atual) => atual.id !== foto.id));
  }

  return (
    <div className="campo-fotos">
      <ul className="campo-fotos__lista">
        {fotos.map((foto, indice) => (
          <li key={foto.id} className="campo-fotos__item">
            <img src={foto.url} alt={`Foto ${indice + 1} do problema`} className="campo-fotos__miniatura" />
            <button
              type="button"
              className="campo-fotos__remover"
              onClick={() => remover(foto)}
              aria-label={`Remover foto ${indice + 1}`}
            >
              <IconeFechar />
            </button>
          </li>
        ))}
        {/* o "+" some quando chega no limite */}
        {fotos.length < MAX_FOTOS && (
          <li>
            <label className="campo-fotos__adicionar">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={adicionar}
                className="campo-fotos__input"
              />
              <IconeMais />
              <span>Adicionar</span>
            </label>
          </li>
        )}
      </ul>
      <p className="campo-fotos__dica">Até {MAX_FOTOS} fotos, de até 5 MB cada.</p>
      {erro && (
        <p className="campo-fotos__erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

export default CampoFotos;
```

`frontend/src/paginas/portal/solicitar-atendimento/componentes/CampoFotos/CampoFotos.css`:

```css
.campo-fotos__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.campo-fotos__item {
  position: relative;
}

.campo-fotos__miniatura,
.campo-fotos__adicionar {
  width: 88px;
  height: 88px;
  border-radius: 10px;
}

.campo-fotos__miniatura {
  display: block;
  object-fit: cover; /* recorta a foto pra caber no quadrado sem distorcer */
}

/* bolinha de remover, presa no canto da miniatura */
.campo-fotos__remover {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 2px solid var(--color-white);
  border-radius: 50%;
  background-color: var(--color-primary);
  color: var(--color-white);
  cursor: pointer;
}

.campo-fotos__remover svg {
  width: 14px;
  height: 14px;
}

.campo-fotos__adicionar {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: 2px dashed var(--color-accent);
  background-color: var(--color-white);
  color: var(--color-accent);
  font-weight: 600;
  font-size: var(--font-size-small);
  cursor: pointer;
}

.campo-fotos__adicionar:hover {
  background-color: #e2effa;
}

.campo-fotos__adicionar:has(.campo-fotos__input:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* o input de arquivo continua acessível pelo teclado; o visual é o quadrado tracejado */
.campo-fotos__input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.campo-fotos__dica {
  margin-top: 0.75rem;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

.campo-fotos__erro {
  margin-top: 0.5rem;
  color: #c0392b;
  font-size: var(--font-size-small);
  font-weight: 600;
}
```

- [ ] **Step 3: Ligar as fotos na página**

Em `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx`:

1. Troque o import do React por `import { useEffect, useRef, useState } from "react";`.
2. Depois do import do `SeletorQuando`, adicione:
   ```tsx
   import { CampoFotos } from "./componentes/CampoFotos/CampoFotos";
   import type { FotoSelecionada } from "./componentes/CampoFotos/CampoFotos";
   ```
3. Depois do `const enviadoRef = useRef(false);`, adicione:
   ```tsx
     const [fotos, setFotos] = useState<FotoSelecionada[]>([]);
     // cópia das fotos pra limpeza ao sair da página (o cleanup do useEffect não enxerga o estado atual)
     const fotosRef = useRef<FotoSelecionada[]>([]);

     // ao sair sem enviar, libera as URLs temporárias das miniaturas; se enviou,
     // as URLs continuam valendo, porque foram pro ProvedorAtendimentos
     useEffect(() => {
       return () => {
         if (enviadoRef.current) return;
         fotosRef.current.forEach((foto) => URL.revokeObjectURL(foto.url));
       };
     }, []);

     function mudarFotos(novas: FotoSelecionada[]) {
       setFotos(novas);
       fotosRef.current = novas;
     }
   ```
4. No `solicitarAtendimento({ ... })`, troque `fotos: [],` por:
   ```tsx
         fotos: fotos.map((foto) => foto.url),
   ```
5. Entre o bloco "Descreva o problema" e o bloco "Quando você prefere?", adicione. O contador do CSS renumera sozinho: este vira o 3 e os seguintes viram 4 e 5.
   ```tsx
               <fieldset className="pagina-atendimento__bloco">
                 <legend className="pagina-atendimento__titulo-bloco">
                   Fotos do problema <span className="pagina-atendimento__opcional">(opcional)</span>
                 </legend>
                 <CampoFotos fotos={fotos} onChange={mudarFotos} />
               </fieldset>
   ```
6. No comentário do componente, troque "Os blocos são numerados pelo CSS" pela frase com os 5 blocos:
   ```
    * só pra quem está logado). Cinco blocos — tipo, descrição, fotos, quando e
    * contato — numerados pelo CSS (counter), então dá pra incluir um bloco no
    * meio sem renumerar nada.
   ```

- [ ] **Step 4: Conferir tipos, lint e testes**

Run: `npm run build --prefix frontend`
Expected: sem erro

Run: `npm run lint --prefix frontend`
Expected: só o erro que já existia (1 problem). Se o `react-hooks/exhaustive-deps` reclamar do `fotosRef.current` no cleanup, a atribuição dentro do `mudarFotos` já é o padrão que a regra aceita; se mesmo assim reclamar, copie `const fotosAoSair = fotosRef;` no corpo do efeito e use `fotosAoSair.current` no cleanup.

Run: `npm test --prefix frontend`
Expected: PASS

- [ ] **Step 5: Conferir no navegador**

1. Em `/solicitar-atendimento` agora são 5 blocos, e "3. Fotos do problema (opcional)" fica entre a descrição e o "4. Quando você prefere?".
2. Pra testar sem a janela de arquivos, rode no console:
   ```js
   const input = document.querySelector(".campo-fotos__input");
   const png = async (n) => new File([await (await fetch("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")).blob()], `f${n}.png`, { type: "image/png" });
   const dt = new DataTransfer();
   for (let i = 1; i <= 6; i++) dt.items.add(await png(i));
   input.files = dt.files;
   input.dispatchEvent(new Event("change", { bubbles: true }));
   ```
   Esperado: 5 miniaturas, a mensagem "Você pode enviar até 5 fotos." e o "+" some.
3. Clique no ✕ da primeira: ficam 4, o "+" volta e a mensagem some.
4. Um arquivo `text/plain` pelo mesmo caminho do passo 2 deve mostrar "Só dá pra enviar imagens.".
5. Envie o formulário completo: o card novo na aba "Atendimentos" mostra "· 4 fotos".
6. `read_console_messages` com `onlyErrors`: nenhum erro.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/componentes/ui/Icones/Icones.tsx frontend/src/paginas/portal/solicitar-atendimento/
git commit -m "feat: fotos do problema no pedido de atendimento" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Pílula "Solicitar atendimento" no cabeçalho

**Files:**
- Modify: `frontend/src/componentes/layout/Cabecalho/Cabecalho.tsx` (imports + `.cabecalho__acoes`)
- Modify: `frontend/src/componentes/layout/Cabecalho/Cabecalho.css` (regra nova + bloco do celular)

**Interfaces:**
- Consumes: `IconeFerramenta` (Task 4); a rota `/solicitar-atendimento` (Task 5)
- Produces: um link visível pra todo mundo. Deslogado, o `RotaLogado` manda pro `/entrar` e o login volta pro formulário (`state.de`, isso já existe).

- [ ] **Step 1: A pílula no `Cabecalho.tsx`**

Adicione o import depois do `Logo`:

```tsx
import { IconeFerramenta } from "../../ui/Icones/Icones";
```

Dentro de `<div className="cabecalho__acoes">`, antes do `<Link to="/carrinho" ...>`:

```tsx
            {/* segunda pílula: leva pro pedido de visita técnica (o RotaLogado pede login antes, se precisar).
                O aria-label mantém o nome completo pro leitor de tela quando o celular mostra só "Atendimento" */}
            <Link
              to="/solicitar-atendimento"
              className="cabecalho__botao-atendimento"
              aria-label="Solicitar atendimento"
              aria-current={pathname === "/solicitar-atendimento" ? "page" : undefined}
            >
              <IconeFerramenta />
              <span className="cabecalho__texto-longo">Solicitar atendimento</span>
              <span className="cabecalho__texto-curto">Atendimento</span>
            </Link>
```

No comentário do componente, troque "carrinho (com o contador de itens) e o botão Entrar" por "a pílula Solicitar atendimento, o carrinho (com o contador de itens) e o botão Entrar".

- [ ] **Step 2: Estilo no `Cabecalho.css`**

Depois da regra `.cabecalho__icone-entrar`:

```css
/* segunda pílula (Solicitar atendimento): mesmo formato do Entrar, em lilás claro,
   pra o Entrar continuar sendo o botão principal */
.cabecalho__botao-atendimento {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-store-button);
  color: var(--color-primary);
  border-radius: 999px;
  height: 48px;
  padding: 0 1.4rem;
  font-weight: 600;
  font-size: var(--font-size-small);
  text-decoration: none;
}

.cabecalho__botao-atendimento:hover {
  background-color: var(--color-white);
}

/* na própria página do formulário, a pílula ganha um contorno azul-claro */
.cabecalho__botao-atendimento[aria-current="page"] {
  outline: 2px solid #8ddcff;
  outline-offset: 2px;
}

/* o texto curto só aparece no celular (ver @media abaixo) */
.cabecalho__texto-curto {
  display: none;
}
```

Dentro do `@media (max-width: 640px)` que já existe, no fim:

```css
  .cabecalho__botao-atendimento {
    height: 40px;
    padding: 0 1rem;
  }

  /* trocar o texto é só visual, então é com media query mesmo (não precisa de JS) */
  .cabecalho__texto-longo {
    display: none;
  }

  .cabecalho__texto-curto {
    display: inline;
  }
```

- [ ] **Step 3: Conferir no navegador e medir o celular**

1. Em 1440px, na Home deslogado, a ordem é: logo, menu, pílula lilás "Solicitar atendimento", carrinho, "Entrar".
2. Clique na pílula: vai pro `/entrar`. Entre: volta pro `/solicitar-atendimento`, com a pílula contornada.
3. Em 375px (`resize_window` `mobile`, depois recarregue), rode no console:
   ```js
   const logo = document.querySelector(".logo").getBoundingClientRect();
   const acoes = document.querySelector(".cabecalho__acoes").getBoundingClientRect();
   ({ mesmaLinha: Math.abs(logo.top - acoes.top) < 20, sobraDireita: innerWidth - acoes.right });
   ```
   Esperado: `mesmaLinha: true` e `sobraDireita >= 0`. Confira deslogado ("Entrar") e logado (o primeiro nome).
4. **Só se `mesmaLinha` der `false`:** acrescente no fim do `Cabecalho.css` e meça de novo:
   ```css
   /* celular estreito: a pílula vira só o ícone (o aria-label continua dizendo "Solicitar atendimento") */
   @media (max-width: 420px) {
     .cabecalho__botao-atendimento {
       width: 40px;
       padding: 0;
       justify-content: center;
     }

     .cabecalho__texto-curto {
       display: none;
     }
   }
   ```
5. Volte o tamanho com `resize_window` `preset: "desktop"`.
6. `read_console_messages` com `onlyErrors`: nenhum erro.

- [ ] **Step 4: Conferir tipos e lint**

Run: `npm run build --prefix frontend`
Expected: sem erro

Run: `npm run lint --prefix frontend`
Expected: só o erro que já existia (1 problem)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/componentes/layout/Cabecalho/
git commit -m "feat: pílula Solicitar atendimento no cabeçalho" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Verificação final e entrega

**Files:**
- Nenhum arquivo novo. Correções que aparecerem aqui voltam pra task dona do arquivo, com commit próprio.

**Interfaces:**
- Consumes: tudo
- Produces: a branch `feat/solicitar-atendimento` pronta, as evidências (saída dos comandos e screenshots) e o texto do PR

- [ ] **Step 1: Comandos completos**

Run: `npm test --prefix frontend`
Expected: PASS em todos os arquivos (os 4 novos de `crud/atendimentos` + os que já existiam)

Run: `npm run build --prefix frontend`
Expected: sem erro

Run: `npm run lint --prefix frontend`
Expected: 1 problem (o de `ContextoCarrinho.tsx`, que já existia)

- [ ] **Step 2: Roteiro no navegador (desktop 1440px e celular 375px)**

1. Deslogado: a pílula leva pro login, e o login volta pro formulário.
2. Enviar vazio mostra as mensagens e rola até o bloco 1.
3. Data mínima = amanhã.
4. Fotos: a 6ª é recusada, um arquivo que não é imagem é recusado, o ✕ remove, e remover e escolher a mesma foto de novo funciona (Review Focus 5).
5. Telefone "(51) 99999-0000" e "+55 51 99999-0000" são aceitos (Review Focus 3).
6. Duplo clique rápido em "Enviar solicitação" (`computer` `double_click` no botão) cria **um** card só na aba (Review Focus 4).
7. O envio válido aparece no topo da aba, com "Aguardando confirmação", o aviso verde e o total de fotos.
8. Celular: sem rolagem horizontal em `/solicitar-atendimento` e em `/perfil` › Atendimentos. Confira com `document.documentElement.scrollWidth <= innerWidth`.
9. Console sem erros.

- [ ] **Step 3: Screenshots pro Eduardo**

Tire screenshots de:
- cabeçalho com a pílula (desktop e celular);
- formulário preenchido (desktop);
- formulário com erros (celular);
- aba "Atendimentos" depois do envio.

Mande com `SendUserFile`.

- [ ] **Step 4: Revisão e integração**

- Use a skill `superpowers:requesting-code-review` na branch inteira (base: `eduardo`).
- Depois, use a skill `superpowers:finishing-a-development-branch`.
- **Não** dar push na `eduardo`.
- Perguntar ao Eduardo antes de dar push da `feat/solicitar-atendimento`.
- O PR pra `main` só abre depois do merge do PR #57. Rascunho da descrição:

```markdown
## O que muda
- Pílula "Solicitar atendimento" no cabeçalho → página `/solicitar-atendimento` (exige login)
- Formulário em 5 blocos: tipo de serviço, descrição, fotos, data/período e contato (vem do perfil, dá pra ajustar)
- Aba "Atendimentos" no Minha conta com o status de cada pedido
- Validação em funções puras com Vitest (`frontend/src/crud/atendimentos/`)

Relacionado a #22 (lado do cliente; a OS do funcionário fica pra outro PR).

## Recado pro backend
- `appointments` precisa de: tipo de serviço, descrição, fotos (URLs no Supabase), período, endereço e telefone do atendimento
- `status_agendamento` precisa de `AGUARDANDO` e `EM_ANDAMENTO`
- Rotas: `POST /appointments` (cliente) e `GET /appointments` (só os do próprio cliente)
- Futuro: escolher o piscineiro e um horário livre na agenda dele (`tecnico_id` + rota de horários livres + checagem de conflito no backend)

## Como testar
1. `npm test --prefix frontend`
2. Entrar como cliente → pílula "Solicitar atendimento" → enviar vazio (erros) → preencher e enviar → Minha conta › Atendimentos

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
