import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { escolherCandidato, baixarImagens } from "./baixar-imagens.mjs";

let tmp;
beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "img-"));
});

const resp = (corpo, { status = 200, tipo = "application/json" } = {}) =>
    new Response(corpo, { status, headers: { "content-type": tipo } });

test("escolherCandidato ignora licencas nc/nd e imagens pequenas", () => {
    const r = [
        { id: "a", license: "by-nc", width: 1000, height: 800 },
        { id: "b", license: "by-nd", width: 1000, height: 800 },
        { id: "c", license: "by", width: 200, height: 200 },
        { id: "d", license: "cc0", width: 900, height: 700 },
        { id: "e", license: "by-sa", width: 1200, height: 900 },
    ];
    assert.equal(escolherCandidato(r).id, "d");
    assert.equal(escolherCandidato([r[0], r[1], r[2]]), null);
});

test("baixa a imagem, grava o arquivo e registra os creditos", async () => {
    const chamadas = [];
    const fakeFetch = async (url) => {
        chamadas.push(String(url));
        if (String(url).includes("/images/?")) {
            return resp(JSON.stringify({ results: [{ id: "x1", title: "Piscina", creator: "Fulano", license: "by", license_version: "2.0", width: 900, height: 700, foreign_landing_url: "https://ex.org/p" }] }));
        }
        return resp(Buffer.from([1, 2, 3, 4]), { tipo: "image/jpeg" });
    };
    const itens = [{ codigo: "p1", imagem_busca: "pool skimmer" }];
    const r = await baixarImagens(itens, { destino: tmp, fetchFn: fakeFetch, pausaMs: 0 });
    assert.deepEqual(r.baixadas, ["p1"]);
    assert.ok(fs.existsSync(path.join(tmp, "p1.jpg")));
    const creditos = fs.readFileSync(path.join(tmp, "CREDITOS.md"), "utf8");
    assert.match(creditos, /p1/);
    assert.match(creditos, /Fulano/);
    assert.match(creditos, /CC BY 2\.0/);
});

test("nao baixa de novo quando o arquivo ja existe", async () => {
    fs.writeFileSync(path.join(tmp, "p1.png"), "x");
    const fakeFetch = async () => { throw new Error("nao deveria chamar a rede"); };
    const r = await baixarImagens([{ codigo: "p1", imagem_busca: "q" }], { destino: tmp, fetchFn: fakeFetch, pausaMs: 0 });
    assert.deepEqual(r.puladas, ["p1"]);
});

test("tenta de novo apos 429 e depois conclui", async () => {
    let n = 0;
    const fakeFetch = async (url) => {
        if (String(url).includes("/images/?")) {
            n += 1;
            if (n === 1) return resp("{}", { status: 429 });
            return resp(JSON.stringify({ results: [{ id: "x", title: "t", creator: "c", license: "cc0", width: 800, height: 600 }] }));
        }
        return resp(Buffer.from([9]), { tipo: "image/webp" });
    };
    const r = await baixarImagens([{ codigo: "p2", imagem_busca: "q" }], { destino: tmp, fetchFn: fakeFetch, pausaMs: 0, esperaRetryMs: 0 });
    assert.deepEqual(r.baixadas, ["p2"]);
    assert.ok(fs.existsSync(path.join(tmp, "p2.webp")));
});

test("produto sem resultado aceitavel vai para a lista de falhas sem derrubar o lote", async () => {
    const fakeFetch = async () => resp(JSON.stringify({ results: [] }));
    const r = await baixarImagens([{ codigo: "p3", imagem_busca: "q" }], { destino: tmp, fetchFn: fakeFetch, pausaMs: 0 });
    assert.deepEqual(r.falhas, ["p3"]);
});
