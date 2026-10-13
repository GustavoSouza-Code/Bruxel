# Atendimento aberto pela loja — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Pré-requisito:** o plano `docs/superpowers/plans/2026-10-13-agenda-atendente.md` precisa estar **implementado e verificado antes**. Este plano edita o código que ele deixa: `tecnicoId`/`data`/`horario`, `ocupacoes`, `SeletorAtendente`, `SeletorDiaHorario`, `escolherTecnico`/`escolherDia`, `formatarAgendamento`/`nomeDoTecnico` e o provedor com `novosPorUsuario`.

**Goal:** Um administrador abre um atendimento no `/solicitar-atendimento` em nome de um cliente cadastrado (buscado por nome, e-mail ou CPF) ou de um cliente sem cadastro (só o nome), e continua na página pronto pro próximo.

**Architecture:** As regras do cliente da loja (busca, validação, conversão e máscara de CPF) ficam em `crud/atendimentos/clienteDaLoja.ts`, funções puras testadas com Vitest. A busca reaproveita o `filtrarUsuarios`. O pedido passa a guardar `cliente` e `abertoNaLoja`, e o provedor guarda cada pedido pelo cliente dele, não por quem está logado. O componente `SeletorCliente` (só montado pra admin) usa o `useUsuarios`. A página ganha o modo admin.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Vite 8, Vitest 5, CSS puro (BEM em português)

**Spec:** `docs/superpowers/specs/2026-10-13-atendimento-pela-loja-design.md`

## Global Constraints

- Nenhuma dependência nova. Os testes automáticos cobrem só as funções puras; a interface é conferida no navegador pelo controller.
- Branch `feat/solicitar-atendimento`. Nunca commitar nem dar push na `eduardo`, nunca dar push nesta branch, nunca fazer amend.
- Lint: não pode surgir erro novo. Linha de base: 1 erro que já existe (`react-refresh/only-export-components` em `src/contexto/ContextoCarrinho.tsx`).
- Fast Refresh: arquivo `.tsx` de componente exporta só componentes (exportar tipo pode).
- React Hooks v7 (lint): nada de `setState` direto no corpo de `useEffect`, nada de ler ou escrever `ref.current` durante a renderização, nada de função impura no render.
- Identificadores, comentários e textos em pt-BR, no estilo do projeto: comentários curtos que explicam o porquê.
- CSS: classes BEM; cores de `src/estilos/tokens.css`. Os hex literais permitidos são só `#f7f7fa`, `#e2effa`, `#e3f5e8`, `#1e7a3c`, `#f1f1f4` e `#c0392b`.
- O bloco "Cliente", a etiqueta "Abrindo pela loja" e o `GET /users` só existem quando `useAutenticacao().ehAdmin` é true. Pro cliente comum a página fica exatamente como depois do plano da agenda.
- Busca: só perfil `CLIENTE`, a partir de 2 caracteres (depois do trim) e até 6 sugestões, reaproveitando `filtrarUsuarios` + `FILTROS_USUARIO_INICIAIS` de `crud/usuarios/filtrarUsuarios.ts`.
- Pedido de cliente sem cadastro fica na chave `"balcao"` do provedor.
- Textos exatos:
  - "Abrindo pela loja"
  - "Preencha com os dados do cliente que está sendo atendido."
  - "Cliente" (título do bloco)
  - "Buscar cliente por nome, e-mail ou CPF"
  - "Carregando clientes…"
  - "Tentar novamente"
  - "Nenhum cliente encontrado. Se ele não tiver conta, use 'Cliente sem cadastro'."
  - "Cliente sem cadastro? Digitar o nome"
  - "Nome do cliente"
  - "Buscar cliente cadastrado"
  - "Trocar"
  - "Escolha o cliente ou digite o nome de quem não tem cadastro."
  - "Informe o nome do cliente (pelo menos 3 letras)."
  - "Onde e como falar com o cliente"
  - "Vale só pra este atendimento."
  - "Usar o endereço da conta do cliente"
  - aviso: "Atendimento aberto para {João Silva}: {21/10/2026 às 13:30 com Carlos}."
  - aba: " · aberto na loja"
  - painel: "Abrir atendimento" / "Para um cliente que está na loja"
- Todo commit termina com `-m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`.
- Comandos a partir da raiz do repositório (`Bruxel/`). Vite no OneDrive: se servir arquivo antigo, dar `touch` no arquivo editado.

## Review Focus

1. **Enter no campo de busca.** Apertar Enter não pode enviar o formulário inteiro; escolhe a primeira sugestão, se houver. Garantido pelo `onKeyDown` do `SeletorCliente` (Task 3) e conferido no navegador.
2. **Trocar de cliente** não pode manter o contato que foi editado pro cliente anterior. Garantido pelo `escolherCliente`, que zera `contatoEditado` (Task 4), e conferido no navegador.
3. **O endereço do próprio admin** nunca preenche o contato. Garantido pelo `usuarioBase` (Task 4) e conferido no navegador.
4. **Dois envios seguidos do admin**, inclusive com duplo clique, criam um pedido por envio, com o formulário limpo entre eles. Garantido pelo reset de estado e do `enviadoRef` (Task 4) e conferido no navegador.
5. **Cliente comum nunca chama `GET /users`**, que daria 403. Garantido pelo `SeletorCliente` só ser montado pra admin (Task 4) e conferido no navegador nas requisições de rede.

---

## Mapa de arquivos

