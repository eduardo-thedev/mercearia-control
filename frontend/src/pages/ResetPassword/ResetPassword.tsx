import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import { api, ApiError } from "../../services/api";
import "../Login/Login.css";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Link inválido - falta o token. Peça um novo link em 'Esqueci minha senha'.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      navigate("/login", { replace: true, state: { resetSuccess: true } });
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
        <h1 className="login__title">Criar nova senha</h1>
        <p className="login__subtitle">Escolha uma senha nova pra sua conta.</p>
      </div>

      <Card>
        <form className="login__form" onSubmit={handleSubmit}>
          {error && <div className="login__error">{error}</div>}
          {!token && <div className="login__error">Link sem token válido - abra o link do e-mail de novo.</div>}

          <Input
            label="Nova senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />

          <Button type="submit" variant="primary" loading={submitting}>
            Salvar nova senha
          </Button>
        </form>
      </Card>

      <p className="login__toggle">
        <Link to="/login">← Voltar pro login</Link>
      </p>
    </div>
  );
}
