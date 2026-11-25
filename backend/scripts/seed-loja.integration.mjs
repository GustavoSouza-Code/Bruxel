import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import bcrypt from "bcrypt";
import pg from "pg";
import {
    validarCatalogo,
    importarCatalogo,
    importarUsuarios,
    carregarCatalogo,
} from "./seed-loja.mjs";

const URL_TESTE =
    process.env.TEST_DATABASE_URL ?? "postgresql://bruxel@localhost/bruxel_seedtest?host=/tmp&port=5433";

let client;
let tmp;

const ITENS = [
    { categoria: "Tratamento da água", codigo: "t-cloro-1kg", nome: "Cloro 1kg", descricao: "d", preco: "39.90", estoque: 10 },
    { categoria: "Limpeza da Piscina", codigo: "t-peneira", nome: "Peneira", descricao: "d", preco: "49.90", estoque: 5 },
];

before(async () => {
    client = new pg.Client({ connectionString: URL_TESTE });
    await client.connect();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "seed-"));
    fs.mkdirSync(path.join(tmp, "imagens"));
    fs.mkdirSync(path.join(tmp, "uploads"));
    fs.writeFileSync(path.join(tmp, "imagens", "t-cloro-1kg.jpg"), "img");
});

after(async () => {
    await client.query("DELETE FROM products WHERE codigo LIKE 't-%'");
    await client.query("DELETE FROM users WHERE email LIKE '%@seedtest.local'");
    await client.end();
    fs.rmSync(tmp, { recursive: true, force: true });
});

const opcoes = () => ({ dirImagens: path.join(tmp, "imagens"), uploadDir: path.join(tmp, "uploads") });

test("importa produtos, copia a imagem e preenche url_imagem relativa", async () => {
    const r = await importarCatalogo(client, ITENS, opcoes());
    assert.equal(r.criados, 2);
    const { rows } = await client.query("SELECT codigo, url_imagem, preco FROM products WHERE codigo LIKE 't-%' ORDER BY codigo");
    assert.equal(rows.length, 2);
    assert.equal(rows[0].url_imagem, "/api/uploads/produtos/t-cloro-1kg.jpg");
    assert.equal(rows[1].url_imagem, null);
    assert.ok(fs.existsSync(path.join(tmp, "uploads", "produtos", "t-cloro-1kg.jpg")));
    assert.deepEqual(r.semImagem, ["t-peneira"]);
});

test("rodar duas vezes nao duplica e atualiza o preco", async () => {
    const alterado = ITENS.map((i) => (i.codigo === "t-peneira" ? { ...i, preco: "55.00" } : i));
    const r = await importarCatalogo(client, alterado, opcoes());
    assert.equal(r.criados, 0);
    assert.equal(r.atualizados, 2);
    const { rows } = await client.query("SELECT preco FROM products WHERE codigo = 't-peneira'");
    assert.equal(rows[0].preco, "55.00");
    const { rows: total } = await client.query("SELECT count(*)::int AS n FROM products WHERE codigo LIKE 't-%'");
    assert.equal(total[0].n, 2);
});

test("categoria inexistente aborta sem inserir nada", async () => {
    const ruim = [{ ...ITENS[0], codigo: "t-ruim", categoria: "Nao existe" }];
    await assert.rejects(() => importarCatalogo(client, ruim, opcoes()), /categoria/i);
    const { rows } = await client.query("SELECT 1 FROM products WHERE codigo = 't-ruim'");
    assert.equal(rows.length, 0);
});

test("validarCatalogo rejeita codigo repetido, preco invalido e estoque negativo", () => {
    assert.throws(() => validarCatalogo([ITENS[0], ITENS[0]]), /repetido/i);
    assert.throws(() => validarCatalogo([{ ...ITENS[0], preco: "abc" }]), /preco/i);
    assert.throws(() => validarCatalogo([{ ...ITENS[0], estoque: -1 }]), /estoque/i);
    assert.throws(() => validarCatalogo([{ ...ITENS[0], nome: "x".repeat(151) }]), /nome/i);
});

test("catalogo.json do repositorio e valido e usa so categorias existentes", async () => {
    const itens = carregarCatalogo(new URL("../seed/catalogo.json", import.meta.url).pathname);
    validarCatalogo(itens);
    assert.ok(itens.length >= 20);
    const { rows } = await client.query("SELECT nome FROM categories");
    const nomes = new Set(rows.map((r) => r.nome));
    for (const i of itens) assert.ok(nomes.has(i.categoria), `categoria ${i.categoria} (${i.codigo})`);
});

const USUARIOS = [
    { nome: "Cliente Um", email: "um@seedtest.local", senha: "SenhaForte123", cpf: "11111111111", telefone: "51999990001" },
    { nome: "Admin Dois", email: "dois@seedtest.local", cpf: "22222222222", perfil: "ADMINISTRADOR" },
];

test("cria usuarios com hash bcrypt, perfil e senha gerada quando ausente", async () => {
    const r = await importarUsuarios(client, USUARIOS);
    assert.equal(r.criados.length, 2);
    const gerada = r.criados.find((u) => u.email === "dois@seedtest.local");
    assert.ok(gerada.senha && gerada.senha.length >= 12);
    const { rows } = await client.query("SELECT email, senha, perfil FROM users WHERE email LIKE '%@seedtest.local' ORDER BY email");
    const um = rows.find((u) => u.email === "um@seedtest.local");
    const dois = rows.find((u) => u.email === "dois@seedtest.local");
    assert.equal(um.perfil, "CLIENTE");
    assert.equal(dois.perfil, "ADMINISTRADOR");
    assert.ok(await bcrypt.compare("SenhaForte123", um.senha));
    assert.ok(await bcrypt.compare(gerada.senha, dois.senha));
});

test("usuario existente e ignorado sem trocar a senha", async () => {
    const antes = (await client.query("SELECT senha FROM users WHERE email = 'um@seedtest.local'")).rows[0].senha;
    const r = await importarUsuarios(client, [{ ...USUARIOS[0], senha: "OutraSenha999" }]);
    assert.deepEqual(r.existentes, ["um@seedtest.local"]);
    const depois = (await client.query("SELECT senha FROM users WHERE email = 'um@seedtest.local'")).rows[0].senha;
    assert.equal(antes, depois);
});

test("rejeita cpf invalido, email invalido e senha curta", async () => {
    await assert.rejects(() => importarUsuarios(client, [{ ...USUARIOS[0], email: "x1@seedtest.local", cpf: "123" }]), /cpf/i);
    await assert.rejects(() => importarUsuarios(client, [{ ...USUARIOS[0], email: "invalido", cpf: "33333333333" }]), /email/i);
    await assert.rejects(() => importarUsuarios(client, [{ ...USUARIOS[0], email: "x2@seedtest.local", cpf: "44444444444", senha: "curta" }]), /senha/i);
});
