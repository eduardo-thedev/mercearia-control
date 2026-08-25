import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import { api, ApiError } from "../../services/api";
import "../Login/Login.css"; // reaproveita .login / .login__header / etc
import "../Transactions/TransactionForm.css"; // reaproveita .tx-form__locked-note

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.forgotPassword(email);
      setSent(true); // sempre mostra sucesso, mesmo que o e-mail nao exista
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível conectar ao servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <div className="login__header">
        <span className="login__eyebrow">Controle financeiro</span>
        <h1 className="login__title">Esqueci minha senha</h1>
        <p className="login__subtitle">
          Informe o e-mail da sua conta e enviamos um link pra você criar uma senha nova.
        </p>
      </div>

      <Card>
        {sent ? (
          <p className="tx-form__locked-note">
            Se esse e-mail existir na nossa base, um link de redefinição foi enviado. Confira sua
            caixa de entrada (e o spam) - o link expira em 1 hora.
          </p>
        ) : (
          <form className="login__form" onSubmit={handleSubmit}>
            {error && <div className="login__error">{error}</div>}
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Button type="submit" variant="primary" loading={submitting}>
              Enviar link
            </Button>
          </form>
        )}
      </Card>

      <p className="login__toggle">
        <Link to="/login">← Voltar pro login</Link>
      </p>
    </div>
  );
}
