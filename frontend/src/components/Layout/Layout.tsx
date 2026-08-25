import { PropsWithChildren, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Layout.css";
import { useAuth } from "../../contexts/AuthContext";
import { ActionSheet } from "../ActionSheet/ActionSheet";

// Shell mobile-first com bottom nav (secao 10 do context.md).
// Pendencias e Relatorios ainda desabilitados - Fases 3 e 5.
export function Layout({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  return (
    <div className="layout">
      <header className="layout__topbar">
        <span className="layout__brand">Mercearia</span>
        {user && <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{user.name}</span>}
      </header>

      <main className="layout__content">{children}</main>

      <nav className="bottom-nav" aria-label="Navegacao principal">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) => `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`}
        >
          Lançamentos
        </NavLink>
        <button className="bottom-nav__fab" type="button" onClick={() => setActionSheetOpen(true)}>
          +
        </button>
        <NavLink
          to="/pending"
          className={({ isActive }) => `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`}
        >
          Pendências
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) => `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`}
        >
          Relatórios
        </NavLink>
      </nav>

      <ActionSheet open={actionSheetOpen} onClose={() => setActionSheetOpen(false)} />
    </div>
  );
}
