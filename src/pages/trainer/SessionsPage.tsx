import { useEffect, useState } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import api from "../../lib/api";
import "./trainer.css";
import "./sessions.css";

/* TIPOS */
interface Team {
  id: number;
  name: string;
}

interface Session {
  id: number;
  team_id: number;
  date: string;
  type: string | null;
  duration: number | null;
  notes: string | null;
  created_at: string;
}

interface Exercise {
  id: number;
  session_id: number;
  name: string;
  description: string | null;
  sets: number | null;
  reps: number | null;
  duration_minutes: number | null;
  intensity: number | null;
  order: number;
}

type Filter = "all" | "upcoming" | "past";

/* BADGE DE TIPO */
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
      className="session-badge"
      style={{ background: style.bg, color: style.color }}
    >
      {type}
    </span>
  );
}

/* HELPERS DE FECHA */
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
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(dateStr, tomorrow.toISOString());
}

function sepLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(dateStr))
    return `Hoy — ${d.getDate()} ${d.toLocaleString("es-ES", { month: "short" })}`;
  if (isTomorrow(dateStr))
    return `Mañana — ${d.getDate()} ${d.toLocaleString("es-ES", { month: "short" })}`;
  return d.toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* COMPONENTE PRINCIPAL */
export function SessionsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [exercises, setExercises] = useState<Record<number, Exercise[]>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* FILTROS */
  const [teamFilter, setTeamFilter] = useState<number | "all">("all");
  const [dateFilter, setDateFilter] = useState<Filter>("all");

  /* MODAL CREAR SESIÓN */
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    team_id: "", date: "", type: "", duration: "", notes: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  /* MODAL EDITAR SESIÓN */
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [editSessionData, setEditSessionData] = useState({
    date: "", type: "", duration: "", notes: "",
  });
  const [editSessionLoading, setEditSessionLoading] = useState(false);
  const [editSessionError, setEditSessionError] = useState("");

  /* MODAL ELIMINAR SESIÓN */
  const [deleteSession, setDeleteSession] = useState<Session | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* MODAL AÑADIR EJERCICIO */
  const [addExerciseSession, setAddExerciseSession] = useState<number | null>(null);
  const [exerciseData, setExerciseData] = useState({
    name: "", sets: "", reps: "", duration_minutes: "", intensity: "",
  });
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [exerciseError, setExerciseError] = useState("");

  /* MODAL EDITAR EJERCICIO */
  const [editExercise, setEditExercise] = useState<{ ex: Exercise; sessionId: number } | null>(null);
  const [editExerciseData, setEditExerciseData] = useState({
    name: "", sets: "", reps: "", duration_minutes: "", intensity: "",
  });
  const [editExerciseLoading, setEditExerciseLoading] = useState(false);
  const [editExerciseError, setEditExerciseError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [teamsRes, sessRes] = await Promise.all([
        api.get("/teams"),
        api.get("/sessions/mine"),
      ]);
      setTeams(teamsRes.data.teams);
      setSessions(sessRes.data.sessions ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  /* EXPANDIR SESIÓN */
  async function toggleExpand(sessionId: number) {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);
    if (!exercises[sessionId]) {
      const res = await api.get(`/sessions/${sessionId}/exercises`);
      setExercises((prev) => ({ ...prev, [sessionId]: res.data.exercises }));
    }
  }

  /* CREAR SESIÓN */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);
    try {
      await api.post(`/sessions/team/${createData.team_id}`, {
        date: createData.date,
        type: createData.type || null,
        duration: createData.duration ? Number(createData.duration) : null,
        notes: createData.notes || null,
      });
      setShowCreate(false);
      setCreateData({ team_id: "", date: "", type: "", duration: "", notes: "" });
      await loadData();
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || "Error al crear la sesión");
    } finally {
      setCreateLoading(false);
    }
  }

  /* EDITAR SESIÓN */
  function openEditSession(session: Session) {
    setEditSession(session);
    setEditSessionData({
      date: session.date.slice(0, 10),
      type: session.type ?? "",
      duration: session.duration?.toString() ?? "",
      notes: session.notes ?? "",
    });
    setEditSessionError("");
  }

  async function handleEditSession(e: React.FormEvent) {
    e.preventDefault();
    if (!editSession) return;
    setEditSessionError("");
    setEditSessionLoading(true);
    try {
      await api.put(`/sessions/${editSession.id}`, {
        date: editSessionData.date,
        type: editSessionData.type || null,
        duration: editSessionData.duration ? Number(editSessionData.duration) : null,
        notes: editSessionData.notes || null,
      });
      setEditSession(null);
      await loadData();
    } catch (err: any) {
      setEditSessionError(err?.response?.data?.error || "Error al editar la sesión");
    } finally {
      setEditSessionLoading(false);
    }
  }

  /* ELIMINAR SESIÓN */
  async function handleDelete() {
    if (!deleteSession) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/sessions/${deleteSession.id}`);
      setDeleteSession(null);
      await loadData();
    } finally {
      setDeleteLoading(false);
    }
  }

  /* AÑADIR EJERCICIO */
  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!addExerciseSession) return;
    setExerciseError("");
    setExerciseLoading(true);
    try {
      const res = await api.post(`/sessions/${addExerciseSession}/exercises`, {
        name: exerciseData.name,
        sets: exerciseData.sets ? Number(exerciseData.sets) : null,
        reps: exerciseData.reps ? Number(exerciseData.reps) : null,
        duration_minutes: exerciseData.duration_minutes
          ? Number(exerciseData.duration_minutes)
          : null,
        intensity: exerciseData.intensity ? Number(exerciseData.intensity) : null,
      });
      setExercises((prev) => ({
        ...prev,
        [addExerciseSession]: [...(prev[addExerciseSession] ?? []), res.data.exercise],
      }));
      setAddExerciseSession(null);
      setExerciseData({ name: "", sets: "", reps: "", duration_minutes: "", intensity: "" });
    } catch (err: any) {
      setExerciseError(err?.response?.data?.error || "Error al añadir el ejercicio");
    } finally {
      setExerciseLoading(false);
    }
  }

  /* EDITAR EJERCICIO */
  function openEditExercise(ex: Exercise, sessionId: number) {
    setEditExercise({ ex, sessionId });
    setEditExerciseData({
      name: ex.name,
      sets: ex.sets?.toString() ?? "",
      reps: ex.reps?.toString() ?? "",
      duration_minutes: ex.duration_minutes?.toString() ?? "",
      intensity: ex.intensity?.toString() ?? "",
    });
    setEditExerciseError("");
  }

  async function handleEditExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!editExercise) return;
    setEditExerciseError("");
    setEditExerciseLoading(true);
    try {
      const res = await api.put(
        `/sessions/${editExercise.sessionId}/exercises/${editExercise.ex.id}`,
        {
          name: editExerciseData.name,
          sets: editExerciseData.sets ? Number(editExerciseData.sets) : null,
          reps: editExerciseData.reps ? Number(editExerciseData.reps) : null,
          duration_minutes: editExerciseData.duration_minutes
            ? Number(editExerciseData.duration_minutes)
            : null,
          intensity: editExerciseData.intensity
            ? Number(editExerciseData.intensity)
            : null,
        }
      );
      setExercises((prev) => ({
        ...prev,
        [editExercise.sessionId]: prev[editExercise.sessionId].map((ex) =>
          ex.id === editExercise.ex.id ? res.data.exercise : ex
        ),
      }));
      setEditExercise(null);
    } catch (err: any) {
      setEditExerciseError(err?.response?.data?.error || "Error al editar el ejercicio");
    } finally {
      setEditExerciseLoading(false);
    }
  }

  /* FILTRADO Y AGRUPADO */
  const now = new Date();
  const filtered = sessions
    .filter((s) => teamFilter === "all" || s.team_id === teamFilter)
    .filter((s) => {
      const d = new Date(s.date);
      if (dateFilter === "upcoming") return d >= now;
      if (dateFilter === "past") return d < now;
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const grouped: { dateStr: string; sessions: Session[] }[] = [];
  for (const s of filtered) {
    const last = grouped[grouped.length - 1];
    if (last && isSameDay(last.dateStr, s.date)) {
      last.sessions.push(s);
    } else {
      grouped.push({ dateStr: s.date, sessions: [s] });
    }
  }

  function teamName(id: number) {
    return teams.find((t) => t.id === id)?.name ?? "Equipo";
  }

  return (
    <div className="trainer-layout">
      <Sidebar />

      <main className="trainer-main">

        {/* TOPBAR */}
        <div className="trainer-topbar">
          <div>
            <h1 className="trainer-page-title">Sesiones</h1>
            <p className="trainer-page-sub">Entrenamientos de tus equipos</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + Nueva sesión
          </button>
        </div>

        {/* FILTROS */}
        <div className="sessions-filters">
          <select
            className="sessions-filter-select"
            value={teamFilter}
            onChange={(e) =>
              setTeamFilter(e.target.value === "all" ? "all" : Number(e.target.value))
            }
          >
            <option value="all">Todos los equipos</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <div className="sessions-filter-sep" />

          {(["all", "upcoming", "past"] as Filter[]).map((f) => (
            <button
              key={f}
              className={`sessions-filter-pill ${dateFilter === f ? "active" : ""}`}
              onClick={() => setDateFilter(f)}
            >
              {f === "all" ? "Todas" : f === "upcoming" ? "Próximas" : "Pasadas"}
            </button>
          ))}
        </div>

        {/* CARGA */}
        {isLoading && <div className="loading-state">Cargando sesiones...</div>}

        {/* LISTA */}
        {!isLoading && (
          <div className="sessions-list">
            {grouped.length === 0 && (
              <div className="empty-state">No hay sesiones para mostrar</div>
            )}

            {grouped.map(({ dateStr, sessions: daySessions }) => (
              <div key={dateStr}>

                {/* SEPARADOR */}
                <div className="sessions-date-sep">
                  <div className="sessions-date-sep-line" />
                  <span className="sessions-date-sep-text">{sepLabel(dateStr)}</span>
                  <div className="sessions-date-sep-line" />
                </div>

                {daySessions.map((session) => {
                  const { day, month } = formatDateBox(session.date);
                  const isExpanded = expandedId === session.id;
                  const sessionExercises = exercises[session.id] ?? [];

                  return (
                    <div key={session.id}>

                      {/* FILA */}
                      <div className={`session-row ${isExpanded ? "expanded" : ""}`}>
                        <div className="session-date-box">
                          <div className="session-date-day">{day}</div>
                          <div className="session-date-month">{month}</div>
                        </div>

                        <div className="session-info">
                          <div className="session-name">
                            {session.type ?? "Sesión de entrenamiento"}
                          </div>
                          <div className="session-meta">
                            {teamName(session.team_id)}
                            {session.duration ? ` · ${session.duration} min` : ""}
                            {isExpanded && sessionExercises.length > 0
                              ? ` · ${sessionExercises.length} ejercicios`
                              : ""}
                          </div>
                        </div>

                        <SessionBadge type={session.type} />

                        <div className="session-actions">
                          <button
                            className="icon-btn"
                            title="Ver ejercicios"
                            onClick={() => toggleExpand(session.id)}
                            style={
                              isExpanded
                                ? {
                                    background: "rgba(232,82,10,0.15)",
                                    borderColor: "var(--color-accent)",
                                  }
                                : {}
                            }
                          >
                            👁
                          </button>
                          <button
                            className="icon-btn"
                            title="Editar sesión"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditSession(session);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="icon-btn danger"
                            title="Eliminar"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteSession(session);
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      {/* EJERCICIOS */}
                      {isExpanded && (
                        <div className="exercises-wrap">
                          <div className="exercises-head">
                            <span className="exercises-title">
                              Ejercicios de la sesión
                            </span>
                            <button
                              className="exercises-add-btn"
                              onClick={() => setAddExerciseSession(session.id)}
                            >
                              + Añadir ejercicio
                            </button>
                          </div>

                          {sessionExercises.length === 0 ? (
                            <div className="exercises-empty">
                              No hay ejercicios — añade el primero
                            </div>
                          ) : (
                            sessionExercises.map((ex, idx) => (
                              <div key={ex.id} className="exercise-row">
                                <div className="exercise-order">{idx + 1}</div>
                                <div className="exercise-name">{ex.name}</div>
                                <div className="exercise-meta">
                                  {[
                                    ex.sets ? `${ex.sets} series` : null,
                                    ex.reps ? `${ex.reps} reps` : null,
                                    ex.duration_minutes
                                      ? `${ex.duration_minutes} min`
                                      : null,
                                    ex.intensity ? `Int. ${ex.intensity}` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </div>
                                <div className="exercise-actions">
                                  <button
                                    className="icon-btn"
                                    onClick={() => openEditExercise(ex, session.id)}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="icon-btn danger"
                                    onClick={async () => {
                                      await api.delete(
                                        `/sessions/${session.id}/exercises/${ex.id}`
                                      );
                                      setExercises((prev) => ({
                                        ...prev,
                                        [session.id]: prev[session.id].filter(
                                          (e) => e.id !== ex.id
                                        ),
                                      }));
                                    }}
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>
                            ))
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

      </main>

      {/* MODAL CREAR SESIÓN */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Nueva sesión</h2>
            <p className="modal-sub">
              Crea una sesión de entrenamiento para un equipo.
            </p>
            <form onSubmit={handleCreate}>
              {createError && (
                <p className="form-error" style={{ marginBottom: "14px" }}>
                  {createError}
                </p>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Equipo</label>
                  <select
                    value={createData.team_id}
                    onChange={(e) =>
                      setCreateData({ ...createData, team_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Selecciona...</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={createData.date}
                    onChange={(e) =>
                      setCreateData({ ...createData, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <input
                    type="text"
                    placeholder="Ej: Fuerza"
                    value={createData.type}
                    onChange={(e) =>
                      setCreateData({ ...createData, type: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Duración (min)</label>
                  <input
                    type="number"
                    placeholder="90"
                    value={createData.duration}
                    onChange={(e) =>
                      setCreateData({ ...createData, duration: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "12px" }}>
                <label>Notas (opcional)</label>
                <input
                  type="text"
                  placeholder="Observaciones del entrenamiento..."
                  value={createData.notes}
                  onChange={(e) =>
                    setCreateData({ ...createData, notes: e.target.value })
                  }
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={createLoading}>
                  {createLoading ? "Creando..." : "Crear sesión"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR SESIÓN */}
      {editSession && (
        <div className="modal-overlay" onClick={() => setEditSession(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Editar sesión</h2>
            <p className="modal-sub">Modifica los datos de la sesión.</p>
            <form onSubmit={handleEditSession}>
              {editSessionError && (
                <p className="form-error" style={{ marginBottom: "14px" }}>
                  {editSessionError}
                </p>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={editSessionData.date}
                    onChange={(e) =>
                      setEditSessionData({ ...editSessionData, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <input
                    type="text"
                    placeholder="Ej: Fuerza"
                    value={editSessionData.type}
                    onChange={(e) =>
                      setEditSessionData({ ...editSessionData, type: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Duración (min)</label>
                  <input
                    type="number"
                    placeholder="90"
                    value={editSessionData.duration}
                    onChange={(e) =>
                      setEditSessionData({ ...editSessionData, duration: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "12px" }}>
                <label>Notas (opcional)</label>
                <input
                  type="text"
                  placeholder="Observaciones..."
                  value={editSessionData.notes}
                  onChange={(e) =>
                    setEditSessionData({ ...editSessionData, notes: e.target.value })
                  }
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditSession(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={editSessionLoading}
                >
                  {editSessionLoading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR SESIÓN */}
      {deleteSession && (
        <div className="modal-overlay" onClick={() => setDeleteSession(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Eliminar sesión</h2>
            <p className="modal-sub">
              ¿Estás seguro? Se eliminarán también todos sus ejercicios.
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setDeleteSession(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                style={{
                  background: "var(--color-error)",
                  boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
                }}
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AÑADIR EJERCICIO */}
      {addExerciseSession && (
        <div className="modal-overlay" onClick={() => setAddExerciseSession(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Añadir ejercicio</h2>
            <p className="modal-sub">
              Añade un ejercicio a esta sesión de entrenamiento.
            </p>
            <form onSubmit={handleAddExercise}>
              {exerciseError && (
                <p className="form-error" style={{ marginBottom: "14px" }}>
                  {exerciseError}
                </p>
              )}
              <div className="form-group">
                <label>Nombre del ejercicio</label>
                <input
                  type="text"
                  placeholder="Ej: Sentadilla con barra"
                  value={exerciseData.name}
                  onChange={(e) =>
                    setExerciseData({ ...exerciseData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "12px",
                }}
              >
                <div className="form-group">
                  <label>Series</label>
                  <input
                    type="number"
                    placeholder="4"
                    value={exerciseData.sets}
                    onChange={(e) =>
                      setExerciseData({ ...exerciseData, sets: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Repeticiones</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={exerciseData.reps}
                    onChange={(e) =>
                      setExerciseData({ ...exerciseData, reps: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Duración (min)</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={exerciseData.duration_minutes}
                    onChange={(e) =>
                      setExerciseData({ ...exerciseData, duration_minutes: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Intensidad (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="7"
                    value={exerciseData.intensity}
                    onChange={(e) =>
                      setExerciseData({ ...exerciseData, intensity: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAddExerciseSession(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={exerciseLoading}
                >
                  {exerciseLoading ? "Añadiendo..." : "Añadir ejercicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR EJERCICIO */}
      {editExercise && (
        <div className="modal-overlay" onClick={() => setEditExercise(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Editar ejercicio</h2>
            <p className="modal-sub">Modifica los datos del ejercicio.</p>
            <form onSubmit={handleEditExercise}>
              {editExerciseError && (
                <p className="form-error" style={{ marginBottom: "14px" }}>
                  {editExerciseError}
                </p>
              )}
              <div className="form-group">
                <label>Nombre del ejercicio</label>
                <input
                  type="text"
                  value={editExerciseData.name}
                  onChange={(e) =>
                    setEditExerciseData({ ...editExerciseData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "12px",
                }}
              >
                <div className="form-group">
                  <label>Series</label>
                  <input
                    type="number"
                    placeholder="4"
                    value={editExerciseData.sets}
                    onChange={(e) =>
                      setEditExerciseData({ ...editExerciseData, sets: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Repeticiones</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={editExerciseData.reps}
                    onChange={(e) =>
                      setEditExerciseData({ ...editExerciseData, reps: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Duración (min)</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={editExerciseData.duration_minutes}
                    onChange={(e) =>
                      setEditExerciseData({
                        ...editExerciseData,
                        duration_minutes: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Intensidad (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="7"
                    value={editExerciseData.intensity}
                    onChange={(e) =>
                      setEditExerciseData({
                        ...editExerciseData,
                        intensity: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditExercise(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={editExerciseLoading}
                >
                  {editExerciseLoading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}