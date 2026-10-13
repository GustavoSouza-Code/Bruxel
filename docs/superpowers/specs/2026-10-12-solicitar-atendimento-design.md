# Solicitar atendimento (lado do cliente)

- **Issue:** [GustavoSouza-Code/Bruxel#22](https://github.com/GustavoSouza-Code/Bruxel/issues/22) — "Desenvolvimento da tela de lançamento e acompanhamento de serviços" (esta entrega **não fecha** a issue)
- **Data:** 12/10/2026
- **Branch:** `feat/solicitar-atendimento` (criada a partir da `eduardo`)

## Objetivo

A #22 pede a ordem de serviço (OS) do lado do funcionário: dados do cliente, fotos e descrição
do problema, observações do técnico, status e pagamento. Antes dela vem o lado do **cliente**:
uma tela pra ele **solicitar um atendimento** (o que depois alimenta a OS) e uma lista pra
ele **acompanhar o status** do que pediu.

O banco ainda não está pronto pra isso: a tabela `appointments` existe no `schema.prisma`,
mas não tem os campos que a tela precisa, e o backend não tem rotas pra ela. Os dados ficam
**na memória do front**, como no `useProdutos` e no `ContextoCarrinho`, com `TODO` pra
trocar pela API.

## Escopo

**Entra:**

- Pílula "Solicitar atendimento" no `Cabecalho`, ao lado do carrinho e do Entrar.
- Página `/solicitar-atendimento` (exige login) com o formulário.
- Aba "Atendimentos" em Minha conta (`/perfil`) com a lista e o status de cada pedido.
- Validação do formulário em funções puras, com testes Vitest.

**Fica pra depois:**

- Tela da OS do funcionário (a imagem da issue), status financeiro (pago) e lista do gestor.
- Integração com a API (depende do backend, ver "Recado pro backend").
- Tela de detalhe de um atendimento e cancelamento pelo cliente.
- Escolha de piscineiro e horário livre na agenda dele (ver "Futuro").

## Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Onde guardar os dados | Contexto em memória (`ProvedorAtendimentos`), com 2 exemplos iniciais | O formulário e a aba precisam da mesma lista; segue o `ContextoCarrinho`; sem backend ainda |
| Entrada na tela | Segunda pílula no cabeçalho, estilo "sólida clara" (fundo `--color-store-button`, texto `--color-primary`) | Escolhida pelo Eduardo entre 3 previews; destaca sem competir com o Entrar |
| Texto da pílula no celular | "Atendimento", escondendo "Solicitar " com media query | É só visual, então CSS é o lugar certo |
| Layout do formulário | Coluna única com 5 blocos numerados, no visual do Minha conta | Escolhido pelo Eduardo entre 2 previews; simples no celular |
| Onde fica a lista | Nova aba "Atendimentos" no `/perfil` | Reaproveita o layout e os cards da aba Compras |
| Login | Rota dentro do `RotaLogado` | A OS precisa estar ligada a um cliente cadastrado; o `entrar` já devolve pra página de origem (`state.de`) |
| Endereço e telefone | Vêm do perfil (`usePerfil`) e podem ser ajustados só pra este pedido | O atendimento pode ser em outro endereço; não altera o cadastro |
| Perfil indisponível (403 na main de hoje) | Bloco de contato abre com os campos vazios, sem erro | O PR #55 libera o próprio usuário; até lá o cliente digita |
| Data e período | Obrigatórios; data a partir de amanhã; período manhã ou tarde | O gestor precisa disso pra marcar; casa com `data_hora` do banco |
| Fotos | Opcionais, até 5, só imagens, até 5 MB cada; miniaturas com `URL.createObjectURL` | Aparecem na OS da issue; sem bucket ainda, vivem no navegador |
| Ícones | SVG inline no `Icones.tsx` | Mesmo padrão dos ícones que já existem |

## Fluxo

1. Pílula do cabeçalho → `/solicitar-atendimento`. Deslogado: `RotaLogado` → `/entrar` → volta pro formulário depois do login.
2. Cliente preenche: **1** tipo de serviço, **2** descrição, **3** fotos, **4** data e período, **5** endereço e telefone.
3. "Enviar solicitação" valida. Com erro: mensagem embaixo de cada bloco com problema, e a página rola até o primeiro.
4. Sem erro: `solicitarAtendimento()` cria o registro com status `aguardando` e vai pra
   `/perfil` com `state: { aba: "atendimentos", mensagem }`.
5. A aba mostra o aviso de sucesso e a lista (mais novo primeiro).

## Dados

```ts
type TipoServico = "limpeza" | "bomba-filtro" | "vazamento" | "instalacao" | "outro";
type PeriodoAtendimento = "manha" | "tarde";
type StatusAtendimento = "aguardando" | "agendado" | "em-andamento" | "concluido" | "cancelado";

interface ContatoAtendimento {
  telefone: string;
  rua: string; numero: string; bairro: string; cidade: string; estado: string; cep: string;
}

interface Atendimento {
  id: string;              // "AT-2026-0003"
  tipo: TipoServico;
  descricao: string;
  fotos: string[];         // URLs pra exibir (blob: por enquanto)
  dataPreferida: string;   // "aaaa-mm-dd", valor do <input type="date">
  periodo: PeriodoAtendimento;
  contato: ContatoAtendimento;
  status: StatusAtendimento;
  criadoEm: string;        // ISO
}

type DadosSolicitacao = Omit<Atendimento, "id" | "status" | "criadoEm">;
```

Rótulos dos status: Aguardando confirmação, Agendado, Em andamento, Concluído, Cancelado.

## Validação (`crud/atendimentos/validarSolicitacao.ts`)

- `validarSolicitacao(dados, hoje)` devolve os erros por campo (objeto vazio = válido):
  - tipo obrigatório;
  - descrição com 10 a 1000 caracteres, depois do trim;
  - data obrigatória e a partir de amanhã;
  - período obrigatório;
  - telefone com 10 ou 11 dígitos;
  - rua, número e cidade obrigatórios;
  - UF com 2 letras, se preenchida;
  - CEP com 8 dígitos, se preenchido.
- `validarFotos(quantidadeAtual, arquivos)` devolve as fotos aceitas e a mensagem de erro, se houver: só `image/*`, no máximo 5 no total e 5 MB cada.
- `dataMinima(hoje)`: amanhã, no formato `aaaa-mm-dd` (vai no `min` do input).
- `formatarPreferencia(data, periodo)`: `"20/10/2026, manhã"`.

O `hoje` entra por parâmetro, pra os testes não dependerem do relógio.

## Componentes

| Arquivo | Papel |
|---|---|
| `tipos/atendimento.ts` | Tipos acima |
| `crud/atendimentos/opcoesAtendimento.ts` | `TIPOS_SERVICO`, `PERIODOS`, `STATUS_LABELS` |
| `crud/atendimentos/validarSolicitacao.ts` (+ `.test.ts`) | Validação e formatação, funções puras |
| `dados/atendimentos.ts` | 2 atendimentos de exemplo |
| `contexto/ContextoAtendimentos.tsx` | `ProvedorAtendimentos` + `useAtendimentos()` |
| `paginas/portal/solicitar-atendimento/solicitar-atendimento.tsx` (+ `.css`) | Página do formulário |
| `.../componentes/SeletorTipoServico/` | Cards de tipo (radios acessíveis) |
| `.../componentes/CampoFotos/` | Upload com miniaturas e remover |
| `.../componentes/SeletorQuando/` | Data + período; isolado pra virar a agenda do piscineiro depois |
| `paginas/portal/perfil/componentes/AbaAtendimentos/` | Lista da aba "Atendimentos" |
| Alterados | `App.tsx` (provedor + rota), `Cabecalho.tsx/.css` (pílula), `Icones.tsx` (ícones), `perfil.tsx` (aba nova + recado do `state`) |

## Recado pro backend

- `appointments` precisa de: tipo de serviço, descrição, fotos (URLs no bucket do Supabase),
  período e endereço/telefone do atendimento.
- O enum `status_agendamento` (DISPONIVEL, AGENDADO, CONCLUIDO, CANCELADO) precisa de
  `AGUARDANDO` e `EM_ANDAMENTO`.
- Faltam as rotas `POST /appointments` (cliente cria) e `GET /appointments` (só os do próprio cliente).

## Futuro

- **Não deixar marcar um horário que já tem atendimento.** Ideia do Eduardo: o cliente escolhe
  o **piscineiro** e depois um **horário livre na agenda dele**. O `DISPONIVEL` do enum já
  encaixa com horários criados antes (DISPONIVEL → AGENDADO quando o cliente escolhe).
- Vai precisar de: piscineiros no banco, `tecnico_id` em `appointments`, rota de horários
  livres e a checagem de conflito **no backend** (o front só esconde os ocupados).
- No front, muda só o `SeletorQuando` e o `DadosSolicitacao` (`tecnicoId`, `horarioId`).

## Branch e PR

- A `eduardo` é a branch do PR #57 (aberto). Por isso o trabalho fica em `feat/solicitar-atendimento`,
  e nada vai pra `eduardo` enquanto o #57 estiver aberto.
- Se o #57 receber ajustes, eles são feitos na `eduardo` e depois trazidos com `git merge eduardo`.
- Depois do merge do #57, abrir o PR `feat/solicitar-atendimento` → `main`, dizendo "Relacionado a #22".

## Verificação

- `npm test --prefix frontend`, `npm run build --prefix frontend` e `npm run lint --prefix frontend` sem erro.
- No navegador, desktop (1440px) e celular (375px):
  - a pílula cabe no cabeçalho;
  - deslogado, a pílula leva pro login e depois volta pro formulário;
  - enviar vazio mostra os erros;
  - limites das fotos;
  - data mínima;
  - envio válido aparece no topo da aba "Atendimentos" com "Aguardando confirmação";
  - console limpo.
