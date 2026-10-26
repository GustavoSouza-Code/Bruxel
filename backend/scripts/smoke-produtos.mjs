/**
 * Teste de fumaça (smoke test) das rotas de produtos.
 *
 * Roda contra a API já em execução (npm run dev) e contra o Postgres do
 * backend/.env. Cria dados temporários com o prefixo "smoke-" e apaga tudo no
 * final, inclusive o usuário de teste.
 *
 * Uso:
 *   npm run dev                 (em um terminal)
 *   npm run test:smoke:produtos (em outro)
 */
import "dotenv/config";
import pg from "pg";

const BASE = process.env.API_URL ?? "http://localhost:3000/api";
const SUFIXO = Date.now().toString(36);
const EMAIL = `smoke.${SUFIXO}@example.com`;
const SENHA = "Teste@12345";
const CPF = Date.now().toString().slice(-11);
const CODIGO_A = `smoke-a-${SUFIXO}`;
const CODIGO_B = `smoke-b-${SUFIXO}`;
const CATEGORIA = `SmokeTest ${SUFIXO}`;
const UUID_INEXISTENTE = "00000000-0000-4000-8000-000000000000";
const UUID_INVALIDO = "isto-nao-e-uuid";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const linhas = [];
let falhas = 0;
let conectado = false;

function anotar(caso, esperado, resposta, nota = "") {
  const ok =
    typeof esperado === "number"
      ? resposta.status === esperado
      : esperado === "4xx"
        ? resposta.status >= 400 && resposta.status < 500
        : resposta.status >= 200 && resposta.status < 300;

  if (!ok) falhas++;

  const detalhe =
    typeof resposta.corpo === "object" && resposta.corpo
      ? JSON.stringify(resposta.corpo).slice(0, 110)
      : String(resposta.corpo).slice(0, 110);

  linhas.push({
    "#": linhas.length + 1,
    caso,
    esperado,
    obtido: resposta.status,
    ok: ok ? "OK" : "FALHOU",
    nota: [nota, detalhe].filter(Boolean).join(" | ").slice(0, 190),
  });
}

async function chamar(metodo, caminho, { corpo, token } = {}) {
  const headers = {};
  if (corpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`${BASE}${caminho}`, {
    method: metodo,
    headers,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });

  const texto = await resposta.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    json = texto;
  }
  return { status: resposta.status, corpo: json };
}

function conferirPersistencia(rotulo, produto, esperado) {
  const problemas = [];
  for (const campo of ["descricao", "estoque", "url_imagem", "ativo"]) {
    if (produto?.[campo] !== esperado[campo]) {
      problemas.push(`${campo}: esperado ${JSON.stringify(esperado[campo])}, veio ${JSON.stringify(produto?.[campo])}`);
    }
  }
  return problemas.length ? `${rotulo}: ${problemas.join("; ")}` : "";
}

