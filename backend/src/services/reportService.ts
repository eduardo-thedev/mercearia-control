import { transactionRepository } from "../repositories/transactionRepository";
import { pendingRepository } from "../repositories/pendingRepository";
import { AppError } from "../utils/AppError";
import { TransactionType } from "../types";

export class ReportError extends AppError {}

function monthBounds(month: string): { from: string; to: string } {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1; // 0-indexado
  const from = `${yearStr}-${monthStr}-01`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate(); // dia 0 do mes seguinte = ultimo dia deste mes
  const to = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

function shiftMonth(month: string, offset: number): string {
  const [yearStr, monthStr] = month.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export const reportService = {
  // Relatorio mensal no formato da secao 9 do context.md: entradas, saidas,
  // resultado do mes + a receber/a pagar em aberto (esses ultimos nao sao
  // "do mes" - sao o total em aberto agora, reaproveitando o summary da
  // Fase 3, igual o exemplo original mostra).
  async monthly(userId: string, month: string) {
    const { from, to } = monthBounds(month);
    const [txSummary, pendingSummary] = await Promise.all([
      transactionRepository.summary(userId, { from, to }),
      pendingRepository.summary(userId),
    ]);

    return {
      month,
      totalEntradas: txSummary.totalEntradas,
      totalSaidas: txSummary.totalSaidas,
      resultado: txSummary.saldo,
      totalReceber: pendingSummary.totalReceber,
      totalPagar: pendingSummary.totalPagar,
    };
  },

  async categories(userId: string, params: { type: TransactionType; month: string }) {
    const { from, to } = monthBounds(params.month);
    return transactionRepository.categoryBreakdown(userId, { type: params.type, from, to });
  },

  // Evolucao do saldo nos ultimos N meses (padrao 6) - saldo acumulado de
  // verdade, nao reiniciado do zero: pega o saldo ate o dia anterior a
  // janela como "saldo inicial" e vai somando o resultado de cada mes.
  async evolution(userId: string, months: number) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const windowStartMonth = shiftMonth(currentMonth, -(months - 1));
    const { from: windowFrom } = monthBounds(windowStartMonth);

    const dayBeforeWindow = new Date(windowFrom);
    dayBeforeWindow.setDate(dayBeforeWindow.getDate() - 1);
    const openingBalanceSummary = await transactionRepository.summary(userId, {
      to: dayBeforeWindow.toISOString().slice(0, 10),
    });

    const { to: windowTo } = monthBounds(currentMonth);
    const rows = await transactionRepository.monthlyBreakdown(userId, { from: windowFrom, to: windowTo });

    const byMonth = new Map<string, { entradas: number; saidas: number }>();
    let cursor = windowStartMonth;
    for (let i = 0; i < months; i++) {
      byMonth.set(cursor, { entradas: 0, saidas: 0 });
      cursor = shiftMonth(cursor, 1);
    }
    for (const row of rows) {
      const bucket = byMonth.get(row.month);
      if (!bucket) continue;
      if (row.type === "entrada") bucket.entradas = row.total;
      else bucket.saidas = row.total;
    }

    let running = openingBalanceSummary.saldo;
    const points = [];
    for (const [month, { entradas, saidas }] of byMonth.entries()) {
      running += entradas - saidas;
      points.push({ month, entradas, saidas, saldo: running });
    }

    return points;
  },
};
