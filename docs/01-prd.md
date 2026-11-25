# PRD: Bruxel

Documento de requisitos do produto. Versão final, 25 de novembro de 2026.

## 1. Contexto

A Bruxel Piscinas vende produtos para manutenção de piscina e faz visitas técnicas. O projeto Bruxel é um sistema web para essa empresa, desenvolvido como trabalho em equipe na Univates, sob orientação do professor Mateus Roveda. Ele reúne em um só lugar a loja virtual, o pedido de visita técnica e a gestão feita pelo dono e pelos funcionários.

## 2. Problema

Quem cuida de uma piscina costuma saber o sintoma (água verde, água turva, olhos ardendo), mas não sabe qual produto resolve. Comprar o produto errado gera desperdício e atrasa a solução. Do lado da empresa, vendas e visitas precisam de controle: estoque, situação dos pedidos, agenda dos técnicos, valores a receber.

O sistema trata esses dois pontos. Para o cliente, oferece um catálogo com um assistente de recomendação e um pedido de visita técnica pela internet. Para a empresa, oferece um painel com pedidos, ordens de serviço, estoque e indicadores financeiros.

## 3. Objetivos

1. Permitir que o cliente encontre e compre produtos de piscina pela internet.
2. Ajudar o cliente a escolher o produto certo a partir de perguntas simples sobre o estado da piscina (Piscinator).
3. Permitir que o cliente peça uma visita técnica, escolhendo data e horário, e acompanhe a ordem de serviço.
4. Dar à empresa um painel para gerir produtos, usuários, pedidos, atendimentos e pagamentos.
5. Dar à empresa indicadores e relatórios exportáveis sobre receita e valores a receber.

## 4. Público e perfis de uso

| Perfil | Descrição | O que faz no sistema |
| --- | --- | --- |
| Visitante | Pessoa sem login | Navega pela loja, vê produtos, usa o Piscinator, monta o carrinho e cria uma conta |
| Cliente | Usuário com perfil `CLIENTE` | Compra, acompanha pedidos, pede visita técnica, acompanha a ordem de serviço e edita o próprio perfil |
| Administrador | Usuário com perfil `ADMINISTRADOR` (dono ou funcionário) | Gere produtos, categorias, usuários, pedidos, atendimentos e pagamentos, e consulta o painel e os relatórios |

## 5. Escopo

### 5.1 Incluído

Cadastro e login de usuários, com dois perfis. Catálogo de produtos organizado em categorias, com busca e filtros. Piscinator, o assistente de recomendação. Carrinho e finalização de compra, com baixa automática de estoque. Acompanhamento de pedidos pelo cliente e atualização de status pelo administrador. Pedido de visita técnica com escolha de horário e foto opcional do problema. Ordem de serviço preenchida pelo técnico, com produtos usados e valor de mão de obra. Registro de pagamento do atendimento. Painel com indicadores e gráficos. Relatórios de pedidos e de atendimentos em tela, CSV e PDF. Upload de imagens de produtos e de atendimentos. Implantação automatizada em uma VM, com backup do banco e das imagens.

### 5.2 Fora do escopo

Gateway de pagamento real: a compra é uma simulação acadêmica e o pedido nasce com o status pago. Cálculo de frete: o valor do frete é gravado como zero. Recuperação de senha. Cobranças recorrentes, controle de despesas e de fornecedores. Favoritos: a tabela existe no banco e o botão aparece no card do produto, mas a função ainda não está ligada à API. Domínio público e HTTPS: a aplicação responde por HTTP no IP da VM.

## 6. Funcionalidades principais

### 6.1 Loja virtual

O catálogo mostra os produtos ativos com imagem, nome e preço. O cliente filtra por categoria, abre a página do produto e adiciona itens ao carrinho. Ao finalizar, informa o endereço de entrega e a forma de pagamento (Pix, cartão de crédito ou boleto). O sistema confere estoque e disponibilidade, grava o preço vigente de cada item e baixa o estoque na mesma operação.

### 6.2 Piscinator

O Piscinator é um questionário de oito perguntas de sim ou não sobre o estado da piscina, por exemplo se a água está verde, turva ou se o filtro parece fraco. Cada resposta afirmativa pontua produtos cujo nome, descrição ou categoria contenham termos ligados à pergunta. O resultado mostra até quatro produtos recomendados, com o motivo da indicação. Quem responde "não" a tudo recebe produtos de manutenção de rotina. As perguntas ficam no código do frontend, e a recomendação usa os produtos cadastrados no banco.

### 6.3 Atendimento e ordem de serviço

O cliente pede uma visita informando tipo de serviço (limpeza, bomba e filtro, vazamento, instalação ou outro), descrição do problema, data, horário, endereço e uma foto opcional. O horário só é aceito se estiver livre. O administrador confirma ou recusa o pedido, inicia o atendimento e o conclui. Durante o atendimento, o técnico registra observações, os produtos usados e o valor da mão de obra. A conclusão baixa o estoque dos produtos usados. Depois, o administrador marca o atendimento como pago. O cliente vê o andamento e o total (mão de obra mais produtos). Um administrador também pode abrir um atendimento pela loja, para cliente sem cadastro.

### 6.4 Painel administrativo

O painel inicial mostra receita do mês e variação em relação ao mês anterior, valores a receber (com quantidade em atraso), ordens de serviço aguardando confirmação e produtos com estoque baixo. Os gráficos mostram a receita por mês (loja e serviços) e a receita por categoria. As telas de gestão cobrem usuários, produtos e categorias, pedidos, atendimentos e pagamentos.

### 6.5 Relatórios

O administrador gera relatórios de pedidos e de atendimentos por período e os baixa em CSV ou PDF.

## 7. Critérios de aceite

| Item | Critério |
| --- | --- |
| Cadastro e login | Um visitante cria conta com CPF de 11 dígitos, e-mail válido e senha de pelo menos 8 caracteres, entra e recebe um token com validade de 5 dias |
| Controle de acesso | Rotas do painel e do administrador respondem 401 sem token e 403 para cliente |
| Compra | Pedido com estoque insuficiente é recusado com mensagem; pedido válido grava preços e baixa o estoque |
| Cancelamento | Pedido pago ou enviado pode ser cancelado e devolve o estoque; pedido entregue não pode |
| Horário | Dois pedidos de cliente no mesmo horário não são aceitos |
| OS | A conclusão do atendimento baixa o estoque dos itens e só ocorre a partir de "em andamento" |
| Imagens | Imagem enviada continua disponível depois de reiniciar ou recriar os containers |
| Backup | Um backup diário gera dump do banco e cópia das imagens, e o dump restaura em um banco novo |
| Implantação | Um push na `main` atualiza a VM sem intervenção manual |

## 8. Premissas e restrições

O sistema roda em uma VM Ubuntu com Docker, acessada por IP. A equipe não usa GitHub Actions, então o deploy é feito por webhook. O pagamento é simulado. O backup é guardado na própria VM, e a cópia para outro local é manual.

## 9. Riscos conhecidos

A aplicação responde apenas por HTTP, então senhas e tokens trafegam sem criptografia até que exista domínio com certificado. Os backups ficam na mesma máquina do banco. A validação de CPF confere apenas o formato de 11 dígitos, não os dígitos verificadores.