async function main() {
  console.log(`API: ${BASE}\nBanco: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@")}\n`);

  try {
    const ping = await chamar("GET", "/products");
    if (ping.status !== 200) throw new Error(`GET /products respondeu ${ping.status}`);
  } catch (erro) {
    throw new Error(`A API não respondeu em ${BASE}. Suba o backend com "npm run dev". (${erro.message})`);
  }

  await db.connect();
  conectado = true;

  // ---------------------------------------------------------------- preparação
  const cadastro = await chamar("POST", "/users", {
    corpo: { nome: "Smoke Produtos", email: EMAIL, senha: SENHA, cpf: CPF },
  });
  if (cadastro.status !== 201) throw new Error(`Falha ao criar usuário de teste: ${JSON.stringify(cadastro.corpo)}`);

  const loginCliente = await chamar("POST", "/auth/login", { corpo: { email: EMAIL, senha: SENHA } });
  const tokenCliente = loginCliente.corpo.token;

  const { rows: categorias } = await db.query(
    "insert into categories (nome) values ($1) returning id",
    [CATEGORIA]
  );
  const categoriaId = categorias[0].id;

  // ------------------------------------------------- casos sem credencial
  anotar("POST /products sem token", 401, await chamar("POST", "/products", {
    corpo: { categoria_id: categoriaId, nome: "X", codigo: `smoke-x-${SUFIXO}`, preco: 10 },
  }));

  anotar("POST /products com token de CLIENTE", 403, await chamar("POST", "/products", {
    corpo: { categoria_id: categoriaId, nome: "X", codigo: `smoke-x-${SUFIXO}`, preco: 10 },
    token: tokenCliente,
  }));

  // promove o usuário de teste e entra de novo
  await db.query("update users set perfil = 'ADMINISTRADOR' where email = $1", [EMAIL]);
  const loginAdmin = await chamar("POST", "/auth/login", { corpo: { email: EMAIL, senha: SENHA } });
  const token = loginAdmin.corpo.token;
  if (!token) throw new Error(`Falha no login de admin: ${JSON.stringify(loginAdmin.corpo)}`);

  const completo = {
    categoria_id: categoriaId,
    nome: "Produto Smoke A",
    codigo: CODIGO_A,
    descricao: "descricao de teste",
    preco: 21.5,
    estoque: 7,
    url_imagem: "/produtos/smoke-a.png",
    ativo: false,
  };

  // ---------------------------------------------------------------- CREATE
  const criado = await chamar("POST", "/products", { corpo: completo, token });
  anotar(
    "POST /products com todos os campos",
    201,
    criado,
    conferirPersistencia("campos ignorados no POST", criado.corpo, completo)
  );
  const idA = criado.corpo?.id;

  anotar("POST /products sem nome", 400, await chamar("POST", "/products", {
    corpo: { categoria_id: categoriaId, codigo: `smoke-sem-nome-${SUFIXO}`, preco: 10 },
    token,
  }));

  anotar("POST /products com código repetido", 409, await chamar("POST", "/products", {
    corpo: { categoria_id: categoriaId, nome: "Repetido", codigo: CODIGO_A, preco: 10 },
    token,
  }));

  anotar("POST /products com preço 0", 400, await chamar("POST", "/products", {
    corpo: { categoria_id: categoriaId, nome: "Preco Zero", codigo: `smoke-preco0-${SUFIXO}`, preco: 0 },
    token,
  }));

  anotar("POST /products com preço string", 400, await chamar("POST", "/products", {
    corpo: { categoria_id: categoriaId, nome: "Preco String", codigo: `smoke-precostr-${SUFIXO}`, preco: "10.00" },
    token,
  }));

  anotar("POST /products com categoria inexistente", "4xx", await chamar("POST", "/products", {
    corpo: { categoria_id: UUID_INEXISTENTE, nome: "Sem Categoria", codigo: `smoke-semcat-${SUFIXO}`, preco: 10 },
    token,
  }));

  // ------------------------------------------------------------------ READ
  const lista = await chamar("GET", "/products");
  const incluiInativo = Array.isArray(lista.corpo) && lista.corpo.some((p) => p.id === idA);
  anotar("GET /products", 200, lista, incluiInativo ? "a lista pública inclui produto inativo" : "");

  const porId = await chamar("GET", `/products/${idA}`);
  anotar("GET /products/:id existente", 200, porId, `preco veio como ${typeof porId.corpo?.preco} (${JSON.stringify(porId.corpo?.preco)})`);

  anotar("GET /products/:id inexistente", 404, await chamar("GET", `/products/${UUID_INEXISTENTE}`));
  anotar("GET /products/:id com id inválido", 404, await chamar("GET", `/products/${UUID_INVALIDO}`));

  // ---------------------------------------------------------------- UPDATE
  const atualizacao = {
    categoria_id: categoriaId,
    nome: "Produto Smoke A atualizado",
    codigo: CODIGO_A,
    descricao: "descricao atualizada",
    preco: 30.75,
    estoque: 4,
    url_imagem: "/produtos/smoke-a-2.png",
    ativo: false,
  };
  const atualizado = await chamar("PUT", `/products/${idA}`, { corpo: atualizacao, token });
  anotar(
    "PUT /products/:id com todos os campos",
    200,
    atualizado,
    conferirPersistencia("campos não persistidos no PUT", atualizado.corpo, atualizacao)
  );

  const comIdExtra = await chamar("PUT", `/products/${idA}`, {
    corpo: { ...atualizacao, id: UUID_INEXISTENTE },
    token,
  });
  anotar("PUT /products/:id com campo extra (id)", 200, comIdExtra);

  const depoisDoIdExtra = await chamar("GET", `/products/${idA}`);
  anotar(
    "PUT não altera o id do produto",
    200,
    depoisDoIdExtra,
    depoisDoIdExtra.corpo?.id === idA ? "" : "o id do produto foi alterado!"
  );

  anotar("PUT /products/:id com preço 0", 400, await chamar("PUT", `/products/${idA}`, {
    corpo: { ...atualizacao, preco: 0 },
    token,
  }));

  anotar("PUT /products/:id com estoque -1", 400, await chamar("PUT", `/products/${idA}`, {
    corpo: { ...atualizacao, estoque: -1 },
    token,
  }));

  const criadoB = await chamar("POST", "/products", {
    corpo: { categoria_id: categoriaId, nome: "Produto Smoke B", codigo: CODIGO_B, preco: 5 },
    token,
  });
  anotar("POST /products mínimo (produto B)", 201, criadoB);
  const idB = criadoB.corpo?.id;

  anotar("PUT /products/:id com código repetido", 409, await chamar("PUT", `/products/${idB}`, {
    corpo: { ...atualizacao, codigo: CODIGO_A },
    token,
  }));

  anotar("PUT /products/:id com categoria inexistente", "4xx", await chamar("PUT", `/products/${idB}`, {
    corpo: { categoria_id: UUID_INEXISTENTE },
    token,
  }));

  // ---------------------------------------------------------------- DELETE
  anotar("DELETE /products/:id", 200, await chamar("DELETE", `/products/${idB}`, { token }));
  anotar("DELETE /products/:id já apagado", 404, await chamar("DELETE", `/products/${idB}`, { token }));

  // ------------------------------------------------------- rota de categorias
  anotar("GET /categories (necessária para o front)", 200, await chamar("GET", "/categories"));

  // ---------------------------------------------------------------- relatório
  console.table(linhas);
  console.log(`\n${linhas.length - falhas}/${linhas.length} casos com o status esperado.`);
}

try {
  await main();
} catch (erro) {
  console.error("\nERRO NO SMOKE TEST:", erro.message);
  process.exitCode = 1;
} finally {
  try {
    if (conectado) {
      await db.query("delete from products where codigo like $1", [`smoke-%-${SUFIXO}`]);
      await db.query("delete from categories where nome = $1", [CATEGORIA]);
      await db.query("delete from users where email = $1", [EMAIL]);
      console.log("\nDados de teste removidos.");
    }
  } catch (erro) {
    console.error("Falha na limpeza:", erro.message);
  }
  await db.end().catch(() => {});
}
