/**
 * Teste de fumaça (smoke test) do fluxo de compra e do estoque.
 *
 * Roda contra a API já em execução (npm run dev) e contra o Postgres do
 * backend/.env. Cria usuários, categoria, produtos e pedidos temporários com o
 * prefixo "smoke-ped-" e apaga tudo no final.
 *
 * Uso:
 *   npm run dev               (em um terminal)
 *   npm run test:smoke:pedidos (em outro)
 */
import "dotenv/config";
import pg from "pg";

const BASE = process.env.API_URL ?? "http://localhost:3000/api";
const SUFIXO = Date.now().toString(36);
const EMAIL_ADMIN = `smoke.pedido.admin.${SUFIXO}@example.com`;
const EMAIL_CLIENTE = `smoke.pedido.cliente.${SUFIXO}@example.com`;
const SENHA = "Teste@12345";
const CPF_ADMIN = Date.now().toString().slice(-11);
const CPF_CLIENTE = (Date.now() + 1).toString().slice(-11);
const CATEGORIA = `SmokePedido ${SUFIXO}`;
const UUID_INEXISTENTE = "00000000-0000-4000-8000-000000000000";
const ENDERECO = "Rua Smoke, 123 - Centro - Lajeado/RS - 95900000";

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

function anotarValor(caso, esperado, obtido, nota = "") {
  const ok = obtido === esperado;
  if (!ok) falhas++;

  linhas.push({
    "#": linhas.length + 1,
    caso,
    esperado,
    obtido,
    ok: ok ? "OK" : "FALHOU",
    nota: nota.slice(0, 190),
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

async function criarUsuario(nome, email, cpf) {
  const resposta = await chamar("POST", "/users", {
    corpo: { nome, email, senha: SENHA, cpf },
  });
  if (resposta.status !== 201) {
    throw new Error(`Falha ao criar usuário ${email}: ${JSON.stringify(resposta.corpo)}`);
  }
  return resposta.corpo.id;
}

async function entrar(email) {
  const resposta = await chamar("POST", "/auth/login", { corpo: { email, senha: SENHA } });
  if (!resposta.corpo?.token) {
    throw new Error(`Falha no login de ${email}: ${JSON.stringify(resposta.corpo)}`);
  }
  return resposta.corpo.token;
}

function corpoPedido(itens, extras = {}) {
  return {
    itens,
    forma_pagamento: "PIX",
    endereco_entrega: ENDERECO,
    ...extras,
  };
}

function conferirPedido(pedido, { status, total, quantidadeItens, usuarioId }) {
  const problemas = [];
  if (pedido?.status !== status) problemas.push(`status ${pedido?.status}`);
  if (Number(pedido?.valor_total) !== total) problemas.push(`total ${pedido?.valor_total}`);
  if (!Array.isArray(pedido?.order_items) || pedido.order_items.length !== quantidadeItens) {
    problemas.push(`itens ${pedido?.order_items?.length}`);
  }
  if (usuarioId && pedido?.usuario_id !== usuarioId) problemas.push("usuario_id diferente");
  if (Array.isArray(pedido?.order_items) && pedido.order_items.some((item) => !item.products?.nome)) {
    problemas.push("item sem nome do produto");
  }
  return problemas.length ? problemas.join("; ") : "";
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
  const idAdmin = await criarUsuario("Smoke Pedido Admin", EMAIL_ADMIN, CPF_ADMIN);
  const idCliente = await criarUsuario("Smoke Pedido Cliente", EMAIL_CLIENTE, CPF_CLIENTE);

  await db.query("update users set perfil = 'ADMINISTRADOR' where email = $1", [EMAIL_ADMIN]);
  const tokenAdmin = await entrar(EMAIL_ADMIN);
  const tokenCliente = await entrar(EMAIL_CLIENTE);

  const { rows: categorias } = await db.query(
    "insert into categories (nome) values ($1) returning id",
    [CATEGORIA]
  );
  const categoriaId = categorias[0].id;

  async function criarProduto(sufixo, preco, estoque, ativo = true) {
    const resposta = await chamar("POST", "/products", {
      corpo: {
        categoria_id: categoriaId,
        nome: `Produto pedido ${sufixo}`,
        codigo: `smoke-ped-${sufixo}-${SUFIXO}`,
        preco,
        estoque,
        ativo,
      },
      token: tokenAdmin,
    });
    if (resposta.status !== 201) {
      throw new Error(`Falha ao criar produto ${sufixo}: ${JSON.stringify(resposta.corpo)}`);
    }
    return resposta.corpo;
  }

  const p1 = await criarProduto("a", 10.5, 5);
  const p2 = await criarProduto("b", 20, 2);
  const p3 = await criarProduto("c", 30, 1);
  const p4 = await criarProduto("inativo", 5, 10, false);

  async function estoqueDe(id) {
    const resposta = await chamar("GET", `/products/${id}`);
    return Number(resposta.corpo?.estoque);
  }

  function comprar(token, corpo) {
    return chamar("POST", "/orders", { corpo, token });
  }

  // ------------------------------------------------------- autenticação
  anotar("POST /orders sem token", 401, await comprar(undefined, corpoPedido([
    { produto_id: p1.id, quantidade: 1 },
  ])));

  // --------------------------------------------------- compra do cliente
  const pedidoCliente = await comprar(tokenCliente, corpoPedido([
    // o preço mandado pelo cliente deve ser ignorado; vale o do banco
    { produto_id: p1.id, quantidade: 2, preco: 0.01 },
    { produto_id: p2.id, quantidade: 1, preco: 0.01 },
  ]));
  anotar(
    "POST /orders como cliente (2 itens)",
    201,
    pedidoCliente,
    conferirPedido(pedidoCliente.corpo, {
      status: "PENDENTE",
      total: 41,
      quantidadeItens: 2,
      usuarioId: idCliente,
    })
  );

  anotarValor("estoque P1 após compra (5 - 2)", 3, await estoqueDe(p1.id));
  anotarValor("estoque P2 após compra (2 - 1)", 1, await estoqueDe(p2.id));

  const pedidosCliente = await chamar("GET", "/orders", { token: tokenCliente });
  anotar("GET /orders como cliente", 200, pedidosCliente);
  anotarValor(
    "cliente vê o próprio pedido",
    true,
    Array.isArray(pedidosCliente.corpo) && pedidosCliente.corpo.some((p) => p.id === pedidoCliente.corpo?.id)
  );
  anotarValor(
    "cliente só vê pedidos dele",
    true,
    Array.isArray(pedidosCliente.corpo) && pedidosCliente.corpo.every((p) => p.usuario_id === idCliente)
  );

  const pedidosAdmin = await chamar("GET", "/orders", { token: tokenAdmin });
  anotar("GET /orders como admin", 200, pedidosAdmin);
  anotarValor(
    "admin vê o pedido do cliente",
    true,
    Array.isArray(pedidosAdmin.corpo) && pedidosAdmin.corpo.some((p) => p.id === pedidoCliente.corpo?.id)
  );

  // ------------------------------------------------------- recusas
  anotar("POST /orders acima do estoque", 409, await comprar(tokenCliente, corpoPedido([
    { produto_id: p3.id, quantidade: 2 },
  ])));
  anotarValor("estoque P3 inalterado após recusa", 1, await estoqueDe(p3.id));

  anotar("POST /orders com produto inativo", 409, await comprar(tokenCliente, corpoPedido([
    { produto_id: p4.id, quantidade: 1 },
  ])));
  anotarValor("estoque P4 inalterado após recusa", 10, await estoqueDe(p4.id));

  anotar("POST /orders com produto inexistente", 404, await comprar(tokenCliente, corpoPedido([
    { produto_id: UUID_INEXISTENTE, quantidade: 1 },
  ])));

  anotar("POST /orders sem itens", 400, await comprar(tokenCliente, corpoPedido([])));

  anotar("POST /orders com quantidade 0", 400, await comprar(tokenCliente, corpoPedido([
    { produto_id: p1.id, quantidade: 0 },
  ])));

  anotar("POST /orders com produto repetido", 400, await comprar(tokenCliente, corpoPedido([
    { produto_id: p1.id, quantidade: 1 },
    { produto_id: p1.id, quantidade: 1 },
  ])));

  anotar("POST /orders com forma de pagamento inválida", 400, await comprar(tokenCliente, corpoPedido(
    [{ produto_id: p1.id, quantidade: 1 }],
    { forma_pagamento: "DINHEIRO" }
  )));

  anotar("POST /orders sem endereço", 400, await comprar(tokenCliente, corpoPedido(
    [{ produto_id: p1.id, quantidade: 1 }],
    { endereco_entrega: "   " }
  )));

  // ------------------------------------------- admin também é um usuário
  const pedidoAdmin = await comprar(tokenAdmin, corpoPedido([
    { produto_id: p2.id, quantidade: 1 },
  ]));
  anotar(
    "POST /orders como admin",
    201,
    pedidoAdmin,
    conferirPedido(pedidoAdmin.corpo, {
      status: "PENDENTE",
      total: 20,
      quantidadeItens: 1,
      usuarioId: idAdmin,
    })
  );
  anotarValor("estoque P2 após duas compras", 0, await estoqueDe(p2.id));

  const pedidosClienteDepois = await chamar("GET", "/orders", { token: tokenCliente });
  anotarValor(
    "cliente não vê o pedido do admin",
    false,
    Array.isArray(pedidosClienteDepois.corpo) &&
      pedidosClienteDepois.corpo.some((p) => p.id === pedidoAdmin.corpo?.id)
  );

  // ------------------------------------------------- concorrência
  const compraUnica = () => comprar(tokenCliente, corpoPedido([
    { produto_id: p3.id, quantidade: 1 },
  ]));
  const [concorrente1, concorrente2] = await Promise.all([compraUnica(), compraUnica()]);
  const statusConcorrencia = [concorrente1.status, concorrente2.status].sort((a, b) => a - b);
  const concorrenciaOk = statusConcorrencia[0] === 201 && statusConcorrencia[1] === 409;
  if (!concorrenciaOk) falhas++;
  linhas.push({
    "#": linhas.length + 1,
    caso: "duas compras simultâneas da última unidade",
    esperado: "201 e 409",
    obtido: statusConcorrencia.join(" e "),
    ok: concorrenciaOk ? "OK" : "FALHOU",
    nota: "",
  });

  const estoqueFinalP3 = await estoqueDe(p3.id);
  anotarValor("estoque P3 após concorrência", 0, estoqueFinalP3);
  anotarValor("estoque P3 não ficou negativo", true, estoqueFinalP3 >= 0);

  // ------------------------------------------------- estoque final
  anotarValor("estoque final P1", 3, await estoqueDe(p1.id));
  anotarValor("estoque final P2", 0, await estoqueDe(p2.id));
  anotarValor("estoque final P4", 10, await estoqueDe(p4.id));

  // ---------------------------------------------------------------- relatório
  console.table(linhas);
  console.log(`\n${linhas.length - falhas}/${linhas.length} casos com o resultado esperado.`);
}

try {
  await main();
} catch (erro) {
  console.error("\nERRO NO SMOKE TEST:", erro.message);
  process.exitCode = 1;
} finally {
  try {
    if (conectado) {
      // pedidos primeiro: order_items tem FK RESTRICT para products e CASCADE para orders
      await db.query(
        "delete from orders where usuario_id in (select id from users where email like $1)",
        [`%${SUFIXO}%`]
      );
      await db.query("delete from products where codigo like $1", [`smoke-ped-%-${SUFIXO}`]);
      await db.query("delete from categories where nome = $1", [CATEGORIA]);
      await db.query("delete from users where email like $1", [`%${SUFIXO}%`]);
      console.log("\nDados de teste removidos.");
    }
  } catch (erro) {
    console.error("Falha na limpeza:", erro.message);
  }
  await db.end().catch(() => {});
}
