import { useNavigate } from "react-router-dom";
import "./ActionSheet.css";

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
}

// Acao rapida "+" Novo lancamento (secao 10 do context.md).
//
// So existem dois motivos pra abrir isso: uma venda que ja foi paga, ou
// uma venda fiada (vira pendencia a receber). Saida nao tem botao aqui -
// o dono nao registra gasto nenhum pelo app; o unico jeito de um
// lancamento de saida existir e o sistema criar sozinho quando uma
// pendencia a pagar e baixada (fluxo raro, acessivel em Pendencias).
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
          onClick={() => goTo("/transactions/new")}
        >
          + Nova Venda
        </button>
        <button className="action-sheet__item" onClick={() => goTo("/pending/new")}>
          + Nova Venda Fiada
        </button>
      </div>
    </div>
  );
}
