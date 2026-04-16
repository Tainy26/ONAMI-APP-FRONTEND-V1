import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/layout/Sidebar";
import api from "../../lib/api";
import "./trainer.css";

/* TIPOS — basados en lo que devuelve tu backend */
interface TeamSummary {
  id: number;
  name: string;
  athletes_count: number;
  team_avg_7d_fatigue: string | null;
  alerts_high_fatigue: { athlete_id: number; name: string }[];
  adherence: {
    athletes_total: number;
    athletes_with_load_today: number;
  };
}

interface DashboardData {
  summary: {
    total_teams: number;
    total_athletes: number;
    total_alerts_high_fatigue: number;
  };
  teams: TeamSummary[];
}

interface Session {
  id: number;
  date: string;
  type: string | null;
  duration: number | null;
  team_id: number;
}

/* COLORES DE FATIGA */
function fatigueColor(value: number | null): string {
  if (!value) return "var(--color-text-muted)";
  if (value >= 8) return "var(--color-error)";
  if (value >= 6) return "var(--color-warning)";
  return "var(--color-success)";
}

/* FORMATO DE FECHA */
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return {
    day: date.getDate(),
    month: date.toLocaleString("es-ES", { month: "short" }).toUpperCase(),
  };
}

export function TrainerDashboardPage() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        /* Llamamos a los dos endpoints en paralelo */
        const [dashRes, sessRes] = await Promise.all([
          api.get("/dashboard/trainer"),
          api.get("/sessions/mine"),
        ]);

        setDashboard(dashRes.data);
        setSessions(sessRes.data.sessions ?? []);
      } catch {
        setError("Error al cargar los datos del dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  /* Próximas sesiones — solo las futuras, máximo 3 */
  const upcomingSessions = sessions
    .filter((s) => new Date(s.date) >= new Date())
    .slice(0, 3);

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* Primera letra en mayúscula */
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);

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
          <div className="trainer-topbar-actions">
            <button
              className="btn-secondary"
              onClick={() => navigate("/trainer/teams")}
            >
              + Equipo
            </button>
            <button
              className="btn-primary"
              onClick={() => navigate("/trainer/sessions")}
            >
              + Sesión
            </button>
          </div>
        </div>

        {/* ESTADO DE CARGA */}
        {isLoading && (
          <div className="loading-state">Cargando datos...</div>
        )}

        {/* ERROR */}
        {error && <p className="form-error">{error}</p>}

        {/* CONTENIDO */}
        {!isLoading && dashboard && (
          <>
            {/* STAT CARDS */}
            <div className="stat-cards">
              <div className="stat-card" style={{ borderTopColor: "var(--color-accent)" }}>
                <div className="stat-card-label">Equipos</div>
                <div className="stat-card-value" style={{ color: "var(--color-accent)" }}>
                  {dashboard.summary.total_teams}
                </div>
                <div className="stat-card-sub">activos</div>
              </div>

              <div className="stat-card" style={{ borderTopColor: "var(--color-success)" }}>
                <div className="stat-card-label">Atletas</div>
                <div className="stat-card-value" style={{ color: "var(--color-success)" }}>
                  {dashboard.summary.total_athletes}
                </div>
                <div className="stat-card-sub">en total</div>
              </div>

              <div className="stat-card" style={{ borderTopColor: "var(--color-warning)" }}>
                <div className="stat-card-label">Alertas fatiga</div>
                <div className="stat-card-value" style={{ color: "var(--color-warning)" }}>
                  {dashboard.summary.total_alerts_high_fatigue}
                </div>
                <div className="stat-card-sub">últimos 3 días</div>
              </div>
            </div>

            {/* BANNER ALERTA — solo si hay alertas */}
            {dashboard.summary.total_alerts_high_fatigue > 0 && (
              <div className="alert-banner">
                <div className="alert-banner-dot" />
                <div>
                  <div className="alert-banner-title">
                    {dashboard.summary.total_alerts_high_fatigue} atletas con fatiga alta
                  </div>
                  <div className="alert-banner-sub">
                    Han registrado fatiga ≥8 en los últimos 3 días
                  </div>
                </div>
              </div>
            )}

            {/* GRID — EQUIPOS Y SESIONES */}
            <div className="dashboard-grid">

              {/* EQUIPOS */}
              <div className="section-card">
                <div className="section-card-head">
                  <span className="section-card-title">Mis equipos</span>
                  <button
                    className="section-card-link"
                    onClick={() => navigate("/trainer/teams")}
                  >
                    Ver todos →
                  </button>
                </div>

                {dashboard.teams.length === 0 ? (
                  <div className="empty-state">
                    No tienes equipos todavía
                  </div>
                ) : (
                  dashboard.teams.map((team) => {
                    const fatigue = team.team_avg_7d_fatigue
                      ? parseFloat(team.team_avg_7d_fatigue)
                      : null;
                    const color = fatigueColor(fatigue);
                    const barWidth = fatigue ? (fatigue / 10) * 100 : 0;

                    return (
                      <div
                        key={team.id}
                        className="team-row"
                        onClick={() => navigate(`/trainer/teams`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="team-avatar">
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="team-info">
                          <div className="team-name">{team.name}</div>
                          <div className="team-meta">
                            {team.athletes_count} atletas ·{" "}
                            {team.adherence.athletes_with_load_today}/
                            {team.adherence.athletes_total} registraron hoy
                          </div>
                          <div className="team-fatigue-bar-wrap">
                            <div
                              className="team-fatigue-bar"
                              style={{
                                width: `${barWidth}%`,
                                background: color,
                              }}
                            />
                          </div>
                        </div>
                        <div
                          className="team-fatigue-value"
                          style={{ color }}
                        >
                          {fatigue ?? "—"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* PRÓXIMAS SESIONES */}
              <div className="section-card">
                <div className="section-card-head">
                  <span className="section-card-title">Próximas sesiones</span>
                  <button
                    className="section-card-link"
                    onClick={() => navigate("/trainer/sessions")}
                  >
                    Ver todas →
                  </button>
                </div>

                {upcomingSessions.length === 0 ? (
                  <div className="empty-state">
                    No hay sesiones próximas
                  </div>
                ) : (
                  upcomingSessions.map((session) => {
                    const { day, month } = formatDate(session.date);
                    return (
                      <div key={session.id} className="session-row">
                        <div className="session-date-box">
                          <div className="session-date-day">{day}</div>
                          <div className="session-date-month">{month}</div>
                        </div>
                        <div className="session-info">
                          <div className="session-name">
                            {session.type ?? "Sesión de entrenamiento"}
                          </div>
                          <div className="session-meta">
                            {session.duration
                              ? `${session.duration} min`
                              : "Sin duración"}
                          </div>
                        </div>
                        {session.type && (
                          <span
                            className="session-badge"
                            style={{
                              background: "rgba(232, 82, 10, 0.12)",
                              color: "var(--color-accent)",
                            }}
                          >
                            {session.type}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </>
        )}

      </main>
    </div>
  );
}