| Arquivo | Responsabilidade | Task |
|---|---|---|
| `frontend/src/tipos/atendimento.ts` | `ClienteDoAtendimento` (T1); campos `cliente` e `abertoNaLoja` no `Atendimento` (T2) | 1, 2 |
| `frontend/src/crud/atendimentos/clienteDaLoja.ts` (+ `.test.ts`) | Busca, validação, conversão e máscara de CPF | 1 |
| `frontend/src/dados/atendimentos.ts` | Exemplos com `cliente`/`abertoNaLoja` | 2 |
| `frontend/src/crud/atendimentos/novoAtendimento.test.ts` | Dados de teste novos | 2 |
| `frontend/src/contexto/ContextoAtendimentos.tsx` | Guarda pelo cliente do pedido; numeração única | 2 |
| `frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx` | " · aberto na loja" | 2 |
| `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx` | Cliente do site (T2); modo admin (T4) | 2, 4 |
| `.../solicitar-atendimento/componentes/SeletorCliente/*` | Bloco "Cliente" | 3 |
| `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.css` | Etiqueta e aviso da loja | 4 |
| `frontend/src/paginas/admin/inicio/inicio.tsx` | Card "Abrir atendimento" | 4 |

---

### Task 1: Regras do cliente da loja (funções puras)

**Files:**
- Modify: `frontend/src/tipos/atendimento.ts` (só acrescenta `ClienteDoAtendimento`)
- Create: `frontend/src/crud/atendimentos/clienteDaLoja.ts`
- Test: `frontend/src/crud/atendimentos/clienteDaLoja.test.ts`

**Interfaces:**
- Consumes: `Usuario` (`tipos/usuario.ts`); `filtrarUsuarios(usuarios, filtros)` e `FILTROS_USUARIO_INICIAIS` (`crud/usuarios/filtrarUsuarios.ts`)
- Produces:
  - `interface ClienteDoAtendimento { id: string | null; nome: string }` (em `tipos/atendimento.ts`)
  - Em `clienteDaLoja.ts`:
    - `type EscolhaCliente = { tipo: "cadastrado"; usuario: Usuario | null } | { tipo: "sem-cadastro"; nome: string }`
    - `ESCOLHA_CLIENTE_INICIAL: EscolhaCliente` (= `{ tipo: "cadastrado", usuario: null }`)
    - `buscarClientes(usuarios: Usuario[], termo: string): Usuario[]`
    - `validarClienteDaLoja(escolha: EscolhaCliente): string | null`
    - `clienteDoAtendimento(escolha: EscolhaCliente): ClienteDoAtendimento`
    - `mascararCpf(cpf: string): string`

- [ ] **Step 1: Tipo do cliente do atendimento**

Em `frontend/src/tipos/atendimento.ts`, logo antes da `interface Atendimento`, acrescente:

```ts
/** De quem é o atendimento. */
export interface ClienteDoAtendimento {
  /** id da conta do cliente; null = cliente sem cadastro (atendido no balcão da loja) */
  id: string | null;
  nome: string;
}
```

- [ ] **Step 2: Escrever os testes (falhando)**

`frontend/src/crud/atendimentos/clienteDaLoja.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Usuario } from "../../tipos/usuario";
import {
  buscarClientes,
  clienteDoAtendimento,
  mascararCpf,
  validarClienteDaLoja,
} from "./clienteDaLoja";

function usuario(dados: Partial<Usuario> & Pick<Usuario, "id" | "nome">): Usuario {
  return { email: `${dados.id}@exemplo.com`, cpf: "00000000000", perfil: "CLIENTE", ...dados };
}

const USUARIOS: Usuario[] = [
  usuario({ id: "1", nome: "João Silva", email: "joao@email.com", cpf: "12345678901" }),
  usuario({ id: "2", nome: "Maria Oliveira", email: "maria@email.com", cpf: "98765432100" }),
  usuario({ id: "3", nome: "Joana Gerente", email: "joana@bruxel.com", perfil: "ADMINISTRADOR" }),
];

const ids = (lista: Usuario[]) => lista.map((u) => u.id);

describe("buscarClientes", () => {
  it("acha pelo nome sem ligar pra acento", () => {
    expect(ids(buscarClientes(USUARIOS, "joao"))).toEqual(["1"]);
  });

  it("acha pelo e-mail e por um pedaço do CPF", () => {
    expect(ids(buscarClientes(USUARIOS, "maria@"))).toEqual(["2"]);
    expect(ids(buscarClientes(USUARIOS, "456.789"))).toEqual(["1"]);
  });

  it("só mostra clientes, nunca administradores", () => {
    expect(buscarClientes(USUARIOS, "joana")).toEqual([]);
  });

  it("com menos de 2 letras não sugere ninguém", () => {
    expect(buscarClientes(USUARIOS, "j")).toEqual([]);
    expect(buscarClientes(USUARIOS, "  j  ")).toEqual([]);
  });

  it("sugere no máximo 6", () => {
    const muitos = Array.from({ length: 10 }, (_, i) => usuario({ id: `c${i}`, nome: `Cliente ${i}` }));
    expect(buscarClientes(muitos, "cliente")).toHaveLength(6);
  });
});

describe("validarClienteDaLoja", () => {
  it("cadastrado sem ninguém escolhido é recusado", () => {
    expect(validarClienteDaLoja({ tipo: "cadastrado", usuario: null })).toBe(
      "Escolha o cliente ou digite o nome de quem não tem cadastro."
    );
  });

  it("cadastrado com cliente escolhido passa", () => {
    expect(validarClienteDaLoja({ tipo: "cadastrado", usuario: USUARIOS[0] })).toBeNull();
  });

  it("sem cadastro precisa de pelo menos 3 letras, sem contar os espaços das pontas", () => {
    expect(validarClienteDaLoja({ tipo: "sem-cadastro", nome: "  Al  " })).toBe(
      "Informe o nome do cliente (pelo menos 3 letras)."
    );
    expect(validarClienteDaLoja({ tipo: "sem-cadastro", nome: "Ana" })).toBeNull();
  });
});

describe("clienteDoAtendimento", () => {
  it("cliente cadastrado leva o id e o nome da conta", () => {
    expect(clienteDoAtendimento({ tipo: "cadastrado", usuario: USUARIOS[0] })).toEqual({
      id: "1",
      nome: "João Silva",
    });
  });

  it("cliente sem cadastro fica sem id, com o nome limpo", () => {
    expect(clienteDoAtendimento({ tipo: "sem-cadastro", nome: "  Maria Oliveira " })).toEqual({
      id: null,
      nome: "Maria Oliveira",
    });
  });
});

describe("mascararCpf", () => {
  it("mostra só os dígitos do meio", () => {
    expect(mascararCpf("12345678901")).toBe("•••.456.789-••");
  });

  it("CPF fora do formato fica como veio", () => {
    expect(mascararCpf("123")).toBe("123");
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test --prefix frontend -- clienteDaLoja`
Expected: FAIL com `Failed to resolve import "./clienteDaLoja"` (ou "Cannot find module")

