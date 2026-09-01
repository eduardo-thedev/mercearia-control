import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { api, ApiError } from "../../services/api";
import { Person, PendingTransaction, PendingEffectiveStatus } from "../../types";
import { formatCurrency, formatDateDisplay } from "../../utils/format";
import "../Transactions/TransactionForm.css"; // reaproveita .tx-form-page__back / .tx-form-page__title
import "../Transactions/Transactions.css"; // reaproveita .tx-list / .tx-empty
import "../Pending/Pending.css"; // reaproveita .pending-card / .status-badge
import "./People.css";

const STATUS_LABEL: Record<PendingEffectiveStatus, string> = {
  pendente: "Pendente",
  vencido: "Vencido",
  pago: "Pago",
  recebido: "Recebido",
};

// Historico completo de uma pessoa: toda pendencia dela, aberta ou ja
// baixada, num lugar so - a razao de existir cadastro de cliente em vez
// de nome solto em cada pendencia.
export function PersonDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [person, setPerson] = useState<Person | null>(null);
  const [items, setItems] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([api.people.get(id), api.pending.list({ person_id: id })])
      .then(([{ person }, { pending }]) => {
        setPerson(person);
        setItems(pending);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar o cliente."))
      .finally(() => setLoading(false));
  }, [id]);

  async function confirmDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await api.people.remove(id);
      navigate("/people", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel excluir o cliente.");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="tx-form-page__back">Carregando...</p>;
  }

  return (
    <div className="tx-form-page">
      <button className="tx-form-page__back" onClick={() => navigate("/people")}>
        ← Voltar
      </button>

      {error && <div className="tx-form__error">{error}</div>}

      {person && (
        <>
          <div>
            <h1 className="tx-form-page__title">{person.name}</h1>
            {person.phone && <p className="person-card__phone">{person.phone}</p>}
          </div>

          <div className="pending-card__actions">
            <button className="pending-card__action" onClick={() => navigate(`/people/${person.id}/edit`)}>
              Editar
            </button>
            <button className="pending-card__action pending-card__action--danger" onClick={() => setConfirmingDelete(true)}>
              Excluir
            </button>
          </div>

          <Button
            variant="accent"
            onClick={() => navigate(`/pending/new?type=receber&person_id=${person.id}`)}
          >
            + Nova Pendência
          </Button>

          <div className="tx-list">
            {items.length === 0 && <p className="tx-empty">Nenhuma pendência registrada ainda.</p>}

            {items.map((item) => (
              <Card key={item.id} className="pending-card">
                <div className="pending-card__main">
                  <span className="pending-card__description">{item.description}</span>
                  <span className="pending-card__due">Vencimento: {formatDateDisplay(item.due_date)}</span>
                </div>
                <div className="pending-card__side">
                  <span className="pending-card__amount">{formatCurrency(item.amount)}</span>
                  <span className={`status-badge status-badge--${item.effective_status}`}>
                    {STATUS_LABEL[item.effective_status]}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        title="Excluir cliente?"
        message="So e possivel excluir quem nao tem nenhuma pendencia no historico."
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
