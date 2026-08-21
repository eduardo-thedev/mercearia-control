import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { SettleDialog } from "../../components/SettleDialog/SettleDialog";
import { api, ApiError } from "../../services/api";
import { PendingTransaction, PendingType, PendingEffectiveStatus } from "../../types";
import { formatCurrency, formatDateDisplay } from "../../utils/format";
import "../Transactions/Transactions.css"; // reaproveita .tabs / .tx-list / .tx-empty
import "./Pending.css";

const STATUS_LABEL: Record<PendingEffectiveStatus, string> = {
  pendente: "Pendente",
  vencido: "Vencido",
  pago: "Pago",
  recebido: "Recebido",
};

export function Pending() {
  const navigate = useNavigate();
  const [type, setType] = useState<PendingType>("receber");
  const [status, setStatus] = useState<PendingEffectiveStatus | "">("");
  const [items, setItems] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [settleTarget, setSettleTarget] = useState<PendingTransaction | null>(null);
  const [settling, setSettling] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { pending } = await api.pending.list({ type, status: status || undefined });
      setItems(pending);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar as pendencias.");
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [type, status]);

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      await api.pending.remove(pendingDeleteId);
      setPendingDeleteId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel excluir a pendencia.");
    } finally {
      setDeleting(false);
    }
  }

  async function confirmSettle(paymentMethod: string) {
    if (!settleTarget) return;
    setSettling(true);
    try {
      await api.pending.settle(settleTarget.id, paymentMethod);
      setSettleTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel dar baixa na pendencia.");
    } finally {
      setSettling(false);
    }
  }

  const settledLabel = type === "receber" ? "Recebido" : "Pago";
  const statusOptions: PendingEffectiveStatus[] =
    type === "receber" ? ["pendente", "vencido", "recebido"] : ["pendente", "vencido", "pago"];

  return (
    <div className="pending">
      <h1 className="pending__title">Pendências</h1>

      <div className="tabs">
        <button
          className={`tabs__item ${type === "receber" ? "tabs__item--active-entrada" : ""}`}
          onClick={() => {
            setType("receber");
            setStatus("");
          }}
        >
          A Receber
        </button>
        <button
          className={`tabs__item ${type === "pagar" ? "tabs__item--active-saida" : ""}`}
          onClick={() => {
            setType("pagar");
            setStatus("");
          }}
        >
          A Pagar
        </button>
      </div>

      <div className="pending-filters">
        <select
          className="pending-filters__select"
          value={status}
          onChange={(e) => setStatus(e.target.value as PendingEffectiveStatus | "")}
        >
          <option value="">Todos os status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <Card style={{ borderColor: "var(--color-danger)" }}>
          <span style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{error}</span>
        </Card>
      )}

      <div className="tx-list">
        {loading && <p className="tx-empty">Carregando...</p>}
        {!loading && items.length === 0 && <p className="tx-empty">Nenhuma pendência encontrada.</p>}

        {!loading &&
          items.map((item) => (
            <Card key={item.id} className="pending-card">
              <div className="pending-card__main">
                <span className="pending-card__person">{item.person}</span>
                <span className="pending-card__description">{item.description}</span>
                <span className="pending-card__due">Vencimento: {formatDateDisplay(item.due_date)}</span>
              </div>
              <div className="pending-card__side">
                <span className="pending-card__amount">{formatCurrency(item.amount)}</span>
                <span className={`status-badge status-badge--${item.effective_status}`}>
                  {STATUS_LABEL[item.effective_status]}
                </span>
                {item.status === "pendente" ? (
                  <div className="pending-card__actions">
                    <button
                      className="pending-card__action pending-card__action--settle"
                      onClick={() => setSettleTarget(item)}
                    >
                      Marcar {settledLabel.toLowerCase()}
                    </button>
                  </div>
                ) : null}
                {item.status === "pendente" && (
                  <div className="pending-card__actions">
                    <button className="pending-card__action" onClick={() => navigate(`/pending/${item.id}/edit`)}>
                      Editar
                    </button>
                    <button
                      className="pending-card__action pending-card__action--danger"
                      onClick={() => setPendingDeleteId(item.id)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
      </div>

      <Button variant="ghost" onClick={() => navigate(`/pending/new?type=${type}`)}>
        + Nova Pendência {type === "receber" ? "a Receber" : "a Pagar"}
      </Button>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Excluir pendência?"
        message="Essa acao nao pode ser desfeita."
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      <SettleDialog
        open={settleTarget !== null}
        type={settleTarget?.type ?? "receber"}
        onCancel={() => setSettleTarget(null)}
        onConfirm={confirmSettle}
        loading={settling}
      />
    </div>
  );
}
