# Integração inicial front ↔ back (fluxo de usuários) — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ligar o fluxo de usuários do frontend à API real: cadastro, login com sessão JWT, proteção do `/admin` e CRUD de usuários no painel.

**Architecture:** O front ganha uma camada `src/api/` (um `fetch` próprio que transforma qualquer falha em `ErroApi`, mais funções tipadas por recurso) e uma sessão em React Context salva no `localStorage`. As páginas continuam falando só com hooks e contexto. No back entra um ajuste mínimo: o login devolve o `perfil` e os controllers de auth e usuários deixam os erros chegarem ao handler global, que já devolve os status certos.

**Tech Stack:** React 19, TypeScript ~6, React Router 7, Vite 8 (front) · Node, Express 5, Prisma 7, PostgreSQL 18, JWT (back).

**Spec:** [docs/superpowers/specs/2026-10-07-integracao-usuarios-design.md](../specs/2026-10-07-integracao-usuarios-design.md)

## Global Constraints

- **Sem dependências novas**, nem no front nem no back.
- **Sem framework de testes** (decisão do Eduardo). A verificação de cada tarefa é `tsc` + lint + checagem manual no navegador ou com `curl`.
- **Nomes em pt-BR** (arquivos, funções, variáveis, comentários), como nos refactors recentes. Os nomes em inglês que já existem nas páginas (`handleCreate`, `editingId`...) ficam como estão.
- **Comentários curtos em pt-BR explicando o porquê.** JSDoc em componentes e funções exportadas, no estilo dos arquivos atuais.
- **Endereço da API:** `VITE_API_URL`, padrão `http://localhost:3000/api`.
- **Chave da sessão no `localStorage`:** `bruxel:sessao`, com `{ token, usuario }`.
- **Textos exatos:**
  - "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
  - "Erro inesperado (status X)."
  - "Conta criada! Entre com seu e-mail e senha."
  - "Carregando usuários…"
  - "Nome e e-mail são obrigatórios."
- **Lint:** a linha de base tem **1 erro** já existente (`ContextoCarrinho.tsx:107`, `react-refresh/only-export-components`). Nenhuma tarefa pode acrescentar erro. Esse erro não é corrigido aqui.
- **Fora do escopo:** `productsController.ts`, produtos, loja e `/perfil`.
- **Branch e PR:** trabalhar na `feat/integracao-usuarios`. Nunca dar push na `main`; tudo entra via PR.
- **OneDrive + Vite:** o repositório fica no OneDrive e o watcher do Vite às vezes serve versão antiga. Antes de testar no navegador, dar `touch` nos arquivos editados. Se algo "impossível" acontecer, conferir com `fetch('/src/...')` o que está sendo servido.
- **Mensagens de commit:** formato `tipo: descrição` em pt-BR, terminando com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Ajustes em relação à spec (decididos ao planejar)

1. **`fazerLogin` em vez de `entrar`:** a função da API se chama `fazerLogin(email, senha)`, para não colidir com o `entrar()` do contexto.
2. **Contexto em três arquivos, por causa do lint:** `contexto/sessao.ts` (localStorage + validade do JWT), `contexto/useAutenticacao.ts` (o `createContext` e o hook) e `contexto/ContextoAutenticacao.tsx` (só o componente provedor).
3. **Menu em padrão "disclosure":** um botão com `aria-expanded` e `aria-controls` e uma lista de links. `role="menu"` exigiria navegação por setas.
4. **Fechar ao mudar de rota não precisa de código:** cada página renderiza o próprio `<Cabecalho />`, então trocar de rota remonta o menu já fechado.
5. **E-mail do login normalizado no front:** o contexto manda o e-mail com `trim().toLowerCase()`, porque o cadastro salva em minúsculas e o login do back compara exatamente.

## Review Focus

1. **E-mail com maiúsculas no login** ("Ana@Email.com" depois de cadastrar assim): precisa entrar, porque o banco guardou "ana@email.com". O teste fica na Task 4, Step 8, item f.
2. **Duplo clique em "Criar conta", "Entrar" ou "Salvar":** só uma requisição pode sair, com o botão desabilitado enquanto espera. O teste fica na Task 4, Step 8, item d, e na Task 5, Step 6, item m.
3. **Texto acima do tamanho da coluna** (UF com 3 letras, CEP com 9 dígitos, número com 11 caracteres): o input não deixa digitar, em vez de o back devolver 500. O teste fica na Task 5, Step 6, item e.
4. **Salvar a edição com nome ou e-mail apagados:** a tela barra com "Nome e e-mail são obrigatórios.", porque o back não valida o update. O teste fica na Task 5, Step 6, item g.
5. **`localStorage` com lixo** (JSON quebrado, token sem 3 partes, `exp` vencido): o site carrega deslogado, sem tela branca, e apaga a chave. O teste fica na Task 3, Step 7.

---

### Task 1: Backend — `perfil` no login e status de erro corretos

**Files:**
- Modify: `backend/src/service/authService.ts`
- Modify: `backend/src/controller/authController.ts` (arquivo inteiro)
- Modify: `backend/src/controller/userController.ts` (arquivo inteiro)
- Modify: `.claude/launch.json`
- Create (local, ignorado pelo git): `backend/.env`

**Interfaces:**
- Produces: `POST /api/auth/login` → `200 { mensagem, token, user: { id, email, nome, perfil } }`. Os erros de `/api/auth/*` e `/api/users*` saem pelo handler global do `server.ts` no formato `{ mensagem, erros? }`, com status 400, 404 ou 409 vindos do `AppError` ou do Prisma.

- [ ] **Step 1: Preparar o ambiente do back**

```bash
cd backend
cp .env.example .env
npm install
npm run db:generate
```

Esperado: o `npm install` termina sem erro e o `db:generate` cria `src/generated/prisma/`. Se o `db:generate` reclamar de config, rodar `npx prisma generate --config prisma7.config.ts` e anotar para o PR (o script do `package.json` não aponta para o `prisma7.config.ts`).

- [ ] **Step 2: Conferir o banco**

```bash
PGPASSWORD=bruxel "/c/Program Files/PostgreSQL/18/bin/psql.exe" -U bruxel -h localhost -d bruxel -c "select 1"
```

- Se responder `1`, rodar `npm run db:migrate` dentro de `backend/`. Se reclamar de config, usar `npx prisma migrate deploy --config prisma7.config.ts`. Esperado: migração `0_init` aplicada, ou "No pending migrations".
- Se falhar com "password authentication failed" ou "database does not exist": **parar e pedir ao Eduardo** para rodar os dois comandos `psql -U postgres ...` do README. Eles exigem a senha do `postgres`, que só ele tem.

- [ ] **Step 3: Adicionar `backend-dev` no `.claude/launch.json`**

Conteúdo final do arquivo:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "frontend-dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev", "--prefix", "frontend"],
      "port": 5173
    },
    {
      "name": "backend-dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev", "--prefix", "backend"],
      "port": 3000
    }
  ]
}
```

- [ ] **Step 4: Login devolve o `perfil`** (`backend/src/service/authService.ts`)

Trocar os imports e a interface do topo por:

```ts
import {UserRepository} from "../repository/userRepository";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {AppError} from "../errors/AppError";
import {perfil_usuario} from "../generated/prisma/enums";

export interface AuthRequestDTO {
    email: string;
    senha: string;
}

interface AuthResponseDTO {
    token: string;
    user: {
        id: string;
        email: string;
        nome: string;
        // o front usa o perfil pra liberar (ou não) o painel admin
        perfil: perfil_usuario;
    }
}
```

E, no `return` do `execute`, trocar o objeto `user` por:

```ts
            user: {
                id: user.id,
                email: user.email,
                nome: user.nome,
                perfil: user.perfil
            }
```

- [ ] **Step 5: `authController.ts` sem `try/catch`** (arquivo inteiro)

```ts
import {Request, Response} from 'express';
import {AuthService, AuthRequestDTO} from '../service/authService';
import {UserRepository} from "../repository/userRepository";

// sem try/catch: no Express 5, um erro lançado num handler async vai direto pro
// handler global do server.ts, que responde com o status certo (ex.: 400 no login errado)
export class AuthController {
    async login(req: Request, res: Response): Promise<Response> {
        const {email, senha}: AuthRequestDTO = req.body;

        const userRepository = new UserRepository();
        const autenticaUsuario = new AuthService(userRepository);
        const resultadoAuth = await autenticaUsuario.execute({email, senha});

        return res.status(200).json({
            mensagem: "Login realizado com sucesso",
            ...resultadoAuth
        });
    }
}
```

- [ ] **Step 6: `userController.ts` sem `try/catch`** (arquivo inteiro)

```ts
import {Request, Response} from "express";
import {UserService} from "../service/userService";

// controller de usuários, cuida da parte de requisições e respostas HTTP
// sem try/catch: no Express 5, um erro lançado num handler async vai direto pro
// handler global do server.ts, que devolve o status certo (AppError: 400/404/409;
// Prisma: P2002 → 409, P2025 → 404)
export class UserController {
    private userService = new UserService();

    create = async (req: Request, res: Response) => {
        const user = req.body;
        const result = await this.userService.create(user);
        return res.status(201).json(result);
    }

    getAll = async (req: Request, res: Response) => {
        const result = await this.userService.getAll();
        return res.status(200).json(result);
    }

