# Casos de uso e fluxos

## 1. Atores

| Ator | Descrição |
| --- | --- |
| Visitante | Pessoa sem login |
| Cliente | Usuário com perfil `CLIENTE` |
| Administrador | Usuário com perfil `ADMINISTRADOR`. Também atua como técnico na ordem de serviço |

O cliente e o administrador herdam o que o visitante faz.

## 2. Diagrama de casos de uso

```mermaid
flowchart LR
    V([Visitante])
    C([Cliente])
    A([Administrador])

    subgraph Publico[Área pública]
        UC1(Ver catálogo e produto)
        UC2(Usar o Piscinator)
        UC3(Criar conta)
        UC4(Entrar)
    end

    subgraph AreaCliente[Área do cliente]
        UC5(Montar carrinho e comprar)
        UC6(Acompanhar pedidos)
        UC7(Pedir visita técnica)
        UC8(Acompanhar ordem de serviço)
        UC9(Editar perfil)
    end

    subgraph Gestao[Painel administrativo]
        UC10(Gerir produtos e categorias)
        UC11(Gerir usuários e perfis)
        UC12(Atualizar status de pedidos)
        UC13(Gerir atendimentos e preencher OS)
        UC14(Registrar pagamento do atendimento)
        UC15(Ver painel de indicadores)
        UC16(Gerar relatórios)
        UC17(Abrir atendimento pela loja)
    end

    V --> UC1
    V --> UC2
    V --> UC3
    V --> UC4
    C --> UC5
    C --> UC6
    C --> UC7
    C --> UC8
    C --> UC9
    A --> UC10
    A --> UC11
    A --> UC12
    A --> UC13
    A --> UC14
    A --> UC15
    A --> UC16
    A --> UC17
```

## 3. Descrição dos casos de uso principais

### UC05 Comprar produtos

Ator: cliente. Requisitos: RF12, RF13.

Pré-condição: cliente logado e carrinho com pelo menos um item.

Fluxo principal:

1. O cliente abre o carrinho e confere os itens.
2. Informa o endereço de entrega e escolhe a forma de pagamento.
3. O sistema valida cada item (produto existente, ativo e com estoque suficiente).
4. O sistema grava o pedido com o preço atual de cada produto, baixa o estoque e devolve o pedido com status `PAGO`.
5. O cliente vê o pedido na tela de acompanhamento.

Fluxo alternativo: se um produto estiver inativo ou sem estoque, nenhuma parte do pedido é gravada e o sistema informa o produto com problema.

### UC07 Pedir visita técnica

Ator: cliente. Requisitos: RF17, RF18, RF19.

1. O cliente escolhe o tipo de serviço e descreve o problema.
2. O sistema mostra os horários ocupados do período.
3. O cliente escolhe data e horário livres, confere o endereço e, se quiser, anexa uma foto.
4. O sistema grava o atendimento com status `AGUARDANDO`.

Fluxo alternativo: se outro cliente reservou o horário no intervalo, o sistema responde 409 com a mensagem "Esse horário já foi reservado" e o cliente escolhe outro.

### UC13 Gerir atendimento e preencher a ordem de serviço

Ator: administrador. Requisitos: RF21 a RF24.

1. O administrador abre o atendimento em `AGUARDANDO` e o confirma (`AGENDADO`) ou o recusa (`RECUSADO`) com uma mensagem ao cliente.
2. No dia da visita, atribui o técnico e marca `EM_ANDAMENTO`.
3. Durante o atendimento, registra observações, mão de obra e produtos usados.
4. Ao marcar `CONCLUIDO`, o sistema baixa o estoque dos produtos usados.

Fluxo alternativo: o administrador cancela um atendimento `AGENDADO` informando o motivo.

### UC14 Registrar pagamento do atendimento

Ator: administrador. Requisito: RF25.

O sistema aceita o pagamento apenas para atendimento `CONCLUIDO` e sem pagamento registrado. O atendimento passa a ter `pago_em` preenchido e sai de "a receber".

### UC17 Abrir atendimento pela loja

