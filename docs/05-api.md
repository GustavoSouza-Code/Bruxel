# Referência da API

A API REST do backend responde sob o prefixo `/api`. Em produção, o nginx do frontend recebe a requisição na porta 80 e repassa tudo que começa com `/api/` para o backend na porta 3000.

## 1. Convenções

Corpo e resposta em JSON, exceto nos uploads (`multipart/form-data`) e nos relatórios em CSV e PDF.

Rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`. O token vem do login e vale 5 dias.

Erros seguem o formato `{ "mensagem": "texto" }`. Quando o erro é de validação de campo, a resposta também traz uma lista com o campo e a mensagem de cada problema.

| Código | Quando |
| --- | --- |
| 400 | Dado inválido ou ausente |
| 401 | Token ausente, inválido ou expirado, ou usuário que não existe mais |
| 403 | Rota de administrador acessada por cliente |
| 404 | Registro não encontrado |
| 409 | Conflito: horário reservado, mudança de status não permitida, pagamento repetido |

As imagens enviadas ficam disponíveis em `/api/uploads/...` e são servidas pelo próprio backend.

Legenda da coluna de acesso: P (pública), L (exige login), A (exige administrador).

## 2. Autenticação

| Método e rota | Acesso | Descrição |
| --- | --- | --- |
| POST `/api/auth/login` | P | Recebe e-mail e senha e devolve o token e os dados do usuário |

## 3. Usuários

| Método e rota | Acesso | Descrição |
| --- | --- | --- |
| POST `/api/users` | P | Cria conta (nome, e-mail, CPF, senha e endereço opcional) |
| GET `/api/users` | A | Lista os usuários |
| GET `/api/users/:id` | L | Consulta um usuário |
| PUT `/api/users/:id` | L | Atualiza dados do usuário |
| PATCH `/api/users/:id/perfil` | A | Muda o perfil (`CLIENTE` ou `ADMINISTRADOR`) |
| DELETE `/api/users/:id` | A | Remove o usuário |

## 4. Categorias

| Método e rota | Acesso | Descrição |
| --- | --- | --- |
| GET `/api/categories` | P | Lista as categorias |
| GET `/api/categories/:id` | P | Consulta uma categoria |
| POST `/api/categories` | A | Cria categoria |
| PUT `/api/categories/:id` | A | Atualiza categoria |
| DELETE `/api/categories/:id` | A | Remove categoria |

## 5. Produtos

| Método e rota | Acesso | Descrição |
| --- | --- | --- |
| GET `/api/products` | P | Lista os produtos |
| GET `/api/products/:id` | P | Consulta um produto |
| POST `/api/products/images` | A | Envia a imagem do produto (campo de arquivo, até 5 MB) e devolve a URL |
| POST `/api/products` | A | Cria produto (categoria, código, nome, descrição, preço, estoque, `url_imagem`, `ativo`) |
| PUT `/api/products/:id` | A | Atualiza produto |
| DELETE `/api/products/:id` | A | Remove produto |

## 6. Pedidos

| Método e rota | Acesso | Descrição |
| --- | --- | --- |
| POST `/api/orders` | L | Cria pedido com `itens` (lista de `produto_id` e `quantidade`), `forma_pagamento` e `endereco_entrega`. O preço é lido do banco |
| GET `/api/orders` | L | Cliente recebe os próprios pedidos, administrador recebe todos |
| PATCH `/api/orders/:id/status` | A | Muda o status para `ENVIADO`, `ENTREGUE` ou `CANCELADO` |

Exemplo de corpo para criar pedido:

```json
{
  "itens": [
    { "produto_id": "6f1c1c1e-0000-4000-8000-000000000001", "quantidade": 2 }
  ],
  "forma_pagamento": "PIX",
  "endereco_entrega": "Rua das Palmeiras, 120, Centro, Lajeado, RS"
}
```

## 7. Atendimentos e ordens de serviço

| Método e rota | Acesso | Descrição |
| --- | --- | --- |
| POST `/api/appointments` | L | Cria pedido de visita. O administrador pode informar o cliente e escolher qualquer horário |
| POST `/api/appointments/images` | L | Envia a foto do atendimento e devolve a URL |
| PUT `/api/appointments/:id/imagem` | L | Troca a foto de um atendimento |
| GET `/api/appointments` | L | Lista atendimentos (o cliente vê só os seus). Aceita filtros `status` e `tecnico_id` |
| GET `/api/appointments/horarios-ocupados` | L | Lista os horários ocupados entre `inicio` e `fim` (no máximo 31 dias) |
| GET `/api/appointments/:id` | L | Consulta um atendimento. O cliente não recebe observações do técnico, mão de obra nem data de pagamento |
| PATCH `/api/appointments/:id/status` | A | Muda o status, respeitando a sequência permitida. Recusa e cancelamento aceitam mensagem ao cliente |
| PUT `/api/appointments/:id/os` | A | Grava observações do técnico, valor de mão de obra e itens usados |
| PATCH `/api/appointments/:id/pagamento` | A | Registra o pagamento de um atendimento concluído |

## 8. Painel

Todas as rotas abaixo exigem administrador.

| Método e rota | Descrição |
| --- | --- |
| GET `/api/dashboard/kpis` | Receita do mês, variação, valores a receber, atendimentos aguardando e estoque baixo |
| GET `/api/dashboard/receita-mensal?meses=6` | Receita por mês, separada em loja e serviços. `meses` vai de 1 a 12 |
| GET `/api/dashboard/receita-por-categoria` | Receita por categoria de produto |
| GET `/api/dashboard/a-receber` | Atendimentos concluídos e ainda não pagos, agrupados por faixa de atraso |

## 9. Relatórios

Todas as rotas abaixo exigem administrador.

| Método e rota | Descrição |
| --- | --- |
| GET `/api/reports/pedidos` | Relatório de pedidos |
| GET `/api/reports/atendimentos` | Relatório de atendimentos |

Parâmetros de consulta: `inicio` e `fim` (formato `aaaa-mm-dd`), `status` e `formato` (`json`, `csv` ou `pdf`; sem o parâmetro o retorno é JSON). O relatório de atendimentos aceita também `pagamento`. O relatório devolve no máximo 5000 linhas.

## 10. Exemplo de uso

```bash
TOKEN=$(curl -s -X POST http://177.44.248.94/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","senha":"sua-senha"}' | jq -r .token)

curl -s http://177.44.248.94/api/products | jq '.[0]'

curl -s -H "Authorization: Bearer $TOKEN" \
  "http://177.44.248.94/api/reports/pedidos?inicio=2026-11-01&fim=2026-11-30&formato=csv" -o pedidos.csv
```