- [ ] **Step 4: Implementar `clienteDaLoja.ts`**

`frontend/src/crud/atendimentos/clienteDaLoja.ts`:

```ts
import type { ClienteDoAtendimento } from "../../tipos/atendimento";
import type { Usuario } from "../../tipos/usuario";
import { FILTROS_USUARIO_INICIAIS, filtrarUsuarios } from "../usuarios/filtrarUsuarios";

/**
 * Quem é o cliente quando um administrador abre o atendimento pela loja: uma conta
 * cadastrada (escolhida na busca; null enquanto não escolheu) ou só o nome de quem
 * não tem conta.
 */
export type EscolhaCliente =
  | { tipo: "cadastrado"; usuario: Usuario | null }
  | { tipo: "sem-cadastro"; nome: string };

/** O bloco "Cliente" começa na busca, sem ninguém escolhido. */
export const ESCOLHA_CLIENTE_INICIAL: EscolhaCliente = { tipo: "cadastrado", usuario: null };

// a partir de quantas letras a busca começa a sugerir, e quantas sugestões no máximo
const MIN_LETRAS_BUSCA = 2;
const MAX_SUGESTOES = 6;

/**
 * Sugestões da busca de cliente: só contas de cliente, por nome, e-mail ou CPF
 * (a mesma busca da gestão de usuários), em ordem alfabética.
 */
export function buscarClientes(usuarios: Usuario[], termo: string): Usuario[] {
  if (termo.trim().length < MIN_LETRAS_BUSCA) return [];
  return filtrarUsuarios(usuarios, { ...FILTROS_USUARIO_INICIAIS, busca: termo, perfil: "CLIENTE" }).slice(
    0,
    MAX_SUGESTOES
  );
}

/** O problema com a escolha do cliente, ou null se dá pra enviar. */
export function validarClienteDaLoja(escolha: EscolhaCliente): string | null {
  if (escolha.tipo === "cadastrado") {
    return escolha.usuario ? null : "Escolha o cliente ou digite o nome de quem não tem cadastro.";
  }
  return escolha.nome.trim().length >= 3 ? null : "Informe o nome do cliente (pelo menos 3 letras).";
}

/** O cliente que vai no pedido: a conta escolhida, ou só o nome (sem id) de quem não tem conta. */
export function clienteDoAtendimento(escolha: EscolhaCliente): ClienteDoAtendimento {
  if (escolha.tipo === "sem-cadastro") return { id: null, nome: escolha.nome.trim() };
  // depois do validarClienteDaLoja sempre tem usuário; o "?? " é só pro TypeScript
  return { id: escolha.usuario?.id ?? null, nome: escolha.usuario?.nome ?? "" };
}

/** "12345678901" → "•••.456.789-••": o atendente confere o cliente sem expor o CPF inteiro na tela. */
export function mascararCpf(cpf: string) {
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return cpf;
  return `•••.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-••`;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test --prefix frontend -- clienteDaLoja`
Expected: PASS (12 testes)

Run: `npm test --prefix frontend`, `npm run build --prefix frontend` e `npm run lint --prefix frontend`
Expected: tudo passa; lint só com o erro da linha de base

- [ ] **Step 6: Commit**

