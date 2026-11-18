# Upload de imagem do produto e status dos pedidos — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O admin sobe a foto do produto por um botão (sem campo de link) e troca o status do pedido (enviado, entregue, cancelado) pelo modal de detalhe, usando as rotas do PR #93.

**Architecture:**
- A `requisicao()` passa a aceitar `FormData`.
- Funções puras e testáveis ficam em `crud/` (medidas e formato da redução, validação do arquivo, próximo passo do pedido). A parte de canvas e os componentes ficam finos em volta delas.
- O `usePedidosAdmin` passa a ler o nome do cliente direto do `GET /orders` e ganha `alterarStatus`.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest (ambiente node, sem DOM: só funções puras têm teste automático), ESLint.

**Spec:** `docs/superpowers/specs/2026-11-16-upload-imagem-e-status-pedidos-design.md`

## Global Constraints

- **Branch:** `eduardo`, que já está em `origin/souza` (PR #93). Não mexer em nada dentro de `backend/`.
- **Commits:** nenhum commit sem o ok do Eduardo. Os passos "Commit" abaixo só rodam depois que ele aprovar.
- **Código:** React + TypeScript, comportamento em `.tsx` e hooks, CSS só pra layout, reusando as classes e os tokens (`--color-primary`, `--color-accent` etc.). Não restilizar o visual do Figma.
- **Textos:** tudo em pt-BR, com acento.
- **Rotas:** `POST /products/images` (multipart, campo `imagem`, resposta `{ url_imagem }`) e `PATCH /orders/:id/status` (corpo `{ status }`, resposta com o pedido completo e `users: { nome, email }`).
- **Tipos aceitos:** `image/jpeg`, `image/png`, `image/webp`. Limite do backend: 5 MB (`5 * 1024 * 1024`).
- **Redução:** lado maior de até 1600 px e qualidade 0,85. Não reduz se a imagem já tiver ≤ 1600 px e ≤ 1 MB (`1024 * 1024`).
- **Textos fixos da interface:**
  - "Escolher imagem", "Trocar imagem", "Remover imagem", "Enviando imagem…";
  - "Envie uma imagem JPG, PNG ou WebP.", "A imagem deve ter no máximo 5 MB.";
  - "Marcar como enviado", "Marcar como entregue", "Cancelar pedido", "Salvando…", "Atualizar pedidos";
  - confirmação: `Cancelar o pedido #${codigo}? Os itens voltam para o estoque e não dá para desfazer.`

## Review Focus

1. **Trocar de foto no meio do envio:** a pessoa escolhe outra foto antes da primeira terminar. Vale só a última, e a resposta antiga não pode sobrescrever o campo (Task 3, verificação manual 3).
2. **Fechar o modal durante o envio:** nada quebra, não aparece aviso de React sobre setState depois de desmontar, e o produto não é salvo (Task 3, verificação manual 4).
3. **Arquivo de tipo errado:** GIF, HEIC que o sistema não converteu, ou `type` vazio. Aparece "Envie uma imagem JPG, PNG ou WebP." e nada é enviado (teste `validarArquivoImagem` na Task 2).
4. **Status mudou por fora (409):** aparece a mensagem do backend e o botão "Atualizar pedidos", que recarrega a lista (Task 5, verificação manual 3).
5. **Editar produto sem mexer na imagem:** o `url_imagem` antigo continua igual. Já "Remover imagem" manda `null` (teste de `paraCorpoProduto` na Task 3).

---

### Task 1: `requisicao()` com `FormData` e `enviarImagemProduto`

**Files:**
- Modify: `frontend/src/api/cliente.ts` (interface `OpcoesRequisicao` e o corpo da `requisicao`)
- Modify: `frontend/src/api/produtos.ts`
- Test: `frontend/src/api/cliente.test.ts`, `frontend/src/api/produtos.test.ts`

**Interfaces:**
- Produces:
  - `OpcoesRequisicao.corpo?: unknown`: quando for `instanceof FormData`, vai cru, sem `Content-Type`;
  - `enviarImagemProduto(token: string, arquivo: Blob, nomeArquivo: string): Promise<string>` em `api/produtos.ts`, que devolve o `url_imagem`.

- [ ] **Step 1: Escrever os testes que falham**

Em `cliente.test.ts`, `describe("requisicao: FormData")`:
- `it("manda FormData cru, sem Content-Type")`: usa `respondeCom(201, { ok: true })`, chama `requisicao("/x", { metodo: "POST", corpo: fd, token: "t" })` e pega `const [, init] = vi.mocked(fetch).mock.calls[0]`. Espera `init.body` sendo o próprio `fd` (`toBe(fd)`), `init.headers` sem a chave `"Content-Type"` e `init.headers.Authorization === "Bearer t"`.
- `it("continua mandando JSON para objeto comum")`: com `corpo: { a: 1 }`, espera `init.headers["Content-Type"] === "application/json"` e `init.body === '{"a":1}'`.

Em `produtos.test.ts`, `describe("enviarImagemProduto")` (com `vi.stubGlobal("fetch", ...)` e `vi.unstubAllGlobals()` no `afterEach`):
- `it("faz POST /products/images com o campo imagem e devolve a url")`: a resposta é `{ url_imagem: "http://h/api/uploads/produtos/a.webp" }`. Espera que o retorno seja essa string, que a URL do fetch termine com `"/products/images"`, que `init.method === "POST"` e que `(init.body as FormData).get("imagem")` seja um `File` com `name === "foto.webp"`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/api/cliente.test.ts src/api/produtos.test.ts`
Expected: FAIL. O FormData vira `"{}"` por causa do `JSON.stringify`, e `enviarImagemProduto` ainda não existe.

- [ ] **Step 3: Implementar**

- Na `requisicao`, `const ehFormulario = corpo instanceof FormData`. Só põe `Content-Type: application/json` quando `corpo !== undefined && !ehFormulario`. O `body` é `ehFormulario ? corpo : JSON.stringify(corpo)`. Atualizar o JSDoc do `corpo` ("objeto enviado como JSON, ou FormData para arquivo").
- `enviarImagemProduto`: `fd.append("imagem", arquivo, nomeArquivo)` e depois `requisicao<{ url_imagem: string }>("/products/images", { metodo: "POST", corpo: fd, token })`. Devolve `.url_imagem`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/api/cliente.test.ts src/api/produtos.test.ts`
Expected: PASS (os testes antigos também)

- [ ] **Step 5: Commit (depois do ok do Eduardo)**

```bash
git add frontend/src/api/cliente.ts frontend/src/api/cliente.test.ts frontend/src/api/produtos.ts frontend/src/api/produtos.test.ts
git commit -m "feat(front): requisicao aceita FormData e envia imagem do produto"
```

---

### Task 2: Validação e redução da foto

**Files:**
- Create: `frontend/src/crud/produtos/reduzirImagem.ts`
- Test: `frontend/src/crud/produtos/reduzirImagem.test.ts`

**Interfaces:**
- Produces:
  - `TIPOS_IMAGEM_ACEITOS: readonly ["image/jpeg", "image/png", "image/webp"]`;
  - `TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024`;
  - `validarArquivoImagem(arquivo: { type: string; size: number }): string | null` devolve a mensagem de erro, ou `null` se estiver tudo certo. Ela **não** recusa por tamanho, porque a redução resolve. Só recusa pelo tipo;
  - `medidasReduzidas(largura: number, altura: number, maximo = 1600): { largura: number; altura: number }` mantém a proporção, arredonda com `Math.round` e nunca aumenta a imagem;
  - `precisaReduzir(arquivo: { size: number }, largura: number, altura: number): boolean` é `true` se algum lado passar de 1600 ou se `size > 1024 * 1024`;
  - `formatosDeSaida(tipoOriginal: string): string[]` devolve a ordem de tentativa do `canvas.toBlob`: `["image/webp", "image/png"]` pra PNG e `["image/webp", "image/jpeg"]` pros outros;
  - `prepararImagem(arquivo: File): Promise<File>` faz a parte do navegador. Lança `Error` com a mensagem pronta pra tela.

- [ ] **Step 1: Escrever os testes que falham**

- `validarArquivoImagem`:
  - `{ type: "image/gif", size: 10 }`, `{ type: "image/heic", size: 10 }` e `{ type: "", size: 10 }` devolvem `"Envie uma imagem JPG, PNG ou WebP."`;
  - `{ type: "image/jpeg", size: 8 * 1024 * 1024 }` devolve `null`.
- `medidasReduzidas`:
  - `(4000, 3000)` dá `{ largura: 1600, altura: 1200 }`;
  - `(3000, 4000)` dá `{ largura: 1200, altura: 1600 }`;
  - `(800, 600)` dá `{ largura: 800, altura: 600 }`;
  - `(1601, 1)` dá `{ largura: 1600, altura: 1 }`.
- `precisaReduzir`:
  - `({ size: 500_000 }, 1200, 900)` é `false`;
  - `({ size: 2_000_000 }, 1200, 900)` é `true`;
  - `({ size: 100_000 }, 2000, 900)` é `true`.
- `formatosDeSaida`:
  - `"image/png"` dá `["image/webp", "image/png"]`;
  - `"image/jpeg"` dá `["image/webp", "image/jpeg"]`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/crud/produtos/reduzirImagem.test.ts`
Expected: FAIL (o módulo não existe)

- [ ] **Step 3: Implementar**

As funções puras saem direto da assinatura e dos testes. A `prepararImagem` segue este algoritmo:

1. `createImageBitmap(arquivo)`. Se der erro: devolve o próprio `arquivo` quando `size <= TAMANHO_MAXIMO_IMAGEM`; senão lança `Error("A imagem deve ter no máximo 5 MB.")`.
2. Se `!precisaReduzir(...)`, devolve o `arquivo`.
3. Desenha num `<canvas>` com as `medidasReduzidas`. Para cada tipo de `formatosDeSaida`, chama `canvas.toBlob(cb, tipo, 0.85)` e aceita o primeiro blob cujo `blob.type === tipo`. O Safari devolve PNG quando pedimos WebP; por isso a comparação.
4. Monta `new File([blob], nomeComExtensao, { type: blob.type })`, trocando a extensão do nome original por `.webp`, `.jpg` ou `.png`. Se ainda passar de 5 MB, lança a mensagem de tamanho.
5. `bitmap.close()` no `finally`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/crud/produtos/reduzirImagem.test.ts`
Expected: PASS

- [ ] **Step 5: Commit (depois do ok do Eduardo)**

```bash
git add frontend/src/crud/produtos/reduzirImagem.ts frontend/src/crud/produtos/reduzirImagem.test.ts
git commit -m "feat(front): valida e reduz a foto do produto antes do upload"
```

---

### Task 3: Campo de imagem só com upload no `FormularioProduto`

**Files:**
- Create: `frontend/src/crud/produtos/FormularioProduto/CampoImagemProduto.tsx`
- Modify: `frontend/src/crud/produtos/FormularioProduto/FormularioProduto.tsx` (tira o `<label>` "URL da imagem", o `urlComErro` e o `urlImagem` do formulário; põe o campo novo)
- Modify: `frontend/src/crud/produtos/FormularioProduto/FormularioProduto.css` (tira `.formulario-produto__preview` e o comentário "preview da URL da imagem"; põe os estilos do campo novo)
- Test: `frontend/src/api/produtos.test.ts`

**Interfaces:**
- Consumes: `enviarImagemProduto` (Task 1); `validarArquivoImagem`, `prepararImagem` e `TIPOS_IMAGEM_ACEITOS` (Task 2); `useAutenticacao().token`.
- Produces: `<CampoImagemProduto url={string} onMudar={(url: string) => void} onEnviandoMudar={(enviando: boolean) => void} />`.

- [ ] **Step 1: Escrever o teste que trava o comportamento de remover**

Em `produtos.test.ts`, `it("remover imagem manda null e manter a imagem manda a url de antes")`:
- `paraCorpoProduto({ ...dados, url_imagem: "" }).url_imagem` é `null`;
- `paraCorpoProduto({ ...dados, url_imagem: "http://h/api/uploads/produtos/a.webp" }).url_imagem` é essa mesma URL.

- [ ] **Step 2: Rodar**

Run: `npx vitest run src/api/produtos.test.ts`
Expected: PASS. Ele trava o contrato que o campo novo usa; o `paraCorpoProduto` não muda.

- [ ] **Step 3: Implementar o `CampoImagemProduto`**

**Estado:**
- `previewLocal: string | null`, com o object URL da foto escolhida;
- `enviando: boolean`;
- `erro: string | null`;
- `urlComErro: string | null`, pra imagem antiga que não carrega;
- `useRef<number>` com o número do envio atual: a resposta só é aplicada se o número ainda for o mesmo;
- `useRef<boolean>` de montado: se o modal fechar, a resposta é ignorada.

**Fluxo ao escolher arquivo (`<input type="file" accept={TIPOS_IMAGEM_ACEITOS.join(",")} hidden>` aberto pelo botão):**
1. Roda `validarArquivoImagem`. Se der erro, mostra a mensagem e para.
2. Cria o `URL.createObjectURL(arquivo)` e mostra o preview na hora.
3. Chama `onEnviandoMudar(true)`.
4. `prepararImagem`, depois `enviarImagemProduto(token, arquivoPronto, arquivoPronto.name)`.
5. Se der certo: `onMudar(url)`.
6. Se der erro: `setErro(mensagemDeErro(falha))` ou a mensagem do `Error` local, e a `url` anterior continua.
7. No `finally`: `onEnviandoMudar(false)`, libera o object URL e limpa o `previewLocal`. O preview passa a usar a `url`.
8. Zerar o `value` do input, pra dar pra escolher o mesmo arquivo de novo.

**Interface:**
- preview com `src = previewLocal ?? url`. Sem imagem, ou com `url === urlComErro`, mostra o bloco vazio;
- durante o envio, "Enviando imagem…" por cima do preview, com `aria-live="polite"`;
- botão "Escolher imagem", que vira "Trocar imagem" quando `url` não está vazia;
- botão "Remover imagem", que só aparece com `url` preenchida e fora do envio, e chama `onMudar("")`;
- erro em `<p role="alert">`.

Liberar o object URL no cleanup do `useEffect` de desmontagem.

- [ ] **Step 4: Ligar no `FormularioProduto`**

- Estado novo: `enviandoImagem`.
- O `<label>` de URL dá lugar a `<div className="formulario-produto__campo--inteiro">` com o rótulo "Imagem" e `<CampoImagemProduto url={formulario.url_imagem ?? ""} onMudar={(url) => atualizarCampo("url_imagem", url)} onEnviandoMudar={setEnviandoImagem} />`.
- O botão de enviar fica `disabled={salvando || enviandoImagem}`.
- O `enviar()` retorna cedo se `enviandoImagem`.
- Atualizar o JSDoc do componente: imagem só por upload.

- [ ] **Step 5: Conferir tipos e lint**

Run: `npm run build && npm run lint` (em `frontend/`)
Expected: sem erros. `grep -n "URL da imagem\|https://\.\.\." src/crud/produtos/FormularioProduto` não acha nada.

- [ ] **Step 6: Verificação manual no navegador (celular, 375 px, backend do #93 rodando, logado como admin)**

1. Novo produto → "Escolher imagem" com um JPG de mais de 5 MB. O preview aparece na hora, junto com "Enviando imagem…" e o "Salvar" desabilitado. No fim, a rede mostra o `POST /products/images` com menos de 1 MB e o produto salvo aparece com a foto na Loja depois de recarregar.
2. Escolher um GIF: aparece "Envie uma imagem JPG, PNG ou WebP." e nenhuma requisição é feita.
3. Escolher a foto A e, logo em seguida, a foto B (rede lenta no DevTools): fica a B.
4. Escolher uma foto e fechar o modal durante o envio: nenhum erro no console e nada é salvo.
5. Editar um produto antigo (imagem de `public/produtos/`): o preview aparece. "Remover imagem" seguido de salvar deixa o produto sem imagem.

- [ ] **Step 7: Commit (depois do ok do Eduardo)**

```bash
git add frontend/src/crud/produtos/FormularioProduto frontend/src/api/produtos.test.ts
git commit -m "feat(front): imagem do produto só por upload, com preview e envio imediato"
```

---

### Task 4: API e hook de pedidos (nome do cliente e `alterarStatus`)

**Files:**
- Modify: `frontend/src/tipos/pedido.ts` (`Pedido.nomeCliente?: string`)
- Modify: `frontend/src/api/pedidos.ts`
- Modify: `frontend/src/crud/pedidos/filtrarPedidos.ts` (`comNomeDoCliente`)
- Modify: `frontend/src/crud/pedidos/usePedidosAdmin.ts`
- Test: `frontend/src/api/pedidos.test.ts`, `frontend/src/crud/pedidos/filtrarPedidos.test.ts`

**Interfaces:**
- Produces:
  - `PedidoApi.users?: { nome: string; email: string }`;
  - `paraPedido` preenche `nomeCliente` com `bruto.users?.nome`;
  - `alterarStatusPedido(token: string, id: string, status: "ENVIADO" | "ENTREGUE" | "CANCELADO"): Promise<Pedido>`;
  - `comNomeDoCliente(pedidos: Pedido[]): PedidoComCliente[]` (sai o parâmetro `usuarios`);
  - `usePedidosAdmin()` devolve `{ pedidos, carregando, erro, recarregar, alterarStatus }`, com `alterarStatus(id: string, status: StatusAlteravel): Promise<PedidoComCliente>`. Ela lança `ErroApi` se a API recusar;
  - `export type StatusAlteravel = "ENVIADO" | "ENTREGUE" | "CANCELADO"` em `tipos/pedido.ts`.

- [ ] **Step 1: Escrever os testes que falham**

- `pedidos.test.ts`:
  - `it("lê o nome do cliente de users")`: `paraPedido({ ...bruto, users: { nome: "Ana", email: "a@x" } }).nomeCliente` é `"Ana"`, e sem `users` é `undefined`;
  - `describe("alterarStatusPedido")` com o fetch stubado: a URL termina com `"/orders/o1/status"`, `init.method === "PATCH"`, `init.body === '{"status":"ENVIADO"}'`, e o retorno tem `status: "ENVIADO"`.
- `filtrarPedidos.test.ts`: trocar o teste de `comNomeDoCliente` por `comNomeDoCliente([pedido({ id: "1", nomeCliente: "Marina Kehl" }), pedido({ id: "2" })])`, que dá `["Marina Kehl", "Cliente removido"]`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/api/pedidos.test.ts src/crud/pedidos/filtrarPedidos.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar**

- `api/pedidos.ts`: o campo `users` e a função `alterarStatusPedido` (`requisicao<PedidoApi>` com `metodo: "PATCH"` e `corpo: { status }`, depois `paraPedido`).
- `comNomeDoCliente` passa a usar `pedido.nomeCliente ?? "Cliente removido"`.
- `usePedidosAdmin`:
  - tira o `listarUsuarios` e o `Promise.all`, e chama só `listarPedidos(token)`, com `.then((lista) => setPedidos(comNomeDoCliente(lista)))`;
  - `alterarStatus` chama a API, aplica `comNomeDoCliente([atualizado])[0]`, troca o pedido na lista com `setPedidos((atuais) => atuais.map(...))` e devolve o pedido;
  - atualizar o JSDoc do hook (o nome vem do próprio `GET /orders`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run && npm run build`
Expected: PASS, e o build sem erro (`/admin/pagamentos` e o `NumerosPainel` continuam compilando)

- [ ] **Step 5: Commit (depois do ok do Eduardo)**

```bash
git add frontend/src/tipos/pedido.ts frontend/src/api/pedidos.ts frontend/src/api/pedidos.test.ts frontend/src/crud/pedidos
git commit -m "feat(front): altera status do pedido e lê o cliente do GET /orders"
```

---

### Task 5: Ações de status no detalhe do pedido

**Files:**
- Modify: `frontend/src/crud/pedidos/opcoesPedido.ts`
- Create: `frontend/src/paginas/admin/pedidos/componentes/AcoesPedido/AcoesPedido.tsx` e `AcoesPedido.css`
- Modify: `frontend/src/paginas/admin/pedidos/componentes/DetalhePedido/DetalhePedido.tsx` (recebe e renderiza as ações; tira o "Só leitura" do JSDoc)
- Modify: `frontend/src/paginas/admin/pedidos/pedidos.tsx` (passa `alterarStatus` e `recarregar`; atualiza o JSDoc)
- Test: `frontend/src/crud/pedidos/opcoesPedido.test.ts`

**Interfaces:**
- Consumes: `usePedidosAdmin().alterarStatus` e `recarregar` (Task 4); `useAvisos().avisar`; `codigoPedido`; `mensagemDeErro`; `ErroApi`.
- Produces:
  - `proximoPasso(status: StatusPedido): { status: StatusAlteravel; rotulo: string; aviso: string } | null`:
    - PAGO → `{ status: "ENVIADO", rotulo: "Marcar como enviado", aviso: "Pedido marcado como enviado." }`;
    - ENVIADO → `{ status: "ENTREGUE", rotulo: "Marcar como entregue", aviso: "Pedido marcado como entregue." }`;
    - os outros status → `null`;
  - `podeCancelar(status: StatusPedido): boolean` é `true` pra PENDENTE, PAGO e ENVIADO;
  - `<AcoesPedido pedido={PedidoComCliente} onAlterar={(status: StatusAlteravel) => Promise<unknown>} onRecarregar={() => void} />`;
  - o `DetalhePedido` ganha as props `onAlterar` e `onRecarregar` e repassa pro `AcoesPedido`.

- [ ] **Step 1: Escrever os testes que falham**

- `proximoPasso`:
  - `"PAGO"` devolve objeto com `status === "ENVIADO"` e `rotulo === "Marcar como enviado"`;
  - `"ENVIADO"` devolve `status === "ENTREGUE"`;
  - `"PENDENTE"`, `"ENTREGUE"` e `"CANCELADO"` devolvem `null`.
- `podeCancelar`:
  - `["PENDENTE", "PAGO", "ENVIADO"]` dão `true`;
  - `["ENTREGUE", "CANCELADO"]` dão `false`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/crud/pedidos/opcoesPedido.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar as funções puras e o `AcoesPedido`**

O `AcoesPedido`:
- retorna `null` quando não há próximo passo e o pedido não pode ser cancelado;
- estado: `salvando` e `erro: { mensagem: string; conflito: boolean } | null`;
- `executar(status, aviso)`:
  - liga o `salvando`, limpa o erro e faz `await onAlterar(status)`;
  - se der certo, chama `avisar({ tipo: "sucesso", mensagem: aviso })`;
  - se der erro, `setErro({ mensagem: mensagemDeErro(f), conflito: f instanceof ErroApi && f.status === 409 })`;
  - no `finally`, desliga o `salvando`;
- o cancelamento só chama `executar("CANCELADO", "Pedido cancelado.")` depois do `window.confirm(...)` com o texto fixo das Global Constraints;
- layout:
  - borda em cima e o erro em `role="alert"`, com o botão "Atualizar pedidos" quando for `conflito`;
  - botão principal (`lista-admin__botao`, largura toda no celular) com `rotulo`, ou "Salvando…" durante o envio;
  - "Cancelar pedido" como botão-link vermelho e discreto;
  - os dois desabilitados durante o envio.

O pedido atualizado chega pela lista do hook, então o selo do modal e o da lista mudam juntos.

- [ ] **Step 4: Ligar no `DetalhePedido` e na página**

Em `pedidos.tsx`: `<DetalhePedido pedido={aberto} onAlterar={(s) => alterarStatus(aberto.id, s)} onRecarregar={recarregar} />`.

- [ ] **Step 5: Rodar testes, tipos e lint**

Run: `npx vitest run && npm run build && npm run lint`
Expected: tudo passando

- [ ] **Step 6: Verificação manual no navegador (375 px, admin)**

1. Pedido PAGO → "Marcar como enviado": aparece o aviso de sucesso, o selo vira "A caminho" no modal e na lista, e o botão vira "Marcar como entregue".
2. "Marcar como entregue": o selo vira "Entregue" e o rodapé de ações some.
3. Pedido PAGO aberto em duas abas, marcado como enviado na aba 1 → na aba 2 "Marcar como enviado" mostra a mensagem do 409 e o "Atualizar pedidos". Clicar recarrega a lista e aparece "A caminho".
4. "Cancelar pedido" → "Cancelar" na confirmação não faz nada; "OK" cancela, mostra o selo "Cancelado", e o estoque do produto em `/admin/produtos` aumenta.

- [ ] **Step 7: Commit (depois do ok do Eduardo)**

```bash
git add frontend/src/crud/pedidos/opcoesPedido.ts frontend/src/crud/pedidos/opcoesPedido.test.ts frontend/src/paginas/admin/pedidos
git commit -m "feat(front): botões para enviar, entregar e cancelar pedido no painel"
```

---

### Task 6: Fechamento

- [ ] **Step 1:** `npm test && npm run build && npm run lint` em `frontend/`. Tudo verde.
- [ ] **Step 2:** `git diff origin/souza --stat` mostra só `frontend/` e `docs/`, sem nada em `backend/`.
- [ ] **Step 3:** Commitar o spec e este plano (depois do ok do Eduardo) e propor o PR da `eduardo` pra `main`, avisando no corpo que depende do #93, fecha a #94 e leva o "Recado pro backend" da foto do atendimento.
