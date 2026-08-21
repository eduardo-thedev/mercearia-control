import { useState } from "react";
import { Button } from "../Button/Button";
import { PAYMENT_METHODS } from "../../constants/transactionOptions";
import { PendingType } from "../../types";
import "./SettleDialog.css";
import "../Input/Input.css"; // reaproveita .field/.field__label/.field__input

interface SettleDialogProps {
  open: boolean;
  type: PendingType;
  onConfirm: (paymentMethod: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

// Bottom-sheet que pede a forma de pagamento antes de baixar uma pendencia -
// pending_transactions nao tem esse campo (secao 12 do context.md), entao e
// escolhido no momento da baixa, quando o dinheiro de fato muda de mao.
export function SettleDialog({ open, type, onConfirm, onCancel, loading }: SettleDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState("");

  if (!open) return null;

  const verb = type === "receber" ? "recebida" : "paga";

  return (
    <div className="settle-overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="settle-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="settle-dialog__title">Marcar como {verb}</h2>
        <p className="settle-dialog__message">
          Isso cria automaticamente {type === "receber" ? "uma entrada" : "uma saída"} no seu
          histórico financeiro.
        </p>

        <label className="field">
          <span className="field__label">Forma de pagamento</span>
          <select className="field__input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="">Selecione</option>
            {PAYMENT_METHODS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <div className="settle-dialog__actions">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => paymentMethod && onConfirm(paymentMethod)}
            disabled={!paymentMethod}
            loading={loading}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