```bash
git add frontend/src/tipos/atendimento.ts frontend/src/crud/atendimentos/clienteDaLoja.ts frontend/src/crud/atendimentos/clienteDaLoja.test.ts
git commit -m "feat: regras do cliente no atendimento aberto pela loja (com Vitest)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: O pedido sabe de quem é

**Files:**
- Modify: `frontend/src/tipos/atendimento.ts`
- Modify: `frontend/src/dados/atendimentos.ts`
- Modify: `frontend/src/crud/atendimentos/novoAtendimento.test.ts`
- Modify: `frontend/src/contexto/ContextoAtendimentos.tsx`
- Modify: `frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx`
- Modify: `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx` (só o envio do cliente)

**Interfaces:**
- Consumes: `ClienteDoAtendimento` (Task 1); o provedor da agenda (`novosPorUsuario`, `ocupacoes`, `solicitarAtendimento`)
- Produces:
  - `Atendimento` e `DadosSolicitacao` com `cliente: ClienteDoAtendimento` e `abertoNaLoja: boolean`
  - `solicitarAtendimento(dados)` guarda em `dados.cliente.id ?? "balcao"`, com numeração única entre todas as contas

- [ ] **Step 1: Teste do `novoAtendimento` com os campos novos**

Em `frontend/src/crud/atendimentos/novoAtendimento.test.ts`, no objeto `DADOS`, logo depois da linha `horario: "13:30",`, acrescente:

```ts
  cliente: { id: "u1", nome: "Ana Souza" },
  abertoNaLoja: false,
```

Run: `npm test --prefix frontend -- novoAtendimento`
Expected: PASS. O `novoAtendimento` só espalha os dados, então já carrega os campos novos. O TypeScript acusa no build até o Step 2.

- [ ] **Step 2: Tipo e exemplos**

Em `frontend/src/tipos/atendimento.ts`, na `interface Atendimento`, logo depois da linha `fotos: string[];` (e do comentário dela), acrescente:

```ts
  /** de quem é o pedido: quem pediu pelo site, ou o cliente que a loja escolheu */
  cliente: ClienteDoAtendimento;
  /** true quando um administrador abriu o pedido pela loja (balcão) */
  abertoNaLoja: boolean;
```

Em `frontend/src/dados/atendimentos.ts`, nos dois exemplos, logo depois da linha `fotos: [],`, acrescente:

```ts
    cliente: { id: null, nome: "Cliente de exemplo" },
    abertoNaLoja: false,
```

- [ ] **Step 3: Provedor guarda pelo cliente do pedido**

Em `frontend/src/contexto/ContextoAtendimentos.tsx`:

1. Logo depois dos imports, acrescente:
   ```tsx
   // chave dos pedidos de quem não tem conta (abertos no balcão): não aparecem pra ninguém no site, mas ocupam a agenda
   const CHAVE_BALCAO = "balcao";
   ```
2. Troque a função `solicitarAtendimento` inteira (o `useCallback` com `[idUsuario]`) por:
   ```tsx
     const solicitarAtendimento = useCallback((dados: DadosSolicitacao) => {
       // o pedido fica com o cliente dele: quem pediu pelo site, ou o cliente que a loja escolheu
       const chave = dados.cliente.id ?? CHAVE_BALCAO;
       // a data do envio é pega aqui fora: a função do setState deve ser pura (o StrictMode chama ela 2 vezes)
       const agora = new Date();
       setNovosPorUsuario((atual) => {
         // numeração única entre todas as contas (como seria no banco), contando os exemplos
         const total = Object.values(atual).reduce((soma, lista) => soma + lista.length, 0);
         const novo = novoAtendimento(dados, total + ATENDIMENTOS_EXEMPLO.length, agora);
         return { ...atual, [chave]: [novo, ...(atual[chave] ?? [])] };
       });
     }, []);
   ```
3. No comentário do componente, troque a frase "Cada conta vê os próprios pedidos (pelo id do usuário logado) e os exemplos." por:
   ```
    * Cada pedido fica guardado com o cliente dele (id da conta, ou "balcao" pra quem
    * não tem conta); cada conta vê os próprios pedidos e os exemplos.
   ```

- [ ] **Step 4: Aba mostra "aberto na loja"**

Em `frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx`, troque o `<span>` do "Enviado em" por:

```tsx
                  <span>
                    Enviado em {new Date(atendimento.criadoEm).toLocaleDateString("pt-BR")}
                    {atendimento.abertoNaLoja && " · aberto na loja"}
                    {quantidadeFotos > 0 &&
                      ` · ${quantidadeFotos} ${quantidadeFotos === 1 ? "foto" : "fotos"}`}
                  </span>
```

- [ ] **Step 5: O cliente do site manda quem ele é**

Em `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx`:

1. Acrescente o import, depois do `useAtendimentos`:
   ```tsx
   import { useAutenticacao } from "../../../contexto/useAutenticacao";
   ```
2. Logo depois de `const navigate = useNavigate();`, acrescente:
   ```tsx
     const { usuario } = useAutenticacao();
   ```
3. No `solicitarAtendimento({ … })` do `enviar`, logo depois da linha `fotos: fotos.map((foto) => foto.url),`, acrescente:
   ```tsx
         // pedido feito pelo site: o cliente é quem está logado
         cliente: { id: usuario?.id ?? null, nome: usuario?.nome ?? "" },
         abertoNaLoja: false,
   ```

- [ ] **Step 6: Conferir**

Run: `npm test --prefix frontend`
Expected: PASS

Run: `npm run build --prefix frontend`
Expected: sem erro (todos os lugares que criam `Atendimento`/`DadosSolicitacao` têm os campos novos)

Run: `npm run lint --prefix frontend`
Expected: só o erro da linha de base

- [ ] **Step 7: Commit**

```bash
git add frontend/src/tipos/atendimento.ts frontend/src/dados/atendimentos.ts frontend/src/crud/atendimentos/novoAtendimento.test.ts frontend/src/contexto/ContextoAtendimentos.tsx frontend/src/paginas/portal/perfil/componentes/AbaAtendimentos/AbaAtendimentos.tsx frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx
git commit -m "feat: pedido de atendimento guarda o cliente e se foi aberto na loja" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Componente `SeletorCliente`

