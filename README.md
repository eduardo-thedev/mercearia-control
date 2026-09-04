# 🛒 Mercearia Control

### Sistema de Controle Financeiro para Pequenos Negócios

Aplicação web desenvolvida para auxiliar no controle financeiro de uma mercearia, centralizando **entradas, saídas, pendências financeiras e indicadores** em uma única plataforma.

O projeto foi desenvolvido com foco em uma arquitetura organizada, segurança, consistência dos dados e experiência **mobile-first**.

---

## 📌 Sobre o Projeto

O **Mercearia Control** é um sistema de controle financeiro desenvolvido para substituir processos manuais baseados em anotações e planilhas.

A aplicação permite registrar movimentações financeiras, acompanhar valores a receber e pagar, realizar baixas de pendências e visualizar indicadores através de um dashboard.

O projeto segue atualmente um modelo **single-user**, onde cada usuário possui acesso isolado aos seus próprios dados.

---

## 🚀 Funcionalidades

### 🔐 Autenticação

- Cadastro de usuários
- Login por usuário ou e-mail
- Autenticação utilizando JWT
- JWT armazenado em cookie `httpOnly`
- Hash de senhas com `bcryptjs`
- Proteção de rotas autenticadas
- Isolamento dos dados por usuário

---

### 💰 e Financeiro

- Cadastro de entradas
- Cadastro de saídas
- Edição e exclusão de lançamentos
- Cálculo automático do saldo
- Histórico de movimentações
- Filtros por:
  - Tipo
  - Categoria
  - Forma de pagamento
  - Período
- Resumo financeiro por período

---

### 📋 Pendências

Controle de valores:

- A receber
- A pagar

Funcionalidades:

- Cadastro de pendências
- Edição e exclusão enquanto pendente
- Filtros por tipo, status e período
- Identificação dinâmica de pendências vencidas
- Baixa de pendências
- Registro automático do lançamento financeiro após a baixa
- Prevenção de baixa duplicada
- Bloqueio de alteração após a baixa

### 🔄 Fluxo de baixa

Quando uma pendência é quitada, o sistema:

```text
Pendência
    ↓
Baixa
    ↓
Atualização do status
    ↓
Criação automática da transação
    ↓
Vinculação entre pendência e lançamento
```
