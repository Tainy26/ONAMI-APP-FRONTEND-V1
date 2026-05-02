import { useEffect, useState } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { LuCheck } from "react-icons/lu";
import api from "../../lib/api";
import "./athlete.css";
import "./dailyload.css";

/* TIPOS */
interface DailyLoad {
  id: number;
  date: string;
  fatigue: number;
  soreness: number;
  sleep_quality: number;
  stress: number;
  mood: number;
  notes: string | null;
}

interface Metric {
  key: keyof Omit<DailyLoad, "id" | "date" | "notes">;
  label: string;
  desc: string;
  color: string;
  type: "negative" | "positive";
}

const METRICS: Metric[] = [
  { key: "fatigue",       label: "Fatiga",      desc: "¿Cómo de cansado/a?",   color: "#E8520A", type: "negative" },
  { key: "soreness",      label: "Dolor musc.", desc: "¿Agujetas o dolor?",     color: "#f59e0b", type: "negative" },
  { key: "sleep_quality", label: "Sueño",       desc: "¿Calidad del sueño?",    color: "#60a5fa", type: "positive" },
  { key: "stress",        label: "Estrés",      desc: "¿Nivel de estrés?",      color: "#ef4444", type: "negative" },
  { key: "mood",          label: "Ánimo",       desc: "¿Estado emocional?",     color: "#a78bfa", type: "positive" },
];

/* HELPERS */
function levelLabel(val: number, type: "negative" | "positive"): string {
  if (type === "positive") {
    if (val <= 2) return "Muy malo";
    if (val <= 4) return "Malo";
    if (val <= 6) return "Regular";
    if (val <= 8) return "Bueno";
    return "Excelente";
  } else {
    if (val <= 2) return "Muy bajo";
    if (val <= 4) return "Bajo";
    if (val <= 6) return "Medio";
    if (val <= 8) return "Alto";
    return "Muy alto";
  }
}

function valColor(val: number, type: "negative" | "positive"): string {
  if (type === "positive") {
    if (val <= 3) return "var(--color-error)";
    if (val <= 5) return "var(--color-warning)";
    if (val <= 7) return "#60a5fa";
    return "var(--color-success)";
  } else {
    if (val <= 3) return "var(--color-success)";
    if (val <= 5) return "var(--color-warning)";
    if (val <= 7) return "var(--color-accent)";
    return "var(--color-error)";
  }
}

function dotColors(val: number, type: "negative" | "positive"): string[] {
  return Array.from({ length: 10 }, (_, i) => {
    if (i >= val) return "var(--color-surface-2)";
    return valColor(val, type);
  });
}

function trendArrow(
  val: number,
  prev: number | null
): { arrow: string; color: string } | null {
  if (prev === null) return null;
  if (val > prev) return { arrow: "↑", color: "var(--color-error)" };
  if (val < prev) return { arrow: "↓", color: "var(--color-success)" };
  return { arrow: "→", color: "var(--color-warning)" };
}

function weekAvg(
  loads: DailyLoad[],
  key: keyof Omit<DailyLoad, "id" | "date" | "notes">
): number {
  if (!loads.length) return 0;
  return parseFloat(
    (loads.reduce((s, d) => s + d[key], 0) / loads.length).toFixed(1)
  );
}

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function shortDay(dateStr: string): { name: string; num: string } {
  const d = new Date(dateStr);
  return {
    name: d.toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 3).toUpperCase(),
    num: d.getDate().toString(),
  };
}

