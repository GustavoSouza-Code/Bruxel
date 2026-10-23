/**
 * Teste de fumaça do fluxo de Ordem de Serviço.
 *
 * Roda contra a API já em execução (npm run dev) e contra o Postgres do
 * backend/.env. Cria usuários, produto e ordens temporários com o sufixo
 * "smoke-os-" e apaga tudo no final.
 *
 * Uso:
 *   npm run dev                   (em um terminal)
 *   npm run test:smoke:atendimentos (em outro)
 */
import "dotenv/config";
import pg from "pg";

const BASE = process.env.API_URL ?? "http://localhost:3000/api";
const SUFIXO = Date.now().toString(36);
const EMAIL_ADMIN = `smoke.os.admin.${SUFIXO}@example.com`;
const EMAIL_CLIENTE = `smoke.os.cliente.${SUFIXO}@example.com`;
const EMAIL_OUTRO = `smoke.os.outro.${SUFIXO}@example.com`;
const SENHA = "Teste@12345";
const CPF_ADMIN = Date.now().toString().slice(-11);
const CPF_CLIENTE = (Date.now() + 1).toString().slice(-11);
const CPF_OUTRO = (Date.now() + 2).toString().slice(-11);
const CATEGORIA = `Smoke OS ${SUFIXO}`;
const UUID_INEXISTENTE = "00000000-0000-4000-8000-000000000000";

const DIAS = 24 * 60 * 60 * 1000;
const DATA_HORA_1 = new Date(Date.now() + 7 * DIAS).toISOString();
const DATA_HORA_2 = new Date(Date.now() + 8 * DIAS).toISOString();

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

function pedido(extras = {}) {
  return {
    tipo: "VAZAMENTO",
    descricao: "Piscina com vazamento perto da bomba e nível baixando rápido.",
    data_hora: DATA_HORA_1,
    telefone: "51999990000",
    rua: "Rua Smoke",
    numero: "123",
    bairro: "Centro",
    cidade: "Lajeado",
    estado: "rs",
    cep: "95900-000",
    ...extras,
  };
}

