# Mercearia Lima - Controle Financeiro (Fase 1 + 2 + 3)

Fase 1 (Fundacao): setup, banco, backend, API, autenticacao.
Fase 2 (Financeiro): CRUD de entradas/saidas, calculo de saldo, historico com filtros.
Fase 3 (Pendencias): CRUD de pendencias a receber/a pagar, baixa gerando
lancamento automatico, status "vencido" calculado dinamicamente.

Modelo: **single-user** (cada usuario e dono isolado dos proprios dados). Auth via
JWT guardado em cookie httpOnly (nao em localStorage).

## Stack

- Backend: Node.js + Express + TypeScript, PostgreSQL via `pg` (sem ORM, mesma
  filosofia do FinDash), bcryptjs, jsonwebtoken, zod pra validacao.
- Frontend: React + TypeScript + Vite, react-router-dom, mobile-first, sem
  biblioteca de UI (componentes proprios em `components/`).

## Reaproveitado do FinDash

Padrao de auth (JWT + bcryptjs), estrutura de pastas em camadas
(controllers/services/repositories), Postgres via Docker local, config por
variaveis de ambiente.

## Como rodar

### 1. Banco de dados

Via Docker:
```bash
cd backend
docker compose up -d
```
Ou Postgres local/pgAdmin/DbGate - ver conversa do projeto pra esse caminho.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run migrate   # cria/atualiza as tabelas
npm run dev        # http://localhost:3333
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev         # http://localhost:5173
```

## Rotas da API

### Auth (Fase 1, com login por usuário)

```
POST /api/auth/register   { name, username, email, password }
POST /api/auth/login      { identifier, password }   -- identifier = username OU email
POST /api/auth/logout
GET  /api/auth/me         (autenticado)
```

`username`: 3-30 caracteres, letras minusculas/numeros/ponto/hifen/underline,
unico. Contas criadas antes dessa mudanca ficam com `username = null` e
continuam logando pelo email normalmente - o backend decide qual buscar pelo
formato do `identifier` (se tem "@", busca por email; senao, por username).

### Transactions - entradas e saidas (Fase 2)

```
GET    /api/transactions            filtros: type, category, payment_method, from, to
GET    /api/transactions/summary    filtros: from, to -> { totalEntradas, totalSaidas, saldo }
GET    /api/transactions/:id
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
```

Todas autenticadas e escopadas ao usuario logado. `category` e validada contra
a lista certa pro `type` (entrada vs saida) - ver `src/constants/transactionOptions.ts`.
Lancamentos com `pending_transaction_id` preenchido (gerados por baixa de
pendencia) nao podem ser editados/excluidos direto - isso vem da Fase 3.

### Pending - pendencias a receber/a pagar (Fase 3)

```
GET    /api/pending              filtros: type, status, from, to (due_date)
GET    /api/pending/:id
POST   /api/pending               { type, person, description, amount, due_date, notes? }
PUT    /api/pending/:id           so funciona enquanto status = pendente
DELETE /api/pending/:id           so funciona enquanto status = pendente
POST   /api/pending/:id/baixa     { payment_method } -> marca pago/recebido e cria a transaction vinculada
```

Decisoes de projeto nessa fase:

- **"vencido" nao e persistido.** E calculado na query (`due_date < hoje AND
  status = 'pendente'`), sem precisar de cron job atualizando status em
  segundo plano. Filtrar por `status=vencido` funciona normalmente.
- **Baixa e atomica.** Cria a transaction e atualiza o status da pendencia
  numa unica transacao de banco (BEGIN/COMMIT) com `SELECT ... FOR UPDATE`,
  e ha um indice unico em `transactions.pending_transaction_id` como segunda
  camada de protecao contra baixa duplicada.
- **Categoria do lancamento gerado:** "Recebimento de pendência" pra
  `receber` (ja existe na lista de categorias de entrada); "Outros" pra
  `pagar` (a lista original de categorias de saida nao tem uma categoria
  especifica pra isso).
- **Forma de pagamento e escolhida no momento da baixa**, nao ao criar a
  pendencia - o modelo de dados original (secao 12) nao tem esse campo em
  `pending_transactions`.
- Pendencias ja baixadas (pago/recebido) nao podem ser editadas nem
  excluidas, pra nao dessincronizar do lancamento que ja foi gerado.

## Estrutura

```
backend/src/
  config/        env, conexao com o Postgres (inclui fix de parser de DATE)
  constants/     categorias por tipo, formas de pagamento
  db/            schema.sql + script de migracao
  types/         tipos compartilhados
  utils/         AppError, hash de senha, JWT, asyncHandler
  middlewares/   auth, tratamento de erro (reconhece qualquer AppError)
  repositories/  acesso a dados (user, transaction, pending)
  services/      regra de negocio (auth, transaction, pending)
  controllers/   HTTP <-> service, validacao zod
  routes/        registro de rotas

frontend/src/
  styles/        tokens.css (paleta Mercearia Lima) + global.css
  constants/     espelho das categorias/formas de pagamento do backend
  utils/         formatCurrency, formatDateDisplay, todayIso
  components/    Button, Input, Card, Layout, ConfirmDialog, ActionSheet, SettleDialog
  pages/         Login, Dashboard, Transactions (lista + form), Pending (lista + form)
  contexts/      AuthContext
  services/      api.ts (fetch client)
  routes/        ProtectedRoute
```

## Bugs pegos em teste ponta a ponta (ja corrigidos)

- `pg` devolvia coluna `DATE` como timestamp completo em vez de `AAAA-MM-DD` -
  corrigido com `types.setTypeParser` em `config/database.ts`.
- Erros de negocio fora de auth (ex: lancamento nao encontrado) caiam em 500
  generico porque o `errorHandler` so reconhecia `AuthError` - agora existe
  `AppError` como base, e `AuthError`/`TransactionError` estendem ela.

## Decisoes em aberto (para decidir no caminho)

- Sem diferenciacao de papel (dono/funcionario) - o modelo e single-user por
  enquanto, como decidido na Fase 1.
- Fase 4 (Dashboard) vai consumir `/api/transactions/summary` e um novo
  agregado de pendencias (total a receber / a pagar) pra montar os
  indicadores reais - hoje o Dashboard so tem um link pra Lançamentos.