/* SPARKLINE SVG */
function SparklineSVG({
  loads,
  color,
  metricKey,
  selectedIdx,
}: {
  loads: DailyLoad[];
  color: string;
  metricKey: keyof Omit<DailyLoad, "id" | "date" | "notes">;
  selectedIdx: number | "all" | null;
}) {
  const n = loads.length;
  if (n === 0) return <svg />;

  const W = 220;
  const H = 28;
  const maxVal = 10;

  const xs = loads.map((_, i) =>
    n === 1 ? W / 2 : (i / (n - 1)) * W
  );
  const ys = loads.map(
    (d) => H - 4 - ((d[metricKey] as number) / maxVal) * (H - 8)
  );

  const points = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  const fillPath =
    `M${xs[0]},${ys[0]} ` +
    xs.slice(1).map((x, i) => `L${x},${ys[i + 1]}`).join(" ") +
    ` L${xs[n - 1]},${H} L${xs[0]},${H}Z`;

  const gradId = `grad-${metricKey}`;

  const vlineX =
    selectedIdx !== null &&
    selectedIdx !== "all" &&
    typeof selectedIdx === "number"
      ? xs[selectedIdx]
      : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {vlineX !== null && (
        <line
          x1={vlineX} y1={0} x2={vlineX} y2={H}
          stroke={color} strokeWidth="1"
          strokeDasharray="3,2" opacity="0.4"
        />
      )}
      {xs.map((x, i) => {
        const isSelected = selectedIdx === i;
        const isAll = selectedIdx === "all";
        const opacity =
          isAll ? 1 : selectedIdx === null ? 1 : isSelected ? 1 : 0.1;
        const r = isAll
          ? i === n - 1 ? 4.5 : 3.5
          : isSelected ? 5 : 2.5;
        return (
          <circle
            key={i}
            cx={x} cy={ys[i]}
            r={r}
            fill={color}
            stroke="var(--color-surface)"
            strokeWidth="1.5"
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}

/* PÁGINA PRINCIPAL */
export function DailyLoadPage() {

  const [values, setValues] = useState({
    fatigue:       5,
    soreness:      5,
    sleep_quality: 5,
    stress:        5,
    mood:          5,
  });
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [hasRegisteredToday, setHasRegisteredToday] = useState(false);

  const [loads, setLoads] = useState<DailyLoad[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | "all" | null>(null);

  const last7 = loads.slice(-7);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoadingHistory(true);

      const from = new Date();
      from.setDate(from.getDate() - 27);
      const fromStr = from.toISOString().slice(0, 10);

      const res = await api.get(`/daily-load/mine?from=${fromStr}`);
      const all: DailyLoad[] = (res.data.daily_load ?? []).sort(
        (a: DailyLoad, b: DailyLoad) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setLoads(all);

      const todayLoad = all.find((d) => isToday(d.date));
      if (todayLoad) {
        setHasRegisteredToday(true);
        setValues({
          fatigue:       todayLoad.fatigue,
          soreness:      todayLoad.soreness,
          sleep_quality: todayLoad.sleep_quality,
          stress:        todayLoad.stress,
          mood:          todayLoad.mood,
        });
        setNotes(todayLoad.notes ?? "");
      } else {
        setHasRegisteredToday(false);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function changeValue(key: keyof typeof values, delta: number) {
    setValues((prev) => ({
      ...prev,
      [key]: Math.min(10, Math.max(1, prev[key] + delta)),
    }));
  }

  /* ENVIAR — sin recargar, actualiza estado local directamente */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);

      const res = await api.post("/daily-load", {
        date:          todayStr,
        fatigue:       values.fatigue,
        soreness:      values.soreness,
        sleep_quality: values.sleep_quality,
        stress:        values.stress,
        mood:          values.mood,
        notes:         notes || null,
      });

      const saved: DailyLoad = res.data.daily_load;

      /* Actualizar estado local sin recargar todo */
      setLoads((prev) => {
        const idx = prev.findIndex((d) => isToday(d.date));
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      });

      setHasRegisteredToday(true);

    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.error || "Error al guardar el registro"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedLoad =
    typeof selectedDay === "number" ? last7[selectedDay] : null;
  const prevLoad =
    typeof selectedDay === "number" && selectedDay > 0
      ? last7[selectedDay - 1]
      : null;

  const todayStr = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });
  const todayFormatted =
    todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

  return (
    <div className="trainer-layout">
      <Sidebar />

      <main className="trainer-main">

        <div className="trainer-topbar">
          <div>
            <h1 className="trainer-page-title">Mi carga diaria</h1>
            <p className="trainer-page-sub">{todayFormatted}</p>
          </div>
        </div>

        {hasRegisteredToday && (
          <div className="athlete-registered-banner">
            <div className="athlete-registered-dot" />
            <span className="athlete-registered-text">
              <LuCheck size={16} /> Ya registraste tu carga hoy — puedes actualizarla si quieres
            </span>
          </div>
        )}

        <div className="dailyload-layout">

          {/* FORMULARIO */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {submitError && (
              <p className="form-error">{submitError}</p>
            )}

            <div className="metric-cards">
              {METRICS.map((metric) => {
                const val = values[metric.key];
                const color = valColor(val, metric.type);
                const level = levelLabel(val, metric.type);
                const dots = dotColors(val, metric.type);

                return (
                  <div
                    key={metric.key}
                    className={`metric-card ${hasRegisteredToday ? "registered" : ""}`}
                  >
                    <div className="metric-card-top">
                      <div>
                        <div className="metric-card-label">{metric.label}</div>
                        <div className="metric-card-desc">{metric.desc}</div>
                      </div>
                      <div
                        className="metric-card-indicator"
                        style={{
                          background: color,
                          boxShadow: `0 0 5px ${color}80`,
                        }}
                      />
                    </div>

                    <div className="metric-card-controls">
                      <button
                        type="button"
                        className="metric-btn"
                        onClick={() => changeValue(metric.key, -1)}
                        disabled={val <= 1}
                      >
                        −
                      </button>
                      <div className="metric-level" style={{ color }}>
                        {level}
                      </div>
                      <button
                        type="button"
                        className="metric-btn"
                        onClick={() => changeValue(metric.key, 1)}
                        disabled={val >= 10}
                      >
                        +
                      </button>
                    </div>

                    <div className="metric-scale">
                      {dots.map((dotColor, i) => (
                        <div
                          key={i}
                          className="metric-dot"
                          style={{ background: dotColor }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="dailyload-notes">
              <label>Notas (opcional)</label>
              <textarea
                placeholder="¿Algo que quieras comentar a tu entrenador?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{
                padding: "12px",
                fontSize: "13px",
                borderRadius: "var(--radius-md)",
                ...(hasRegisteredToday && {
                  background: "var(--color-success)",
                  boxShadow: "0 3px 10px rgba(34,197,94,0.3)",
                }),
              }}
            >
              {isSubmitting
                ? "Guardando..."
                : hasRegisteredToday
                ? "Actualizar registro"
                : "Guardar registro del día"}
            </button>
          </form>

          {/* HISTORIAL */}
          <div className="history-card">
            <div className="history-card-head">
              <span className="history-card-title">Historial reciente</span>
              <span className="history-card-sub">
                {selectedDay === "all"
                  ? "Últimos 7 días"
                  : selectedLoad
                  ? new Date(selectedLoad.date).toLocaleDateString("es-ES", {
                      day: "numeric", month: "short",
                    })
                  : "Selecciona un día"}
              </span>
            </div>

            {!isLoadingHistory && last7.length > 0 && (
              <div className="day-selector">
                <button
                  className={`day-btn day-btn-all ${selectedDay === "all" ? "active" : ""}`}
                  onClick={() => setSelectedDay("all")}
                >
                  <span className="day-btn-name">Últ. 7d</span>
                  <span className="day-btn-num">↺</span>
                </button>
                {last7.map((load, i) => {
                  const { name, num } = shortDay(load.date);
                  return (
                    <button
                      key={load.id}
                      className={`day-btn ${selectedDay === i ? "active" : ""}`}
                      onClick={() => setSelectedDay(i)}
                    >
                      <span className="day-btn-name">{name}</span>
                      <span className="day-btn-num">{num}</span>
                      <div className="day-btn-dot registered" />
                    </button>
                  );
                })}
              </div>
            )}

            {!isLoadingHistory && last7.length > 0 && (
              <div className="sparks-body">
                {METRICS.map((metric) => (
                  <div key={metric.key} className="spark-row">
                    <span className="spark-label">{metric.label}</span>
                    <div className="spark-wrap">
                      <SparklineSVG
                        loads={last7}
                        color={metric.color}
                        metricKey={metric.key}
                        selectedIdx={selectedDay}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isLoadingHistory && (
              <div className="loading-state">Cargando historial...</div>
            )}

            {!isLoadingHistory && last7.length === 0 && (
              <div className="empty-state">Sin registros todavía</div>
            )}

            {selectedLoad && selectedDay !== "all" && (
              <div className="spark-detail">
                <div className="spark-detail-title">
                  {new Date(selectedLoad.date).toLocaleDateString("es-ES", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
                </div>
                <div className="spark-detail-grid">
                  {METRICS.map((metric) => {
                    const val = selectedLoad[metric.key] as number;
                    const prev = prevLoad
                      ? (prevLoad[metric.key] as number)
                      : null;
                    const color = valColor(val, metric.type);
                    const level = levelLabel(val, metric.type);
                    const t = trendArrow(val, prev);
                    return (
                      <div key={metric.key} className="spark-detail-item">
                        <div
                          className="spark-detail-dot"
                          style={{ background: metric.color }}
                        />
                        <span className="spark-detail-label">
                          {metric.label}
                        </span>
                        <span className="spark-detail-val" style={{ color }}>
                          {val}
                        </span>
                        <span className="spark-detail-level">· {level}</span>
                        {t && (
                          <span
                            className="spark-detail-trend"
                            style={{ color: t.color }}
                          >
                            {t.arrow}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedDay === "all" && last7.length > 0 && (
              <div className="week-summary">
                <div className="week-summary-title">
                  Resumen últimos 7 días
                </div>
                {METRICS.map((metric) => {
                  const avg = weekAvg(last7, metric.key);
                  const color = valColor(Math.round(avg), metric.type);
                  const level = levelLabel(Math.round(avg), metric.type);
                  const t = trendArrow(
                    last7[last7.length - 1][metric.key] as number,
                    last7[0][metric.key] as number
                  );
                  return (
                    <div key={metric.key} className="week-summary-row">
                      <div
                        className="week-summary-dot"
                        style={{ background: metric.color }}
                      />
                      <span className="week-summary-label">
                        {metric.label}
                      </span>
                      <span className="week-summary-val" style={{ color }}>
                        {avg}
                      </span>
                      <span className="week-summary-level">· {level}</span>
                      {t && (
                        <span
                          className="week-summary-trend"
                          style={{ color: t.color }}
                        >
                          {t.arrow}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}