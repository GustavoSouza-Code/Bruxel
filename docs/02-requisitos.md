# Requisitos

Lista de requisitos do Bruxel. Cada requisito tem um identificador usado nos casos de uso e nos testes.

## 1. Requisitos funcionais

### 1.1 Contas e acesso

| ID | Requisito |
| --- | --- |
| RF01 | O visitante cria uma conta informando nome, e-mail, CPF e senha. O perfil inicial é `CLIENTE`. |
| RF02 | O usuário entra com e-mail e senha e recebe um token JWT. |
| RF03 | O usuário logado consulta e edita os próprios dados e o endereço. |
| RF04 | O administrador lista, consulta e exclui usuários e altera o perfil de um usuário. |
| RF05 | As telas do painel só abrem para administradores. Páginas da área do cliente exigem login. |

### 1.2 Catálogo

| ID | Requisito |
| --- | --- |
| RF06 | Qualquer visitante lista os produtos e abre o detalhe de um produto. |
| RF07 | O catálogo permite busca por texto, filtro por categoria e alternância entre cards e lista. |
| RF08 | O administrador cria, edita e exclui produtos e categorias. |
| RF09 | O administrador envia a imagem do produto pelo formulário. O arquivo é gravado no servidor e a URL fica no produto. |
| RF10 | O administrador desativa um produto sem apagá-lo. |
| RF11 | O Piscinator faz oito perguntas de sim ou não e recomenda até quatro produtos do catálogo. |

### 1.3 Compra

| ID | Requisito |
| --- | --- |
| RF12 | O cliente monta um carrinho, informa o endereço de entrega e escolhe Pix, cartão de crédito ou boleto. |
| RF13 | Ao criar o pedido, o sistema valida estoque e produto ativo, grava o preço de cada item e baixa o estoque na mesma transação. |
| RF14 | O cliente lista os próprios pedidos. O administrador lista todos. |
| RF15 | O administrador muda o status do pedido para enviado, entregue ou cancelado, seguindo a sequência permitida. |
| RF16 | O cancelamento de um pedido pendente, pago ou enviado devolve o estoque. |

### 1.4 Atendimento técnico

| ID | Requisito |
| --- | --- |
| RF17 | O cliente pede uma visita informando tipo de serviço, descrição, data, horário, endereço, telefone e foto opcional. |
| RF18 | O cliente consulta os horários ocupados de um intervalo de até 31 dias antes de escolher. |
| RF19 | O sistema recusa um horário já reservado quando o pedido vem de um cliente. |
| RF20 | O administrador abre atendimento pela loja para um cliente cadastrado ou sem cadastro. |
| RF21 | O administrador confirma ou recusa o pedido, inicia, conclui ou cancela o atendimento, seguindo a sequência permitida. |
| RF22 | O administrador atribui um técnico. O mesmo técnico não pode ter dois atendimentos no mesmo horário. |
| RF23 | Na ordem de serviço, o administrador registra observações do técnico, valor de mão de obra e os produtos usados. |
| RF24 | A conclusão do atendimento baixa o estoque dos produtos usados. |
| RF25 | O administrador registra o pagamento de um atendimento concluído, uma única vez. |
| RF26 | O cliente vê o andamento, a mensagem de recusa ou cancelamento e o valor total. Observações do técnico, mão de obra e data de pagamento ficam restritas ao administrador. |
| RF27 | O cliente ou o administrador troca a foto do atendimento. |

### 1.5 Gestão e relatórios

| ID | Requisito |
| --- | --- |
| RF28 | O painel mostra receita do mês, variação sobre o mês anterior, valores a receber, atendimentos aguardando e produtos com estoque baixo. |
| RF29 | O painel mostra a receita mensal (loja e serviços) e a receita por categoria. |
| RF30 | O administrador gera o relatório de pedidos e o de atendimentos por período, em JSON, CSV ou PDF. |

