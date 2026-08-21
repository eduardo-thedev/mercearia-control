import { useNavigate } from "react-router-dom";
import "./ActionSheet.css";

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
}

// Acao rapida "+" Novo lancamento (secao 10 do context.md).
export function ActionSheet({ open, onClose }: ActionSheetProps) {
  const navigate = useNavigate();
  if (!open) return null;

  function goTo(path: string) {
    onClose();
    navigate(path);
  }

  return (
    <div className="action-sheet-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="action-sheet" onClick={(e) => e.stopPropagation()}>
        <span className="action-sheet__title">Novo lançamento</span>
        <button
          className="action-sheet__item action-sheet__item--entrada"
          onClick={() => goTo("/transactions/new?type=entrada")}
        >
          + Nova Entrada
        </button>
        <button
          className="action-sheet__item action-sheet__item--saida"
          onClick={() => goTo("/transactions/new?type=saida")}
        >
          + Nova Saída
        </button>
        <button className="action-sheet__item" onClick={() => goTo("/pending/new")}>
          + Nova Pendência
        </button>
      </div>
    </div>
  );
}
