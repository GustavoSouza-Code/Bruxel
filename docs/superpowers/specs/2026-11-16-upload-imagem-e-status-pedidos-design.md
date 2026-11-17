# Upload de imagem do produto e status dos pedidos no painel (issue #94)

## Por quê

O PR #93 (Gustavo Souza) colocou no backend o upload de imagem (`POST /api/products/images`) e a troca de status do pedido (`PATCH /api/orders/:id/status`). O front ainda não usa nenhum dos dois: o admin só cadastra imagem colando um link, e a tela de pedidos é só leitura. A issue #94 pede a integração.

Quem usa é o **dono da loja, pelo celular, com poucos pedidos por dia**. Isso guia as decisões abaixo:

- Ele vai fotografar o produto no celular e subir na hora. Uma foto de celular costuma ter de 3 a 8 MB, e o backend recusa acima de 5 MB.
- Todo pedido já nasce **PAGO** (simulação acadêmica). Então cada compra precisa que ele marque "enviado" e depois "entregue". Isso é rotina, não exceção.
- Como são poucos pedidos, não precisa de ação em lote nem de atalho na lista.

## Objetivos

- No cadastro e na edição de produto: escolher uma foto (câmera ou galeria), ver o preview na hora, a foto sobe sozinha e o produto fica com a imagem.
- **Imagem do produto só por upload.** Colar link pelo celular é difícil (decisão do Eduardo), então o campo "URL da imagem" sai do formulário, junto com todo o código que só existia pra ele.
- No detalhe do pedido: um botão com o próximo passo (enviar ou entregar) e a opção de cancelar, com o status atualizado na lista logo em seguida.
- Mostrar os erros do backend com o texto que ele manda.

## Fora do escopo

- Recortar ou girar a foto. A loja mostra a imagem com `object-fit: contain`, então a foto aparece inteira.
- Motivo do cancelamento (o backend não guarda). Se o cliente pedir no futuro, vira recado pro backend.
- Ações em lote ou troca de status direto na lista.
- Apagar do disco as imagens que sobraram (escolheu e depois cancelou o formulário). Fica pra depois, se ocupar espaço.
- Mexer no backend.
- O link de foto do **atendimento** (`CampoFotoLink`, em "Solicitar atendimento"). Ele também é um link colado pelo celular, mas a rota de upload do #93 é só pra admin, então o cliente não conseguiria usá-la. Fica como está e vira recado pro backend (abaixo).

## Anti-objetivos

- Foto de celular recusada por tamanho.
- Restilizar o visual do Figma: os elementos novos usam as classes e os tokens que já existem.
- Cancelar sem querer (o cancelamento devolve o estoque e não pode ser desfeito).

## Abordagens consideradas

**Onde fica a troca de status**
1. **Botões no rodapé do modal de detalhe (escolhida).** O dono já abre o pedido pra ver os itens e o endereço antes de despachar. No celular o botão ocupa a largura toda, e a lista continua limpa.
2. `<select>` de status no modal. É genérico, mas mostra opções que o backend recusaria (ex.: "Entregue" num pedido só pago), e no celular é um toque a mais.
3. Botão rápido no card da lista. É mais rápido, mas com poucos pedidos por dia não compensa, e aumenta a chance de tocar sem querer.

**Tamanho da foto**
1. **Reduzir no navegador antes de enviar (escolhida).** Lado maior de até 1600 px. Uma foto de 6 MB vira algo em torno de 300 KB: sobe rápido no 4G, nunca esbarra nos 5 MB e ocupa menos disco na VM.
2. Mandar o arquivo original e mostrar erro acima de 5 MB. É mais simples, mas falha justamente no caso principal (foto do celular).

## Design

### 1. `requisicao()` aceita `FormData` (`api/cliente.ts`)
Se `corpo` for `FormData`, ele vai direto no `body`, sem `Content-Type` (o navegador põe o `multipart/form-data` com o boundary) e sem `JSON.stringify`. Fora isso, nada muda.

### 2. Upload da imagem
- **`api/produtos.ts` → `enviarImagemProduto(token, arquivo)`**: monta o `FormData` com o campo `imagem`, faz `POST /products/images` e devolve o `url_imagem`.
- **`crud/produtos/reduzirImagem.ts`**:
  - `medidasReduzidas(largura, altura, max = 1600)` é uma função pura e testada.
  - `reduzirImagem(arquivo)` lê a imagem (`createImageBitmap`), desenha num `<canvas>` e exporta em WebP (qualidade 0,85). Se o navegador não gerar WebP (Safari), exporta em JPEG, ou em PNG quando o original é PNG, pra não perder fundo transparente.
  - Se a foto já é pequena (≤ 1600 px e ≤ 1 MB), manda o original.
  - Se a redução falhar, manda o original quando ele tiver até 5 MB; acima disso, mostra erro.