## 2. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF01 | Segurança de senhas: armazenadas com hash bcrypt. |
| RNF02 | Autenticação: token JWT com validade de 5 dias, enviado no cabeçalho `Authorization`. |
| RNF03 | Autorização: as rotas administrativas passam por dois middlewares, um que valida o token e outro que exige o perfil `ADMINISTRADOR`. |
| RNF04 | Consistência: operações que mexem em estoque rodam em transação, e o cancelamento usa atualização condicional para não devolver o estoque duas vezes. |
| RNF05 | Integridade: restrições no banco (chaves estrangeiras, unicidade de e-mail, CPF, código de produto e nome de categoria, itens únicos por pedido). |
| RNF06 | Upload: imagens de até 5 MB, gravadas em volume persistente. |
| RNF07 | Relatórios: limite de 5000 linhas por relatório. |
| RNF08 | Portabilidade: o sistema roda inteiro com `docker compose up`, com banco, backend e frontend em três containers. |
| RNF09 | Persistência: banco e imagens ficam em volumes nomeados e sobrevivem à recriação dos containers. |
| RNF10 | Disponibilidade: os containers usam `restart: unless-stopped` e healthchecks, e o frontend só sobe depois do backend saudável. |
| RNF11 | Implantação: o push na `main` dispara o deploy na VM por webhook. |
| RNF12 | Recuperação: backup diário do banco (formato custom do `pg_dump`) e das imagens, com validação do dump e retenção de 7 dias. |
| RNF13 | Qualidade: o backend e o frontend têm testes automatizados (Vitest nos dois). |
| RNF14 | Compatibilidade: interface responsiva para uso em celular e computador. |

## 3. Regras de negócio

| ID | Regra |
| --- | --- |
| RN01 | CPF, e-mail e código de produto são únicos. O CPF tem 11 dígitos numéricos. |
| RN02 | A senha tem no mínimo 8 caracteres. |
| RN03 | O pedido nasce com status `PAGO`, porque o pagamento é simulado. |
| RN04 | A sequência de um pedido é `PAGO` para `ENVIADO` para `ENTREGUE`. O cancelamento vale para `PENDENTE`, `PAGO` e `ENVIADO`. |
| RN05 | O preço do item é copiado do produto no momento da compra e não muda se o produto for reajustado. |
| RN06 | Um pedido só aceita produtos ativos e quantidades dentro do estoque. |
| RN07 | A sequência de um atendimento é `AGUARDANDO` para `AGENDADO` ou `RECUSADO`, `AGENDADO` para `EM_ANDAMENTO` ou `CANCELADO`, e `EM_ANDAMENTO` para `CONCLUIDO`. Qualquer outra mudança retorna erro 409. |
| RN08 | Ao recusar ou cancelar um atendimento, o administrador registra uma mensagem que o cliente passa a ver. |
| RN09 | O pagamento só é registrado para atendimento concluído e apenas uma vez. |
| RN10 | O total do atendimento é a mão de obra mais a soma de preço unitário vezes quantidade dos produtos usados. O preço unitário também é gravado na hora. |
| RN11 | O endereço e o telefone são copiados para o pedido e para o atendimento, e não mudam se o usuário editar o perfil depois. |
| RN12 | Os horários livres para o cliente são os que não têm atendimento em status ocupado. Atendimentos `DISPONIVEL`, `CANCELADO` e `RECUSADO` liberam o horário. |
| RN13 | O frete é gravado como zero. |
| RN14 | Um usuário com pedidos ou atendimentos não pode ser removido pelo banco (chave estrangeira com restrição). |

## 4. Matriz de permissões

| Ação | Visitante | Cliente | Administrador |
| --- | --- | --- | --- |
| Ver catálogo e Piscinator | sim | sim | sim |
| Criar conta e entrar | sim | sim | sim |
| Comprar, ver os próprios pedidos | não | sim | sim |
| Pedir atendimento e ver os próprios | não | sim | sim |
| Editar o próprio perfil | não | sim | sim |
| Gerir produtos e categorias | não | não | sim |
| Gerir usuários e perfis | não | não | sim |
| Mudar status de pedidos e atendimentos | não | não | sim |
| Preencher OS e registrar pagamento | não | não | sim |
| Painel e relatórios | não | não | sim |