    getById = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const result = await this.userService.getById(id);
        return res.status(200).json(result);
    }

    update = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const data = req.body;
        const result = await this.userService.update(id, data);
        return res.status(200).json(result);
    }

    delete = async (req: Request, res: Response) => {
        const id = String(req.params.id);
        const result = await this.userService.delete(id);
        return res.status(200).json(result);
    }
}
```

- [ ] **Step 7: Checar os tipos**

```bash
cd backend && npx tsc --noEmit
```

Esperado: sem saída (exit 0).

- [ ] **Step 8: Subir o back e conferir as respostas**

Subir com `preview_start` `{ name: "backend-dev" }` e esperar "Servidor rodando na porta 3000" nos logs. Depois, rodar no Bash:

```bash
# 1. login com usuário que não existe → 400
curl -s -w "\n%{http_code}\n" -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"ninguem@bruxel.test","senha":"errada"}'
# 2. cadastro sem campos → 400 com a lista de erros
curl -s -w "\n%{http_code}\n" -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"nome":"Teste"}'
# 3. cadastro válido → 201
curl -s -w "\n%{http_code}\n" -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"nome":"Cliente Teste","email":"cliente.teste@bruxel.test","senha":"senha-teste-123","cpf":"11122233344"}'
# 4. mesmo CPF de novo → 409
curl -s -w "\n%{http_code}\n" -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"nome":"Cliente Teste","email":"outro@bruxel.test","senha":"senha-teste-123","cpf":"11122233344"}'
# 5. login válido → 200 com user.perfil
curl -s -w "\n%{http_code}\n" -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"cliente.teste@bruxel.test","senha":"senha-teste-123"}'
# 6. listar sem token → 401
curl -s -w "\n%{http_code}\n" http://localhost:3000/api/users
```

Esperado, na ordem:
1. `{"mensagem":"E-mail ou senha incorretos."}` com `400`.
2. `{"mensagem":"Dados inválidos.","erros":[{"campo":"email",...},{"campo":"senha",...},{"campo":"cpf",...}]}` com `400`.
3. O usuário criado (sem `senha`, `perfil: "CLIENTE"`) com `201`.
4. `{"mensagem":"Um usuário com esse CPF já existe."}` com `409`.
5. `{"mensagem":"Login realizado com sucesso","token":"...","user":{...,"perfil":"CLIENTE"}}` com `200`.
6. `{"mensagem":"Token não fornecido."}` com `401`.

Se o caso 3 der 409 porque o usuário já existe de uma rodada anterior, também está certo.

- [ ] **Step 9: Criar a conta de admin de teste**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"nome":"Admin Teste","email":"admin.teste@bruxel.test","senha":"senha-teste-123","cpf":"55566677788"}'
PGPASSWORD=bruxel "/c/Program Files/PostgreSQL/18/bin/psql.exe" -U bruxel -h localhost -d bruxel -c "UPDATE users SET perfil = 'ADMINISTRADOR' WHERE email = 'admin.teste@bruxel.test';"
```

Esperado: `201` (ou `409` se já existir) e `UPDATE 1`.

- [ ] **Step 10: Commit**

```bash
git add backend/src/service/authService.ts backend/src/controller/authController.ts backend/src/controller/userController.ts .claude/launch.json
git commit -m "fix: login devolve o perfil e erros de usuários saem com o status certo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Front — cliente HTTP, funções da API e tipos

**Files:**
- Create: `frontend/src/api/cliente.ts`
- Create: `frontend/src/api/autenticacao.ts`
- Create: `frontend/src/api/usuarios.ts`
- Create: `frontend/src/vite-env.d.ts`
- Create: `frontend/.env.example`
- Create (local, ignorado): `frontend/.env`
- Modify: `frontend/src/tipos/usuario.ts` (arquivo inteiro)

**Interfaces:**
- Produces (`api/cliente.ts`):
  - `class ErroApi extends Error { status: number; mensagem: string; erros?: ErroCampo[] }`
  - `interface ErroCampo { campo: string; mensagem: string }`
  - `requisicao<T>(caminho: string, opcoes?: { metodo?: "GET"|"POST"|"PUT"|"DELETE"; corpo?: unknown; token?: string | null }): Promise<T>`
  - `mensagemDeErro(falha: unknown): string`
- Produces (`api/autenticacao.ts`): `interface RespostaLogin { mensagem: string; token: string; user: UsuarioSessao }` e `fazerLogin(email: string, senha: string): Promise<RespostaLogin>`.
- Produces (`api/usuarios.ts`):
  - `interface DadosNovoUsuario { nome; email; cpf; senha }` (todos `string`)
  - `type CamposAtualizacaoUsuario`
  - `listarUsuarios(token: string): Promise<Usuario[]>`
  - `criarUsuario(dados: DadosNovoUsuario): Promise<Usuario>`
  - `atualizarUsuario(token: string, id: string, campos: CamposAtualizacaoUsuario): Promise<Usuario>`
  - `excluirUsuario(token: string, id: string): Promise<Usuario>`
- Produces (`tipos/usuario.ts`): campos opcionais de `Usuario` como `string | null`, e `type UsuarioSessao = Pick<Usuario, "id" | "nome" | "email" | "perfil">`.

- [ ] **Step 1: `frontend/.env.example` e o `.env` local**

`frontend/.env.example`:

```
# endereço da API (backend). Copie este arquivo para .env e ajuste se o back rodar em outro lugar
VITE_API_URL=http://localhost:3000/api
```

```bash
cp frontend/.env.example frontend/.env
```

- [ ] **Step 2: `frontend/src/vite-env.d.ts`**

```ts
// tipos das variáveis do frontend/.env (o Vite só expõe pro código as que começam com VITE_)
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
```

- [ ] **Step 3: `frontend/src/tipos/usuario.ts`** (arquivo inteiro)

```ts
/**
 * Dados de um usuário da Bruxel. Os campos têm os mesmos nomes da tabela
 * `users` do banco. A senha não fica aqui: o front só a envia no cadastro/login.
 *
 * Os campos opcionais podem vir `null` da API (coluna vazia no banco).
 */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  /** CPF só com dígitos (11 caracteres), igual ao banco */
  cpf: string;
  telefone?: string | null;
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  /** sigla com 2 letras, ex.: "RS" */
  estado?: string | null;
  /** só dígitos (8 caracteres) */
  cep?: string | null;
  perfil: "CLIENTE" | "ADMINISTRADOR";
}

/** O usuário logado, do jeito que o POST /auth/login devolve (só o básico). */
export type UsuarioSessao = Pick<Usuario, "id" | "nome" | "email" | "perfil">;
```

- [ ] **Step 4: `frontend/src/api/cliente.ts`**

```ts
/**
 * Cliente HTTP do front: o único lugar que chama o fetch. As funções de
 * api/autenticacao.ts e api/usuarios.ts usam a requisicao() daqui, então
 * endereço da API, JSON, token e tratamento de erro ficam todos num lugar só.
 */

// endereço base da API; vem do frontend/.env (ver .env.example)
const URL_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

/** Erro de validação de um campo, no formato do validaObrigatorios do backend. */
export interface ErroCampo {
  campo: string;
  mensagem: string;
}

/**
 * Erro de uma chamada à API. `status` 0 = a requisição nem chegou no servidor
 * (backend desligado, sem rede); os outros valores são o status HTTP da resposta.
 */
export class ErroApi extends Error {
  status: number;
  /** texto pronto pra mostrar na tela */
  mensagem: string;
  /** erros por campo, quando o backend recusa os dados (status 400) */
  erros?: ErroCampo[];

  constructor(status: number, mensagem: string, erros?: ErroCampo[]) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
    this.mensagem = mensagem;
    this.erros = erros;
  }
}

interface OpcoesRequisicao {
  metodo?: "GET" | "POST" | "PUT" | "DELETE";
  /** objeto enviado como JSON no corpo */
  corpo?: unknown;
  /** JWT do usuário logado; vai no header Authorization */
  token?: string | null;
}

/**
 * Chama a API e devolve o JSON da resposta já com o tipo T. Qualquer falha
 * (sem conexão, status fora de 2xx) vira um ErroApi, então quem chama só
 * precisa de um try/catch.
 */
export async function requisicao<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const { metodo = "GET", corpo, token } = opcoes;

  const headers: Record<string, string> = {};
  if (corpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${URL_BASE}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    // o fetch só lança quando não existe resposta nenhuma (servidor fora do ar, sem rede)
    throw new ErroApi(0, "Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
  }

  // corpo vazio ou que não é JSON (ex.: página HTML de erro do Express) vira null
  const dados: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) throw paraErroApi(resposta.status, dados);
  return dados as T;
}

// monta o ErroApi a partir do corpo de erro do backend: { mensagem, erros? }
function paraErroApi(status: number, dados: unknown): ErroApi {
  if (dados && typeof dados === "object" && "mensagem" in dados) {
    const { mensagem, erros } = dados as { mensagem: string; erros?: unknown };
    const errosCampos = Array.isArray(erros) ? (erros as ErroCampo[]) : undefined;
    // em erro de validação a mensagem é genérica ("Dados inválidos."); as dos campos dizem o que falta
    const texto = errosCampos?.length
      ? errosCampos.map((erro) => erro.mensagem.trim()).join(" ")
      : mensagem;
    return new ErroApi(status, texto, errosCampos);
  }
  return new ErroApi(status, `Erro inesperado (status ${status}).`);
}

/** Texto pra mostrar na tela a partir de qualquer erro pego num catch. */
export function mensagemDeErro(falha: unknown): string {
  return falha instanceof ErroApi ? falha.mensagem : "Algo deu errado. Tente novamente.";
}
```

- [ ] **Step 5: `frontend/src/api/autenticacao.ts`**

```ts
import { requisicao } from "./cliente";
import type { UsuarioSessao } from "../tipos/usuario";

/** Resposta do POST /auth/login. */
export interface RespostaLogin {
  mensagem: string;
  /** JWT (vale 5 dias); vai no header Authorization das rotas protegidas */
  token: string;
  user: UsuarioSessao;
}

/**
 * Faz login na API. Quem guarda o token e o usuário é o ContextoAutenticacao
 * (use o entrar() dele nas telas, não esta função direto).
 */
export function fazerLogin(email: string, senha: string) {
  return requisicao<RespostaLogin>("/auth/login", { metodo: "POST", corpo: { email, senha } });
}
```

- [ ] **Step 6: `frontend/src/api/usuarios.ts`**

```ts
import { requisicao } from "./cliente";
import type { Usuario } from "../tipos/usuario";

/** O que o cadastro envia (POST /users). O perfil o banco define sozinho (CLIENTE). */
export interface DadosNovoUsuario {
  nome: string;
  email: string;
  /** só dígitos, igual ao banco */
  cpf: string;
  senha: string;
}

/** Campos que o PUT /users/:id aceita; o backend ignora o resto (inclusive o CPF). */
export type CamposAtualizacaoUsuario = Partial<
  Pick<Usuario, "nome" | "email" | "telefone" | "rua" | "numero" | "bairro" | "cidade" | "estado" | "cep">
>;

/** Lista todos os usuários (só administrador). */
export function listarUsuarios(token: string) {
  return requisicao<Usuario[]>("/users", { token });
}

// o cadastro é público (não manda token): é assim que um visitante cria a conta
export function criarUsuario(dados: DadosNovoUsuario) {
  return requisicao<Usuario>("/users", { metodo: "POST", corpo: dados });
}

/** Altera só os campos enviados e devolve o usuário atualizado (só administrador). */
export function atualizarUsuario(token: string, id: string, campos: CamposAtualizacaoUsuario) {
  return requisicao<Usuario>(`/users/${id}`, { metodo: "PUT", corpo: campos, token });
}

