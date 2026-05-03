import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Sidebar } from "../../components/layout/Sidebar";
import { LoadChart } from "../../components/charts/LoadChart";
import { LuTriangleAlert, LuCheck } from "react-icons/lu";
import api from "../../lib/api";
import "./athlete.css";

/* TIPOS */
interface DashboardData {
  athlete: {
    id: number;
    name: string;
    team_id: number | null;
    team_name: string | null;
  };
  load_summary: {
    last_load: {
      date: string;
      fatigue: number;
      soreness: number;
      sleep_quality: number;
      stress: number;
      mood: number;
    } | null;
    avg_7d_fatigue: string | null;
    avg_3d_fatigue: string | null;
    personal_alert: boolean;
    has_registered_today: boolean;
  };
  sessions: {
    next_session: {
      id: number;
      date: string;
      type: string | null;
      duration: number | null;
    } | null;
    last_session: {
      id: number;
      date: string;
      type: string | null;
    } | null;
  };
}

interface DailyLoad {
  date: string;
  fatigue: number | null;
  sleep_quality: number | null;
  mood: number | null;
  stress: number | null;
}

/* HELPERS */
function fatigueColor(value: number | string | null): string {
  const v = value ? Number(value) : null;
  if (!v) return "var(--color-text-muted)";
  if (v >= 8) return "var(--color-error)";
  if (v >= 6) return "var(--color-warning)";
  return "var(--color-success)";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleString("es-ES", { month: "short" }).toUpperCase(),
  };
}

