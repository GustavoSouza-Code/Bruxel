CREATE TYPE perfil_usuario AS ENUM ('CLIENTE', 'ADMINISTRADOR');
CREATE TYPE status_pedido AS ENUM ('PENDENTE', 'PAGO', 'ENVIADO', 'ENTREGUE', 'CANCELADO');
CREATE TYPE forma_pagamento AS ENUM ('PIX', 'CARTAO_CREDITO', 'BOLETO');
CREATE TYPE status_agendamento AS ENUM ('DISPONIVEL', 'AGENDADO', 'CONCLUIDO', 'CANCELADO');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    telefone VARCHAR(20),
    rua VARCHAR(150),
    numero VARCHAR(10),
    bairro VARCHAR(80),
    cidade VARCHAR(80),
    estado CHAR(2),
    cep VARCHAR(8),
    perfil perfil_usuario NOT NULL DEFAULT 'CLIENTE',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT uq_usuarios_cpf UNIQUE (cpf),
    CONSTRAINT ck_usuarios_cpf CHECK (cpf ~ '^[0-9]{11}$'),
    CONSTRAINT ck_usuarios_cep CHECK (cep ~ '^[0-9]{8}$')
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(80) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_categorias_nome UNIQUE (nome)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID NOT NULL,
    codigo VARCHAR(160) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10,2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    url_imagem TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_produtos_codigo UNIQUE (codigo),
    CONSTRAINT ck_produtos_preco CHECK (preco > 0),
    CONSTRAINT ck_produtos_estoque CHECK (estoque >= 0),
    CONSTRAINT fk_produtos_categoria FOREIGN KEY (categoria_id) REFERENCES categories (id) ON DELETE RESTRICT
);

CREATE TABLE favorites (
    usuario_id UUID NOT NULL,
    produto_id UUID NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_favoritos PRIMARY KEY (usuario_id, produto_id),
    CONSTRAINT fk_favoritos_usuario FOREIGN KEY (usuario_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_favoritos_produto FOREIGN KEY (produto_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    status status_pedido NOT NULL DEFAULT 'PENDENTE',
    forma_pagamento forma_pagamento NOT NULL,
    endereco_entrega TEXT NOT NULL,
    valor_frete NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor_total NUMERIC(10,2) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_pedidos_valor_frete CHECK (valor_frete >= 0),
    CONSTRAINT ck_pedidos_valor_total CHECK (valor_total >= 0),
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL,
    produto_id UUID NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario NUMERIC(10,2) NOT NULL,
    CONSTRAINT uq_itens_pedido_produto UNIQUE (pedido_id, produto_id),
    CONSTRAINT ck_itens_pedido_quantidade CHECK (quantidade > 0),
    CONSTRAINT ck_itens_pedido_preco_unitario CHECK (preco_unitario > 0),
    CONSTRAINT fk_itens_pedido_pedido FOREIGN KEY (pedido_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_itens_pedido_produto FOREIGN KEY (produto_id) REFERENCES products (id) ON DELETE RESTRICT
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_hora TIMESTAMPTZ NOT NULL,
    status status_agendamento NOT NULL DEFAULT 'DISPONIVEL',
    usuario_id UUID,
    observacoes TEXT,
    valor NUMERIC(10,2),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_agendamentos_usuario CHECK (
        (status = 'DISPONIVEL' AND usuario_id IS NULL)
        OR (status <> 'DISPONIVEL' AND usuario_id IS NOT NULL)
    ),
    CONSTRAINT ck_agendamentos_valor CHECK (valor >= 0),
    CONSTRAINT fk_agendamentos_usuario FOREIGN KEY (usuario_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_produtos_categoria ON products (categoria_id);
CREATE INDEX idx_pedidos_usuario ON orders (usuario_id);
CREATE INDEX idx_itens_pedido_produto ON order_items (produto_id);
CREATE INDEX idx_agendamentos_status_data ON appointments (status, data_hora);
CREATE INDEX idx_agendamentos_usuario ON appointments (usuario_id);
