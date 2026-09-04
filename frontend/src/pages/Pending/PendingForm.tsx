import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import "../../components/Input/Input.css";
import { api, ApiError } from "../../services/api";
import { PendingType, Person } from "../../types";
import { todayIso } from "../../utils/format";
import "../Transactions/TransactionForm.css"; // reaproveita .tx-form-page / .tx-form / .tx-form__error

const NEW_PERSON_VALUE = "__new__";

export function PendingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const [type, setType] = useState<PendingType>(
    (searchParams.get("type") as PendingType) === "pagar" ? "pagar" : "receber"
  );
  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState(searchParams.get("person_id") ?? "");
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonPhone, setNewPersonPhone] = useState("");
  const [creatingPerson, setCreatingPerson] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayIso());
  const [notes, setNotes] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Lista de gente ja cadastrada pra escolher em vez de digitar o nome de
  // novo toda vez - e o motivo de "Joao" duas vezes nao virar duas pessoas.
  useEffect(() => {
    api.people
      .list()
      .then(({ people }) => setPeople(people))
      .catch(() => {
        /* selecao so fica vazia - o erro real aparece se tentar salvar sem pessoa */
      });
  }, []);

  useEffect(() => {
    if (!id) return;
    api.pending
      .get(id)
      .then(({ pending }) => {
        setType(pending.type);
        setPersonId(pending.person_id);
        setDescription(pending.description);
        setAmount(String(pending.amount));
        setDueDate(pending.due_date);
        setNotes(pending.notes ?? "");
        setLocked(pending.status !== "pendente");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar a pendencia."))
      .finally(() => setLoadingInitial(false));
  }, [id]);

  function handlePersonSelect(value: string) {
    if (value === NEW_PERSON_VALUE) {
      setShowNewPerson(true);
      setPersonId("");
      return;
    }
    setShowNewPerson(false);
    setPersonId(value);
  }

  async function handleCreatePerson() {
    setError(null);
    if (!newPersonName.trim()) {
      setError("Informe o nome da pessoa.");
      return;
    }
    setCreatingPerson(true);
    try {
      const { person } = await api.people.create({
        name: newPersonName.trim(),
        phone: newPersonPhone.trim() || null,
      });
      setPeople((prev) => [...prev, person].sort((a, b) => a.name.localeCompare(b.name)));
      setPersonId(person.id);
      setShowNewPerson(false);
      setNewPersonName("");
      setNewPersonPhone("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel cadastrar a pessoa.");
    } finally {
      setCreatingPerson(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount.replace(",", "."));
    if (!personId) return setError(`Selecione o ${type === "receber" ? "cliente" : "fornecedor"}.`);
    if (!description.trim()) return setError("Descricao e obrigatoria.");
    if (!parsedAmount || parsedAmount <= 0) return setError("O valor deve ser maior que zero.");
    if (!dueDate) return setError("Vencimento e obrigatorio.");

    setSubmitting(true);
    try {
      const payload = {
        type,
        person_id: personId,
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
                className={`tx-form__type-btn ${type === "pagar" ? "tx-form__type-btn--active-secondary" : ""}`}
                onClick={() => setType("pagar")}
              >
                A Pagar
              </button>
            </div>

            <label className="field">
              <span className="field__label">{type === "receber" ? "Cliente" : "Fornecedor"}</span>
              <select
                className="field__input"
                value={showNewPerson ? NEW_PERSON_VALUE : personId}
                onChange={(e) => handlePersonSelect(e.target.value)}
                required={!showNewPerson}
              >
                <option value="">Selecione</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value={NEW_PERSON_VALUE}>+ Cadastrar novo</option>
              </select>
            </label>

            {showNewPerson && (
              <Card style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <Input
                  label="Nome"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  maxLength={160}
                  autoFocus
                />
                <Input
                  label="Telefone (opcional)"
                  type="tel"
                  value={newPersonPhone}
                  onChange={(e) => setNewPersonPhone(e.target.value)}
                  maxLength={30}
                />
                <Button type="button" variant="ghost" onClick={handleCreatePerson} loading={creatingPerson}>
                  Salvar pessoa
                </Button>
              </Card>
            )}

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
