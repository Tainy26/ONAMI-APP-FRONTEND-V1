import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/layout/Sidebar";
import { LuEye, LuCheck, LuPlus } from "react-icons/lu";
import api from "../../lib/api";
import "./athlete.css";
import "./athlete-sessions.css";

/* TIPOS */
interface Session {
  id: number;
  team_id: number;
  date: string;
  type: string | null;
  duration: number | null;
  notes: string | null;
}

interface Exercise {
  id: number;
  name: string;
  sets: number | null;
  reps: number | null;
  duration_minutes: number | null;
  intensity: number | null;
  order: number;
}

interface DailyLoadDate {
  date: string;
}

type Filter = "all" | "upcoming" | "past";

/* HELPERS */
function formatDateBox(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleString("es-ES", { month: "short" }).toUpperCase(),
  };
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function isToday(dateStr: string) {
  return isSameDay(dateStr, new Date().toISOString());
}

function isTomorrow(dateStr: string) {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return isSameDay(dateStr, t.toISOString());
}

function isPast(dateStr: string) {
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function isTodayOrPast(dateStr: string) {
  return new Date(dateStr) <= new Date();
}

function sepLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(dateStr))
    return `Hoy — ${d.getDate()} ${d.toLocaleString("es-ES", { month: "short" })}`;
  if (isTomorrow(dateStr))
    return `Mañana — ${d.getDate()} ${d.toLocaleString("es-ES", { month: "short" })}`;
  if (isPast(dateStr)) return "Pasadas";
  return d.toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* BADGE */
function SessionBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const map: Record<string, { bg: string; color: string }> = {
    fuerza:       { bg: "rgba(232,82,10,0.15)",    color: "var(--color-accent)"   },
    cardio:       { bg: "rgba(34,197,94,0.12)",     color: "var(--color-success)"  },
    técnica:      { bg: "rgba(96,165,250,0.12)",    color: "#60a5fa"               },
    tecnica:      { bg: "rgba(96,165,250,0.12)",    color: "#60a5fa"               },
    recuperación: { bg: "rgba(245,158,11,0.12)",    color: "var(--color-warning)"  },
    recuperacion: { bg: "rgba(245,158,11,0.12)",    color: "var(--color-warning)"  },
  };
  const style = map[type.toLowerCase()] ?? {
    bg: "rgba(232,82,10,0.12)",
    color: "var(--color-accent)",
  };
  return (
    <span
      className="athlete-session-badge"
      style={{ background: style.bg, color: style.color }}
    >
      {type}
    </span>
  );
}

