import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import "../../components/Input/Input.css";
import { api, ApiError } from "../../services/api";
import { PendingType } from "../../types";
import { todayIso } from "../../utils/format";
import "../Transactions/TransactionForm.css"; // reaproveita .tx-form-page / .tx-form / .tx-form__error

export function PendingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const [type, setType] = useState<PendingType>(
    (searchParams.get("type") as PendingType) === "pagar" ? "pagar" : "receber"
  );
  const [person, setPerson] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayIso());
  const [notes, setNotes] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.pending
      .get(id)
      .then(({ pending }) => {
        setType(pending.type);
        setPerson(pending.person);
        setDescription(pending.description);
        setAmount(String(pending.amount));
        setDueDate(pending.due_date);
        setNotes(pending.notes ?? "");
        setLocked(pending.status !== "pendente");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar a pendencia."))
      .finally(() => setLoadingInitial(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount.replace(",", "."));
    if (!person.trim()) return setError("Informe o cliente/fornecedor.");
    if (!description.trim()) return setError("Descricao e obrigatoria.");
    if (!parsedAmount || parsedAmount <= 0) return setError("O valor deve ser maior que zero.");
    if (!dueDate) return setError("Vencimento e obrigatorio.");

    setSubmitting(true);
    try {
      const payload = {
        type,
        person: person.trim(),
        description: description.trim(),
        amount: parsedAmount,
        due_date: dueDate,
        notes: notes.trim() || null,
      };

      if (isEdit && id) {
        await api.pending.update(id, payload);
      } else {
        await api.pending.create(payload);
      }
      navigate("/pending", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar a pendencia.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInitial) {
    return <p className="tx-form-page__back">Carregando...</p>;
  }

  return (
    <div className="tx-form-page">
      <button className="tx-form-page__back" onClick={() => navigate(-1)}>
        ← Voltar
      </button>
      <h1 className="tx-form-page__title">{isEdit ? "Editar pendência" : "Nova pendência"}</h1>

      {locked ? (
        <Card>
          <p className="tx-form-page__title" style={{ fontSize: "var(--text-base)" }}>
            Esta pendência já foi baixada.
          </p>
          <p className="tx-form__locked-note">
            Pendências pagas ou recebidas não podem mais ser editadas, pra não dessincronizar do
            lançamento financeiro que a baixa já gerou.
          </p>
        </Card>
      ) : (
        <Card>
          <form className="tx-form" onSubmit={handleSubmit}>
            {error && <div className="tx-form__error">{error}</div>}

            <div className="tx-form__type-toggle">
              <button
                type="button"
                className={`tx-form__type-btn ${type === "receber" ? "tx-form__type-btn--active-entrada" : ""}`}
                onClick={() => setType("receber")}
              >
                A Receber
              </button>
              <button
                type="button"
                className={`tx-form__type-btn ${type === "pagar" ? "tx-form__type-btn--active-saida" : ""}`}
                onClick={() => setType("pagar")}
              >
                A Pagar
              </button>
            </div>

            <Input
              label={type === "receber" ? "Cliente" : "Fornecedor"}
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              maxLength={160}
              required
            />

            <Input
              label="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={255}
              required
            />

            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <Input
              label="Vencimento"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />

            <label className="field">
              <span className="field__label">Observação (opcional)</span>
              <textarea
                className="field__input"
                style={{ minHeight: 80, paddingTop: 10, paddingBottom: 10, resize: "vertical" }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
              />
            </label>

            <Button type="submit" variant="primary" loading={submitting}>
              {isEdit ? "Salvar alterações" : "Salvar"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
