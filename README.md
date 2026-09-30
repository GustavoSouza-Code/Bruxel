# Bruxel

Projeto acadêmico da disciplina de Web II, ministrada pelo professor Mateus Roveda, destinado ao desenvolvimento de uma aplicação web para a empresa Bruxel Piscinas. O projeto tem como finalidade aplicar, na prática, conceitos de desenvolvimento web, responsividade, organização de conteúdo e boas práticas de programação.

## Sobre o sistema

A Bruxel Piscinas vende produtos para manutenção de piscina pela internet e oferece visitas técnicas. O portal do cliente reúne cadastro e login, catálogo de produtos, o Piscinator (assistente que recomenda produtos a partir de perguntas sobre o estado da piscina), carrinho de compras e perfil do usuário. O painel administrativo reúne a gestão de produtos e de usuários.

## Stack

Backend em TypeScript com Express, PostgreSQL via Prisma ORM, autenticação com JWT. Frontend em React com Vite e React Router.

## Estrutura do repositório

```
backend/    API REST
frontend/   Portal do cliente e painel administrativo
```

Cada pasta tem seu próprio `package.json` e roda de forma independente.

## Como rodar o projeto

### Pré-requisitos

- Node 20.19 ou superior (ou 22.12+)
- PostgreSQL 13 ou superior, rodando localmente

### Backend

Crie o usuário e o banco no Postgres:

```bash
psql -U postgres -c "CREATE USER bruxel WITH PASSWORD 'bruxel';"
psql -U postgres -c "CREATE DATABASE bruxel OWNER bruxel;"
```

Dentro de `backend/`:

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:generate
npm run dev
```

O `.env.example` já traz uma `DATABASE_URL` apontando para o usuário e o banco criados acima, e um `JWT_SECRET` de exemplo.

O servidor sobe em `http://localhost:3000`, com as rotas registradas sob `/api`.

### Frontend

Dentro de `frontend/`:

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

### Scripts do backend

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor em modo desenvolvimento, reiniciando a cada alteração |
| `npm run build` | Compila o TypeScript para `dist/` |
| `npm run start` | Roda a versão compilada |
| `npm run db:migrate` | Aplica as migrações do Prisma no banco |
| `npm run db:pull` | Lê o schema do banco e atualiza `prisma/schema.prisma` |
| `npm run db:generate` | Gera o client do Prisma a partir do schema |

### Scripts do frontend

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Gera a build de produção |
| `npm run preview` | Serve a build de produção localmente, para conferência |
| `npm run lint` | Roda o ESLint |

## Banco de dados

O schema tem sete tabelas: `users`, `products`, `categories`, `favorites`, `orders`, `order_items` e `appointments`. O DDL completo está versionado como a migração inicial em `prisma/migrations/0_init`.

## Autenticação

Login é feito em `POST /api/auth/login`, com `email` e `senha` no corpo da requisição. A resposta traz um token JWT, válido por 5 dias, que deve ser enviado nas requisições seguintes no header `Authorization: Bearer <token>`.

Duas camadas de proteção, aplicadas por rota:

- **Exige login**: confirma que o token é válido e não expirou. Sem isso, a resposta é 401.
- **Exige perfil administrador**: além de logado, confirma que o usuário tem `perfil = ADMINISTRADOR`. Sem isso, a resposta é 403.

Nem toda rota pede login. `GET /api/products` e `GET /api/products/:id` são públicas, porque qualquer visitante deve poder navegar pelo catálogo sem conta. `POST /api/users`, o cadastro, também é pública, pelo mesmo motivo: ninguém consegue criar a primeira conta se o cadastro exigisse login.

Senhas são armazenadas com hash bcrypt, nunca em texto puro. Respostas de API que retornam dados de usuário nunca incluem o campo de senha.

## Rotas do frontend

Portal público:

| Rota | Página |
| --- | --- |
| `/` | Início |
| `/sobre` | Sobre a empresa |
| `/loja` | Catálogo de produtos |
| `/piscinator` | Assistente de recomendação de produtos |
| `/carrinho` | Carrinho de compras |
| `/entrar` | Login |
| `/criar-conta` | Cadastro |
| `/perfil` | Perfil do usuário logado |