/** Apaga o usuário e devolve os dados dele (só administrador). */
export function excluirUsuario(token: string, id: string) {
  return requisicao<Usuario>(`/users/${id}`, { metodo: "DELETE", token });
}
```

- [ ] **Step 7: Tipos e lint**

```bash
cd frontend && npx tsc -b && npm run lint
```

Esperado: o `tsc` sem saída e o lint com **só** o erro antigo do `ContextoCarrinho.tsx:107`.

- [ ] **Step 8: Conferir o cliente pelo console do navegador**

Com o `backend-dev` e o `frontend-dev` rodando (reiniciar o `frontend-dev` com `preview_stop`/`preview_start` para ele ler o `.env` novo), rodar no `javascript_tool` da aba do front:

```js
(async () => {
  const { requisicao } = await import("/src/api/cliente.ts");
  const { fazerLogin } = await import("/src/api/autenticacao.ts");
  const { criarUsuario } = await import("/src/api/usuarios.ts");
  const pega = async (fn) => { try { await fn(); return "não lançou"; } catch (e) { return [e.name, e.status, e.mensagem, e.erros?.length ?? 0]; } };
  return {
    rotaInexistente: await pega(() => requisicao("/rota-que-nao-existe")),
    loginErrado: await pega(() => fazerLogin("ninguem@bruxel.test", "errada")),
    cadastroVazio: await pega(() => criarUsuario({ nome: "", email: "", cpf: "", senha: "" })),
  };
})()
```

Esperado:
- `rotaInexistente`: `["ErroApi", 404, "Erro inesperado (status 404).", 0]`
- `loginErrado`: `["ErroApi", 400, "E-mail ou senha incorretos.", 0]`
- `cadastroVazio`: `["ErroApi", 400, "O nome é obrigatório. O E-mail é obrigatório. A senha é obrigatória. O CPF é obrigatório.", 4]`

Depois, parar o back (`preview_stop` do `backend-dev`) e rodar de novo só o `loginErrado`. Esperado: `["ErroApi", 0, "Não foi possível conectar ao servidor. Verifique se o backend está rodando.", 0]`. Subir o back outra vez.

- [ ] **Step 9: Commit**

```bash
git add frontend/.env.example frontend/src/vite-env.d.ts frontend/src/tipos/usuario.ts frontend/src/api
git commit -m "feat: cliente HTTP e funções da API de usuários e login no front

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Front — sessão, `RotaAdmin` e rotas protegidas

**Files:**
- Create: `frontend/src/contexto/sessao.ts`
- Create: `frontend/src/contexto/useAutenticacao.ts`
- Create: `frontend/src/contexto/ContextoAutenticacao.tsx`
- Create: `frontend/src/componentes/layout/RotaAdmin/RotaAdmin.tsx`
- Modify: `frontend/src/App.tsx` (arquivo inteiro)

**Interfaces:**
- Consumes: `fazerLogin` e `UsuarioSessao` (Task 2).
- Produces (`contexto/sessao.ts`): `interface Sessao { token: string; usuario: UsuarioSessao }`, `lerSessao(): Sessao | null`, `salvarSessao(sessao: Sessao): void`, `apagarSessao(): void`.
- Produces (`contexto/useAutenticacao.ts`): `useAutenticacao(): ValorContextoAutenticacao`, com `{ usuario: UsuarioSessao | null; token: string | null; estaLogado: boolean; ehAdmin: boolean; entrar(email, senha): Promise<UsuarioSessao>; sair(): void }`. Também exporta o objeto `ContextoAutenticacao`.
- Produces: `<ProvedorAutenticacao>` e `<RotaAdmin />`, que usa `location.state.de` (string com o caminho barrado) ao redirecionar para `/entrar`.

- [ ] **Step 1: `frontend/src/contexto/sessao.ts`**

```ts
import type { UsuarioSessao } from "../tipos/usuario";

/** O que fica salvo no localStorage enquanto a pessoa está logada. */
export interface Sessao {
  token: string;
  usuario: UsuarioSessao;
}

// o prefixo evita colidir com outras coisas salvas no mesmo endereço (localhost:5173)
const CHAVE_SESSAO = "bruxel:sessao";

/**
 * Lê a sessão salva. Devolve null (e apaga o que estiver salvo) se não houver
 * nada, se o conteúdo estiver corrompido ou se o token já expirou.
 */
export function lerSessao(): Sessao | null {
  try {
    const salvo = localStorage.getItem(CHAVE_SESSAO);
    if (!salvo) return null;
    const sessao = JSON.parse(salvo) as Sessao;
    if (!sessao.token || !sessao.usuario || tokenExpirado(sessao.token)) {
      apagarSessao();
      return null;
    }
    return sessao;
  } catch {
    // JSON quebrado ou token que não dá pra decodificar: começa deslogado
    apagarSessao();
    return null;
  }
}

export function salvarSessao(sessao: Sessao) {
  try {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  } catch {
    // navegador bloqueando o localStorage: a sessão vale só até recarregar a página
  }
}

export function apagarSessao() {
  try {
    localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // sem localStorage não há o que apagar
  }
}

/**
 * Confere o `exp` (validade, em segundos) do JWT. O token tem 3 partes
 * separadas por "."; a do meio é o payload em base64url. Aqui só lemos o
 * payload, sem conferir a assinatura: quem garante que o token é válido de
 * verdade é o backend, em cada requisição.
 */
function tokenExpirado(token: string) {
  const payload = token.split(".")[1];
  if (!payload) return true;
  // base64url usa - e _ no lugar de + e /; o atob só entende base64 normal
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const { exp } = JSON.parse(atob(base64)) as { exp?: number };
  return typeof exp !== "number" || exp * 1000 <= Date.now();
}
```

- [ ] **Step 2: `frontend/src/contexto/useAutenticacao.ts`**

```ts
import { createContext, useContext } from "react";
import type { UsuarioSessao } from "../tipos/usuario";

/** Tudo que os componentes conseguem ler e usar da sessão via useAutenticacao(). */
export interface ValorContextoAutenticacao {
  /** usuário logado; null = ninguém logado */
  usuario: UsuarioSessao | null;
  /** JWT enviado nas rotas protegidas da API; null = ninguém logado */
  token: string | null;
  estaLogado: boolean;
  ehAdmin: boolean;
  /** faz login na API e guarda a sessão; se der errado, a promessa rejeita com um ErroApi */
  entrar: (email: string, senha: string) => Promise<UsuarioSessao>;
  /** encerra a sessão (quem chama decide pra onde navegar depois) */
  sair: () => void;
}

// começa como null pra useAutenticacao() conseguir detectar o uso fora do ProvedorAutenticacao.
// Fica neste arquivo (e não no ContextoAutenticacao.tsx) porque o Fast Refresh do Vite
// pede que arquivos de componente exportem só componentes
export const ContextoAutenticacao = createContext<ValorContextoAutenticacao | null>(null);

/**
 * Atalho pra acessar a sessão: `const { usuario, entrar, sair } = useAutenticacao()`.
 * Lança erro se for usado fora do ProvedorAutenticacao.
 */
export function useAutenticacao() {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) {
    throw new Error("useAutenticacao deve ser usado dentro de um ProvedorAutenticacao");
  }
  return contexto;
}
```

- [ ] **Step 3: `frontend/src/contexto/ContextoAutenticacao.tsx`**

```tsx
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { fazerLogin } from "../api/autenticacao";
import { ContextoAutenticacao } from "./useAutenticacao";
import type { ValorContextoAutenticacao } from "./useAutenticacao";
import { apagarSessao, lerSessao, salvarSessao } from "./sessao";
import type { Sessao } from "./sessao";

/**
 * Guarda quem está logado e disponibiliza pra árvore inteira (Cabecalho,
 * RotaAdmin, páginas). Precisa envolver o app — ver App.tsx.
 *
 * A sessão também vai pro localStorage, então recarregar a página não desloga.
 */
export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  // a função inicial roda só na primeira renderização: o app já nasce com a sessão
  // salva, sem um instante "deslogado" que faria o RotaAdmin mandar pro /entrar
  const [sessao, setSessao] = useState<Sessao | null>(() => lerSessao());

  // useCallback mantém a mesma função entre renderizações; o useUsuarios usa o
  // sair() como dependência de um useEffect e não pode buscar a lista de novo à toa
  const entrar = useCallback(async (email: string, senha: string) => {
    // o cadastro salva o e-mail em minúsculas, então o login compara do mesmo jeito
    const { token, user } = await fazerLogin(email.trim().toLowerCase(), senha);
    const nova: Sessao = { token, usuario: user };
    salvarSessao(nova);
    setSessao(nova);
    return user;
  }, []);

  const sair = useCallback(() => {
    apagarSessao();
    setSessao(null);
  }, []);

  // useMemo: só cria um objeto novo quando a sessão muda, pra não re-renderizar à toa quem usa o contexto
  const valor = useMemo<ValorContextoAutenticacao>(
    () => ({
      usuario: sessao?.usuario ?? null,
      token: sessao?.token ?? null,
      estaLogado: sessao !== null,
      ehAdmin: sessao?.usuario.perfil === "ADMINISTRADOR",
      entrar,
      sair,
    }),
    [sessao, entrar, sair]
  );

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>;
}
```

- [ ] **Step 4: `frontend/src/componentes/layout/RotaAdmin/RotaAdmin.tsx`**

```tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAutenticacao } from "../../../contexto/useAutenticacao";

/**
 * Protege as páginas do painel (/admin/*). No App.tsx ela é a rota "pai" das
 * páginas admin: se a pessoa pode entrar, a página filha aparece no <Outlet />;
 * senão, redireciona.
 *
 * Isso só esconde as telas. Quem protege os dados de verdade é o backend, que
 * confere o token e o perfil em cada requisição.
 */
export function RotaAdmin() {
  const { estaLogado, ehAdmin } = useAutenticacao();
  const { pathname } = useLocation();

  // sem login: vai pro /entrar lembrando de onde veio, pra voltar pra cá depois de logar
  if (!estaLogado) {
    return <Navigate to="/entrar" replace state={{ de: pathname }} />;
  }
  // logado como cliente: o painel não é pra ele
  if (!ehAdmin) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default RotaAdmin;
```

- [ ] **Step 5: `frontend/src/App.tsx`** (arquivo inteiro)

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { ProvedorAutenticacao } from "./contexto/ContextoAutenticacao";
import { ProvedorCarrinho } from "./contexto/ContextoCarrinho";
import { RotaAdmin } from "./componentes/layout/RotaAdmin/RotaAdmin";
import { PaginaInicio } from "./paginas/portal/inicio/inicio";
import { PaginaSobre } from "./paginas/portal/sobre/sobre";
import { PaginaLoja } from "./paginas/portal/loja/loja";
import { PaginaPiscinator } from "./paginas/portal/piscinator/piscinator";
import { PaginaCarrinho } from "./paginas/portal/carrinho/carrinho";
import { PaginaEntrar } from "./paginas/portal/entrar/entrar";
import { PaginaCriarConta } from "./paginas/portal/criar-conta/criar-conta";
import { PaginaPerfil } from "./paginas/portal/perfil/perfil";
import { PaginaAdminUsuarios } from "./paginas/admin/usuarios/usuarios";
import { PaginaAdminProdutos } from "./paginas/admin/produtos/produtos";

