import { useEffect, useState } from "react";
import { Card } from "../../components/Card/Card";
import { api, ApiError } from "../../services/api";
import { MonthlyReport, CategoryBreakdownItem, EvolutionPoint, TransactionType } from "../../types";
import { formatCurrency, currentMonthIso, formatMonthLabel, formatMonthShort } from "../../utils/format";
import "./Reports.css";

function shiftMonth(month: string, offset: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function Reports() {
  const [month, setMonth] = useState(currentMonthIso());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [categoryType, setCategoryType] = useState<TransactionType>("entrada");
  const [categories, setCategories] = useState<CategoryBreakdownItem[]>([]);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [reportRes, categoriesRes, evolutionRes] = await Promise.all([
          api.reports.monthly(month),
          api.reports.categories(month, categoryType),
          api.reports.evolution(6),
        ]);
        setReport(reportRes);
        setCategories(categoriesRes.categories);
        setEvolution(evolutionRes.evolution);
        // Sem saida no mes, nao faz sentido oferecer o toggle pra ver
        // categoria de saida - volta pro unico tipo que existe de fato.
        if (!reportRes.totalSaidas && categoryType === "saida") {
          setCategoryType("entrada");
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Não foi possível carregar os relatórios.");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, categoryType]);

  const maxCategoryTotal = Math.max(1, ...categories.map((c) => c.total));

  return (
    <div className="reports">
      <h1 className="reports__title">Relatórios</h1>

      <div className="month-picker">
        <button className="month-picker__btn" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
          ‹
        </button>
        <span className="month-picker__label">{formatMonthLabel(month)}</span>
        <button className="month-picker__btn" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
          ›
        </button>
      </div>

      {error && (
        <Card style={{ borderColor: "var(--color-danger)" }}>
          <span style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{error}</span>
        </Card>
      )}

      {loading ? (
        <p className="reports-empty">Carregando...</p>
      ) : (
        <>
          {/*
            "Saidas" e "Resultado" so aparecem se houve saida de fato no
            mes (o unico jeito disso acontecer e uma pendencia a pagar
            baixada). Sem saida, Resultado seria so uma copia de
            Entradas - redundante - entao o mes fica so com a linha de
            venda. Mesma logica pra "a pagar" mais abaixo.
          */}
          <Card className="monthly-report">
            <div className="monthly-report__row">
              <span className="monthly-report__label">Entradas</span>
              <span className="monthly-report__value monthly-report__value--entrada">
                {formatCurrency(report?.totalEntradas ?? 0)}
              </span>
            </div>
            {Boolean(report?.totalSaidas) && (
              <>
                <div className="monthly-report__row">
                  <span className="monthly-report__label">Saídas</span>
                  <span className="monthly-report__value monthly-report__value--saida">
                    {formatCurrency(report?.totalSaidas ?? 0)}
                  </span>
                </div>
                <div className="monthly-report__row monthly-report__row--result">
                  <span className="monthly-report__label">Resultado</span>
                  <span className="monthly-report__value">{formatCurrency(report?.resultado ?? 0)}</span>
                </div>
              </>
            )}
            <div className="monthly-report__row">
              <span className="monthly-report__label">A receber (em aberto)</span>
              <span className="monthly-report__value monthly-report__value--receber">
                {formatCurrency(report?.totalReceber ?? 0)}
              </span>
            </div>
            {Boolean(report?.totalPagar) && (
              <div className="monthly-report__row">
                <span className="monthly-report__label">A pagar (em aberto)</span>
                <span className="monthly-report__value monthly-report__value--pagar">
                  {formatCurrency(report?.totalPagar ?? 0)}
                </span>
              </div>
            )}
          </Card>

          <div>
            <p className="reports__section-title">Por categoria</p>
            <Card>
              {/* So vale mostrar o alternador se houve saida no mes -
                  sem isso, teria um botao pra uma vista sempre vazia. */}
              {Boolean(report?.totalSaidas) && (
                <div className="category-toggle">
                  <button
                    className={`category-toggle__btn ${categoryType === "entrada" ? "category-toggle__btn--active-entrada" : ""}`}
                    onClick={() => setCategoryType("entrada")}
                  >
                    Entradas
                  </button>
                  <button
                    className={`category-toggle__btn ${categoryType === "saida" ? "category-toggle__btn--active-saida" : ""}`}
                    onClick={() => setCategoryType("saida")}
                  >
                    Saídas
                  </button>
                </div>
              )}

              {categories.length === 0 ? (
                <p className="reports-empty">Sem lançamentos nesse mês.</p>
              ) : (
                <div className="bar-list">
                  {categories.map((c) => (
                    <div key={c.category}>
                      <div className="bar-item__top">
                        <span className="bar-item__category">{c.category}</span>
                        <span className="bar-item__value">{formatCurrency(c.total)}</span>
                      </div>
                      <div className="bar-item__track">
                        <div
                          className={`bar-item__fill bar-item__fill--${categoryType}`}
                          style={{ width: `${(c.total / maxCategoryTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div>
            <p className="reports__section-title">Evolução do saldo (6 meses)</p>
            <Card>
              <EvolutionChart data={evolution} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Grafico de linha simples em SVG puro - sem biblioteca externa, pra nao
// precisar instalar dependencia nova so pra isso.
function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  if (data.length === 0) {
    return <p className="reports-empty">Sem dados suficientes ainda.</p>;
  }

  const width = 320;
  const height = 140;
  const paddingX = 8;
  const paddingY = 20;

  const values = data.map((d) => d.saldo);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;

  const stepX = (width - paddingX * 2) / (data.length - 1 || 1);

  function yFor(value: number) {
    return height - paddingY - ((value - min) / range) * (height - paddingY * 2);
  }

  const points = data.map((d, i) => `${paddingX + i * stepX},${yFor(d.saldo)}`).join(" ");
  const zeroY = yFor(0);
  const isNegativeEnd = data[data.length - 1].saldo < 0;

  return (
    <svg className="evolution-chart" viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <line
        x1={paddingX}
        y1={zeroY}
        x2={width - paddingX}
        y2={zeroY}
        stroke="var(--color-border)"
        strokeWidth={1}
        strokeDasharray="3,3"
      />
      <polyline
        points={points}
        fill="none"
        stroke={isNegativeEnd ? "var(--color-danger)" : "var(--color-success)"}
        strokeWidth={2}
      />
      {data.map((d, i) => (
        <circle
          key={d.month}
          cx={paddingX + i * stepX}
          cy={yFor(d.saldo)}
          r={3}
          fill={isNegativeEnd ? "var(--color-danger)" : "var(--color-success)"}
        />
      ))}
      {data.map((d, i) => (
        <text key={d.month} x={paddingX + i * stepX} y={height - 4} textAnchor="middle">
          {formatMonthShort(d.month)}
        </text>
      ))}
    </svg>
  );
}
