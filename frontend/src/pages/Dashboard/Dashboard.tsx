import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Button } from "../../components/Button/Button";
import { useAuth } from "../../contexts/AuthContext";
import { api, ApiError } from "../../services/api";
import { Transaction, TransactionSummary, PendingSummary } from "../../types";
import { formatCurrency, formatDateDisplay, todayIso, firstDayOfMonthIso } from "../../utils/format";
import "./Dashboard.css";

// Indicadores de verdade (secao 4.1 do context.md): saldo atual (desde
// sempre), resumo do mes corrente, total a receber/a pagar e os ultimos
// lancamentos. Tudo consumido de endpoints que ja existiam das Fases 2 e 3,
// mais o novo /pending/summary.
export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [balance, setBalance] = useState<TransactionSummary | null>(null);
  const [monthSummary, setMonthSummary] = useState<TransactionSummary | null>(null);
  const [pendingSummary, setPendingSummary] = useState<PendingSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [balanceRes, monthRes, pendingRes, recentRes] = await Promise.all([
          api.transactions.summary(),
          api.transactions.summary({ from: firstDayOfMonthIso(), to: todayIso() }),
          api.pending.summary(),
          api.transactions.list({ limit: 5 }),
        ]);
        setBalance(balanceRes);
        setMonthSummary(monthRes);
        setPendingSummary(pendingRes);
        setRecent(recentRes.transactions);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar o dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="dashboard">
      <div>
        <p className="dashboard__greeting">Olá, {user?.name}</p>
        <h1 className="dashboard__title">Dashboard</h1>
      </div>

      {error && (
        <Card style={{ borderColor: "var(--color-danger)" }}>
          <span style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{error}</span>
        </Card>
      )}

      {loading ? (
        <p className="dashboard__greeting">Carregando...</p>
      ) : (
        <>
          <Card className="balance-card">
            <span className="balance-card__label">Saldo atual</span>
            <span className={`balance-card__value ${(balance?.saldo ?? 0) < 0 ? "balance-card__value--negative" : ""}`}>
              {formatCurrency(balance?.saldo ?? 0)}
            </span>
          </Card>

          <div>
            <p className="dashboard__section-title">Este mês</p>
            <div className="indicator-grid">
              <Card className="indicator-card">
                <span className="indicator-card__label">Entradas</span>
                <span className="indicator-card__value indicator-card__value--entrada">
                  {formatCurrency(monthSummary?.totalEntradas ?? 0)}
                </span>
              </Card>
              <Card className="indicator-card">
                <span className="indicator-card__label">Saídas</span>
                <span className="indicator-card__value indicator-card__value--saida">
                  {formatCurrency(monthSummary?.totalSaidas ?? 0)}
                </span>
              </Card>
            </div>
          </div>

          <div>
            <p className="dashboard__section-title">Pendências em aberto</p>
            <div className="indicator-grid">
              <Card className="indicator-card">
                <span className="indicator-card__label">A Receber</span>
                <span className="indicator-card__value indicator-card__value--receber">
                  {formatCurrency(pendingSummary?.totalReceber ?? 0)}
                </span>
              </Card>
              <Card className="indicator-card">
                <span className="indicator-card__label">A Pagar</span>
                <span className="indicator-card__value indicator-card__value--pagar">
                  {formatCurrency(pendingSummary?.totalPagar ?? 0)}
                </span>
              </Card>
            </div>
          </div>

          <div>
            <p className="dashboard__section-title">Últimos lançamentos</p>
            <Card>
              {recent.length === 0 ? (
                <p className="recent-item__meta">Nenhum lançamento ainda.</p>
              ) : (
                <div className="recent-list">
                  {recent.map((tx) => (
                    <div key={tx.id} className="recent-item">
                      <div className="recent-item__main">
                        <span className="recent-item__description">{tx.description}</span>
                        <span className="recent-item__meta">
                          {tx.category} · {formatDateDisplay(tx.date)}
                        </span>
                      </div>
                      <span className={`recent-item__amount recent-item__amount--${tx.type}`}>
                        {tx.type === "entrada" ? "+" : "-"} {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <div className="dashboard__actions">
        <Button variant="accent" onClick={() => navigate("/transactions")}>
          Lançamentos
        </Button>
        <Button variant="ghost" onClick={() => navigate("/pending")}>
          Pendências
        </Button>
      </div>

      <Button variant="ghost" onClick={() => logout()}>
        Sair
      </Button>
    </div>
  );
}
