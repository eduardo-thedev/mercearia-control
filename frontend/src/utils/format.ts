const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

// Input value="AAAA-MM-DD" <-> exibicao DD/MM/AAAA, sem depender de Date()
// (Date() com string "AAAA-MM-DD" as vezes desloca um dia por causa de timezone)
export function formatDateDisplay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function firstDayOfMonthIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function currentMonthIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// "2026-08" -> "Agosto/2026"
export function formatMonthLabel(monthIso: string): string {
  const [year, month] = monthIso.split("-");
  return `${MONTH_NAMES_PT[Number(month) - 1]}/${year}`;
}

// "2026-08" -> "Ago" (pros rotulos do grafico de evolucao, que precisam ser curtos)
export function formatMonthShort(monthIso: string): string {
  const [, month] = monthIso.split("-");
  return MONTH_NAMES_PT[Number(month) - 1].slice(0, 3);
}
