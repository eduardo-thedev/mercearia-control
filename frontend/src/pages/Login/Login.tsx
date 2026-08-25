import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../services/api";
import "./Login.css";

export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resetSuccess = Boolean((location.state as { resetSuccess?: boolean } | null)?.resetSuccess);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState(""); // login: usuario ou email
  const [email, setEmail] = useState(""); // cadastro
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(identifier, password);
      } else {
        await register(name, username, email, password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel conectar ao servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <div className="login__header">
        <span className="login__eyebrow">Controle financeiro</span>
        <h1 className="login__title">
          {mode === "login" ? "Bem-vindo de volta" : "Criar sua conta"}
        </h1>
        <p className="login__subtitle">
          {mode === "login"
            ? "Entre para ver o caixa da sua mercearia."
            : "Leva menos de um minuto pra comecar."}
        </p>
      </div>

      <Card>
        <form className="login__form" onSubmit={handleSubmit}>
          {resetSuccess && mode === "login" && (
            <div className="login__error" style={{ background: "#E3F0E1", color: "var(--color-success)" }}>
              Senha redefinida com sucesso. Entre com sua senha nova.
            </div>
          )}
          {error && <div className="login__error">{error}</div>}

          {mode === "register" && (
            <>
              <Input
                label="Nome"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
              <Input
                label="Nome de usuário"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                autoComplete="username"
                placeholder="ex: eduardo"
                minLength={3}
                maxLength={30}
                pattern="[a-z0-9._-]+"
                title="Apenas letras minúsculas, números, ponto, hífen ou underline"
                required
              />
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </>
          )}

          {mode === "login" && (
            <Input
              label="Usuário ou e-mail"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          )}

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
          />

          <Button type="submit" variant="primary" loading={submitting}>
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>

          {mode === "login" && (
            <p className="login__toggle" style={{ marginTop: "calc(var(--space-2) * -1)" }}>
              <Link to="/forgot-password">Esqueci minha senha</Link>
            </p>
          )}
        </form>
      </Card>

      <p className="login__toggle">
        {mode === "login" ? "Ainda nao tem conta?" : "Ja tem conta?"}{" "}
        <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Criar conta" : "Entrar"}
        </button>
      </p>
    </div>
  );
}
