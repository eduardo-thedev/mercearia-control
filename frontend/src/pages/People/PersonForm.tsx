import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import { api, ApiError } from "../../services/api";
import "../Transactions/TransactionForm.css"; // reaproveita .tx-form-page / .tx-form / .tx-form__error

export function PersonForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.people
      .get(id)
      .then(({ person }) => {
        setName(person.name);
        setPhone(person.phone ?? "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar o cliente."))
      .finally(() => setLoadingInitial(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Informe o nome.");

    setSubmitting(true);
    try {
      const payload = { name: name.trim(), phone: phone.trim() || null };
      if (isEdit && id) {
        await api.people.update(id, payload);
        navigate(`/people/${id}`, { replace: true });
      } else {
        const { person } = await api.people.create(payload);
        navigate(`/people/${person.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar o cliente.");
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
      <h1 className="tx-form-page__title">{isEdit ? "Editar cliente" : "Novo cliente"}</h1>

      <Card>
        <form className="tx-form" onSubmit={handleSubmit}>
          {error && <div className="tx-form__error">{error}</div>}

          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} required />

          <Input
            label="Telefone (opcional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
          />

          <Button type="submit" variant="primary" loading={submitting}>
            {isEdit ? "Salvar alterações" : "Salvar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
