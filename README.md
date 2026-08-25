# Mercearia Lima - Controle Financeiro (Fase 1 + 2 + 3 + 4 + 5)

Fase 1 (Fundacao): setup, banco, backend, API, autenticacao (login por usuário ou e-mail).
Fase 2 (Financeiro): CRUD de entradas/saidas, calculo de saldo, historico com filtros.
Fase 3 (Pendencias): CRUD de pendencias a receber/a pagar, baixa gerando
lancamento automatico, status "vencido" calculado dinamicamente.
Fase 4 (Dashboard): saldo atual, resumo do mes, total a receber/a pagar em
aberto, ultimos lancamentos.
Fase 5 (Relatorios): relatorio mensal, gastos/receitas por categoria,
evolucao do saldo em grafico SVG (sem dependencia externa).

Pos-roadmap (rumo a producao): error boundary no frontend e recuperacao de
senha por e-mail - ver secoes proprias mais abaixo.

Modelo: **single-user** (cada usuario e dono isolado dos proprios dados). Auth via
JWT guardado em cookie httpOnly (nao em localStorage).

## Stack

- Backend: Node.js + Express + TypeScript, PostgreSQL via `pg` (sem ORM, mesma
  filosofia do FinDash), bcryptjs, jsonwebtoken, zod pra validacao.
- Frontend: React + TypeScript + Vite, react-router-dom, mobile-first, sem
  biblioteca de UI (componentes proprios em `components/`).

## Reaproveitado do FinDash

Padrao de auth (JWT + bcryptjs), estrutura de pastas em camadas
(controllers/services/repositories), config por variaveis de ambiente.

## Como rodar

### 1. Banco de dados

Postgres local, gerenciado via pgAdmin ou DbGate (sem Docker no ambiente de
desenvolvimento atual). Precisa existir um banco `mercearia_db` com um
usuario que tenha acesso a ele - ver `.env.example` pro formato esperado da
`DATABASE_URL`.

> Existe um `docker-compose.yml` em `backend/` como alternativa, se um dia
> fizer sentido rodar via Docker (ex: outra maquina, CI), mas nao e o fluxo
> usado hoje.

### 2. Backend

```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL pro seu Postgres local
npm install
npm run migrate         # cria/atualiza as tabelas (idempotente - roda schema.sql inteiro)
npm run dev              # http://localhost:3333
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

## Rotas da API

### Auth (Fase 1, login por usuário ou e-mail)

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

```
POST /api/auth/forgot-password   { email } -> sempre 200 com mensagem generica,
                                    exista ou nao a conta (evita enumeracao de e-mail)
POST /api/auth/reset-password    { token, password } -> token de uso unico, expira em 1h
```

Variaveis novas no `.env` do backend: `RESEND_API_KEY` e `EMAIL_FROM`. Sem
`RESEND_API_KEY` configurada, o link de reset cai no **console do backend**
em vez de ser enviado por e-mail de verdade - da pra testar o fluxo inteiro
sem precisar configurar o Resend ainda.

### Transactions - entradas e saidas (Fase 2)

```
GET    /api/transactions            filtros: type, category, payment_method, from, to, limit
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
`limit` (Fase 4) existe pra alimentar o "ultimos lancamentos" do Dashboard.

### Pending - pendencias a receber/a pagar (Fase 3)

```
GET    /api/pending              filtros: type, status, from, to (due_date)
GET    /api/pending/summary      -> { totalReceber, totalPagar } (so o que esta em aberto)
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

### Reports - relatorios (Fase 5)

```
GET /api/reports/monthly?month=AAAA-MM              -> { month, totalEntradas, totalSaidas, resultado, totalReceber, totalPagar }
GET /api/reports/categories?month=AAAA-MM&type=..    -> { categories: [{ category, total }] }
GET /api/reports/evolution?months=6                  -> { evolution: [{ month, entradas, saidas, saldo }] }
```

Decisoes de projeto nessa fase:

- **Relatorio mensal reaproveita os summaries existentes** - `totalEntradas`/
  `totalSaidas`/`resultado` vem de `transactionRepository.summary` com o mes
  como periodo; `totalReceber`/`totalPagar` vem do `pendingRepository.summary`
  (sempre o total em aberto agora, nao "do mes" - pendencia nao tem essa
  nocao, e o exemplo original do context.md tambem mostra assim).
- **Evolucao do saldo e cumulativa de verdade**, nao reinicia do zero na
  janela de 6 meses: calcula o saldo ate o dia anterior a janela como "saldo
  inicial" e vai somando o resultado de cada mes a partir dali.
- **Graficos em SVG puro**, sem biblioteca externa (recharts, chart.js etc) -
  mantem o front sem dependencia nova so pra isso.

## Rede de seguranca (ErrorBoundary)

`main.tsx` envolve `<App />` num `ErrorBoundary` (`components/ErrorBoundary`).
Qualquer erro de render nao previsto em qualquer tela mostra uma mensagem
amigavel com botao "Recarregar" em vez de tela branca sem explicacao - feito
pensando em quem vai usar o sistema no dia a dia sem conhecimento tecnico.
Em dev (`import.meta.env.DEV`), mostra tambem o stack trace pra debug.

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
  services/      regra de negocio (auth, transaction, pending, report, email)
  controllers/   HTTP <-> service, validacao zod
  routes/        registro de rotas

frontend/src/
  styles/        tokens.css (paleta Mercearia Lima) + global.css
  constants/     espelho das categorias/formas de pagamento do backend
  utils/         formatCurrency, formatDateDisplay, todayIso, firstDayOfMonthIso,
                  currentMonthIso, formatMonthLabel, formatMonthShort
  components/    Button, Input, Card, Layout, ConfirmDialog, ActionSheet, SettleDialog,
                  ErrorBoundary
  pages/         Login, ForgotPassword, ResetPassword, Dashboard, Transactions
                  (lista + form), Pending (lista + form), Reports
  contexts/      AuthContext
  services/      api.ts (fetch client)
  routes/        ProtectedRoute
```

## Bugs pegos em teste ponta a ponta (ja corrigidos)

- `pg` devolvia coluna `DATE` como timestamp completo em vez de `AAAA-MM-DD` -
  corrigido com `types.setTypeParser` em `config/database.ts`.
- Erros de negocio fora de auth (ex: lancamento nao encontrado) caiam em 500
  generico porque o `errorHandler` so reconhecia `AuthError` - agora existe
  `AppError` como base, e `AuthError`/`TransactionError`/`PendingError`
  estendem ela.
- `toPublicUser` so excluia `password_hash` da resposta - depois de adicionar
  `reset_token_hash`/`reset_token_expires_at` na tabela `users`, esses campos
  vazavam no JSON de `/auth/login` e `/auth/me`. Corrigido excluindo os dois
  tambem, e o tipo `PublicUser` agora reflete isso (`Omit` com os 3 campos).

## Decisoes em aberto (para decidir no caminho)

- Sem diferenciacao de papel (dono/funcionario) - o modelo e single-user por
  enquanto, como decidido na Fase 1.
- Roadmap original (6 fases) completo em funcionalidade, mais error boundary
  e recuperacao de senha resolvidos como pre-producao. Falta a Fase 6
  formal (responsividade fina, testes automatizados) e infraestrutura de
  deploy (a definir - aguardando limitacoes que o Eduardo vai trazer).
- `RESEND_API_KEY` ainda nao configurada em lugar nenhum - o fluxo de reset
  de senha funciona ponta a ponta, mas o e-mail de verdade so sai quando essa
  chave for configurada (fallback pro console enquanto isso).