function conferirAtendimento(atendimento, { status, usuarioId, tecnicoId }) {
  const problemas = [];
  if (atendimento?.status !== status) problemas.push(`status ${atendimento?.status}`);
  if (usuarioId && atendimento?.usuario_id !== usuarioId) problemas.push("usuario_id diferente");
  if (tecnicoId && atendimento?.tecnico_id !== tecnicoId) problemas.push("tecnico_id diferente");
  if (!Array.isArray(atendimento?.itens)) problemas.push("itens ausentes");
  if (atendimento?.estado && atendimento.estado !== atendimento.estado.toUpperCase()) {
    problemas.push("UF não normalizada");
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
  const idAdmin = await criarUsuario("Smoke OS Admin", EMAIL_ADMIN, CPF_ADMIN);
  const idCliente = await criarUsuario("Smoke OS Cliente", EMAIL_CLIENTE, CPF_CLIENTE);
  const idOutro = await criarUsuario("Smoke OS Outro", EMAIL_OUTRO, CPF_OUTRO);

  await db.query("update users set perfil = 'ADMINISTRADOR' where email = $1", [EMAIL_ADMIN]);
  const tokenAdmin = await entrar(EMAIL_ADMIN);
  const tokenCliente = await entrar(EMAIL_CLIENTE);
  const tokenOutro = await entrar(EMAIL_OUTRO);

  const { rows: categorias } = await db.query(
    "insert into categories (nome) values ($1) returning id",
    [CATEGORIA]
  );
  const categoriaId = categorias[0].id;

  const produto = await chamar("POST", "/products", {
    corpo: {
      categoria_id: categoriaId,
      nome: `Produto Smoke OS ${SUFIXO}`,
      codigo: `smoke-os-${SUFIXO}`,
      preco: 12.5,
      estoque: 5,
      ativo: true,
    },
    token: tokenAdmin,
  });
  if (produto.status !== 201) {
    throw new Error(`Falha ao criar produto: ${JSON.stringify(produto.corpo)}`);
  }

  const solicitar = (token, corpo) => chamar("POST", "/appointments", { corpo, token });
  const mudarStatus = (token, id, corpo) =>
    chamar("PATCH", `/appointments/${id}/status`, { corpo, token });

  // ------------------------------------------------------------- criação
  anotar("POST /appointments sem token", 401, await solicitar(undefined, pedido()));

  anotar("POST /appointments com tipo inválido", 400, await solicitar(tokenCliente, pedido({ tipo: "PINTURA" })));

  anotar(
    "POST /appointments com descrição curta",
    400,
    await solicitar(tokenCliente, pedido({ descricao: "curta" }))
  );

  anotar(
    "POST /appointments com data inválida",
    400,
    await solicitar(tokenCliente, pedido({ data_hora: "não é data" }))
  );

  const osCliente = await solicitar(
    tokenCliente,
    pedido({ tecnico_id: idAdmin, data_hora: DATA_HORA_1, foto_url: "https://exemplo.com/foto.jpg" })
  );
  anotar(
    "POST /appointments como cliente",
    201,
    osCliente,
    conferirAtendimento(osCliente.corpo, {
      status: "AGUARDANDO",
      usuarioId: idCliente,
      tecnicoId: idAdmin,
    })
  );

  anotar(
    "POST /appointments no mesmo horário do técnico",
    409,
    await solicitar(tokenOutro, pedido({ tecnico_id: idAdmin, data_hora: DATA_HORA_1 }))
  );

  const osOutro = await solicitar(
    tokenOutro,
    pedido({ tecnico_id: idAdmin, data_hora: DATA_HORA_2 })
  );
  anotar(
    "POST /appointments de outro cliente",
    201,
    osOutro,
    conferirAtendimento(osOutro.corpo, { status: "AGUARDANDO", usuarioId: idOutro })
  );

  const idOs = osCliente.corpo.id;
  const idOsOutro = osOutro.corpo.id;

  // ------------------------------------------------------------- consultas
  const listaCliente = await chamar("GET", "/appointments", { token: tokenCliente });
  anotar("GET /appointments como cliente", 200, listaCliente);
  anotarValor(
    "cliente vê a própria ordem",
    true,
    Array.isArray(listaCliente.corpo) && listaCliente.corpo.some((os) => os.id === idOs)
  );
  anotarValor(
    "cliente não vê a ordem de outro cliente",
    false,
    Array.isArray(listaCliente.corpo) && listaCliente.corpo.some((os) => os.id === idOsOutro)
  );
  anotarValor(
    "lista do cliente só tem ordens dele",
    true,
    Array.isArray(listaCliente.corpo) && listaCliente.corpo.every((os) => os.usuario_id === idCliente)
  );

  const listaOutro = await chamar("GET", "/appointments", { token: tokenOutro });
  anotarValor(
    "outro cliente não vê a ordem do primeiro",
    false,
    Array.isArray(listaOutro.corpo) && listaOutro.corpo.some((os) => os.id === idOs)
  );

  const listaAdmin = await chamar("GET", "/appointments", { token: tokenAdmin });
  anotar("GET /appointments como admin", 200, listaAdmin);
  anotarValor(
    "admin vê as ordens de todos os clientes",
    true,
    Array.isArray(listaAdmin.corpo) &&
      listaAdmin.corpo.some((os) => os.id === idOs) &&
      listaAdmin.corpo.some((os) => os.id === idOsOutro)
  );

  anotar("GET /appointments/:id do próprio cliente", 200, await chamar("GET", `/appointments/${idOs}`, {
    token: tokenCliente,
  }));
  anotar("GET /appointments/:id de outro cliente", 403, await chamar("GET", `/appointments/${idOs}`, {
    token: tokenOutro,
  }));
  anotar("GET /appointments/:id inexistente", 404, await chamar("GET", `/appointments/${UUID_INEXISTENTE}`, {
    token: tokenAdmin,
  }));
  anotar("GET /appointments/:id como admin", 200, await chamar("GET", `/appointments/${idOs}`, {
    token: tokenAdmin,
  }));

  // ------------------------------------------------------------- segurança
  anotar(
    "cliente tenta mudar o status",
    403,
    await mudarStatus(tokenCliente, idOs, { status: "AGENDADO" })
  );

  anotar(
    "cliente tenta preencher a OS",
    403,
    await chamar("PUT", `/appointments/${idOs}/os`, {
      corpo: { observacoes_tecnico: "Tentativa do cliente" },
      token: tokenCliente,
    })
  );

  // ------------------------------------------------------------- andamento
  anotar(
    "transição inválida AGUARDANDO -> CONCLUIDO",
    409,
    await mudarStatus(tokenAdmin, idOs, { status: "CONCLUIDO" })
  );

  anotar(
    "recusar sem mensagem para o cliente",
    400,
    await mudarStatus(tokenAdmin, idOs, { status: "RECUSADO" })
  );

  anotar(
    "confirmar visita",
    200,
    await mudarStatus(tokenAdmin, idOs, { status: "AGENDADO" }),
    "AGUARDANDO -> AGENDADO"
  );

  anotar(
    "editar a OS antes de iniciar o atendimento",
    409,
    await chamar("PUT", `/appointments/${idOs}/os`, {
      corpo: { observacoes_tecnico: "Ainda não começou" },
      token: tokenAdmin,
    })
  );

  anotar(
    "iniciar atendimento",
    200,
    await mudarStatus(tokenAdmin, idOs, { status: "EM_ANDAMENTO" }),
    "AGENDADO -> EM_ANDAMENTO"
  );

  const osPreenchida = await chamar("PUT", `/appointments/${idOs}/os`, {
    corpo: {
      observacoes_tecnico: "Troca do selo da bomba e limpeza do filtro.",
      valor_mao_de_obra: 150.5,
      itens: [{ produto_id: produto.corpo.id, quantidade: 2 }],
    },
    token: tokenAdmin,
  });
  anotar("PUT /appointments/:id/os", 200, osPreenchida);
  anotarValor(
    "OS guarda observações, mão de obra e item com preço do banco",
    true,
    osPreenchida.corpo?.observacoes_tecnico?.includes("bomba") === true &&
      Number(osPreenchida.corpo?.valor_mao_de_obra) === 150.5 &&
      osPreenchida.corpo?.itens?.length === 1 &&
      Number(osPreenchida.corpo.itens[0].preco_unitario) === 12.5
  );

  anotar(
    "PUT /appointments/:id/os com estoque insuficiente",
    409,
    await chamar("PUT", `/appointments/${idOs}/os`, {
      corpo: { itens: [{ produto_id: produto.corpo.id, quantidade: 99 }] },
      token: tokenAdmin,
    })
  );

  anotar(
    "PUT /appointments/:id/os com produto inexistente",
    404,
    await chamar("PUT", `/appointments/${idOs}/os`, {
      corpo: { itens: [{ produto_id: UUID_INEXISTENTE, quantidade: 1 }] },
      token: tokenAdmin,
    })
  );

  anotar(
    "PUT /appointments/:id/os com quantidade zero",
    400,
    await chamar("PUT", `/appointments/${idOs}/os`, {
      corpo: { itens: [{ produto_id: produto.corpo.id, quantidade: 0 }] },
      token: tokenAdmin,
    })
  );

  anotar(
    "concluir atendimento",
    200,
    await mudarStatus(tokenAdmin, idOs, { status: "CONCLUIDO" }),
    "EM_ANDAMENTO -> CONCLUIDO"
  );

  anotar("PATCH /appointments/:id/pagamento", 200, await chamar(
    "PATCH",
    `/appointments/${idOs}/pagamento`,
    { token: tokenAdmin }
  ));

  const pago = await chamar("GET", `/appointments/${idOs}`, { token: tokenCliente });
  anotarValor("cliente vê a ordem concluída no histórico", "CONCLUIDO", pago.corpo?.status);
  anotarValor("ordem concluída tem data de pagamento", true, Boolean(pago.corpo?.pago_em));

  anotar(
    "editar a OS depois do pagamento",
    409,
    await chamar("PUT", `/appointments/${idOs}/os`, {
      corpo: { valor_mao_de_obra: 1 },
      token: tokenAdmin,
    })
  );

  // ------------------------------------------------------------- recusa
  const recusa = await mudarStatus(tokenAdmin, idOsOutro, {
    status: "RECUSADO",
    mensagem_cliente: "Não conseguimos atender nesse horário. Podemos remarcar.",
  });
  anotar("recusar com mensagem para o cliente", 200, recusa);

  const osRecusada = await chamar("GET", `/appointments/${idOsOutro}`, { token: tokenOutro });
  anotarValor(
    "cliente vê a mensagem da recusa",
    true,
    osRecusada.corpo?.mensagem_cliente?.includes("remarcar") === true
  );
  anotar(
    "cliente não acessa a ordem recusada de outro",
    403,
    await chamar("GET", `/appointments/${idOsOutro}`, { token: tokenCliente })
  );

  // recusar libera o horário do técnico para um novo pedido
  const osDepoisDaRecusa = await solicitar(
    tokenOutro,
    pedido({ tecnico_id: idAdmin, data_hora: DATA_HORA_2 })
  );
  anotar("horário volta a ficar livre depois da recusa", 201, osDepoisDaRecusa);

  // ------------------------------------------------------------- filtros
  const concluidas = await chamar("GET", "/appointments?status=CONCLUIDO", { token: tokenAdmin });
  anotar("GET /appointments?status=CONCLUIDO", 200, concluidas);
  anotarValor(
    "filtro por status devolve só concluídas",
    true,
    Array.isArray(concluidas.corpo) && concluidas.corpo.every((os) => os.status === "CONCLUIDO")
  );

  const doTecnico = await chamar("GET", `/appointments?tecnico_id=${idAdmin}`, { token: tokenAdmin });
  anotar("GET /appointments?tecnico_id=", 200, doTecnico);
  anotarValor(
    "filtro por técnico devolve as ordens dele",
    true,
    Array.isArray(doTecnico.corpo) && doTecnico.corpo.every((os) => os.tecnico_id === idAdmin)
  );

  anotar("GET /appointments?status=INVALIDO", 400, await chamar("GET", "/appointments?status=INVALIDO", {
    token: tokenAdmin,
  }));

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
      // as ordens saem antes dos produtos/usuários por causa das FKs
      await db.query(
        `delete from appointments
         where usuario_id in (select id from users where email like $1)
            or tecnico_id in (select id from users where email like $1)`,
        [`%${SUFIXO}%`]
      );
      await db.query("delete from products where codigo = $1", [`smoke-os-${SUFIXO}`]);
      await db.query("delete from categories where nome = $1", [CATEGORIA]);
      await db.query("delete from users where email like $1", [`%${SUFIXO}%`]);
      console.log("\nDados de teste removidos.");
    }
  } catch (erro) {
    console.error("Falha na limpeza:", erro.message);
  }
  await db.end().catch(() => {});
}