/**
 * Raiz da aplicação: define as rotas do site.
 *
 * Os provedores envolvem tudo pra que a sessão (ProvedorAutenticacao) e o
 * carrinho (ProvedorCarrinho) sejam estados únicos, compartilhados por todas
 * as páginas e pelo Cabecalho. Como ficam acima das rotas, não se perdem ao
 * navegar entre elas.
 */
function App() {
  return (
    <ProvedorAutenticacao>
      <ProvedorCarrinho>
        <BrowserRouter>
          <Routes>
            {/* portal: site público da Bruxel */}
            <Route path="/" element={<PaginaInicio />} />
            <Route path="/sobre" element={<PaginaSobre />} />
            <Route path="/loja" element={<PaginaLoja />} />
            <Route path="/piscinator" element={<PaginaPiscinator />} />
            <Route path="/carrinho" element={<PaginaCarrinho />} />
            <Route path="/entrar" element={<PaginaEntrar />} />
            <Route path="/criar-conta" element={<PaginaCriarConta />} />
            <Route path="/perfil" element={<PaginaPerfil />} />
            {/* painel de gestão (usa o NavAdmin no lugar do Cabecalho);
                o RotaAdmin só deixa passar quem está logado como administrador */}
            <Route element={<RotaAdmin />}>
              <Route path="/admin/usuarios" element={<PaginaAdminUsuarios />} />
              <Route path="/admin/produtos" element={<PaginaAdminProdutos />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProvedorCarrinho>
    </ProvedorAutenticacao>
  );
}

export default App
```

- [ ] **Step 6: Tipos e lint**

```bash
cd frontend && npx tsc -b && npm run lint
```

Esperado: o `tsc` sem saída e o lint com só o erro antigo do `ContextoCarrinho.tsx`.

- [ ] **Step 7: Conferir os redirecionamentos e o `localStorage` com lixo**

Dar `touch` nos arquivos editados. Depois, no `javascript_tool` da aba do front, definir o gerador de sessão falsa (o front só lê o payload, não confere a assinatura):

```js
window.sessaoFalsa = (perfil, segundos) => {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const token = `${b64({ alg: "HS256" })}.${b64({ id: "x", perfil, exp: Math.floor(Date.now() / 1000) + segundos })}.assinatura-falsa`;
  localStorage.setItem("bruxel:sessao", JSON.stringify({ token, usuario: { id: "x", nome: "Pessoa Teste", email: "pessoa@bruxel.test", perfil } }));
};
```

Para cada linha da tabela: rodar o preparo no console, navegar até a URL (navegar recarrega o app) e conferir.

| Preparo no console | Navegar para | Esperado |
|---|---|---|
| `localStorage.clear()` | `/admin/usuarios` | URL vira `/entrar` |
| `sessaoFalsa("CLIENTE", 3600)` (definir `sessaoFalsa` de novo após cada navegação) | `/admin/usuarios` | URL vira `/` |
| `sessaoFalsa("ADMINISTRADOR", 3600)` | `/admin/usuarios` | Página "Gestão de Usuários" aparece (ainda com mock) |
| `sessaoFalsa("ADMINISTRADOR", -10)` | `/admin/usuarios` | URL vira `/entrar` e `localStorage.getItem("bruxel:sessao")` dá `null` |
| `localStorage.setItem("bruxel:sessao", "{quebrado")` | `/` | Home carrega normal; a chave foi apagada |
| `localStorage.setItem("bruxel:sessao", JSON.stringify({ token: "sem-pontos", usuario: {} }))` | `/` | Home carrega normal; a chave foi apagada |

No fim, rodar `localStorage.clear()`.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/contexto/sessao.ts frontend/src/contexto/useAutenticacao.ts frontend/src/contexto/ContextoAutenticacao.tsx frontend/src/componentes/layout/RotaAdmin frontend/src/App.tsx
git commit -m "feat: sessão com JWT no front e proteção das rotas /admin

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Front — login e cadastro pela API

**Files:**
- Modify: `frontend/src/crud/usuarios/FormularioCadastro/FormularioCadastro.tsx` (arquivo inteiro)
- Modify: `frontend/src/crud/usuarios/FormularioCadastro/FormularioCadastro.css` (acrescentar no fim)
- Modify: `frontend/src/paginas/portal/criar-conta/criar-conta.tsx` (arquivo inteiro)
- Modify: `frontend/src/paginas/portal/entrar/entrar.tsx` (imports + linhas 45–76)
- Modify: `frontend/src/paginas/portal/entrar/entrar.css` (acrescentar no fim)
- Modify: `frontend/src/paginas/admin/usuarios/usuarios.tsx:29-32` (adaptação temporária, reescrita na Task 5)

**Interfaces:**
- Consumes:
  - `criarUsuario` e `DadosNovoUsuario` (Task 2)
  - `mensagemDeErro` (Task 2)
  - `useAutenticacao().entrar` (Task 3)
  - `location.state.de` deixado pelo `RotaAdmin` (Task 3)
- Produces:
  - `FormularioCadastro` com `onEnviar: (dados: DadosFormularioCadastro) => Promise<void>`
  - `type DadosFormularioCadastro = DadosNovoUsuario`
  - `/entrar` lê `location.state` no formato `{ mensagem?: string; de?: string }`

- [ ] **Step 1: `FormularioCadastro.tsx`** (arquivo inteiro)

```tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { mensagemDeErro } from "../../../api/cliente";
import type { DadosNovoUsuario } from "../../../api/usuarios";
import "./FormularioCadastro.css";

/** O que o formulário entrega ao ser enviado (a confirmação de senha fica só aqui dentro). */
export type DadosFormularioCadastro = DadosNovoUsuario;

interface FormularioCadastroProps {
  /** salva os dados; se a promessa rejeitar, a mensagem do erro aparece no formulário */
  onEnviar: (dados: DadosFormularioCadastro) => Promise<void>;
  /** texto do botão de enviar; padrão "Criar conta" */
  textoBotao?: string;
}

/**
 * Formulário de cadastro de usuário, usado no "/criar-conta" e no modal de
 * "Novo usuário" do painel admin. Confere se as duas senhas são iguais, espera
 * o onEnviar terminar e só limpa os campos se der certo. Se der erro (ex.: CPF
 * já cadastrado), mostra a mensagem e mantém o que foi digitado.
 */
export function FormularioCadastro({
  onEnviar,
  textoBotao = "Criar conta",
}: FormularioCadastroProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  // mensagem de erro mostrada acima do botão; null = sem erro
  const [erro, setErro] = useState<string | null>(null);
  // true enquanto espera a API: desabilita o botão pra não cadastrar duas vezes
  const [enviando, setEnviando] = useState(false);

  async function enviar(event: FormEvent) {
    event.preventDefault();

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      await onEnviar({ nome: nome.trim(), email: email.trim(), cpf, senha });
    } catch (falha) {
      // mantém os campos pra pessoa só corrigir o que deu problema
      setErro(mensagemDeErro(falha));
      setEnviando(false);
      return;
    }

    setEnviando(false);
    setNome("");
    setEmail("");
    setCpf("");
    setSenha("");
    setConfirmarSenha("");
  }

  return (
    <form className="formulario-cadastro" onSubmit={enviar}>
      <label>
        Nome completo
        <input
          type="text"
          placeholder="Seu nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={150}
          required
        />
      </label>
      <label>
        E-mail
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255}
          autoComplete="email"
          required
        />
      </label>
      <label>
        CPF
        <input
          type="text"
          inputMode="numeric"
          placeholder="Só números"
          value={cpf}
          // tira tudo que não é dígito, pra ficar no formato do banco (11 dígitos)
          onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
          maxLength={11}
          minLength={11}
          required
        />
      </label>
      <label>
        Senha
        <input
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>
      <label>
        Confirmar senha
        <input
          type="password"
          placeholder="••••••••"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>

      {erro && (
        <p className="formulario-cadastro__erro" role="alert">
          {erro}
        </p>
      )}

      <button type="submit" className="formulario-cadastro__enviar" disabled={enviando}>
        {enviando ? "Enviando…" : textoBotao}
      </button>
    </form>
  );
}

