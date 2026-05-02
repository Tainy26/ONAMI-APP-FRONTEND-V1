import { useEffect, useState } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import api from "../../lib/api";
import "./trainer.css";
import "./teams.css";

/* TIPOS */
interface Team {
  id: number;
  name: string;
  description: string | null;
  join_code: string;
}

interface TeamStats {
  id: number;
  athletes_count: number;
  team_avg_7d_fatigue: string | null;
  alerts_high_fatigue: { athlete_id: number; name: string }[];
  adherence: {
    athletes_total: number;
    athletes_with_load_today: number;
  };
  athletes: { id: number; name: string }[];
}

/* COLOR DE FATIGA */
function fatigueColor(value: number | null): string {
  if (!value) return "var(--color-text-muted)";
  if (value >= 8) return "var(--color-error)";
  if (value >= 6) return "var(--color-warning)";
  return "var(--color-success)";
}

/* INICIALES */
function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<Record<number, TeamStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  /* MODAL CREAR */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  /* MODAL EDITAR */
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  /* MODAL ELIMINAR */
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      setIsLoading(true);

      /* Cargamos equipos */
      const teamsRes = await api.get("/teams");
      const teamsList: Team[] = teamsRes.data.teams;
      setTeams(teamsList);

      /* Cargamos stats del dashboard para tener fatiga y adherencia */
      const dashRes = await api.get("/dashboard/trainer");
      const statsMap: Record<number, TeamStats> = {};

      for (const t of dashRes.data.teams) {
        /* Por cada equipo cargamos también sus atletas */
        const athletesRes = await api.get(`/teams/${t.id}/athletes`);
        statsMap[t.id] = {
          ...t,
          athletes: athletesRes.data.athletes,
        };
      }

      setStats(statsMap);
    } catch {
      setError("Error al cargar los equipos");
    } finally {
      setIsLoading(false);
    }
  }

  /* CREAR EQUIPO */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);

    try {
      await api.post("/teams", {
        name: createName,
        description: createDesc || null,
      });
      setCreateName("");
      setCreateDesc("");
      setShowCreateModal(false);
      await loadTeams();
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || "Error al crear el equipo");
    } finally {
      setCreateLoading(false);
    }
  }

  /* EDITAR EQUIPO */
  function openEdit(team: Team) {
    setEditTeam(team);
    setEditName(team.name);
    setEditDesc(team.description ?? "");
    setEditError("");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTeam) return;
    setEditError("");
    setEditLoading(true);

    try {
      await api.put(`/teams/${editTeam.id}`, {
        name: editName,
        description: editDesc || null,
      });
      setEditTeam(null);
      await loadTeams();
    } catch (err: any) {
      setEditError(err?.response?.data?.error || "Error al editar el equipo");
    } finally {
      setEditLoading(false);
    }
  }

  /* ELIMINAR EQUIPO */
  async function handleDelete() {
    if (!deleteTeam) return;
    setDeleteLoading(true);

    try {
      await api.delete(`/teams/${deleteTeam.id}`);
      setDeleteTeam(null);
      await loadTeams();
    } catch {
      setDeleteTeam(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="trainer-layout">
      <Sidebar />

      <main className="trainer-main trainer-teams">

        {/* TOPBAR */}
        <div className="trainer-topbar">
          <div>
            <h1 className="trainer-page-title">Equipos</h1>
            <p className="trainer-page-sub">
              Gestiona tus equipos y atletas
            </p>
          </div>
        </div>

        {/* CARGA */}
        {isLoading && (
          <div className="loading-state">Cargando equipos...</div>
        )}

        {/* ERROR */}
        {error && <p className="form-error">{error}</p>}

        {/* GRID DE EQUIPOS */}
        {!isLoading && (
          <div className="teams-grid">
            {teams.map((team) => {
              const s = stats[team.id];
              const fatigue = s?.team_avg_7d_fatigue
                ? parseFloat(s.team_avg_7d_fatigue)
                : null;
              const color = fatigueColor(fatigue);
              const barWidth = fatigue ? (fatigue / 10) * 100 : 0;
              const athletes = s?.athletes ?? [];
              const visibleAthletes = athletes.slice(0, 3);
              const remaining = athletes.length - 3;

              return (
                <div key={team.id} className="team-card">

                  {/* CABECERA */}
                  <div className="team-card-top">
                    <div className="team-card-avatar">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="team-card-info">
                      <div className="team-card-name">{team.name}</div>
                      <div className="team-card-code">{team.join_code}</div>
                    </div>
                    <div className="team-card-actions">
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(team);
                        }}
                        title="Editar"
                      >
                        <LuPencil size={14} />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTeam(team);
                        }}
                        title="Eliminar"
                      >
                        <LuTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* STATS */}
                  <div className="team-card-stats">
                    <div className="team-stat">
                      <div
                        className="team-stat-value"
                        style={{ color: "var(--color-accent)" }}
                      >
                        {s?.athletes_count ?? 0}
                      </div>
                      <div className="team-stat-label">Atletas</div>
                    </div>
                    <div className="team-stat">
                      <div
                        className="team-stat-value"
                        style={{ color: "var(--color-success)" }}
                      >
                        {s?.adherence.athletes_with_load_today ?? 0}
                      </div>
                      <div className="team-stat-label">Registraron hoy</div>
                    </div>
                    <div className="team-stat">
                      <div
                        className="team-stat-value"
                        style={{
                          color: s?.alerts_high_fatigue.length
                            ? "var(--color-error)"
                            : "var(--color-success)",
                        }}
                      >
                        {s?.alerts_high_fatigue.length ?? 0}
                      </div>
                      <div className="team-stat-label">Alertas</div>
                    </div>
                  </div>

                  {/* FATIGA */}
                  <div className="team-fatigue-section">
                    <div className="team-fatigue-header">
                      <span className="team-fatigue-label">
                        Fatiga media 7d
                      </span>
                      <span
                        className="team-fatigue-value"
                        style={{ color }}
                      >
                        {fatigue ?? "—"}
                      </span>
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

                  {/* ATLETAS */}
                  <div className="team-athletes-section">
                    <div className="team-athletes-avatars">
                      {visibleAthletes.map((a) => (
                        <div
                          key={a.id}
                          className="athlete-avatar-mini"
                          title={a.name}
                        >
                          {initials(a.name)}
                        </div>
                      ))}
                      {remaining > 0 && (
                        <div className="athlete-avatar-mini more">
                          +{remaining}
                        </div>
                      )}
                      {athletes.length === 0 && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Sin atletas
                        </span>
                      )}
                    </div>
                    <button className="team-view-btn">
                      Ver atletas →
                    </button>
                  </div>

                </div>
              );
            })}

            {/* TARJETA NUEVA */}
            <div
              className="team-card-new"
              onClick={() => setShowCreateModal(true)}
            >
              <div className="team-card-new-icon">+</div>
              <div className="team-card-new-label">Crear nuevo equipo</div>
              <div className="team-card-new-sub">
                Añade un equipo y comparte el código con tus atletas
              </div>
            </div>

          </div>
        )}

      </main>

      {/* MODAL CREAR */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Crear nuevo equipo</h2>
            <p className="modal-sub">
              Los atletas podrán unirse con el código generado automáticamente.
            </p>

            <form onSubmit={handleCreate}>
              {createError && (
                <p className="form-error" style={{ marginBottom: "16px" }}>
                  {createError}
                </p>
              )}

              <div className="form-group">
                <label>Nombre del equipo</label>
                <input
                  type="text"
                  placeholder="Ej: Equipo Delta"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: "14px" }}>
                <label>Descripción</label>
                <input
                  type="text"
                  placeholder="Ej: Categoría Sub-23"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? "Creando..." : "Crear equipo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {editTeam && (
        <div
          className="modal-overlay"
          onClick={() => setEditTeam(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Editar equipo</h2>
            <p className="modal-sub">Modifica el nombre o descripción.</p>

            {/* CÓDIGO DE UNIÓN */}
            <div className="join-code-box">
              <div>
                <div className="join-code-label">Código de unión</div>
                <div className="join-code-value">{editTeam.join_code}</div>
              </div>
              <button
                className="join-code-copy"
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(editTeam.join_code)
                }
              >
                Copiar
              </button>
            </div>

            <form onSubmit={handleEdit} style={{ marginTop: "20px" }}>
              {editError && (
                <p className="form-error" style={{ marginBottom: "16px" }}>
                  {editError}
                </p>
              )}

              <div className="form-group">
                <label>Nombre del equipo</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: "14px" }}>
                <label>Descripción (opcional)</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditTeam(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteTeam && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteTeam(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Eliminar equipo</h2>
            <p className="modal-sub">
              ¿Estás seguro de que quieres eliminar{" "}
              <strong style={{ color: "var(--color-text)" }}>
                {deleteTeam.name}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setDeleteTeam(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                style={{
                  background: "var(--color-error)",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
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

    </div>
  );
}