import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./CaseAnalyticsView.css";

const TYPE_COLORS = {
  Civil: "#1f3a5f",
  Criminal: "#7a1f2b",
  Family: "#2f5233",
  Property: "#8a5a12",
  Consumer: "#3f6b6e",
  Labour: "#6b4a2f",
  Uncategorized: "#5c564f",
};

const TYPE_ORDER = ["Civil", "Criminal", "Family", "Property", "Consumer", "Labour", "Uncategorized"];

function pick(obj, keys, fallback = null) {
  if (!obj) return fallback;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return fallback;
}

function normalizeType(t) {
  if (!t) return "Uncategorized";
  const clean = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  return TYPE_ORDER.includes(clean) ? clean : "Uncategorized";
}

// ISO-ish week key: the Monday of the week a date falls in
function weekStart(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function AdvocateAnalytics() {
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState("month"); // "month" | "week"
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(false);

      const advocate = JSON.parse(localStorage.getItem("advocate")) || {};

      if (!advocate.id) {
        setError(true);
        return;
      }

      const res = await API.get(`/cases/all/?advocate_id=${advocate.id}`);
      setCases(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const normalized = useMemo(() => {
    return cases.map((item) => {
      const c = item.case || item;
      const createdRaw = pick(c, ["created_at", "createdAt"]);
      return {
        type: normalizeType(pick(c, ["case_type", "caseType"])),
        status: pick(c, ["status"], "Pending"),
        createdAt: createdRaw ? new Date(createdRaw) : null,
      };
    });
  }, [cases]);

  // ===== Type distribution =====
  const typeDistribution = useMemo(() => {
    const counts = {};
    normalized.forEach((c) => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    const total = normalized.length || 1;
    return TYPE_ORDER.filter((t) => counts[t]).map((t) => ({
      type: t,
      count: counts[t],
      pct: Math.round((counts[t] / total) * 100),
    })).sort((a, b) => b.count - a.count);
  }, [normalized]);

  // ===== Month periods (last 6 months) =====
  const monthPeriods = useMemo(() => {
    const periods = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-IN", { month: "short" }),
        sub: d.getFullYear(),
        match: (date) => date && date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth(),
      });
    }
    return periods;
  }, []);

  // ===== Week periods (last 8 weeks) =====
  const weekPeriods = useMemo(() => {
    const periods = [];
    const currentWeekStart = weekStart(new Date());
    for (let i = 7; i >= 0; i--) {
      const start = new Date(currentWeekStart);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      periods.push({
        key: start.toISOString(),
        label: start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        sub: `w/o`,
        match: (date) => date && date >= start && date <= end,
      });
    }
    return periods;
  }, []);

  const activePeriods = range === "month" ? monthPeriods : weekPeriods;

  const chartData = useMemo(() => {
    return activePeriods.map((period) => {
      const inPeriod = normalized.filter((c) => period.match(c.createdAt));
      const byType = {};
      inPeriod.forEach((c) => {
        byType[c.type] = (byType[c.type] || 0) + 1;
      });
      return {
        ...period,
        total: inPeriod.length,
        byType,
      };
    });
  }, [activePeriods, normalized]);

  const maxTotal = Math.max(1, ...chartData.map((p) => p.total));

  // ===== Stat cards =====
  const busiestPeriod = chartData.reduce(
    (best, p) => (p.total > (best?.total ?? -1) ? p : best),
    null
  );

  const mostCommonType = typeDistribution[0];

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return normalized.filter(
      (c) => c.createdAt && c.createdAt.getFullYear() === now.getFullYear() && c.createdAt.getMonth() === now.getMonth()
    ).length;
  }, [normalized]);

  const thisWeekCount = useMemo(() => {
    const start = weekStart(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return normalized.filter((c) => c.createdAt && c.createdAt >= start && c.createdAt <= end).length;
  }, [normalized]);

  // SVG chart geometry
  const chartHeight = 220;
  const barWidth = 34;
  const gap = range === "month" ? 44 : 26;
  const chartWidth = chartData.length * (barWidth + gap) + gap;

  return (
    <div className="an-page">
      <header className="an-header">
        <button className="an-back-btn" onClick={() => navigate("/advocate/dashboard")}>
          ← Dashboard
        </button>
        <div>
          <span className="an-eyebrow">Practice Insights</span>
          <h1>Case Analytics</h1>
          <p>How your caseload breaks down by type and over time.</p>
        </div>
      </header>

      {loading ? (
        <div className="an-state">
          <span className="an-state-mark" />
          Loading analytics…
        </div>
      ) : error ? (
        <div className="an-state">
          Couldn't load case data.
          <button className="an-retry" onClick={fetchCases}>Retry</button>
        </div>
      ) : normalized.length === 0 ? (
        <div className="an-state">No cases yet — analytics will appear once you file your first case.</div>
      ) : (
        <>
          {/* STAT ROW */}
          <div className="an-stat-row">
            <div className="an-stat-card">
              <span className="an-stat-label">Total Cases</span>
              <span className="an-stat-value">{normalized.length}</span>
            </div>
            <div className="an-stat-card">
              <span className="an-stat-label">This Month</span>
              <span className="an-stat-value">{thisMonthCount}</span>
            </div>
            <div className="an-stat-card">
              <span className="an-stat-label">This Week</span>
              <span className="an-stat-value">{thisWeekCount}</span>
            </div>
            <div className="an-stat-card">
              <span className="an-stat-label">Most Common Type</span>
              <span className="an-stat-value an-stat-value--sm">
                {mostCommonType ? mostCommonType.type : "—"}
              </span>
            </div>
          </div>

          <div className="an-grid">
            {/* TREND CHART */}
            <div className="an-panel">
              <div className="an-panel-head">
                <h2>Cases Filed Over Time</h2>
                <div className="an-toggle">
                  <button
                    className={range === "month" ? "is-active" : ""}
                    onClick={() => setRange("month")}
                  >
                    Monthly
                  </button>
                  <button
                    className={range === "week" ? "is-active" : ""}
                    onClick={() => setRange("week")}
                  >
                    Weekly
                  </button>
                </div>
              </div>

              <div className="an-chart-scroll">
                <svg
                  className="an-chart"
                  viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`}
                  width={chartWidth}
                  height={chartHeight + 50}
                >
                  {/* gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                    <line
                      key={f}
                      x1={0}
                      x2={chartWidth}
                      y1={chartHeight - chartHeight * f}
                      y2={chartHeight - chartHeight * f}
                      className="an-gridline"
                    />
                  ))}

                  {chartData.map((period, i) => {
                    const x = gap + i * (barWidth + gap);
                    let yCursor = chartHeight;

                    return (
                      <g key={period.key}>
                        {TYPE_ORDER.filter((t) => period.byType[t]).map((t) => {
                          const count = period.byType[t];
                          const segHeight = (count / maxTotal) * chartHeight;
                          const y = yCursor - segHeight;
                          yCursor -= segHeight;
                          return (
                            <rect
                              key={t}
                              x={x}
                              y={mounted ? y : chartHeight}
                              width={barWidth}
                              height={mounted ? segHeight : 0}
                              fill={TYPE_COLORS[t]}
                              rx="2"
                              className="an-bar-segment"
                              style={{ transitionDelay: `${i * 40}ms` }}
                            >
                              <title>{`${t}: ${count}`}</title>
                            </rect>
                          );
                        })}

                        {period.total > 0 && (
                          <text
                            x={x + barWidth / 2}
                            y={chartHeight - (period.total / maxTotal) * chartHeight - 8}
                            textAnchor="middle"
                            className="an-bar-total"
                          >
                            {period.total}
                          </text>
                        )}

                        <text x={x + barWidth / 2} y={chartHeight + 20} textAnchor="middle" className="an-bar-label">
                          {period.label}
                        </text>
                        {range === "week" && (
                          <text x={x + barWidth / 2} y={chartHeight + 34} textAnchor="middle" className="an-bar-sublabel">
                            {period.sub}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="an-legend">
                {typeDistribution.map((t) => (
                  <span key={t.type} className="an-legend-item">
                    <span className="an-legend-dot" style={{ background: TYPE_COLORS[t.type] }} />
                    {t.type}
                  </span>
                ))}
              </div>
            </div>

            {/* TYPE DISTRIBUTION */}
            <div className="an-panel">
              <div className="an-panel-head">
                <h2>By Case Type</h2>
                <span className="an-tag">{typeDistribution.length}</span>
              </div>

              <div className="an-type-list">
                {typeDistribution.map((t) => (
                  <div className="an-type-row" key={t.type}>
                    <div className="an-type-row-head">
                      <span>
                        <span className="an-legend-dot" style={{ background: TYPE_COLORS[t.type] }} />
                        {t.type}
                      </span>
                      <span className="an-type-count">
                        {t.count} <span className="an-type-pct">({t.pct}%)</span>
                      </span>
                    </div>
                    <div className="an-type-bar-track">
                      <div
                        className="an-type-bar-fill"
                        style={{
                          width: mounted ? `${t.pct}%` : "0%",
                          background: TYPE_COLORS[t.type],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {busiestPeriod && busiestPeriod.total > 0 && (
                <div className="an-callout">
                  Busiest {range === "month" ? "month" : "week"}:{" "}
                  <strong>
                    {busiestPeriod.label} {range === "month" ? busiestPeriod.sub : ""}
                  </strong>{" "}
                  with {busiestPeriod.total} case{busiestPeriod.total === 1 ? "" : "s"} filed.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}