export function AthleteSessionsPage() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [exercises, setExercises] = useState<Record<number, Exercise[]>>({});
  const [registeredDates, setRegisteredDates] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [sessRes, loadRes] = await Promise.all([
        api.get("/sessions/mine"),
        api.get("/daily-load/mine"),
      ]);
      setSessions(sessRes.data.sessions ?? []);
      const dates = (loadRes.data.daily_load ?? []).map(
        (d: DailyLoadDate) => d.date
      );
      setRegisteredDates(dates);
    } finally {
      setIsLoading(false);
    }
  }

  /* EXPANDIR */
  async function toggleExpand(sessionId: number) {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);
    if (!exercises[sessionId]) {
      const res = await api.get(`/sessions/${sessionId}/exercises`);
      setExercises((prev) => ({
        ...prev,
        [sessionId]: res.data.exercises ?? [],
      }));
    }
  }

  /* COMPROBAR SI HAY REGISTRO EN UNA FECHA */
  function hasLoadOnDate(dateStr: string): boolean {
    return registeredDates.some((d) => isSameDay(d, dateStr));
  }

  /* FILTRADO */
  const now = new Date();
  const filtered = sessions
    .filter((s) => {
      const d = new Date(s.date);
      if (filter === "upcoming") return d >= now;
      if (filter === "past") return d < now;
      return true;
    })
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

  /* PRÓXIMA SESIÓN */
  const nextSession = sessions
    .filter((s) => new Date(s.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  /* AGRUPAR POR FECHA */
  const grouped: { dateStr: string; sessions: Session[] }[] = [];
  let lastSepLabel = "";
  for (const s of filtered) {
    const label = sepLabel(s.date);
    if (label !== lastSepLabel) {
      grouped.push({ dateStr: s.date, sessions: [s] });
      lastSepLabel = label;
    } else {
      grouped[grouped.length - 1].sessions.push(s);
    }
  }

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="trainer-layout">
      <Sidebar />

      <main className="trainer-main">

        {/* TOPBAR */}
        <div className="trainer-topbar">
          <div>
            <h1 className="trainer-page-title">Mis sesiones</h1>
            <p className="trainer-page-sub">{todayFormatted}</p>
          </div>
        </div>

        {isLoading && <div className="loading-state">Cargando sesiones...</div>}

        {!isLoading && (
          <>
            {/* PRÓXIMA SESIÓN */}
            {nextSession && (
              <div className="next-session-card">
                <div className="next-session-date-box">
                  <div className="next-session-day">
                    {formatDateBox(nextSession.date).day}
                  </div>
                  <div className="next-session-month">
                    {formatDateBox(nextSession.date).month}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="next-session-label">Próxima sesión</div>
                  <div className="next-session-name">
                    {nextSession.type ?? "Sesión de entrenamiento"}
                  </div>
                  <div className="next-session-meta">
                    {isToday(nextSession.date)
                      ? "Hoy"
                      : isTomorrow(nextSession.date)
                      ? "Mañana"
                      : new Date(nextSession.date).toLocaleDateString("es-ES", {
                          weekday: "long", day: "numeric", month: "long",
                        })}
                    {nextSession.duration ? ` · ${nextSession.duration} min` : ""}
                  </div>
                </div>
                <SessionBadge type={nextSession.type} />
              </div>
            )}

            {/* FILTROS */}
            <div className="athlete-sessions-filters">
              {(["all", "upcoming", "past"] as Filter[]).map((f) => (
                <button
                  key={f}
                  className={`athlete-sessions-pill ${filter === f ? "active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "Todas" : f === "upcoming" ? "Próximas" : "Pasadas"}
                </button>
              ))}
            </div>

            {/* LISTA */}
            {filtered.length === 0 ? (
              <div className="athlete-sessions-empty">
                No hay sesiones para mostrar
              </div>
            ) : (
              <div className="athlete-sessions-list">
                {grouped.map(({ dateStr, sessions: daySessions }) => (
                  <div key={dateStr}>

                    {/* SEPARADOR */}
                    <div className="athlete-sessions-sep">
                      <div className="athlete-sessions-sep-line" />
                      <span className="athlete-sessions-sep-text">
                        {sepLabel(dateStr)}
                      </span>
                      <div className="athlete-sessions-sep-line" />
                    </div>

                    {daySessions.map((session) => {
                      const { day, month } = formatDateBox(session.date);
                      const isExpanded = expandedId === session.id;
                      const sessionExercises = exercises[session.id] ?? [];
                      const canRegister = isTodayOrPast(session.date);
                      const isRegistered = hasLoadOnDate(session.date);

                      return (
                        <div key={session.id}>

                          {/* FILA */}
                          <div
                            className={`athlete-session-row ${isExpanded ? "expanded" : ""}`}
                            onClick={() => toggleExpand(session.id)}
                          >
                            <div className="athlete-session-date">
                              <div className="athlete-session-day">{day}</div>
                              <div className="athlete-session-month">{month}</div>
                            </div>

                            <div className="athlete-session-info">
                              <div className="athlete-session-name">
                                {session.type ?? "Sesión de entrenamiento"}
                              </div>
                              <div className="athlete-session-meta">
                                {session.duration
                                  ? `${session.duration} min`
                                  : "Sin duración"}
                                {sessionExercises.length > 0
                                  ? ` · ${sessionExercises.length} ejercicios`
                                  : ""}
                              </div>
                            </div>

                            <SessionBadge type={session.type} />

                            <div className="athlete-session-actions">
                              {/* OJO */}
                              <button
                                className={`icon-btn ${isExpanded ? "" : ""}`}
                                style={
                                  isExpanded
                                    ? {
                                        background: "rgba(232,82,10,0.15)",
                                        borderColor: "var(--color-accent)",
                                      }
                                    : {}
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(session.id);
                                }}
                              >
                                <LuEye size={14} />
                              </button>

                              {/* ICONO + o ✓ — solo cuando NO expandida */}
                              {canRegister && !isExpanded && (
                                isRegistered ? (
                                  <div
                                    className="registered-icon-btn"
                                    title="Carga registrada"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate("/athlete/daily-load");
                                    }}
                                  >
                                    <LuCheck size={14} />
                                  </div>
                                ) : (
                                  <div
                                    className="register-icon-btn"
                                    title="Registrar carga"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate("/athlete/daily-load");
                                    }}
                                  >
                                    <LuPlus size={14} />
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* EJERCICIOS EXPANDIDOS */}
                          {isExpanded && (
                            <div className="athlete-exercises-wrap">
                              <div className="athlete-exercises-head">
                                <span className="athlete-exercises-title">
                                  Ejercicios de la sesión
                                </span>
                              </div>

                              {sessionExercises.length === 0 ? (
                                <div style={{
                                  padding: "16px 14px",
                                  fontSize: "12px",
                                  color: "var(--color-text-muted)",
                                  textAlign: "center",
                                }}>
                                  Sin ejercicios añadidos
                                </div>
                              ) : (
                                sessionExercises.map((ex, idx) => (
                                  <div key={ex.id} className="athlete-exercise-row">
                                    <div className="athlete-exercise-order">
                                      {idx + 1}
                                    </div>
                                    <div className="athlete-exercise-name">
                                      {ex.name}
                                    </div>
                                    <div className="athlete-exercise-meta">
                                      {[
                                        ex.sets ? `${ex.sets} series` : null,
                                        ex.reps ? `${ex.reps} reps` : null,
                                        ex.duration_minutes
                                          ? `${ex.duration_minutes} min`
                                          : null,
                                        ex.intensity
                                          ? `Int. ${ex.intensity}`
                                          : null,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </div>
                                  </div>
                                ))
                              )}

                              {/* BANNER REGISTRAR */}
                              {canRegister && (
                                <div
                                  className={`athlete-register-banner ${isRegistered ? "done" : ""}`}
                                >
                                  <div>
                                    <div className="arb-title">
                                      {isRegistered
                                        ? <><LuCheck size={14} /> Carga registrada ese día</>
                                        : "¿Cómo te fue en esta sesión?"}
                                    </div>
                                    <div className="arb-sub">
                                      {isRegistered
                                        ? "Puedes actualizarla si quieres"
                                        : "Registra tu carga del día"}
                                    </div>
                                  </div>
                                  <button
                                    className="arb-btn"
                                    onClick={() => navigate("/athlete/daily-load")}
                                  >
                                    {isRegistered
                                      ? "Ver / Editar →"
                                      : "Registrar carga →"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}