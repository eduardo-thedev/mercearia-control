import { Component, ErrorInfo, PropsWithChildren } from "react";
import { Button } from "../Button/Button";
import "./ErrorBoundary.css";

interface State {
  error: Error | null;
}

// Rede de seguranca pra qualquer erro de render nao previsto. Sem isso,
// um erro em qualquer tela derruba o app inteiro numa pagina branca sem
// explicacao nenhuma - ruim especialmente pra quem nao e tecnico.
export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Erro nao tratado capturado pelo ErrorBoundary:", error, info.componentStack);
  }

  handleReload = () => {
    // Reload completo, nao so navegacao client-side - garante que qualquer
    // estado corrompido em memoria e descartado.
    window.location.href = "/";
  };

  render() {
    if (this.state.error) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="error-boundary">
          <h1 className="error-boundary__title">Algo deu errado</h1>
          <p className="error-boundary__message">
            Essa tela encontrou um problema inesperado. Seus dados estão salvos normalmente - isso
            é só um erro de exibição. Tente recarregar.
          </p>
          <Button variant="primary" onClick={this.handleReload}>
            Recarregar
          </Button>
          {isDev && (
            <pre className="error-boundary__details">
              {this.state.error.message}
              {"\n"}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