- **Validação antes de enviar**: aceita JPG, PNG e WebP, como pede a issue. O `accept` do input é `image/jpeg,image/png,image/webp`, e no iPhone o sistema já converte HEIC pra JPEG. Outro tipo mostra "Envie uma imagem JPG, PNG ou WebP."
- **`FormularioProduto`**: o campo "URL da imagem" é **removido** e no lugar entra um bloco "Imagem", só com upload:
  - preview grande (ou um espaço vazio com ícone), e embaixo o botão **"Escolher imagem"**, que vira "Trocar imagem" quando já existe uma imagem;
  - ao lado, um botão discreto **"Remover imagem"** (escolha minha: sem o campo de link, é o único jeito de tirar a imagem de um produto). Ele só limpa o `url_imagem` no formulário, e a mudança vale ao salvar;
  - durante o envio: o preview local aparece na hora (`URL.createObjectURL`), com "Enviando imagem…" por cima, e o "Salvar" fica desabilitado;
  - deu certo: o campo `url_imagem` recebe a URL devolvida e o preview passa a usar essa URL;
  - deu erro: aparece a mensagem do backend embaixo do botão e volta a URL anterior;
  - se ele escolher outra foto antes da primeira terminar, vale só a última. Os object URLs são liberados;
  - produtos antigos que já têm link (inclusive os de `frontend/public/produtos/`) continuam mostrando a imagem no preview e na loja. O `url_imagem` continua sendo o mesmo campo, só não dá mais pra digitar nele;
  - **o que sai do código:** o `<input>` de URL, o `atualizarCampo("url_imagem", texto digitado)`, o `trim()` da URL digitada e o comentário de CSS "preview da URL da imagem, embaixo do campo". O `urlComErro` fica, porque uma imagem antiga pode não carregar, e aí aparece o espaço vazio em vez de uma imagem quebrada. O `paraCorpoProduto` e o `textoOuNull` continuam, porque ainda mandam `null` quando a imagem é removida.

### 3. Status do pedido
- **`api/pedidos.ts`**:
  - `alterarStatusPedido(token, id, status)` faz `PATCH /orders/:id/status` e devolve o `Pedido` convertido;
  - o `PedidoApi` ganha `users?: { nome, email }`.
- **Nome do cliente sem `GET /users`** (escolha minha): o `GET /orders` do admin agora já traz `users.nome`. O `usePedidosAdmin` deixa de chamar `listarUsuarios` e o `comNomeDoCliente` passa a usar esse nome, com "Cliente removido" quando ele não vier. Isso também vale pra `/admin/pagamentos` e pra home do painel, que usam o mesmo hook.
- **`crud/pedidos/opcoesPedido.ts`** (funções puras, testadas):
  - `proximoPasso(status)` devolve `PAGO → { status: "ENVIADO", rotulo: "Marcar como enviado" }` e `ENVIADO → { status: "ENTREGUE", rotulo: "Marcar como entregue" }`; nos outros status devolve `null`;
  - `podeCancelar(status)` é `true` pra PENDENTE, PAGO e ENVIADO (igual a `STATUS_CANCELAVEIS` do backend).
- **`usePedidosAdmin`** ganha `alterarStatus(id, status)`: chama a API, troca o pedido na lista pela versão que voltou (mantendo o nome do cliente) e repassa o erro pra quem chamou.
- **`DetalhePedido`** ganha o rodapé de ações (só aparece se houver próximo passo ou se o pedido puder ser cancelado):
  - botão principal com o próximo passo, na largura toda no celular;
  - "Cancelar pedido" como link discreto, em vermelho. Ele pede confirmação com `window.confirm`, igual às exclusões do painel: *"Cancelar o pedido #3F9A21C0? Os itens voltam para o estoque e não dá para desfazer."*;
  - enquanto salva, os botões ficam desabilitados e o texto vira "Salvando…";
  - deu certo: aviso de sucesso (`useAvisos`), por exemplo "Pedido marcado como enviado.", e o selo de status muda no modal e na lista;
  - deu erro: a mensagem do backend aparece em cima dos botões. No 409 ("O status do pedido mudou…") também aparece o botão "Atualizar pedidos", que chama o `recarregar`.
- O comentário da página `/admin/pedidos` que dizia "só leitura" é atualizado.

### Rascunho das telas (celular)

```
Produto (modal)                      Pedido #3F9A21C0 (modal)
┌──────────────────────────┐         ┌──────────────────────────┐
│ Nome / Código / …        │         │ Cliente  Data  Pix [Pago]│
│ Imagem                   │         │ itens…        Total R$ 89│
│ ┌──────────────────────┐ │         │ Entregar em: Rua …       │
│ │      (preview)       │ │         │ ──────────────────────── │
│ │  Enviando imagem…    │ │         │ [  Marcar como enviado  ]│
│ └──────────────────────┘ │         │      Cancelar pedido     │
│ [Trocar imagem] Remover  │         └──────────────────────────┘
│ [Salvar] (desabilitado)  │
└──────────────────────────┘
```

## Recado pro backend

- **Foto do atendimento por upload:** o cliente também sofre pra colar link no celular em "Solicitar atendimento". Para trocar o `CampoFotoLink` por upload, falta uma rota de upload aberta a qualquer usuário logado (por exemplo `POST /api/appointments/images`, com o mesmo multer, limite e pasta própria) que devolva a URL pra gravar em `foto_url`.

## Restrições

- React + TypeScript, comportamento em `.tsx` e hooks, CSS só pra layout, reusando as classes e os tokens existentes.
- O backend é o do PR #93. A branch `eduardo` foi avançada até `origin/souza` (fast-forward, sem commit novo). Quando o #93 for mergeado, o PR deste trabalho mostra só o front.
- Testes com Vitest nas funções puras (`medidasReduzidas`, `proximoPasso`, `podeCancelar`, `comNomeDoCliente`, `requisicao` com `FormData`, `enviarImagemProduto`, `alterarStatusPedido`).

## Fica a critério de quem implementar

- Texto exato dos avisos e da confirmação, mantendo o tom das outras telas.
- O ícone do espaço vazio da imagem (usar um dos `Icones` que já existem).
