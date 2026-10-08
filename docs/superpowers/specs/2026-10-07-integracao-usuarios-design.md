# Integração inicial front ↔ back: fluxo de usuários

- **Issue:** [GustavoSouza-Code/Bruxel#31](https://github.com/GustavoSouza-Code/Bruxel/issues/31) — "Implementar rotas e integração inicial do frontend com backend"
- **Data:** 07/10/2026
- **Branch:** `feat/integracao-usuarios`

## Objetivo

Validar a comunicação entre o frontend (React + TS) e a API (Express + Prisma)
pelo fluxo de usuários, de ponta a ponta: criar conta, entrar, manter a sessão,
proteger o painel admin e gerenciar usuários com dados reais do banco.

## Escopo

**Entra:**

- Cliente HTTP do front (`fetch` próprio) e funções tipadas da API de usuários e de login.
- Sessão no front (`ContextoAutenticacao`) persistida no `localStorage`.
- Login (`/entrar`) e cadastro (`/criar-conta`) chamando a API.
- Admin de usuários (`/admin/usuarios`) listando, criando, editando e excluindo pela API.
- Proteção das rotas `/admin/*` (`RotaAdmin`).
- Cabeçalho e NavAdmin mostrando o usuário logado, com "Sair".
- Ajuste mínimo no backend: login devolve `perfil`; controllers de auth e usuários
  deixam os erros chegarem ao handler global (status corretos).
- Roteiro de teste manual ponta a ponta, com resultados registrados no PR.

**Fica para outras issues:**

- Produtos (admin e loja) via API — depende de rota de categorias, `preco` como
  número e campos faltando no `POST /products`.
- Página `/perfil` com dados reais — depende de `GET /me` e de o cliente poder
  editar a si mesmo.
- Testes automatizados (Vitest/Supertest).
- Correções no `productsController` (mesmo problema de status 500).

## Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Cliente HTTP | `fetch` com um wrapper próprio | Sem dependência nova; segue o código existente; bom para aprender |
| Endereço da API | `VITE_API_URL`, padrão `http://localhost:3000/api` | Muda só a variável no deploy; o back já usa `cors()` |
| Onde fica o token | `localStorage`, gerenciado só pelo `ContextoAutenticacao` | Sessão sobrevive ao recarregar (JWT vale 5 dias). Risco de XSS anotado para a aula de OWASP |
| Como as funções da API recebem o token | Por parâmetro (`listarUsuarios(token)`) | Explícito, sem estado global escondido no `cliente.ts` |
| Atualização da lista do admin | Só depois da resposta da API (sem otimista) | Mais simples; a tela nunca mostra algo não salvo |
| Cabeçalho logado | Variante B: pílula "Nome ▾" com menu suspenso | Mantém o visual do botão "Entrar" do Figma e cabe no celular |
| Testes | Só roteiro manual nesta issue | Decisão do Eduardo |

## Arquitetura

### Frontend — arquivos novos (`frontend/src/`)

| Arquivo | Responsabilidade |
|---|---|
| `api/cliente.ts` | `requisicao<T>(caminho, { metodo?, corpo?, token? })`: monta a URL com `VITE_API_URL`, envia/recebe JSON, coloca `Authorization: Bearer <token>` quando recebe token e lança `ErroApi` para qualquer resposta não 2xx ou falha de rede. Exporta também a classe `ErroApi`. |
| `api/autenticacao.ts` | `fazerLogin(email, senha)` → `POST /auth/login`, devolve `{ token, user }`. (Não se chama `entrar` para não colidir com o `entrar()` do contexto.) |
| `api/usuarios.ts` | `listarUsuarios(token)`, `criarUsuario(dados)`, `atualizarUsuario(token, id, campos)`, `excluirUsuario(token, id)`. |
| `contexto/sessao.ts` | `lerSessao`, `salvarSessao` e `apagarSessao` (localStorage), mais a checagem do `exp` do JWT. |
| `contexto/useAutenticacao.ts` | O `createContext` e o hook `useAutenticacao()`. Expõe `usuario`, `token`, `estaLogado`, `ehAdmin`, `entrar(email, senha)` e `sair()`. |
| `contexto/ContextoAutenticacao.tsx` | Só o componente `ProvedorAutenticacao`. Fica separado do hook porque a regra `react-refresh/only-export-components` do lint não aceita componente e hook no mesmo `.tsx` (o `ContextoCarrinho` já tem esse erro). |
| `componentes/layout/RotaAdmin/RotaAdmin.tsx` | Rota de layout com `<Outlet>`. Sem login → `<Navigate to="/entrar" state={{ de: localização }}>`; logado sem ser admin → `<Navigate to="/">`. |
| `componentes/layout/MenuUsuario/MenuUsuario.tsx` (+ `.css`) | Pílula "Nome ▾" e menu suspenso do cabeçalho (ver "Cabeçalho"). |
| `frontend/.env.example` | `VITE_API_URL=http://localhost:3000/api` |

### Frontend — arquivos alterados

| Arquivo | Mudança |
|---|---|
| `App.tsx` | Envolve tudo com `ProvedorAutenticacao`; `/admin/usuarios` e `/admin/produtos` passam a ser filhas de `<Route element={<RotaAdmin />}>`. Remove o TODO de proteção. |
| `tipos/usuario.ts` | Campos opcionais viram `string \| null` (a API devolve `null`). Novo tipo `UsuarioSessao = Pick<Usuario, "id" \| "nome" \| "email" \| "perfil">`. |
| `crud/usuarios/useUsuarios.ts` | Sai o mock; carrega com `listarUsuarios` ao montar e expõe `usuarios`, `carregando`, `erro`, `recarregar`, `criarUsuario`, `atualizarUsuario`, `excluirUsuario` (as três últimas assíncronas). Em `ErroApi` com status 401, chama `sair()`. |
| `crud/usuarios/FormularioCadastro/FormularioCadastro.tsx` | `onEnviar` passa a ser `(dados) => Promise<void>`. Espera a promessa, desabilita o botão enquanto envia e só limpa os campos se der certo. Se a promessa rejeitar, mostra a mensagem do erro e mantém os campos. |
| `paginas/portal/entrar/entrar.tsx` | Formulário controlado; chama `entrar()`; mostra erro/sucesso; redireciona após login. |
| `paginas/portal/criar-conta/criar-conta.tsx` | Chama `criarUsuario`; se der certo, vai para `/entrar` com mensagem de sucesso. |
| `paginas/admin/usuarios/usuarios.tsx` | Estados de carregamento/erro; ações assíncronas; CPF só leitura na edição; limites de UF/CEP; Excluir desabilitado na própria linha. |
| `componentes/layout/Cabecalho/Cabecalho.tsx` | Logado: mostra `MenuUsuario` no lugar do link "Entrar". |
| `componentes/layout/NavAdmin/NavAdmin.tsx` | Link "Sair" no final, ao lado de "Voltar ao site". |

### Backend — ajuste mínimo

| Arquivo | Mudança |
|---|---|
| `src/service/authService.ts` | `user` da resposta inclui `perfil`. |
| `src/controller/authController.ts` | Remove o `try/catch`. No Express 5, um erro lançado num handler `async` vai sozinho para o handler global do `server.ts`. |
| `src/controller/userController.ts` | Mesma coisa nos cinco métodos. |

Com isso, os status passam a ser os do `AppError` e do Prisma (já tratados no
`server.ts`): login errado → 400, CPF/e-mail duplicado → 409, usuário inexistente → 404,
e-mail duplicado no update → 409 (P2002). Erros de validação devolvem
`{ mensagem, erros: [{ campo, mensagem }] }`.

### Contrato com a API

| Ação | Requisição | Token | Resposta de sucesso |
|---|---|---|---|
| Login | `POST /auth/login` `{ email, senha }` | — | 200 `{ mensagem, token, user: { id, email, nome, perfil } }` |
| Cadastro | `POST /users` `{ nome, email, senha, cpf }` | — | 201 `Usuario` (sempre `perfil = CLIENTE`) |
| Listar | `GET /users` | admin | 200 `Usuario[]` |
| Editar | `PUT /users/:id` (só `nome, email, telefone, rua, numero, bairro, cidade, estado, cep`) | admin | 200 `Usuario` |
| Excluir | `DELETE /users/:id` | admin | 200 `Usuario` |

Erros: `{ mensagem, erros? }`, com 401 (sem token/token inválido/usuário excluído),
403 (não admin), 400, 404, 409, 500.

## Fluxo de dados

### Login (`/entrar`)

1. O formulário chama `entrar(email, senha)` do contexto, que manda o e-mail com
   `trim().toLowerCase()`: o cadastro salva o e-mail em minúsculas e o login do back
   compara exatamente. O botão fica desabilitado com "Entrando…".
2. Se der certo, o contexto guarda `{ token, usuario }` no estado e no `localStorage`.
   Depois redireciona: se veio barrado pelo `RotaAdmin` (`location.state.de`), volta
   para lá; senão, admin vai para `/admin/usuarios` e cliente vai para `/`.
3. Se der erro, a mensagem do `ErroApi` aparece acima do botão.

### Sessão

- **Chave no `localStorage`:** `bruxel:sessao`, com `{ token, usuario }` em JSON.
- **Ao montar o provedor:** lê a chave e decodifica o payload do JWT (base64url → JSON)
  para conferir o `exp`. Se o token expirou, se o JSON está corrompido ou se não dá
  para decodificar, apaga a chave e começa deslogado. A leitura é feita no
  inicializador do `useState`, para a primeira renderização já sair com a sessão
  certa (sem o `RotaAdmin` redirecionar por engano).
- **`sair()`:** limpa o estado e a chave. Quem chama decide para onde navegar
  (o menu e o NavAdmin levam para `/`).
- **401 numa chamada autenticada:** `useUsuarios` chama `sair()`; o `RotaAdmin`
  então redireciona para `/entrar`.

### Cadastro

- `/criar-conta`: se o `criarUsuario` der certo, faz `navigate("/entrar", { state: { mensagem: "Conta criada! Entre com seu e-mail e senha." } })`.
- Modal "Novo usuário" do admin: se der certo, o usuário devolvido entra no fim da lista
  e o modal fecha; se der erro, o modal continua aberto com a mensagem.

### Admin de usuários

- **Ao abrir:** `GET /users`. Mostra "Carregando usuários…" e, se falhar, um aviso com "Tentar novamente".
- **Editar:** envia só os campos editáveis; string vazia vira `null`. A linha é
  substituída pelo usuário que a API devolver. CPF aparece como texto (o back ignora
  `cpf` no update). Inputs com `maxLength` 2 para UF (convertido para maiúsculas) e 8
  dígitos para CEP (só números).
- **Excluir:** `window.confirm` → `DELETE` → remove da lista. O botão fica
  desabilitado na linha do usuário logado (id igual ao de `useAutenticacao().usuario`).
- **Erro em editar/excluir:** aviso no topo da lista; a linha continua em edição.

## Tratamento de erros

`ErroApi` tem `status: number`, `mensagem: string` e
`erros?: { campo: string; mensagem: string }[]`.

| Situação | `status` | `mensagem` |
|---|---|---|
| `fetch` lança (back desligado, sem rede) | `0` | "Não foi possível conectar ao servidor. Verifique se o backend está rodando." |
| Resposta não 2xx com JSON | status HTTP | `mensagem` do corpo; se houver `erros`, as mensagens deles separadas por espaço |
| Resposta não 2xx sem JSON | status HTTP | "Erro inesperado (status X)." |

**Na tela:**

- **Formulários:** `<p role="alert">` acima do botão, no estilo do `formulario-cadastro__erro`.
- **Lista do admin:** aviso no topo.
- **Sucesso no `/entrar`:** mensagem verde com `role="status"`.

## Cabeçalho (variante B)

- **Deslogado:** o link "Entrar" de hoje, sem mudança.
- **Logado:** um botão com o mesmo visual de `.cabecalho__botao-entrar`, com ícone,
  primeiro nome e seta. Segue o padrão "disclosure" (`aria-expanded` + `aria-controls`
  e uma lista de links): `role="menu"` exigiria navegação por setas. Ao clicar, abre
  um menu suspenso branco abaixo, alinhado à direita:
  - topo com nome completo e e-mail;
  - "Minha conta" → `/perfil`;
  - "Painel de gestão" → `/admin/usuarios` (só admin);
  - divisor;
  - "Sair" (vermelho) → `sair()` + `navigate("/")`.
- **O menu fecha:** ao clicar fora (listener de `mousedown` no `document`, registrado
  num `useEffect` só enquanto está aberto), com Esc e ao escolher um item. Ao mudar
  de rota fecha sozinho: cada página renderiza o próprio `<Cabecalho />`, então o menu
  é montado de novo, fechado.
- **No celular** (até 640px): o botão usa a altura de 40px que o "Entrar" já usa ali.

## Documentação

- **`README.md`:**
  - variável `VITE_API_URL` e o `.env.example` do front;
  - como criar o primeiro administrador
    (`UPDATE users SET perfil = 'ADMINISTRADOR' WHERE email = '...';`);
  - rotas `/admin/usuarios` e `/admin/produtos` na tabela de rotas, marcadas como "exige administrador".
- **`.claude/launch.json`:** configuração `backend-dev` (`npm run dev --prefix backend`, porta 3000).
- **Descrição do PR:** versão corrigida do `API_USERS.md` (porta 3000, rotas que exigem
  admin, `telefone` em vez de `phone`, `numero` incluído) e aviso para o
  Gusta Univates e o Gabriel sobre as mudanças no back.

## Roteiro de teste manual

**Preparação:** Postgres local com o usuário e o banco `bruxel` (passo do README);
`backend/.env` a partir do `.env.example`; `npm install`, `npm run db:migrate`,
`npm run db:generate` no back; `frontend/.env` a partir do `.env.example`; back e
front rodando.

| # | Caso | Esperado |
|---|---|---|
| 1 | Back desligado, tentar entrar | Mensagem de falha de conexão |
| 2 | Criar conta válida | Vai para `/entrar` com mensagem de sucesso |
| 3 | Criar conta com CPF repetido / e-mail repetido | Mensagem do 409; campos mantidos |
| 4 | Entrar com senha errada | "E-mail ou senha incorretos." (400) |
| 5 | Entrar como cliente | Vai para `/`; menu "Nome ▾" sem "Painel de gestão" |
| 6 | Cliente abre `/admin/usuarios` | Redireciona para `/` |
| 7 | Visitante abre `/admin/usuarios` e depois entra como admin | Vai para `/entrar` e, após o login, volta para `/admin/usuarios` |
| 8 | Admin vê a lista | Usuários do banco |
| 9 | Admin cria usuário pelo modal (válido / repetido) | Entra na lista / erro no modal |
| 10 | Admin edita endereço e recarrega | Dado persistido |
| 11 | Admin troca e-mail para um já usado | Mensagem do 409; linha continua em edição |
| 12 | Admin exclui usuário e recarrega | Some da lista; botão Excluir desabilitado na própria linha |
| 13 | Recarregar logado | Continua logado |
| 14 | Sair pelo menu e pelo NavAdmin | Volta para `/` com "Entrar"; `/admin` redireciona |
| 15 | Token adulterado no `localStorage` + ação no admin | 401 → vai para `/entrar` |
| 16 | Celular (375px) | Menu do cabeçalho cabe e funciona |

Os resultados (✅/❌, com prints dos principais) vão para uma tabela na descrição do PR.

## Riscos e observações

- **Token no `localStorage`:** pode ser lido por um script injetado (XSS). Fica como
  ponto para a aula de OWASP (alternativa: cookie `httpOnly`, que exige mudanças no back).
- **Expiração:** o front confere o `exp` só ao carregar a página. Um token que expira
  com a página aberta é pego pelo 401 na próxima chamada.
- **`/perfil` continua com mock.** O "Minha conta" leva até ele, mas os dados reais
  ficam para a issue de perfil.
- **O primeiro admin só existe via SQL**, até haver uma tela ou seed para isso.