**Files:**
- Create: `frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorCliente/SeletorCliente.tsx`
- Create: `frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorCliente/SeletorCliente.css`

**Interfaces:**
- Consumes: `EscolhaCliente`, `buscarClientes` e `mascararCpf` (Task 1); `useUsuarios()` de `crud/usuarios/useUsuarios.ts`, que devolve `{ usuarios, carregando, erro, recarregar, … }` e busca `GET /users` com o token (só admin)
- Produces: `SeletorCliente({ escolha: EscolhaCliente; onChange: (escolha: EscolhaCliente) => void })`, que a Task 4 monta **só para admin**

- [ ] **Step 1: Componente**

`frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorCliente/SeletorCliente.tsx`:

```tsx
import { useState } from "react";
import type { KeyboardEvent } from "react";
import type { EscolhaCliente } from "../../../../../crud/atendimentos/clienteDaLoja";
import { buscarClientes, mascararCpf } from "../../../../../crud/atendimentos/clienteDaLoja";
import { useUsuarios } from "../../../../../crud/usuarios/useUsuarios";
import "./SeletorCliente.css";

interface SeletorClienteProps {
  escolha: EscolhaCliente;
  onChange: (escolha: EscolhaCliente) => void;
}

/**
 * Bloco "Cliente", que só o administrador vê ao abrir um atendimento pela loja:
 * busca o cliente entre as contas cadastradas (nome, e-mail ou CPF) ou, se a
 * pessoa não tem conta, deixa digitar só o nome.
 *
 * Usa o useUsuarios (GET /users, só de administrador): por isso a página só monta
 * este componente quando quem está logado é admin.
 */
export function SeletorCliente({ escolha, onChange }: SeletorClienteProps) {
  const { usuarios, carregando, erro, recarregar } = useUsuarios();
  // o que está digitado na busca (só existe enquanto ninguém foi escolhido)
  const [termo, setTermo] = useState("");
  const sugestoes = buscarClientes(usuarios, termo);

  function escolher(usuario: (typeof sugestoes)[number]) {
    setTermo("");
    onChange({ tipo: "cadastrado", usuario });
  }

  // Enter na busca escolhe a primeira sugestão; sem isso ele enviaria o formulário inteiro
  function aoApertarTecla(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== "Enter") return;
    evento.preventDefault();
    if (sugestoes[0]) escolher(sugestoes[0]);
  }

  if (escolha.tipo === "sem-cadastro") {
    return (
      <div className="seletor-cliente">
        <label className="seletor-cliente__campo">
          Nome do cliente
          <input
            type="text"
            value={escolha.nome}
            onChange={(e) => onChange({ tipo: "sem-cadastro", nome: e.target.value })}
            maxLength={150}
            placeholder="Ex.: Maria Oliveira"
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className="seletor-cliente__link"
          onClick={() => onChange({ tipo: "cadastrado", usuario: null })}
        >
          Buscar cliente cadastrado
        </button>
      </div>
    );
  }

  if (escolha.usuario) {
    const cliente = escolha.usuario;
    return (
      <div className="seletor-cliente">
        <div className="seletor-cliente__escolhido">
          <span className="seletor-cliente__avatar" aria-hidden="true">
            {cliente.nome.slice(0, 2).toUpperCase()}
          </span>
          <span className="seletor-cliente__dados">
            <strong>{cliente.nome}</strong>
            <span>
              {cliente.email} · CPF {mascararCpf(cliente.cpf)}
            </span>
          </span>
          <button
            type="button"
            className="seletor-cliente__trocar"
            onClick={() => onChange({ tipo: "cadastrado", usuario: null })}
          >
            Trocar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="seletor-cliente">
      <input
        type="search"
        className="seletor-cliente__busca"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onKeyDown={aoApertarTecla}
        placeholder="Buscar cliente por nome, e-mail ou CPF"
        aria-label="Buscar cliente por nome, e-mail ou CPF"
        autoComplete="off"
      />

      {carregando ? (
        <p className="seletor-cliente__estado">Carregando clientes…</p>
      ) : erro ? (
        <p className="seletor-cliente__estado" role="alert">
          {erro}{" "}
          <button type="button" className="seletor-cliente__link" onClick={recarregar}>
            Tentar novamente
          </button>
        </p>
      ) : termo.trim().length >= 2 && sugestoes.length === 0 ? (
        <p className="seletor-cliente__estado">
          Nenhum cliente encontrado. Se ele não tiver conta, use 'Cliente sem cadastro'.
        </p>
      ) : (
        sugestoes.length > 0 && (
          <ul className="seletor-cliente__sugestoes">
            {sugestoes.map((usuario) => (
              <li key={usuario.id}>
                <button type="button" className="seletor-cliente__sugestao" onClick={() => escolher(usuario)}>
                  <strong>{usuario.nome}</strong>
                  <span>{usuario.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      <button
        type="button"
        className="seletor-cliente__link"
        onClick={() => onChange({ tipo: "sem-cadastro", nome: "" })}
      >
        Cliente sem cadastro? Digitar o nome
      </button>
    </div>
  );
}

export default SeletorCliente;
```

- [ ] **Step 2: Estilo**

`frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorCliente/SeletorCliente.css`:

```css
.seletor-cliente {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.seletor-cliente__campo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-weight: 600;
  font-size: var(--font-size-small);
}

/* campos no padrão do formulário do perfil */
.seletor-cliente__busca,
.seletor-cliente__campo input {
  width: 100%;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  padding: 0.8rem 1rem;
  font-family: inherit;
  font-size: var(--font-size-body);
  background-color: var(--color-white);
}

.seletor-cliente__busca:focus,
.seletor-cliente__campo input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

/* sugestões da busca: uma lista colada embaixo do campo */
.seletor-cliente__sugestoes {
  list-style: none;
  margin: 0;
  padding: 0;
  background-color: var(--color-white);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  overflow: hidden;
}

.seletor-cliente__sugestoes li + li {
  border-top: 1px solid var(--color-border-soft);
}

.seletor-cliente__sugestao {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  padding: 0.7rem 1rem;
  background: none;
  border: none;
  text-align: left;
  font-family: inherit;
  font-size: var(--font-size-small);
  color: var(--color-primary);
  cursor: pointer;
}

.seletor-cliente__sugestao span {
  color: var(--color-text-muted);
  overflow-wrap: anywhere; /* e-mail comprido quebra em vez de estourar no celular */
}

.seletor-cliente__sugestao:hover {
  background-color: #e2effa;
}

.seletor-cliente__sugestao:focus-visible {
  background-color: #e2effa;
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

/* cliente escolhido: card com borda azul, como um card selecionado */
.seletor-cliente__escolhido {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--color-white);
  border: 2px solid var(--color-accent);
  border-radius: 10px;
}

.seletor-cliente__avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-store-button);
  color: var(--color-primary);
  font-weight: 700;
  font-size: var(--font-size-small);
}

.seletor-cliente__dados {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.seletor-cliente__dados strong {
  color: var(--color-primary);
  font-size: var(--font-size-small);
}

.seletor-cliente__dados span {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  overflow-wrap: anywhere;
}

/* botões com cara de link (Trocar, sem cadastro, voltar pra busca, tentar de novo) */
.seletor-cliente__trocar,
.seletor-cliente__link {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  color: var(--color-accent);
  font-weight: 600;
  font-size: var(--font-size-small);
  cursor: pointer;
}

.seletor-cliente__link {
  align-self: flex-start;
}

.seletor-cliente__trocar:hover,
.seletor-cliente__link:hover {
  text-decoration: underline;
}

.seletor-cliente__estado {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}
```

- [ ] **Step 3: Conferir**

Run: `npm run build --prefix frontend`, `npm run lint --prefix frontend` e `npm test --prefix frontend`
Expected: build sem erro; lint só com a linha de base; testes passando. O componente ainda não é usado; quem liga ele é a Task 4.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/paginas/portal/solicitar-atendimento/componentes/SeletorCliente/
git commit -m "feat: seletor de cliente pro atendimento aberto pela loja" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Modo admin na página + card no painel

**Files:**
- Modify: `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx`
- Modify: `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.css`
- Modify: `frontend/src/paginas/admin/inicio/inicio.tsx`

**Interfaces:**
- Consumes:
  - `EscolhaCliente`, `ESCOLHA_CLIENTE_INICIAL`, `validarClienteDaLoja` e `clienteDoAtendimento` (Task 1);
  - os campos `cliente`/`abertoNaLoja` (Task 2);
  - `SeletorCliente` (Task 3);
  - `useAutenticacao()` → `{ usuario, ehAdmin }`;
  - `contatoDoUsuario(usuario | null)`;
  - do plano da agenda: `RASCUNHO_INICIAL`, `formatarAgendamento` e `nomeDoTecnico`.
- Produces: a página no modo admin (comportamento final; nada depende dela)

- [ ] **Step 1: Imports e estado**

Em `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx`:

1. Acrescente os imports:
   ```tsx
   import {
     ESCOLHA_CLIENTE_INICIAL,
     clienteDoAtendimento,
     validarClienteDaLoja,
   } from "../../../crud/atendimentos/clienteDaLoja";
   import type { EscolhaCliente } from "../../../crud/atendimentos/clienteDaLoja";
   import { SeletorCliente } from "./componentes/SeletorCliente/SeletorCliente";
   ```
2. Troque `const { usuario } = useAutenticacao();` por `const { usuario, ehAdmin } = useAutenticacao();`.
3. Logo depois do `const enviadoRef = useRef(false);`, acrescente:
   ```tsx
     // admin abrindo pela loja: quem é o cliente, o erro do bloco "Cliente" e o aviso depois do envio
     const [escolhaCliente, setEscolhaCliente] = useState<EscolhaCliente>(ESCOLHA_CLIENTE_INICIAL);
     const [erroCliente, setErroCliente] = useState<string | null>(null);
     const [avisoLoja, setAvisoLoja] = useState<string | null>(null);
   ```

- [ ] **Step 2: De onde vem o contato**

Troque o trecho

```tsx
  // o contato é derivado a cada renderização, em vez de um useEffect copiar o perfil pro estado
  const contatoPerfil = contatoDoUsuario(perfil);
  const contato = contatoEditado ?? contatoPerfil;
  const perfilTemContato = Object.keys(validarContato(contatoPerfil)).length === 0;
  const mostrarCamposContato = editandoContato || !perfilTemContato;
```

por