export default FormularioCadastro;
```

- [ ] **Step 2: CSS do botão desabilitado** (acrescentar no fim de `FormularioCadastro.css`)

```css
/* enquanto espera a resposta da API */
.formulario-cadastro__enviar:disabled {
  opacity: 0.6;
  cursor: wait;
}
```

- [ ] **Step 3: `criar-conta.tsx`** (arquivo inteiro)

```tsx
import { Link, useNavigate } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { FormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import type { DadosFormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import { criarUsuario } from "../../../api/usuarios";
import "./criar-conta.css";

/**
 * Tela de cadastro (rota "/criar-conta"): envia os dados pro POST /api/users.
 * Se der certo, leva pro login com um aviso; se der errado (ex.: CPF já
 * cadastrado), o FormularioCadastro mostra a mensagem da API.
 */
export function PaginaCriarConta() {
  const navigate = useNavigate();

  async function cadastrar(dados: DadosFormularioCadastro) {
    await criarUsuario(dados);
    // a conta é criada deslogada: a pessoa entra em seguida com o e-mail e a senha
    navigate("/entrar", { state: { mensagem: "Conta criada! Entre com seu e-mail e senha." } });
  }

  return (
    <>
      <Cabecalho />

      <section className="pagina-criar-conta">
        <Container className="pagina-criar-conta__interno">
          <h1 className="pagina-criar-conta__mensagem">
            Crie sua conta para aproveitar tudo que a Bruxel Piscinas tem
            pra oferecer
          </h1>

          <FormularioCadastro onEnviar={cadastrar} />

          <p className="pagina-criar-conta__link-login">
            Já tem uma conta? <Link to="/entrar">Entrar</Link>
          </p>
        </Container>
      </section>

      <Rodape />
    </>
  );
}

export default PaginaCriarConta;
```

- [ ] **Step 4: `entrar.tsx`**

Trocar a linha 1 (`import { Link } from "react-router-dom";`) por:

```tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { mensagemDeErro } from "../../../api/cliente";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
```

E trocar o trecho que vai do comentário `/**` "Tela de login (rota "/entrar")..." até o `</form>` (linhas 45–76 do arquivo original) por:

```tsx
/**
 * Tela de login (rota "/entrar"): envia e-mail e senha pelo entrar() do
 * ContextoAutenticacao. Se der certo, leva o admin pro painel e o cliente pra
 * Home (ou de volta pra página que o RotaAdmin barrou); se der errado, mostra
 * a mensagem da API acima do botão.
 */
export function PaginaEntrar() {
  const { entrar } = useAutenticacao();
  const navigate = useNavigate();
  // recados que outras telas mandam pelo state do navigate: o aviso do /criar-conta
  // (mensagem) e a página que o RotaAdmin barrou (de)
  const recado = useLocation().state as { mensagem?: string; de?: string } | null;

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  // mensagem de erro mostrada acima do botão; null = sem erro
  const [erro, setErro] = useState<string | null>(null);
  // true enquanto espera a API: desabilita o botão pra não enviar duas vezes
  const [enviando, setEnviando] = useState(false);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const usuario = await entrar(email, senha);
      const destino = recado?.de ?? (usuario.perfil === "ADMINISTRADOR" ? "/admin/usuarios" : "/");
      // replace: o "voltar" do navegador não traz de novo pra tela de login
      navigate(destino, { replace: true });
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setEnviando(false);
    }
  }

  return (
    <>
      <Cabecalho />

      <section className="pagina-entrar">
        <Container className="pagina-entrar__interno">
          <h1 className="pagina-entrar__mensagem">
            Olá! Você precisa realizar o login para entrar no seu perfil
          </h1>

          <form className="pagina-entrar__formulario" onSubmit={enviar}>
            {/* aviso de "conta criada" vindo do /criar-conta; some se aparecer um erro */}
            {recado?.mensagem && !erro && (
              <p className="pagina-entrar__sucesso" role="status">
                {recado.mensagem}
              </p>
            )}
            <label>
              E-mail
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {erro && (
              <p className="pagina-entrar__erro" role="alert">
                {erro}
              </p>
            )}
            <button type="submit" className="pagina-entrar__enviar" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </form>
```

O resto do arquivo (link "Criar conta", vitrine de recursos, `Rodape`) não muda.

- [ ] **Step 5: CSS das mensagens** (acrescentar no fim de `entrar.css`)

```css
/* mensagens acima do botão: erro (vermelho) e "conta criada" (verde) */
.pagina-entrar__erro {
  margin: 0;
  color: #c0392b;
  font-size: var(--font-size-small);
  font-weight: 600;
}

.pagina-entrar__sucesso {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background-color: #e8f6ee;
  color: #1e7b45;
  font-size: var(--font-size-small);
  font-weight: 600;
}

/* enquanto espera a resposta da API */
.pagina-entrar__enviar:disabled {
  opacity: 0.6;
  cursor: wait;
}
```

- [ ] **Step 6: Adaptação temporária no admin** (`usuarios.tsx`, linhas 29–32)

O `onEnviar` agora precisa devolver uma promessa. Trocar o `handleCreate` por (a Task 5 reescreve a página toda):

```tsx
  async function handleCreate(data: DadosFormularioCadastro) {
    criarUsuario(data);
    setIsCreateOpen(false);
  }
```

- [ ] **Step 7: Tipos e lint**

```bash
cd frontend && npx tsc -b && npm run lint
```

Esperado: o `tsc` sem saída e o lint com só o erro antigo do `ContextoCarrinho.tsx`.

- [ ] **Step 8: Conferir no navegador** (back e front rodando; `touch` nos arquivos editados antes)

| # | Ação | Esperado |
|---|---|---|
| a | `/criar-conta`: Nome "Ana Teste", E-mail `Ana.Teste@Bruxel.test`, CPF `22233344455`, senha e confirmação `senha-teste-123`, enviar | Vai para `/entrar` com a faixa verde "Conta criada! Entre com seu e-mail e senha." |
| b | `/criar-conta` com os mesmos dados | "Um usuário com esse CPF já existe." acima do botão; os campos continuam preenchidos |
| c | `/criar-conta` com CPF novo `33344455566` e o mesmo e-mail | "Um usuário com esse E-mail já existe." |
| d | Preencher um cadastro válido novo (CPF `44455566677`, e-mail `duplo@bruxel.test`) e dar um **`double_click`** (ação do `computer`, que gera dois cliques reais) no botão "Criar conta". Depois, `read_network_requests` com filtro `/api/users`. (Não usar `requestSubmit()` duas vezes seguidas pelo console: elas rodam antes de o React re-renderizar e desabilitar o botão, o que não acontece com clique de verdade) | Só **um** `POST /api/users` |
| e | `/entrar` com `ana.teste@bruxel.test` e senha errada | "E-mail ou senha incorretos." |
| f | `/entrar` com `ANA.TESTE@bruxel.test` e `senha-teste-123` | Vai para `/`; `localStorage.getItem("bruxel:sessao")` tem `perfil: "CLIENTE"` |
| g | `localStorage.clear()`, abrir `/admin/usuarios` (vai para `/entrar`), entrar com `admin.teste@bruxel.test` / `senha-teste-123` | Volta para `/admin/usuarios` |

No fim, rodar `localStorage.clear()`.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/crud/usuarios/FormularioCadastro frontend/src/paginas/portal/criar-conta/criar-conta.tsx frontend/src/paginas/portal/entrar frontend/src/paginas/admin/usuarios/usuarios.tsx
git commit -m "feat: login e cadastro chamando a API

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Front — admin de usuários com dados reais

**Files:**
- Modify: `frontend/src/crud/usuarios/useUsuarios.ts` (arquivo inteiro)
- Modify: `frontend/src/crud/usuarios/camposUsuario.ts` (arquivo inteiro)
- Modify: `frontend/src/paginas/admin/usuarios/usuarios.tsx` (arquivo inteiro)
- Modify: `frontend/src/paginas/admin/usuarios/usuarios.css` (acrescentar antes do `@media (min-width: 900px)`)

**Interfaces:**
- Consumes:
  - `listarUsuarios`, `criarUsuario`, `atualizarUsuario`, `excluirUsuario`, `CamposAtualizacaoUsuario` e `DadosNovoUsuario` (Task 2)
  - `ErroApi` e `mensagemDeErro` (Task 2)
  - `useAutenticacao()` → `token`, `sair`, `usuario` (Task 3)
  - `FormularioCadastro` com `onEnviar` assíncrono (Task 4)
- Produces:
  - `useUsuarios()` → `{ usuarios: Usuario[]; carregando: boolean; erro: string | null; recarregar(): void; criarUsuario(dados): Promise<void>; atualizarUsuario(id, campos): Promise<void>; excluirUsuario(id): Promise<void> }`
  - `paraCamposAtualizacao(usuario: Usuario): CamposAtualizacaoUsuario`
  - `CAMPOS_ENDERECO` com `maxLength` e `normalizar?`

- [ ] **Step 1: `useUsuarios.ts`** (arquivo inteiro)

```ts
import { useEffect, useState } from "react";
import type { Usuario } from "../../tipos/usuario";
import { ErroApi, mensagemDeErro } from "../../api/cliente";
import * as apiUsuarios from "../../api/usuarios";
import type { CamposAtualizacaoUsuario, DadosNovoUsuario } from "../../api/usuarios";
import { useAutenticacao } from "../../contexto/useAutenticacao";

/**
 * CRUD de usuários: busca a lista na API e é o único lugar que a altera. As
 * telas só chamam essas funções.
 *
 * Cada alteração espera a resposta do backend antes de mexer na lista, pra
 * tela nunca mostrar algo que não foi salvo. Se a API recusar, a promessa
 * rejeita com um ErroApi e quem chamou mostra a mensagem.
 *
 * As rotas de usuários exigem token de administrador. Se a API responder 401
 * (token vencido ou usuário apagado), a sessão é encerrada e o RotaAdmin
 * manda a pessoa pro /entrar.
 */
export function useUsuarios() {
  const { token, sair } = useAutenticacao();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  // começa true porque a busca dispara assim que a página abre
  const [carregando, setCarregando] = useState(true);
  // erro ao carregar a lista; null = sem erro
  const [erro, setErro] = useState<string | null>(null);
  // somar 1 aqui faz o useEffect abaixo buscar a lista de novo ("Tentar novamente")
  const [tentativa, setTentativa] = useState(0);

  // busca a lista ao abrir a página (e a cada "Tentar novamente"). Os setState
  // ficam dentro do .then/.catch, depois da resposta, e não direto no efeito
  useEffect(() => {
    if (!token) return;
    // se a página fechar antes da resposta chegar, o resultado é ignorado
    let cancelado = false;

    apiUsuarios
      .listarUsuarios(token)
      .then((lista) => {
        if (!cancelado) setUsuarios(lista);
      })
      .catch((falha: unknown) => {
        if (falha instanceof ErroApi && falha.status === 401) sair();
        if (!cancelado) setErro(mensagemDeErro(falha));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [token, sair, tentativa]);

  function recarregar() {
    setCarregando(true);
    setErro(null);
    setTentativa((atual) => atual + 1);
  }

  // roda uma chamada autenticada; se o token não vale mais (401), encerra a sessão antes de repassar o erro
  async function comToken<T>(chamada: (token: string) => Promise<T>): Promise<T> {
    if (!token) throw new ErroApi(401, "Sessão encerrada. Entre novamente.");
    try {
      return await chamada(token);
    } catch (falha) {
      if (falha instanceof ErroApi && falha.status === 401) sair();
      throw falha;
    }
  }

  async function criarUsuario(dados: DadosNovoUsuario) {
    // o cadastro é público, não precisa de token
    const novo = await apiUsuarios.criarUsuario(dados);
    setUsuarios((atuais) => [...atuais, novo]);
  }

  // substitui o usuário pela versão que o backend devolveu (já com o que ele de fato salvou)
  async function atualizarUsuario(id: string, campos: CamposAtualizacaoUsuario) {
    const atualizado = await comToken((t) => apiUsuarios.atualizarUsuario(t, id, campos));
    setUsuarios((atuais) => atuais.map((usuario) => (usuario.id === id ? atualizado : usuario)));
  }

  async function excluirUsuario(id: string) {
    await comToken((t) => apiUsuarios.excluirUsuario(t, id));
    setUsuarios((atuais) => atuais.filter((usuario) => usuario.id !== id));
  }

  return { usuarios, carregando, erro, recarregar, criarUsuario, atualizarUsuario, excluirUsuario };
}
```

- [ ] **Step 2: `camposUsuario.ts`** (arquivo inteiro)

```ts
import type { Usuario } from "../../tipos/usuario";
import type { CamposAtualizacaoUsuario } from "../../api/usuarios";

/** Campos de texto que as telas deixam editar (id e perfil ficam de fora). */
export type CampoEditavelUsuario = Exclude<keyof Usuario, "id" | "perfil">;

/** Um campo de endereço como aparece no formulário de edição. */
interface CampoEndereco {
  campo: CampoEditavelUsuario;
  label: string;
  /** tamanho da coluna no banco: acima disso o PostgreSQL recusa e a API devolve erro */
  maxLength: number;
  /** ajusta o texto digitado antes de guardar (ex.: CEP só com dígitos) */
  normalizar?: (valor: string) => string;
}

// campos do endereço, na ordem dos inputs; o banco guarda cada um numa coluna
export const CAMPOS_ENDERECO: CampoEndereco[] = [
  { campo: "rua", label: "Rua", maxLength: 150 },
  { campo: "numero", label: "Número", maxLength: 10 },
  { campo: "bairro", label: "Bairro", maxLength: 80 },
  { campo: "cidade", label: "Cidade", maxLength: 80 },
  {
    campo: "estado",
    label: "UF",
    maxLength: 2,
    normalizar: (valor) => valor.replace(/[^a-zA-Z]/g, "").toUpperCase(),
  },
  { campo: "cep", label: "CEP", maxLength: 8, normalizar: (valor) => valor.replace(/\D/g, "") },
];

/**
 * Monta o endereço num texto só pra exibir, ex.: "Rua X, 850 - Centro, Lajeado - RS".
 * Pula as partes vazias; sem endereço nenhum devolve "".
 */
export function formatarEndereco(usuario: Usuario) {
  const logradouro = [usuario.rua, usuario.numero].filter(Boolean).join(", ");
  const cidadeUf = [usuario.cidade, usuario.estado].filter(Boolean).join(" - ");
  return [logradouro, usuario.bairro, cidadeUf].filter(Boolean).join(" - ");
}

// texto vazio vira null: assim o PUT apaga o valor no banco em vez de gravar ""
function vazioParaNull(valor?: string | null) {
  const texto = valor?.trim();
  return texto ? texto : null;
}

/**
 * Monta o corpo do PUT /users/:id a partir do usuário editado na tabela: só
 * os campos que o backend aceita (CPF, id e perfil ficam de fora).
 */
export function paraCamposAtualizacao(usuario: Usuario): CamposAtualizacaoUsuario {
  return {
    nome: usuario.nome.trim(),
    email: usuario.email.trim(),
    telefone: vazioParaNull(usuario.telefone),
    rua: vazioParaNull(usuario.rua),
    numero: vazioParaNull(usuario.numero),
    bairro: vazioParaNull(usuario.bairro),
    cidade: vazioParaNull(usuario.cidade),
    estado: vazioParaNull(usuario.estado),
    cep: vazioParaNull(usuario.cep),
  };
}
```

- [ ] **Step 3: `usuarios.tsx`** (arquivo inteiro)

```tsx
import { useState } from "react";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { Modal } from "../../../componentes/ui/Modal/Modal";
import { FormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import type { DadosFormularioCadastro } from "../../../crud/usuarios/FormularioCadastro/FormularioCadastro";
import { useUsuarios } from "../../../crud/usuarios/useUsuarios";
import {
  CAMPOS_ENDERECO,
  formatarEndereco,
  paraCamposAtualizacao,
} from "../../../crud/usuarios/camposUsuario";
import type { CampoEditavelUsuario } from "../../../crud/usuarios/camposUsuario";
import { mensagemDeErro } from "../../../api/cliente";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import type { Usuario } from "../../../tipos/usuario";
import "./usuarios.css";

/**
 * Gestão de usuários do painel admin (rota "/admin/usuarios"): tabela com
 * edição inline e exclusão, e um botão que abre um modal com o mesmo
 * formulário do "/criar-conta" pra cadastrar usuários. A lista e as
 * operações de criar/editar/excluir vêm do useUsuarios (src/crud/usuarios),
 * que conversa com a API; esta página só cuida da tela.
 */
export function PaginaAdminUsuarios() {
  const { usuarios, carregando, erro, recarregar, criarUsuario, atualizarUsuario, excluirUsuario } =
    useUsuarios();
  // admin logado: a linha dele não pode ser excluída
  const { usuario: usuarioLogado } = useAutenticacao();
  // id do usuário cuja linha está em edição; null = ninguém (só uma linha por vez)
  const [editingId, setEditingId] = useState<string | null>(null);
  // cópia editável do usuário em edição; só vai pra API ao clicar em Salvar
  const [editDraft, setEditDraft] = useState<Usuario | null>(null);
  // controla se o modal de "Novo usuário" está aberto
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // erro ao salvar ou excluir, mostrado acima da lista; null = sem erro
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  // true enquanto o PUT da edição não volta (desabilita Salvar e Cancelar)
  const [salvando, setSalvando] = useState(false);

  // se a API recusar, o erro sobe pro FormularioCadastro, que mostra a mensagem e deixa o modal aberto
  async function handleCreate(data: DadosFormularioCadastro) {
    await criarUsuario(data);
    setIsCreateOpen(false);
  }

  function startEdit(user: Usuario) {
    setEditingId(user.id);
    setEditDraft({ ...user });
    setErroAcao(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
    setErroAcao(null);
  }

  async function saveEdit() {
    if (!editDraft) return;
    // o backend não valida o update: sem isso daria pra salvar um usuário sem nome
    if (!editDraft.nome.trim() || !editDraft.email.trim()) {
      setErroAcao("Nome e e-mail são obrigatórios.");
      return;
    }
    setSalvando(true);
    setErroAcao(null);
    try {
      await atualizarUsuario(editDraft.id, paraCamposAtualizacao(editDraft));
      setEditingId(null);
      setEditDraft(null);
    } catch (falha) {
      // a linha continua em edição pra pessoa corrigir (ex.: e-mail que já existe)
      setErroAcao(mensagemDeErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(user: Usuario) {
    // pede confirmação antes de excluir (a ação não tem desfazer)
    if (!window.confirm(`Excluir o usuário ${user.nome}?`)) return;
    setErroAcao(null);
    try {
      await excluirUsuario(user.id);
      // se a linha excluída estava em edição, encerra a edição
      if (editingId === user.id) {
        setEditingId(null);
        setEditDraft(null);
      }
    } catch (falha) {
      setErroAcao(mensagemDeErro(falha));
    }
  }

  function updateDraftField(field: CampoEditavelUsuario, value: string) {
    setEditDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  return (
    <>
      <NavAdmin />

      <section className="pagina-admin-usuarios">
        <Container>
          <div className="pagina-admin-usuarios__topo">
            <h1 className="pagina-admin-usuarios__titulo">Gestão de Usuários</h1>
            <button
              className="pagina-admin-usuarios__novo"
              onClick={() => setIsCreateOpen(true)}
            >
              + Novo usuário
            </button>
          </div>

          {erroAcao && (
            <p className="pagina-admin-usuarios__aviso" role="alert">
              {erroAcao}
            </p>
          )}

          {/* títulos das colunas (só em telas largas; no celular o rótulo vem do data-label) */}
          <div className="pagina-admin-usuarios__linha-titulos">
            <span>Nome</span>
            <span>E-mail</span>
            <span>Endereço</span>
            <span>Telefone</span>
            <span>CPF</span>
            <span>Ações</span>
          </div>

          <div className="pagina-admin-usuarios__lista">
            {carregando && <p className="pagina-admin-usuarios__vazio">Carregando usuários…</p>}

            {!carregando && erro && (
              <div className="pagina-admin-usuarios__aviso" role="alert">
                <span>{erro}</span>
                <button
                  type="button"
                  className="pagina-admin-usuarios__cancelar"
                  onClick={recarregar}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!carregando &&
              !erro &&
              usuarios.map((user) => {
                // só a linha do usuário em edição vira inputs; as outras continuam em modo leitura
                const isEditing = editingId === user.id;
                const draft = isEditing ? editDraft : null;
                const ehVoceMesmo = user.id === usuarioLogado?.id;

                return (
                  <div key={user.id} className="pagina-admin-usuarios__linha">
                    {isEditing && draft ? (
                      <>
                        <input
                          value={draft.nome}
                          onChange={(e) => updateDraftField("nome", e.target.value)}
                          maxLength={150}
                          aria-label="Nome"
                        />
                        <input
                          type="email"
                          value={draft.email}
                          onChange={(e) => updateDraftField("email", e.target.value)}
                          maxLength={255}
                          aria-label="E-mail"
                        />
                        {/* o endereço tem uma coluna por campo no banco, então vira um grupo de inputs */}
                        <div className="pagina-admin-usuarios__editar-endereco">
                          {CAMPOS_ENDERECO.map(({ campo, label, maxLength, normalizar }) => (
                            <input
                              key={campo}
                              value={draft[campo] ?? ""}
                              onChange={(e) =>
                                updateDraftField(
                                  campo,
                                  normalizar ? normalizar(e.target.value) : e.target.value
                                )
                              }
                              maxLength={maxLength}
                              placeholder={label}
                              aria-label={label}
                            />
                          ))}
                        </div>
                        <input
                          value={draft.telefone ?? ""}
                          onChange={(e) => updateDraftField("telefone", e.target.value)}
                          maxLength={20}
                          aria-label="Telefone"
                        />
                        {/* o backend não deixa trocar o CPF, então na edição ele só aparece */}
                        <span data-label="CPF">{draft.cpf}</span>
                        <div className="pagina-admin-usuarios__acoes">
                          <button
                            className="pagina-admin-usuarios__salvar"
                            onClick={saveEdit}
                            disabled={salvando}
                          >
                            {salvando ? "Salvando…" : "Salvar"}
                          </button>
                          <button
                            className="pagina-admin-usuarios__cancelar"
                            onClick={cancelEdit}
                            disabled={salvando}
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* data-label: rótulo que o CSS mostra no celular, onde não há linha de títulos */}
                        <span data-label="Nome">{user.nome}</span>
                        <span data-label="E-mail">{user.email}</span>
                        {/* campos vazios (ex.: usuário recém-criado) mostram "—" */}
                        <span data-label="Endereço">{formatarEndereco(user) || "—"}</span>
                        <span data-label="Telefone">{user.telefone || "—"}</span>
                        <span data-label="CPF">{user.cpf || "—"}</span>
                        <div className="pagina-admin-usuarios__acoes">
                          <button
                            className="pagina-admin-usuarios__editar"
                            onClick={() => startEdit(user)}
                          >
                            Editar
                          </button>
                          <button
                            className="pagina-admin-usuarios__excluir"
                            onClick={() => handleDelete(user)}
                            // excluir a própria conta derrubaria a sessão no meio do uso
                            disabled={ehVoceMesmo}
                            title={ehVoceMesmo ? "Você não pode excluir a própria conta" : undefined}
                          >
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

            {!carregando && !erro && usuarios.length === 0 && (
              <p className="pagina-admin-usuarios__vazio">Nenhum usuário cadastrado.</p>
            )}
          </div>
        </Container>
      </section>

      {isCreateOpen && (
        <Modal titulo="Novo usuário" onFechar={() => setIsCreateOpen(false)}>
          <FormularioCadastro textoBotao="Criar usuário" onEnviar={handleCreate} />
        </Modal>
      )}
    </>
  );
}

export default PaginaAdminUsuarios;
```

- [ ] **Step 4: CSS do aviso e dos botões desabilitados** (`usuarios.css`, antes do bloco `@media (min-width: 900px)`)

```css
/* aviso de erro (falha ao carregar, salvar ou excluir); o botão "Tentar novamente" fica à direita */
.pagina-admin-usuarios__aviso {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0 0 1rem;
  padding: 0.85rem 1.25rem;
  border: 1px solid #f5c6c1;
  border-radius: 12px;
  background-color: #fdecea;
  color: #c0392b;
  font-weight: 600;
  font-size: var(--font-size-small);
}

/* botões travados (salvando, ou Excluir na própria linha) */
.pagina-admin-usuarios__salvar:disabled,
.pagina-admin-usuarios__cancelar:disabled,
.pagina-admin-usuarios__excluir:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* sem o hover vermelho no Excluir travado */
.pagina-admin-usuarios__excluir:disabled:hover {
  border-color: var(--color-border-soft);
  color: var(--color-text-muted);
}
```

- [ ] **Step 5: Tipos e lint**

```bash
cd frontend && npx tsc -b && npm run lint
```

Esperado: o `tsc` sem saída e o lint com só o erro antigo do `ContextoCarrinho.tsx`. Se aparecer `react-hooks/set-state-in-effect` no `useUsuarios.ts`, conferir se algum `setState` saiu de dentro do `.then`/`.catch`/`.finally`.

- [ ] **Step 6: Conferir no navegador** (back e front rodando; `touch` nos arquivos; entrar como `admin.teste@bruxel.test` / `senha-teste-123`)

| # | Ação | Esperado |
|---|---|---|
| a | Abrir `/admin/usuarios` | "Carregando usuários…" e depois os usuários do banco (Cliente Teste, Ana Teste, Admin Teste...) |
| b | Linha do Admin Teste | Botão Excluir desabilitado, com tooltip "Você não pode excluir a própria conta" |
| c | "+ Novo usuário" com CPF `66677788899`, e-mail `modal@bruxel.test` | O modal fecha e o usuário aparece no fim da lista |
| d | "+ Novo usuário" com o CPF `66677788899` de novo | O modal continua aberto com "Um usuário com esse CPF já existe." |
| e | Editar "Ana Teste": UF digitar `rsx` / CEP digitar `95900-0001` / Número digitar `12345678901` | UF fica `RS`; CEP fica `95900000` (8 dígitos); Número para em 10 caracteres |
| f | Na mesma edição, Rua `Rua Teste`, Cidade `Lajeado`, Salvar; recarregar a página | A linha mostra o endereço; depois de recarregar, continua lá |
| g | Editar "Ana Teste", apagar o Nome, Salvar | "Nome e e-mail são obrigatórios." no topo; a linha continua em edição |
| h | Editar "Ana Teste", e-mail `admin.teste@bruxel.test`, Salvar | "Já existe um registro com esse valor." (409); a linha continua em edição |
| i | Na edição, conferir a coluna CPF | Texto, não input |
| j | Excluir "modal@bruxel.test" (confirmar) e recarregar | Some da lista e não volta |
| k | Parar o back (`preview_stop`), recarregar `/admin/usuarios` | Aviso "Não foi possível conectar…" com "Tentar novamente"; subir o back e clicar → a lista aparece |
| l | No console: `localStorage.setItem("bruxel:sessao", JSON.stringify({ ...JSON.parse(localStorage.getItem("bruxel:sessao")), token: JSON.parse(localStorage.getItem("bruxel:sessao")).token.slice(0, -3) + "abc" }))`, depois recarregar | Vai para `/entrar` (o `GET /users` dá 401 e a sessão é encerrada) |
| m | Entrar de novo como admin, editar "Ana Teste", mudar o Telefone e dar `double_click` em "Salvar"; `read_network_requests` com filtro `/api/users/` | Só **um** `PUT` |

- [ ] **Step 7: Commit**

```bash
git add frontend/src/crud/usuarios/useUsuarios.ts frontend/src/crud/usuarios/camposUsuario.ts frontend/src/paginas/admin/usuarios
git commit -m "feat: admin de usuários lendo e gravando pela API

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Front — menu do usuário no cabeçalho e "Sair" no painel

**Files:**
- Create: `frontend/src/componentes/layout/MenuUsuario/MenuUsuario.tsx`
- Create: `frontend/src/componentes/layout/MenuUsuario/MenuUsuario.css`
- Modify: `frontend/src/componentes/layout/Cabecalho/Cabecalho.tsx` (imports, linha 28 e linhas 147–163)
- Modify: `frontend/src/componentes/layout/NavAdmin/NavAdmin.tsx` (arquivo inteiro)
- Modify: `frontend/src/componentes/layout/NavAdmin/NavAdmin.css` (arquivo inteiro)

**Interfaces:**
- Consumes: `useAutenticacao()` → `usuario`, `estaLogado`, `ehAdmin`, `sair` (Task 3).
- Produces: `<MenuUsuario />`, sem props.

- [ ] **Step 1: `MenuUsuario.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import "./MenuUsuario.css";

/**
 * Botão do usuário logado no Cabecalho, no lugar do "Entrar": mostra o
 * primeiro nome e, ao clicar, abre um menu com Minha conta, Painel de gestão
 * (só admin) e Sair.
 *
 * O menu fecha ao clicar fora, com Esc ou ao escolher um item. Trocar de
 * página também fecha, porque cada página renderiza o próprio Cabecalho e o
 * menu nasce fechado de novo.
 */
export function MenuUsuario() {
  const { usuario, ehAdmin, sair } = useAutenticacao();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  // envolve o botão e o menu: clique dentro dele não conta como "clique fora"
  const raizRef = useRef<HTMLDivElement>(null);

  // enquanto o menu está aberto, escuta cliques e teclas na página toda pra saber quando fechar
  useEffect(() => {
    if (!aberto) return;

    function aoClicar(evento: MouseEvent) {
      if (!raizRef.current?.contains(evento.target as Node)) setAberto(false);
    }
    function aoApertarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoApertarTecla);
    // limpeza: tira os listeners quando o menu fecha (ou o componente sai da tela)
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoApertarTecla);
    };
  }, [aberto]);

  if (!usuario) return null;

  function handleSair() {
    setAberto(false);
    sair();
    navigate("/");
  }

  return (
    <div className="menu-usuario" ref={raizRef}>
      {/* mesmo visual do botão "Entrar" (classe do Cabecalho.css) */}
      <button
        type="button"
        className="cabecalho__botao-entrar menu-usuario__botao"
        aria-expanded={aberto}
        aria-controls="menu-usuario-opcoes"
        onClick={() => setAberto((atual) => !atual)}
      >
        <svg className="cabecalho__icone-entrar" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </svg>
        {/* só o primeiro nome, pra caber no header */}
        {usuario.nome.split(" ")[0]}
        <svg
          className={`menu-usuario__seta${aberto ? " menu-usuario__seta--aberta" : ""}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <div id="menu-usuario-opcoes" className="menu-usuario__menu">
          <div className="menu-usuario__topo">
            <strong>{usuario.nome}</strong>
            <span>{usuario.email}</span>
          </div>
          <Link to="/perfil" className="menu-usuario__item" onClick={() => setAberto(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
            Minha conta
          </Link>
          {ehAdmin && (
            <Link to="/admin/usuarios" className="menu-usuario__item" onClick={() => setAberto(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              Painel de gestão
            </Link>
          )}
          <hr className="menu-usuario__divisor" />
          <button type="button" className="menu-usuario__item menu-usuario__item--sair" onClick={handleSair}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

export default MenuUsuario;
```

- [ ] **Step 2: `MenuUsuario.css`**

```css
/* âncora do menu suspenso: ele se posiciona em relação a esta caixa */
.menu-usuario {
  position: relative;
}

/* o visual da pílula vem de .cabecalho__botao-entrar; <button> não herda a fonte sozinho */
.menu-usuario__botao {
  font-family: inherit;
}

.menu-usuario__seta {
  transition: transform 0.15s ease;
}

.menu-usuario__seta--aberta {
  transform: rotate(180deg);
}

/* caixa branca abaixo do botão, alinhada à direita (não sai da tela no celular) */
.menu-usuario__menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 200; /* acima do header (z-index 100) e do conteúdo */
  min-width: 230px;
  padding: 0.4rem;
  background-color: var(--color-white);
  color: var(--color-text);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(10, 13, 77, 0.25);
  white-space: normal; /* o .cabecalho__acoes usa nowrap; aqui o e-mail pode quebrar */
}

.menu-usuario__topo {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.6rem 0.8rem 0.7rem;
  margin-bottom: 0.3rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.menu-usuario__topo strong {
  color: var(--color-primary);
}

.menu-usuario__topo span {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

/* Links e o botão Sair com o mesmo visual */
.menu-usuario__item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: none;
  border-radius: 10px;
  background: none;
  color: var(--color-primary);
  font-family: inherit;
  font-size: var(--font-size-small);
  font-weight: 600;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.menu-usuario__item:hover,
.menu-usuario__item:focus-visible {
  background-color: #eef3ff;
}

.menu-usuario__item--sair {
  color: #c0392b;
}

.menu-usuario__divisor {
  border: none;
  border-top: 1px solid var(--color-border-soft);
  margin: 0.3rem 0;
}
```

- [ ] **Step 3: `Cabecalho.tsx`**

Depois do import do `useBordasRolagem`, acrescentar:

```tsx
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { MenuUsuario } from "../MenuUsuario/MenuUsuario";
```

Na linha 28, logo depois de `const { quantidadeItens } = useCarrinho();`, acrescentar:

```tsx
  const { estaLogado } = useAutenticacao();
```

No JSDoc do componente (linhas 20–21), trocar "carrinho (com o contador / de itens) e botão Entrar." por "carrinho (com o contador / de itens) e o botão Entrar, ou o menu do usuário quando há alguém logado." (a "/" marca a quebra de linha que já existe no comentário).

Trocar o `<Link to="/entrar" ...>...Entrar</Link>` (linhas 147–163) por:

```tsx
            {/* logado: menu com o nome; deslogado: o botão Entrar */}
            {estaLogado ? (
              <MenuUsuario />
            ) : (
              <Link to="/entrar" className="cabecalho__botao-entrar">
                <svg
                  className="cabecalho__icone-entrar"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
                Entrar
              </Link>
            )}
```

- [ ] **Step 4: `NavAdmin.tsx`** (arquivo inteiro)

```tsx
import { Link, useNavigate } from "react-router-dom";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import "./NavAdmin.css";

/**
 * Barra de navegação do painel de gestão. Substitui o Cabecalho do site nas
 * páginas /admin/*: tem os atalhos de Usuários e Produtos, o link pra voltar
 * ao portal e o botão Sair.
 */
export function NavAdmin() {
  const { sair } = useAutenticacao();
  const navigate = useNavigate();

  function handleSair() {
    sair();
    navigate("/");
  }

  return (
    <header className="nav-admin">
      <span className="nav-admin__titulo">Painel de Gestão</span>
      <nav className="nav-admin__links">
        <Link to="/admin/usuarios" className="nav-admin__link">
          Usuários
        </Link>
        <Link to="/admin/produtos" className="nav-admin__link">
          Produtos
        </Link>
      </nav>
      <Link to="/" className="nav-admin__voltar">
        Voltar ao site
      </Link>
      <button type="button" className="nav-admin__sair" onClick={handleSair}>
        Sair
      </button>
    </header>
  );
}

export default NavAdmin;
```

- [ ] **Step 5: `NavAdmin.css`** (arquivo inteiro)

```css
/* Barra do painel (mais escura que o Cabecalho do site, pra diferenciar) */
.nav-admin {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem var(--gutter);
  background-color: var(--color-primary-dark);
  color: var(--color-white);
  flex-wrap: wrap;
}

.nav-admin__titulo {
  font-weight: 700;
  font-size: var(--font-size-body);
  margin-right: auto; /* empurra os links e o "Voltar ao site" pra direita */
  white-space: nowrap;
}

.nav-admin__links {
  display: flex;
  gap: 1rem;
}

.nav-admin__link,
.nav-admin__voltar,
.nav-admin__sair {
  color: var(--color-white);
  text-decoration: none;
  font-size: var(--font-size-small);
  opacity: 0.85;
  white-space: nowrap;
}

.nav-admin__link:hover,
.nav-admin__voltar:hover,
.nav-admin__sair:hover {
  opacity: 1;
  text-decoration: underline;
}

/* linha à esquerda separa "Voltar ao site" dos atalhos do painel */
.nav-admin__voltar {
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  padding-left: 1rem;
}

/* <button> com cara de link, igual aos outros itens da barra */
.nav-admin__sair {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  cursor: pointer;
}
```

- [ ] **Step 6: Tipos e lint**

```bash
cd frontend && npx tsc -b && npm run lint
```

Esperado: o `tsc` sem saída e o lint com só o erro antigo do `ContextoCarrinho.tsx`.

- [ ] **Step 7: Conferir no navegador** (`touch` nos arquivos)

| # | Ação | Esperado |
|---|---|---|
| a | Deslogado, abrir `/` | Botão "Entrar" igual ao de antes |
| b | Entrar como `ana.teste@bruxel.test` | O header mostra "Ana ▾"; ao clicar abre nome, e-mail, Minha conta e Sair (**sem** Painel); a seta gira |
| c | Com o menu aberto: clicar no banner da Home / apertar Esc | Fecha nos dois casos |
| d | Abrir o menu e clicar em "Minha conta" | Vai para `/perfil` com o menu fechado |
| e | "Sair" | Vai para `/` com "Entrar" de volta; `localStorage.getItem("bruxel:sessao")` dá `null` |
| f | Entrar como admin, ir para `/`, abrir o menu | Mostra "Painel de gestão", que leva a `/admin/usuarios` |
| g | No painel, clicar em "Sair" no NavAdmin | Vai para `/` deslogado; abrir `/admin/usuarios` manda para `/entrar` |
| h | `resize_window` em 375×700, logado, abrir o menu e tirar screenshot | O botão e o menu cabem na tela, sem rolagem horizontal; depois voltar com o preset `desktop` |

- [ ] **Step 8: Commit**

```bash
git add frontend/src/componentes/layout/MenuUsuario frontend/src/componentes/layout/Cabecalho/Cabecalho.tsx frontend/src/componentes/layout/NavAdmin
git commit -m "feat: menu do usuário logado no cabeçalho e Sair no painel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Documentação, roteiro completo e PR

**Files:**
- Modify: `README.md`
- Create (temporário, fora do repo): `<scratchpad>/pr-body.md`

**Interfaces:**
- Consumes: tudo das Tasks 1–6.

- [ ] **Step 1: README, seção "Frontend"**

Trocar o bloco da seção `### Frontend` (do `Dentro de frontend/:` até `Abre em http://localhost:5173.`) por:

````markdown
Dentro de `frontend/`:

```bash
cp .env.example .env
npm install
npm run dev
```

O `.env.example` aponta o front para a API local (`VITE_API_URL=http://localhost:3000/api`). Abre em `http://localhost:5173`.

### Primeiro administrador

Toda conta criada pela API (tela "Criar conta" ou `POST /api/users`) nasce com perfil `CLIENTE`. Para acessar o painel `/admin`, crie uma conta pelo site e promova ela no banco:

```bash
psql -U bruxel -d bruxel -c "UPDATE users SET perfil = 'ADMINISTRADOR' WHERE email = 'seu@email.com';"
```

Se você já estava logado com essa conta, saia e entre de novo para o site reconhecer o novo perfil.
````

- [ ] **Step 2: README, seções "Autenticação" e "Rotas do frontend"**

Na seção `## Autenticação`, trocar a frase "A resposta traz um token JWT, válido por 5 dias, que deve ser enviado nas requisições seguintes no header `Authorization: Bearer <token>`." por:

```markdown
A resposta traz um token JWT, válido por 5 dias, e os dados básicos do usuário (`id`, `nome`, `email`, `perfil`). O token deve ser enviado nas requisições seguintes no header `Authorization: Bearer <token>`. No frontend, a sessão fica salva no `localStorage` (chave `bruxel:sessao`).
```

No fim da seção `## Rotas do frontend`, acrescentar:

```markdown

Painel de gestão (exige login de administrador; quem não é admin é redirecionado):

| Rota | Página |
| --- | --- |
| `/admin/usuarios` | Gestão de usuários |
| `/admin/produtos` | Gestão de produtos |
```

- [ ] **Step 3: Rodar o roteiro completo da spec**

Com `localStorage.clear()`, back e front rodando, executar os 16 casos da tabela "Roteiro de teste manual" da spec, nesta ordem. Os dados de teste ficam nos e-mails `@bruxel.test` (senha `senha-teste-123`).

| # | Caso | Como |
|---|---|---|
| 1 | Back desligado | `preview_stop` do back → `/entrar` → entrar → mensagem de conexão → subir o back de novo |
| 2 | Criar conta válida | `/criar-conta`, CPF `77788899900`, e-mail `roteiro@bruxel.test` |
| 3 | CPF/e-mail repetido | Repetir o 2 / trocar só o CPF |
| 4 | Senha errada | `/entrar` com `roteiro@bruxel.test` e senha errada |
| 5 | Login cliente | `roteiro@bruxel.test` → `/`, menu sem Painel |
| 6 | Cliente no `/admin/usuarios` | Digitar a URL → volta para `/` |
| 7 | Visitante no `/admin` e depois admin | Sair → `/admin/usuarios` → `/entrar` → login admin → volta para `/admin/usuarios` |
| 8 | Lista do banco | Conferir os usuários de teste |
| 9 | Criar pelo modal (válido/repetido) | CPF `88899900011` / repetir |
| 10 | Editar endereço e recarregar | Na linha "Roteiro" |
| 11 | E-mail já usado | Trocar o e-mail da linha "Roteiro" para `admin.teste@bruxel.test` |
| 12 | Excluir e recarregar | Excluir o usuário criado no 9; Excluir travado na própria linha |
| 13 | Recarregar logado | F5 em `/admin/usuarios` |
| 14 | Sair pelo menu e pelo NavAdmin | Os dois caminhos |
| 15 | Token adulterado | O comando da Task 5, passo 6, item l |
| 16 | Celular | 375×700, menu aberto, screenshot |

Anotar ✅/❌ e uma observação curta para cada caso num `pr-body.md` no scratchpad. Tirar screenshots dos casos 2, 4, 5, 8 e 16. Se algum caso der ❌, **parar**, usar `superpowers:systematic-debugging`, corrigir na tarefa correspondente e rodar o caso de novo.

- [ ] **Step 4: Verificação final**

```bash
cd frontend
npx tsc -b
npm run lint   # sai com exit 1 por causa do erro antigo, por isso não vai encadeado com &&
npm run build
cd ../backend && npx tsc --noEmit
git status --short
```

Esperado:
- `tsc` sem saída e lint só com o erro antigo do `ContextoCarrinho.tsx`.
- `vite build` termina sem erro.
- `tsc` do back sem saída.
- `git status` mostra só o `README.md` modificado.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: variável do front, primeiro admin e rotas do painel no README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Montar a descrição do PR** (no `pr-body.md`)

Seções, nesta ordem:
1. **Resumo**, com `Closes #31`.
2. **O que mudou no front** (camada `api/`, sessão, `RotaAdmin`, login/cadastro, admin, menu).
3. **Aviso para o back (Gusta Univates e Gabriel):**
   - `authService` devolve `perfil`.
   - `authController` e `userController` sem `try/catch`, com os status agora corretos: 400, 404 e 409 em vez de 500.
   - Fica para eles: o `productsController` tem o mesmo problema; o login compara o e-mail sem normalizar (o front normaliza por enquanto); se aconteceu, `npm run db:generate`/`db:migrate` precisaram de `--config prisma7.config.ts`.
4. **API de usuários (versão corrigida do `API_USERS.md` anexado na issue):**

| Ação | Método e rota | Token | Corpo | Resposta |
|---|---|---|---|---|
| Login | `POST /api/auth/login` | — | `{ email, senha }` | `200 { mensagem, token, user: { id, email, nome, perfil } }` |
| Cadastrar | `POST /api/users` | — | `{ nome, email, senha, cpf }` (CPF com 11 dígitos) | `201` usuário (`perfil: CLIENTE`) |
| Listar | `GET /api/users` | admin | — | `200` lista |
| Buscar | `GET /api/users/:id` | admin | — | `200` usuário |
| Atualizar | `PUT /api/users/:id` | admin | qualquer um de `nome, email, senha, telefone, rua, numero, bairro, cidade, estado, cep` | `200` usuário |
| Excluir | `DELETE /api/users/:id` | admin | — | `200` usuário |

   Base: `http://localhost:3000/api` (não 3333). Erros: `{ mensagem, erros? }` com 400, 401 (sem token ou token inválido), 403 (não admin), 404 e 409.

5. **Como testar** (passos do README + criar admin via SQL).
6. **Resultado do roteiro** (a tabela de 16 casos com ✅/❌).
7. **Pendências para outras issues:** produtos via API, `/perfil` real, testes automatizados, token em cookie `httpOnly` (OWASP).
8. A linha `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 7: Fechar a branch**

Usar `superpowers:finishing-a-development-branch`. O push e a criação do PR (`gh pr create --base main --body-file <scratchpad>/pr-body.md`) **só com confirmação do Eduardo**.
