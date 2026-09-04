import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Button } from "../../components/Button/Button";
import { api, ApiError } from "../../services/api";
import { PersonWithTotals } from "../../types";
import { formatCurrency } from "../../utils/format";
import "../Transactions/TransactionForm.css"; // reaproveita .tx-form-page__back
import "./People.css";

// Cadastro de clientes/fornecedores - existe pra parar de tratar o nome
// como texto solto na pendencia: aqui e uma pessoa so, e toda pendencia
// dela (passada ou em aberto) fica visivel num lugar so ao entrar nela.
export function People() {
  const navigate = useNavigate();
  const [people, setPeople] = useState<PersonWithTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.people
      .list()
      .then(({ people }) => setPeople(people))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar os clientes."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="people">
      <button className="tx-form-page__back" onClick={() => navigate(-1)}>
        ← Voltar
      </button>
      <h1 className="people__title">Clientes</h1>

      {error && (
        <Card style={{ borderColor: "var(--color-danger)" }}>
          <span style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{error}</span>
        </Card>
      )}

      <div className="people-list">
        {loading && <p className="people-empty">Carregando...</p>}
        {!loading && people.length === 0 && <p className="people-empty">Nenhum cliente cadastrado ainda.</p>}

        {!loading &&
          people.map((person) => (
            <Card key={person.id} className="person-card" onClick={() => navigate(`/people/${person.id}`)}>
              <div className="person-card__main">
                <span className="person-card__name">{person.name}</span>
                {person.phone && <span className="person-card__phone">{person.phone}</span>}
              </div>
              {person.total_receber_aberto > 0 ? (
                <span className="person-card__amount person-card__amount--receber">
                  {formatCurrency(person.total_receber_aberto)}
                </span>
              ) : (
                <span className="person-card__amount person-card__amount--zero">Em dia</span>
              )}
            </Card>
          ))}
      </div>

      <Button variant="ghost" onClick={() => navigate("/people/new")}>
        + Novo Cliente
      </Button>
    </div>
  );
}