export function AthleteDashboardPage() {
  useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [chartData, setChartData] = useState<DailyLoad[]>([]);
  const [chartRange, setChartRange] = useState<"7" | "28">("7");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRange]);

  async function loadData() {
    try {
      setIsLoading(true);
      const res = await api.get("/dashboard/athlete");
      setDashboard(res.data);
    } finally {
      setIsLoading(false);
    }
    await loadChartData();
  }

  async function loadChartData() {
    const from = new Date();
    from.setDate(from.getDate() - Number(chartRange) + 1);
    const fromStr = from.toISOString().slice(0, 10);

    const res = await api.get(`/daily-load/mine?from=${fromStr}`);
    const loads: DailyLoad[] = res.data.daily_load ?? [];

    /* Ordenamos de más antiguo a más reciente */
    setChartData(loads.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
  }

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);

  const lastLoad = dashboard?.load_summary.last_load;
  const nextSession = dashboard?.sessions.next_session;

  return (
    <div className="trainer-layout">
      <Sidebar />

      <main className="trainer-main">

        {/* TOPBAR */}
        <div className="trainer-topbar">
          <div>
            <h1 className="trainer-page-title">Dashboard</h1>
            <p className="trainer-page-sub">{todayFormatted}</p>
          </div>
        </div>

        {isLoading && <div className="loading-state">Cargando...</div>}

        {!isLoading && dashboard && (
          <>
            {/* ALERTA PERSONAL */}
            {dashboard.load_summary.personal_alert && (
              <div className="alert-banner" style={{
                background: "rgba(239,68,68,0.08)",
                borderColor: "rgba(239,68,68,0.25)",
              }}>
                <div className="alert-banner-dot" style={{
                  background: "var(--color-error)",
                  boxShadow: "0 0 8px rgba(239,68,68,0.6)",
                }} />
                <div>
                  <div className="alert-banner-title" style={{ color: "var(--color-error)" }}>
                    <LuTriangleAlert size={16} /> Fatiga elevada detectada
                  </div>
                  <div className="alert-banner-sub">
                    Has registrado fatiga alta los últimos días. Habla con tu entrenador.
                  </div>
                </div>
              </div>
            )}

            {/* BANNER REGISTRO */}
            {!dashboard.load_summary.has_registered_today ? (
              <div className="athlete-register-banner">
                <div>
                  <div className="athlete-register-title">
                    ¿Cómo te encuentras hoy?
                  </div>
                  <div className="athlete-register-sub">
                    Aún no has registrado tu carga diaria
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/athlete/daily-load")}
                >
                  Registrar ahora
                </button>
              </div>
            ) : (
              <div className="athlete-registered-banner">
                <div className="athlete-registered-dot" />
                <span className="athlete-registered-text">
                  <LuCheck size={16} /> Carga diaria registrada hoy
                </span>
              </div>
            )}

            {/* STAT CARDS */}
            <div className="stat-cards">
              <div className="stat-card" style={{
                borderTopColor: fatigueColor(dashboard.load_summary.avg_7d_fatigue),
              }}>
                <div className="stat-card-label">Fatiga 7d</div>
                <div className="stat-card-value" style={{
                  color: fatigueColor(dashboard.load_summary.avg_7d_fatigue),
                }}>
                  {dashboard.load_summary.avg_7d_fatigue
                    ? Number(dashboard.load_summary.avg_7d_fatigue).toFixed(1)
                    : "—"}
                </div>
                <div className="stat-card-sub">media semanal</div>
              </div>

              <div className="stat-card" style={{ borderTopColor: "#60a5fa" }}>
                <div className="stat-card-label">Sueño último</div>
                <div className="stat-card-value" style={{ color: "#60a5fa" }}>
                  {lastLoad?.sleep_quality ?? "—"}
                </div>
                <div className="stat-card-sub">último registro</div>
              </div>

              <div className="stat-card" style={{ borderTopColor: "#a78bfa" }}>
                <div className="stat-card-label">Ánimo último</div>
                <div className="stat-card-value" style={{ color: "#a78bfa" }}>
                  {lastLoad?.mood ?? "—"}
                </div>
                <div className="stat-card-sub">último registro</div>
              </div>
            </div>

            {/* GRÁFICA */}
            <div className="section-card">
              <div className="section-card-head">
                <span className="section-card-title">Evolución de carga</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {(["7", "28"] as const).map((r) => (
                    <button
                      key={r}
                      className={`sessions-filter-pill ${chartRange === r ? "active" : ""}`}
                      onClick={() => setChartRange(r)}
                    >
                      {r} días
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding: "16px 20px 8px", height: "240px" }}>
                {chartData.length === 0 ? (
                  <div className="empty-state">
                    No hay datos para mostrar
                  </div>
                ) : (
                  <LoadChart data={chartData} />
                )}
              </div>
            </div>

            {/* GRID — PRÓXIMA SESIÓN + ÚLTIMO REGISTRO */}
            <div className="dashboard-grid">

              {/* PRÓXIMA SESIÓN */}
              <div className="section-card">
                <div className="section-card-head">
                  <span className="section-card-title">Próxima sesión</span>
                  <button
                    className="section-card-link"
                    onClick={() => navigate("/athlete/sessions")}
                  >
                    Ver todas →
                  </button>
                </div>
                {!nextSession ? (
                  <div className="empty-state">No hay sesiones próximas</div>
                ) : (
                  <div className="team-row">
                    <div className="session-date-box">
                      <div className="session-date-day">
                        {formatDate(nextSession.date).day}
                      </div>
                      <div className="session-date-month">
                        {formatDate(nextSession.date).month}
                      </div>
                    </div>
                    <div className="team-info">
                      <div className="team-name">
                        {nextSession.type ?? "Sesión de entrenamiento"}
                      </div>
                      <div className="team-meta">
                        {nextSession.duration
                          ? `${nextSession.duration} min`
                          : "Sin duración"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ÚLTIMO REGISTRO */}
              <div className="section-card">
                <div className="section-card-head">
                  <span className="section-card-title">Último registro</span>
                  <button
                    className="section-card-link"
                    onClick={() => navigate("/athlete/daily-load")}
                  >
                    Ver historial →
                  </button>
                </div>
                {!lastLoad ? (
                  <div className="empty-state">Sin registros todavía</div>
                ) : (
                  <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { label: "Fatiga",  value: lastLoad.fatigue,       color: fatigueColor(lastLoad.fatigue)  },
                      { label: "Sueño",   value: lastLoad.sleep_quality, color: "#60a5fa"                       },
                      { label: "Estrés",  value: lastLoad.stress,        color: fatigueColor(lastLoad.stress)   },
                      { label: "Ánimo",   value: lastLoad.mood,          color: "#a78bfa"                       },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)", width: "50px", flexShrink: 0 }}>
                          {label}
                        </span>
                        <div style={{ flex: 1, height: "5px", background: "var(--color-surface-2)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${(value / 10) * 100}%`, height: "100%", background: color, borderRadius: "3px" }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color, width: "20px", textAlign: "right" }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </>
        )}

      </main>
    </div>
  );
}