```tsx
  // de onde vem o contato: pro admin, da conta do cliente escolhido (sem cadastro, de lugar nenhum);
  // pro cliente, do próprio perfil. O endereço do admin nunca entra num pedido de outra pessoa
  const usuarioBase = ehAdmin ? (escolhaCliente.tipo === "cadastrado" ? escolhaCliente.usuario : null) : perfil;
  // o contato é derivado a cada renderização, em vez de um useEffect copiar a base pro estado
  const contatoBase = contatoDoUsuario(usuarioBase);
  const contato = contatoEditado ?? contatoBase;
  const baseTemContato = Object.keys(validarContato(contatoBase)).length === 0;
  const mostrarCamposContato = editandoContato || !baseTemContato;
  // só o cliente espera o próprio perfil carregar; o admin usa a conta do cliente escolhido
  const esperandoPerfil = !ehAdmin && carregandoPerfil;
```

Depois, no resto do arquivo, troque **todas** as ocorrências que sobraram:
- `contatoPerfil` → `contatoBase` (no `atualizarContato` e no `usarContatoDoPerfil`);
- `perfilTemContato` → `baseTemContato` (no JSX do botão "Usar o endereço…");
- `carregandoPerfil` → `esperandoPerfil` (no `{carregandoPerfil ? (` do bloco de contato e no `disabled`/`aria-busy` do botão de enviar). Mantenha a desestruturação `carregando: carregandoPerfil` do `usePerfil()`.

- [ ] **Step 3: Trocar de cliente**

Logo depois da função `usarContatoDoPerfil`, acrescente:

```tsx
  // outro cliente, outro contato: o que foi digitado pro cliente anterior é descartado
  function escolherCliente(escolha: EscolhaCliente) {
    setEscolhaCliente(escolha);
    setContatoEditado(null);
    setEditandoContato(false);
    setErroCliente(null);
    setAvisoLoja(null);
    (Object.keys(contatoBase) as (keyof ContatoAtendimento)[]).forEach(limparErro);
  }
```

- [ ] **Step 4: Envio do admin**

No `enviar`:

1. Troque o bloco
   ```tsx
       const encontrados = validarSolicitacao(completo, new Date(), ocupacoes);
       if (Object.keys(encontrados).length > 0) {
         setErros(encontrados);
   ```
   por
   ```tsx
       const encontrados = validarSolicitacao(completo, new Date(), ocupacoes);
       // pela loja, o cliente também precisa estar escolhido
       const problemaCliente = ehAdmin ? validarClienteDaLoja(escolhaCliente) : null;
       setErroCliente(problemaCliente);
       if (Object.keys(encontrados).length > 0 || problemaCliente) {
         setErros(encontrados);
   ```
2. No `solicitarAtendimento({ … })`, troque as linhas que a Task 2 acrescentou
   ```tsx
         // pedido feito pelo site: o cliente é quem está logado
         cliente: { id: usuario?.id ?? null, nome: usuario?.nome ?? "" },
         abertoNaLoja: false,
   ```
   por
   ```tsx
         cliente,
         abertoNaLoja: ehAdmin,
   ```
   e, logo antes da linha `enviadoRef.current = true;`, acrescente:
   ```tsx
       // pela loja, o cliente é o escolhido no bloco "Cliente"; pelo site, é quem está logado
       const cliente = ehAdmin
         ? clienteDoAtendimento(escolhaCliente)
         : { id: usuario?.id ?? null, nome: usuario?.nome ?? "" };
   ```
3. Logo depois da linha `const agendamento = formatarAgendamento(…);`, acrescente:
   ```tsx
       if (ehAdmin) {
         // no balcão o atendente abre vários seguidos: fica na página, com o aviso e o formulário limpo
         setAvisoLoja(`Atendimento aberto para ${cliente.nome}: ${agendamento}.`);
         setRascunho(RASCUNHO_INICIAL);
         setEscolhaCliente(ESCOLHA_CLIENTE_INICIAL);
         setContatoEditado(null);
         setEditandoContato(false);
         setErros({});
         // as fotos foram pro pedido: só esvazia o campo, sem revogar as URLs
         mudarFotos([]);
         // libera o próximo envio (o formulário já está limpo, então um clique repetido só mostra os erros)
         enviadoRef.current = false;
         window.scrollTo(0, 0);
         return;
       }
   ```

- [ ] **Step 5: JSX do modo admin**

1. Logo antes do `<h1 className="pagina-atendimento__titulo">`, acrescente:
   ```tsx
             {ehAdmin && <span className="pagina-atendimento__etiqueta-loja">Abrindo pela loja</span>}
   ```
2. Troque o texto do `<p className="pagina-atendimento__subtitulo">` por:
   ```tsx
               {ehAdmin
                 ? "Preencha com os dados do cliente que está sendo atendido."
                 : "Conte o que está acontecendo com a sua piscina e a Bruxel confirma a visita com você."}
   ```
3. Logo depois do `</p>` do subtítulo e antes do comentário `{/* noValidate: … */}`, acrescente:
   ```tsx
             {avisoLoja && (
               <p className="pagina-atendimento__aviso" role="status">
                 {avisoLoja}
               </p>
             )}
   ```
