-- Adapta `appointments` para a Ordem de Serviço (OS) descrita pelo frontend.
-- A tabela passa a guardar o pedido de atendimento e os dados que o técnico
-- preenche. Nenhum dado existente é apagado: as colunas antigas são renomeadas.

-- 1. Renomeia as colunas que já existiam para os nomes da OS (preserva os dados).
ALTER TABLE "appointments" RENAME COLUMN "observacoes" TO "descricao";
ALTER TABLE "appointments" RENAME COLUMN "valor" TO "valor_mao_de_obra";

-- A constraint antiga compara `status` com o enum antigo; precisa sair antes
-- da troca do tipo (a nova é criada no passo 6).
ALTER TABLE "appointments" DROP CONSTRAINT "ck_agendamentos_usuario";

-- 2. Recria o enum de status com os estados do fluxo da OS.
--    A recriação do tipo (em vez de ADD VALUE) permite usar o novo valor como
--    default na mesma migração. "DISPONIVEL" fica mantido para os registros antigos.
CREATE TYPE "status_agendamento_new" AS ENUM (
    'DISPONIVEL',
    'AGUARDANDO',
    'AGENDADO',
    'EM_ANDAMENTO',
    'CONCLUIDO',
    'CANCELADO',
    'RECUSADO'
);

ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "appointments"
    ALTER COLUMN "status" TYPE "status_agendamento_new"
    USING ("status"::text::"status_agendamento_new");
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'AGUARDANDO';

DROP TYPE "status_agendamento";
ALTER TYPE "status_agendamento_new" RENAME TO "status_agendamento";

-- 3. Tipo de serviço escolhido no pedido.
CREATE TYPE "tipo_servico" AS ENUM (
    'LIMPEZA',
    'BOMBA_FILTRO',
    'VAZAMENTO',
    'INSTALACAO',
    'OUTRO'
);

-- 4. Colunas da OS. Ficam nulas para não quebrar registros antigos.
ALTER TABLE "appointments"
    ADD COLUMN "tecnico_id" UUID,
    ADD COLUMN "tipo" "tipo_servico",
    ADD COLUMN "foto_url" TEXT,
    ADD COLUMN "nome_cliente" VARCHAR(150),
    ADD COLUMN "aberto_na_loja" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "telefone" VARCHAR(20),
    ADD COLUMN "rua" VARCHAR(150),
    ADD COLUMN "numero" VARCHAR(10),
    ADD COLUMN "bairro" VARCHAR(80),
    ADD COLUMN "cidade" VARCHAR(80),
    ADD COLUMN "estado" CHAR(2),
    ADD COLUMN "cep" VARCHAR(8),
    ADD COLUMN "mensagem_cliente" TEXT,
    ADD COLUMN "observacoes_tecnico" TEXT,
    ADD COLUMN "pago_em" TIMESTAMPTZ(6);

-- 5. Responsável técnico é um usuário já cadastrado (funcionário).
ALTER TABLE "appointments"
    ADD CONSTRAINT "fk_agendamentos_tecnico"
    FOREIGN KEY ("tecnico_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;

CREATE INDEX "idx_agendamentos_tecnico"
    ON "appointments"("tecnico_id", "data_hora");

-- 6. A regra antiga exigia usuário em qualquer status diferente de DISPONIVEL,
--    o que impedia atendimento de balcão (cliente sem cadastro). A nova regra
--    aceita cliente cadastrado OU nome do cliente informado no pedido.
ALTER TABLE "appointments"
    ADD CONSTRAINT "ck_agendamentos_cliente" CHECK (
        ("status" = 'DISPONIVEL' AND "usuario_id" IS NULL)
        OR ("status" <> 'DISPONIVEL' AND ("usuario_id" IS NOT NULL OR "nome_cliente" IS NOT NULL))
    );

ALTER TABLE "appointments"
    RENAME CONSTRAINT "ck_agendamentos_valor" TO "ck_agendamentos_valor_mao_de_obra";

-- 7. Produtos usados na OS (mesmo molde de `order_items`), com o preço
--    congelado na hora em que foi lançado.
CREATE TABLE "appointment_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" NUMERIC(10,2) NOT NULL,

    CONSTRAINT "appointment_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_itens_agendamento_produto" UNIQUE ("appointment_id", "produto_id"),
    CONSTRAINT "ck_itens_agendamento_quantidade" CHECK ("quantidade" > 0),
    CONSTRAINT "ck_itens_agendamento_preco_unitario" CHECK ("preco_unitario" > 0),
    CONSTRAINT "fk_itens_agendamento_agendamento"
        FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_itens_agendamento_produto"
        FOREIGN KEY ("produto_id") REFERENCES "products"("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE INDEX "idx_itens_agendamento_produto"
    ON "appointment_items"("produto_id");
