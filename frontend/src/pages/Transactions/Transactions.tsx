import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { api, ApiError } from "../../services/api";
import { Transaction, TransactionType } from "../../types";
import { categoriesForType } from "../../constants/transactionOptions";
import { formatCurrency, formatDateDisplay } from "../../utils/format";
import "./Transactions.css";

export function Transactions() {
  const navigate = useNavigate();
  const [type, setType] = useState<TransactionType>("entrada");
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { transactions } = await api.transactions.list({
        type,
        category: category || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setTransactions(transactions);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar os lancamentos.");
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [type, category, from, to]);

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setCategory(""); // categorias sao diferentes por tipo, entao reseta o filtro
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      await api.transactions.remove(pendingDeleteId);
      setPendingDeleteId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel excluir o lancamento.");
    } finally {
      setDeleting(false);
    }
  }

  const categoryOptions = categoriesForType(type);

  return (
    <div className="transactions">
      <h1 className="transactions__title">Lançamentos</h1>

      <div className="tabs">
        <button
          className={`tabs__item ${type === "entrada" ? "tabs__item--active-entrada" : ""}`}
          onClick={() => handleTypeChange("entrada")}
        >
          Entradas
        </button>
        <button
          className={`tabs__item ${type === "saida" ? "tabs__item--active-saida" : ""}`}
          onClick={() => handleTypeChange("saida")}
        >
          Saídas
        </button>
      </div>

      <div className="filters">
        <label className="filters__field">
          <span className="filters__label">Categoria</span>
          <select className="filters__select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Todas</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="filters__field">
          <span className="filters__label">De</span>
          <input className="filters__input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="filters__field">
          <span className="filters__label">Até</span>
          <input className="filters__input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      {error && (
        <Card style={{ borderColor: "var(--color-danger)" }}>
          <span style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{error}</span>
        </Card>
      )}

      <div className="tx-list">
        {loading && <p className="tx-empty">Carregando...</p>}

        {!loading && transactions.length === 0 && (
          <p className="tx-empty">Nenhum lançamento encontrado com esses filtros.</p>
        )}

        {!loading &&
          transactions.map((tx) => (
            <Card key={tx.id} className="tx-card">
              <div className="tx-card__main">
                <span className="tx-card__description">{tx.description}</span>
                <span className="tx-card__meta">
                  {tx.category} · {tx.payment_method} · {formatDateDisplay(tx.date)}
                </span>
                {tx.pending_transaction_id && (
                  <span className="tx-card__pending-tag">Gerado por baixa de pendência</span>
                )}
              </div>
              <div className="tx-card__side">
                <span className={`tx-card__amount tx-card__amount--${tx.type}`}>
                  {tx.type === "entrada" ? "+" : "-"} {formatCurrency(tx.amount)}
                </span>
                {!tx.pending_transaction_id && (
                  <div className="tx-card__actions">
                    <button className="tx-card__action" onClick={() => navigate(`/transactions/${tx.id}/edit`)}>
                      Editar
                    </button>
                    <button
                      className="tx-card__action tx-card__action--danger"
                      onClick={() => setPendingDeleteId(tx.id)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
      </div>

      <Button variant="ghost" onClick={() => navigate(`/transactions/new?type=${type}`)}>
        + Novo {type === "entrada" ? "Entrada" : "Saída"}
      </Button>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Excluir lançamento?"
        message="Essa acao nao pode ser desfeita."
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
