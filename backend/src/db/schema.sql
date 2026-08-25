-- Schema da Fase 1 (Fundacao)
-- Modelo single-user: cada usuario e dono isolado dos proprios dados.
-- transactions e pending_transactions ja entram no schema (fazem parte do
-- modelo de dados base do context.md), mas os CRUDs delas ficam para as
-- Fases 2 e 3. Aqui so criamos a estrutura.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Login por usuario em vez de email, pra nao ficar digitando o email toda
-- vez (pedido do Eduardo). Nullable pra nao quebrar contas ja existentes -
-- login aceita username OU email, e continua funcionando por email pra quem
-- ainda nao definiu um usuario. Indice parcial: varias linhas com username
-- NULL nao colidem entre si.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
  ON users(username)
  WHERE username IS NOT NULL;

-- Recuperacao de senha: guarda so o HASH do token (nunca o token cru),
-- mesmo principio de nunca guardar senha em texto puro. Token expira e
-- e de uso unico (limpo apos reset bem-sucedido).
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS pending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('receber', 'pagar')),
  person VARCHAR(160) NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'recebido', 'vencido')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('entrada', 'saida')),
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(80) NOT NULL,
  payment_method VARCHAR(40) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  -- referencia a pendencia que originou este lancamento (baixa).
  -- evita duplicidade e permite rastrear a origem (ver secao 13 do context.md)
  pending_transaction_id UUID REFERENCES pending_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_pending_user_status ON pending_transactions(user_id, status);

-- Garante que uma pendencia so pode gerar UM lancamento vinculado, mesmo se
-- dois requests de baixa chegarem quase juntos (defesa em profundidade, alem
-- da checagem de status na service layer - secao 13 do context.md).
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_pending_unique
  ON transactions(pending_transaction_id)
  WHERE pending_transaction_id IS NOT NULL;
