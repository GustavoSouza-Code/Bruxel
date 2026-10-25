/**
 * Dados temporários para testar produtos/categorias pelo Postman.
 *
 * Uso (na pasta backend):
 *   node scripts/seed-postman.mjs           -> insere os dados de teste
 *   node scripts/seed-postman.mjs --limpar  -> remove apenas os dados de teste
 *
 * A inserção aborta se já existir algum registro com os prefixos de teste.
 * A limpeza remove pedidos que usaram os produtos de teste (e seus itens em
 * cascata), depois os produtos e as categorias. Nada fora dos prefixos é tocado.
 */
import "dotenv/config";
import pg from "pg";

const PREFIXO_CODIGO = "teste-postman-";
const PREFIXO_CATEGORIA = "[TESTE]%";

const CATEGORIAS = [
    "[TESTE] Vestuário",
    "[TESTE] Calçados",
    "[TESTE] Acessórios",
];

const PRODUTOS = [
    {
        categoria: "[TESTE] Vestuário",
        codigo: "teste-postman-cam-001",
        nome: "Camiseta Teste Preta",
        descricao: "Camiseta de teste para o Postman (tamanho P).",
        preco: "59.90",
        estoque: 12,
        ativo: true,
    },
    {
        categoria: "[TESTE] Vestuário",
        codigo: "teste-postman-cam-002",
        nome: "Camiseta Teste Branca",
        descricao: "Camiseta de teste para o Postman (tamanho M).",
        preco: "64.90",
        estoque: 8,
        ativo: true,
    },
    {
        categoria: "[TESTE] Calçados",
        codigo: "teste-postman-ten-001",
        nome: "Tênis Teste Runner",
        descricao: "Tênis de teste para o Postman (tamanho 42).",
        preco: "199.90",
        estoque: 5,
        ativo: true,
    },
    {
        categoria: "[TESTE] Calçados",
        codigo: "teste-postman-chi-001",
        nome: "Chinelo Teste",
        descricao: "Chinelo de teste com estoque zero.",
        preco: "49.90",
        estoque: 0,
        ativo: true,
    },
    {
        categoria: "[TESTE] Acessórios",
        codigo: "teste-postman-bon-001",
        nome: "Boné Teste",
        descricao: "Boné de teste inativo para validar a regra de disponibilidade.",
        preco: "39.90",
        estoque: 3,
        ativo: false,
    },
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function inserir() {
    await client.query("BEGIN");

    const existentes = await client.query(
        `SELECT 'categoria' AS tipo, nome AS valor FROM categories WHERE nome LIKE $1
         UNION ALL
         SELECT 'produto' AS tipo, codigo AS valor FROM products WHERE codigo LIKE $2`,
        [PREFIXO_CATEGORIA, `${PREFIXO_CODIGO}%`]
    );

    if (existentes.rowCount > 0) {
        throw new Error(
            `Já existem registros de teste (${existentes.rows.map((r) => r.valor).join(", ")}). Nada foi alterado.`
        );
    }

    const idsCategorias = new Map();
    for (const nome of CATEGORIAS) {
        const resultado = await client.query(
            "INSERT INTO categories (nome) VALUES ($1) RETURNING id, nome",
            [nome]
        );
        idsCategorias.set(nome, resultado.rows[0].id);
    }

    const inseridos = [];
    for (const produto of PRODUTOS) {
        const resultado = await client.query(
            `INSERT INTO products
                (categoria_id, codigo, nome, descricao, preco, estoque, url_imagem, ativo)
             VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)
             RETURNING id, categoria_id, codigo, nome, preco, estoque, ativo`,
            [
                idsCategorias.get(produto.categoria),
                produto.codigo,
                produto.nome,
                produto.descricao,
                produto.preco,
                produto.estoque,
                produto.ativo,
            ]
        );
        inseridos.push({ ...resultado.rows[0], categoria: produto.categoria });
    }

    await client.query("COMMIT");

    console.log("CATEGORIAS INSERIDAS:");
    console.table([...idsCategorias].map(([nome, id]) => ({ id, nome })));
    console.log("PRODUTOS INSERIDOS:");
    console.table(inseridos);
}

async function limpar() {
    await client.query("BEGIN");

    // remove pedidos que usaram os produtos de teste (itens saem por CASCADE)
    const pedidos = await client.query(
        `DELETE FROM orders
         WHERE id IN (
             SELECT DISTINCT oi.pedido_id
             FROM order_items oi
             JOIN products p ON p.id = oi.produto_id
             WHERE p.codigo LIKE $1
         )
         RETURNING id`,
        [`${PREFIXO_CODIGO}%`]
    );

    // favoritos saem por CASCADE ao apagar o produto
    const produtos = await client.query(
        "DELETE FROM products WHERE codigo LIKE $1 RETURNING id, codigo, nome",
        [`${PREFIXO_CODIGO}%`]
    );

    // as categorias só podem sair depois dos produtos (FK ON DELETE RESTRICT)
    const categorias = await client.query(
        "DELETE FROM categories WHERE nome LIKE $1 RETURNING id, nome",
        [PREFIXO_CATEGORIA]
    );

    await client.query("COMMIT");

    console.log(`Pedidos removidos: ${pedidos.rowCount}`);
    console.log(`Produtos removidos: ${produtos.rowCount}`);
    console.table(produtos.rows);
    console.log(`Categorias removidas: ${categorias.rowCount}`);
    console.table(categorias.rows);
}

try {
    await client.connect();

    if (process.argv.includes("--limpar")) {
        await limpar();
    } else {
        await inserir();
    }
} catch (erro) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("ERRO:", erro.message);
    process.exitCode = 1;
} finally {
    await client.end().catch(() => {});
}
