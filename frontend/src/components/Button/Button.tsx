import { ButtonHTMLAttributes } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "ghost";
  loading?: boolean;
}

export function Button({ variant = "primary", loading, children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={`btn btn--${variant}`} disabled={disabled || loading} {...rest}>
      {loading ? "Carregando..." : children}
    </button>
  );
}
