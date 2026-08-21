import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import "../../components/Input/Input.css"; // reaproveita .field/.field__label/.field__input pro textarea
import { api, ApiError } from "../../services/api";
import { TransactionType } from "../../types";
import { categoriesForType, PAYMENT_METHODS } from "../../constants/transactionOptions";
import { todayIso } from "../../utils/format";
import "./TransactionForm.css";

export function TransactionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const [type, setType] = useState<TransactionType>(
    (searchParams.get("type") as TransactionType) === "saida" ? "saida" : "entrada"
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [locked, setLocked] = useState(false); // veio de baixa de pendencia - nao pode editar
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .transactions.get(id)
      .then(({ transaction }) => {
        setType(transaction.type);
        setDescription(transaction.description);
        setAmount(String(transaction.amount));
        setDate(transaction.date);
        setCategory(transaction.category);
        setPaymentMethod(transaction.payment_method);
        setNotes(transaction.notes ?? "");
        setLocked(Boolean(transaction.pending_transaction_id));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar o lancamento."))
      .finally(() => setLoadingInitial(false));
  }, [id]);

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setCategory(""); // lista de categorias muda por tipo
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount.replace(",", "."));
    if (!description.trim()) return setError("Descricao e obrigatoria.");
    if (!parsedAmount || parsedAmount <= 0) return setError("O valor deve ser maior que zero.");
    if (!date) return setError("Data e obrigatoria.");
    if (!category) return setError("Selecione uma categoria.");
    if (!paymentMethod) return setError("Selecione a forma de pagamento.");

    setSubmitting(true);
    try {
      const payload = {
        type,
        description: description.trim(),
        amount: parsedAmount,
        date,
        category,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      };

      if (isEdit && id) {
        await api.transactions.update(id, payload);
      } else {
        await api.transactions.create(payload);
      }
      navigate("/transactions", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar o lancamento.");
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
      <h1 className="tx-form-page__title">{isEdit ? "Editar lançamento" : "Novo lançamento"}</h1>

      {locked ? (
        <Card>
          <p className="tx-form-page__title" style={{ fontSize: "var(--text-base)" }}>
            Este lançamento não pode ser editado aqui.
          </p>
          <p className="tx-form__locked-note">
            Ele foi criado automaticamente pela baixa de uma pendência. Pra alterá-lo, ajuste a
            pendência de origem (isso chega na Fase 3).
          </p>
        </Card>
      ) : (
        <Card>
          <form className="tx-form" onSubmit={handleSubmit}>
            {error && <div className="tx-form__error">{error}</div>}

            <div className="tx-form__type-toggle">
              <button
                type="button"
                className={`tx-form__type-btn ${type === "entrada" ? "tx-form__type-btn--active-entrada" : ""}`}
                onClick={() => handleTypeChange("entrada")}
              >
                Entrada
              </button>
              <button
                type="button"
                className={`tx-form__type-btn ${type === "saida" ? "tx-form__type-btn--active-saida" : ""}`}
                onClick={() => handleTypeChange("saida")}
              >
                Saída
              </button>
            </div>

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

            <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

            <label className="field">
              <span className="field__label">Categoria</span>
              <select
                className="field__input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                {categoriesForType(type).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Forma de pagamento</span>
              <select
                className="field__input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                {PAYMENT_METHODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

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