4. Logo depois da abertura do `<form …>`, antes do `<fieldset>` do "Tipo de serviço", acrescente:
   ```tsx
               {/* só pra admin: vira o bloco 1 (o counter do CSS renumera os outros sozinho) */}
               {ehAdmin && (
                 <fieldset className="pagina-atendimento__bloco">
                   <legend className="pagina-atendimento__titulo-bloco">Cliente</legend>
                   <SeletorCliente escolha={escolhaCliente} onChange={escolherCliente} />
                   {erroCliente && (
                     <p className="pagina-atendimento__erro" role="alert">
                       {erroCliente}
                     </p>
                   )}
                 </fieldset>
               )}
   ```
5. No bloco de contato:
   - troque `<legend className="pagina-atendimento__titulo-bloco">Onde e como falar com você</legend>` por
     ```tsx
                   <legend className="pagina-atendimento__titulo-bloco">
                     {ehAdmin ? "Onde e como falar com o cliente" : "Onde e como falar com você"}
                   </legend>
     ```
   - troque o texto do botão `Usar o endereço do meu perfil` por
     `{ehAdmin ? "Usar o endereço da conta do cliente" : "Usar o endereço do meu perfil"}`;
   - troque o texto da última dica (`Vale só pra este atendimento: o endereço do seu perfil não muda.`) por
     ```tsx
                     {ehAdmin
                       ? "Vale só pra este atendimento."
                       : "Vale só pra este atendimento: o endereço do seu perfil não muda."}
     ```

Em `frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.css`, logo depois da regra `.pagina-atendimento__subtitulo`, acrescente:

```css
/* etiqueta que lembra o admin que ele está abrindo pelo balcão */
.pagina-atendimento__etiqueta-loja {
  display: inline-block;
  margin-bottom: 0.5rem;
  background-color: var(--color-store-button);
  color: var(--color-primary);
  border-radius: 999px;
  padding: 0.2rem 0.75rem;
  font-size: var(--font-size-small);
  font-weight: 600;
}

/* aviso verde depois que o admin abre um atendimento (o formulário volta limpo embaixo) */
.pagina-atendimento__aviso {
  max-width: 820px;
  margin: 0 0 1rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background-color: #e3f5e8;
  color: #1e7a3c;
  font-weight: 600;
  font-size: var(--font-size-small);
}
```

- [ ] **Step 6: Card no painel**

Em `frontend/src/paginas/admin/inicio/inicio.tsx`, na lista `AREAS_ADMIN`, logo depois do item `clientes` (antes do `];`), acrescente:

```tsx
  {
    id: "atendimento",
    titulo: "Abrir atendimento",
    descricao: "Para um cliente que está na loja",
    rota: "/solicitar-atendimento",
    icone: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5" />
      </svg>
    ),
  },
```

- [ ] **Step 7: Conferir**

Run: `npm test --prefix frontend`
Expected: PASS

Run: `npm run build --prefix frontend`
Expected: sem erro

Run: `npm run lint --prefix frontend`
Expected: só o erro da linha de base

Run: `grep -n "contatoPerfil\|perfilTemContato" frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx`
Expected: nenhuma linha

- [ ] **Step 8: Commit**

```bash
git add frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx frontend/src/paginas/portal/solicitar-atendimento/solicitar-atendimento.css frontend/src/paginas/admin/inicio/inicio.tsx
git commit -m "feat: admin abre atendimento pela loja no lugar do cliente" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Verificação no navegador (controller, depois da Task 4)

Use o backend na 3000 e o frontend na 5173. Pro modo admin, o Eduardo entra com a conta de admin dele no pane, ou eu promovo a conta de teste no banco local **só com autorização dele**.

1. **Como cliente** (conta de teste): o formulário fica igual ao da agenda. Não aparece o bloco "Cliente", e nas requisições de rede não há nenhum `GET /api/users` (só o `/api/users/:id` do perfil).
2. **Como admin:**
   - aparecem a etiqueta "Abrindo pela loja", o subtítulo da loja e o bloco "1. Cliente". Os outros blocos passam a ser 2 a 6;
   - o endereço do próprio admin não aparece no contato.
3. **Busca:**
   - "cliente teste" sem acento sugere a conta de teste;
   - Enter escolhe a primeira sugestão sem enviar o formulário;
   - escolher mostra o card com o CPF mascarado e preenche o contato com o que a conta tem;
   - "Trocar" volta pra busca vazia.
4. **Sem cadastro:**
   - "Cliente sem cadastro? Digitar o nome" mostra o campo de nome, e o contato abre vazio;
   - enviar com "Al" mostra "Informe o nome do cliente (pelo menos 3 letras).";
   - "Buscar cliente cadastrado" volta pra busca.
5. **Enviar sem cliente** mostra "Escolha o cliente ou digite o nome de quem não tem cadastro." no bloco 1.
6. **Envio válido:**
   - a página continua, com o aviso "Atendimento aberto para …: … às … com …." no topo;
   - o formulário fica limpo (sem cliente, tipo, descrição, fotos nem horário) e a página está no topo;
   - um segundo envio seguido funciona.
7. **Agenda:** reabrindo a escolha do mesmo atendente e dia, o horário que o admin pegou aparece ocupado.
8. **Minha conta do cliente:** saindo e entrando com a conta do cliente escolhido na mesma aba, o pedido aparece na aba Atendimentos com "· aberto na loja".
9. **Painel:** o `/admin` mostra o card "Abrir atendimento", que leva pro formulário.
10. **Celular:** em 375px não há rolagem horizontal, e as sugestões e o card do cliente cabem na tela.
11. **Console:** sem erros de código. O 403 do perfil do cliente é esperado.