Ator: administrador. Requisito: RF20.

O administrador abre o atendimento em nome de um cliente cadastrado ou informando apenas o nome de um cliente sem cadastro. Nesse caso o atendimento fica com `aberto_na_loja` verdadeiro, e o administrador pode escolher qualquer horário, inclusive um já ocupado.

## 4. Ciclo de vida do pedido

```mermaid
stateDiagram-v2
    [*] --> PAGO: compra criada
    PAGO --> ENVIADO: administrador envia
    ENVIADO --> ENTREGUE: administrador confirma entrega
    PAGO --> CANCELADO: cancelamento
    ENVIADO --> CANCELADO: cancelamento
    PENDENTE --> CANCELADO: cancelamento
    ENTREGUE --> [*]
    CANCELADO --> [*]
```

O estado `PENDENTE` existe no banco como valor padrão, mas o serviço grava `PAGO` na criação, porque o pagamento é simulado. O administrador só consegue pedir os status `ENVIADO`, `ENTREGUE` e `CANCELADO`. Enviar exige que o pedido esteja `PAGO`, e entregar exige `ENVIADO`. O cancelamento devolve o estoque dos itens.

## 5. Ciclo de vida do atendimento

```mermaid
stateDiagram-v2
    [*] --> AGUARDANDO: cliente pede a visita
    AGUARDANDO --> AGENDADO: administrador confirma
    AGUARDANDO --> RECUSADO: administrador recusa
    AGENDADO --> EM_ANDAMENTO: início da visita
    AGENDADO --> CANCELADO: cancelamento
    EM_ANDAMENTO --> CONCLUIDO: fim da visita
    RECUSADO --> [*]
    CANCELADO --> [*]
    CONCLUIDO --> [*]
```

Depois de `CONCLUIDO`, o administrador ainda registra o pagamento, que não muda o status e preenche `pago_em`. Qualquer mudança fora das setas acima retorna erro 409.

## 6. Fluxo de compra

```mermaid
sequenceDiagram
    actor Cliente
    participant Front as Frontend
    participant API as Backend (ordersService)
    participant DB as PostgreSQL

    Cliente->>Front: finaliza carrinho
    Front->>API: POST /api/orders (itens, pagamento, endereço)
    API->>API: valida corpo e token
    API->>DB: busca produtos dos itens
    API->>API: confere ativo e estoque, copia o preço
    API->>DB: transação: grava pedido e itens, baixa estoque
    DB-->>API: pedido gravado
    API-->>Front: 201 com o pedido
    Front-->>Cliente: tela do pedido
```

## 7. Fluxo de pedido de visita

```mermaid
sequenceDiagram
    actor Cliente
    actor Admin as Administrador
    participant Front as Frontend
    participant API as Backend
    participant DB as PostgreSQL

    Cliente->>Front: abre "Solicitar atendimento"
    Front->>API: GET /api/appointments/horarios-ocupados
    API-->>Front: horários ocupados
    Cliente->>Front: escolhe horário e envia
    Front->>API: POST /api/appointments
    API->>DB: confere conflito de horário
    API->>DB: grava com status AGUARDANDO
    Admin->>API: PATCH /api/appointments/:id/status (AGENDADO)
    Admin->>API: PUT /api/appointments/:id/os (observações, mão de obra, itens)
    Admin->>API: PATCH /api/appointments/:id/status (CONCLUIDO)
    API->>DB: baixa estoque dos itens da OS
    Admin->>API: PATCH /api/appointments/:id/pagamento
    API->>DB: grava pago_em
```

## 8. Piscinator

O questionário tem oito perguntas de sim ou não. Cada resposta "sim" soma pontos aos produtos cujo nome, descrição ou categoria contenham as palavras ligadas à pergunta. O resultado ordena por pontuação e mostra até quatro produtos, cada um com o motivo da indicação. Se todas as respostas forem "não", o resultado traz produtos de manutenção de rotina. A lógica está em `frontend/src/crud/produtos/recomendacaoPiscinator.ts` e roda no navegador, sobre os produtos que a API entrega.
