import { useEffect, useState } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { LoadChart } from "../../components/charts/LoadChart";
import { LuEye, LuTrash2, LuUser } from "react-icons/lu";
import api from "../../lib/api";
import "./trainer.css";
import "./athletes.css";

/* TIPOS */
interface Team {
  id: number;
  name: string;
}

interface Athlete {
  id: number;
  name: string;
  email: string;
  team_id: number;
}

interface AthleteStats {
  athlete_id: number;
  last_date: string | null;
  last_fatigue: number | null;
  avg_7d_fatigue: string | null;
  avg_28d_fatigue: string | null;
  alert_high_fatigue: boolean;
  trend: {
    fatigue_trend: "up" | "down" | "flat" | null;
    last7_fatigue_avg: string | null;
    prev7_fatigue_avg: string | null;
  };
}

interface ChartPoint {
  date: string;
  fatigue: number | null;
  sleep_quality: number | null;
  mood: number | null;
  stress: number | null;
}

type FilterType = "all" | "alert" | "no_register";

/* HELPERS */
function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function fatigueColor(value: number | string | null): string {
  const v = value ? Number(value) : null;
  if (!v) return "var(--color-text-muted)";
  if (v >= 8) return "var(--color-error)";
  if (v >= 6) return "var(--color-warning)";
  return "var(--color-success)";
}

function lastRegisterLabel(dateStr: string | null): string {
  if (!dateStr) return "Sin registro";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return `Hace ${diff} días`;
}

function trendLabel(trend: string | null) {
  if (trend === "up")   return { text: "↑ Subiendo", color: "var(--color-error)"   };
  if (trend === "down") return { text: "↓ Bajando",  color: "var(--color-success)" };
  if (trend === "flat") return { text: "→ Estable",  color: "var(--color-warning)" };
  return { text: "Sin datos", color: "var(--color-text-muted)" };
}

export function AthletesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [stats, setStats] = useState<Record<number, AthleteStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  /* FILTROS */
  const [teamFilter, setTeamFilter] = useState<number | "all">("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");

  /* ATLETA SELECCIONADO */
  const [selected, setSelected] = useState<Athlete | null>(null);
  const [selectedStats, setSelectedStats] = useState<AthleteStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [athleteChartData, setAthleteChartData] = useState<ChartPoint[]>([]);

  /* MODAL ELIMINAR */
  const [deleteAthlete, setDeleteAthlete] = useState<Athlete | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);

      const teamsRes = await api.get("/teams");
      const teamsList: Team[] = teamsRes.data.teams;
      setTeams(teamsList);

      const allAthletes: Athlete[] = [];
      const allStats: Record<number, AthleteStats> = {};

      await Promise.all(
        teamsList.map(async (team) => {
          const [athletesRes, statsRes] = await Promise.all([
            api.get(`/teams/${team.id}/athletes`),
            api.get(`/teams/${team.id}/daily-load/stats`),
          ]);

          for (const a of athletesRes.data.athletes) {
            allAthletes.push(a);
          }

          for (const s of statsRes.data.athletes) {
            allStats[s.athlete_id] = {
              athlete_id:         s.athlete_id,
              last_date:          s.last_date,
              last_fatigue:       s.last_fatigue,
              avg_7d_fatigue:     s.avg_7d_fatigue,
              avg_28d_fatigue:    null,
              alert_high_fatigue: s.alert_high_fatigue,
              trend: {
                fatigue_trend:       null,
                last7_fatigue_avg:   null,
                prev7_fatigue_avg:   null,
              },
            };
          }
        })
      );

      setAthletes(allAthletes);
      setStats(allStats);
    } finally {
      setIsLoading(false);
    }
  }

  /* SELECCIONAR ATLETA */
  async function selectAthlete(athlete: Athlete) {
    setSelected(athlete);
    setStatsLoading(true);
    setAthleteChartData([]);

    try {
      /* Stats detalladas del atleta */
      const statsRes = await api.get(
        `/athletes/${athlete.id}/daily-load/stats`
      );
      setSelectedStats({
        athlete_id:         athlete.id,
        last_date:          statsRes.data.last?.date ?? null,
        last_fatigue:       statsRes.data.last?.fatigue ?? null,
        avg_7d_fatigue:     statsRes.data.avg_7d_fatigue,
        avg_28d_fatigue:    statsRes.data.avg_28d_fatigue,
        alert_high_fatigue: false,
        trend:              statsRes.data.trend,
      });

      /* Datos para la gráfica — últimos 7 días del equipo filtrados por atleta */
      const from = new Date();
      from.setDate(from.getDate() - 6);
      const fromStr = from.toISOString().slice(0, 10);

      const loadRes = await api.get(
        `/teams/${athlete.team_id}/daily-load?from=${fromStr}`
      );

      const chartPoints: ChartPoint[] = (loadRes.data.rows ?? [])
        .filter((r: any) => r.athlete_id === athlete.id && r.date)
        .sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        .map((r: any) => ({
          date:          r.date,
          fatigue:       r.fatigue       ?? null,
          sleep_quality: r.sleep_quality ?? null,
          mood:          r.mood          ?? null,
          stress:        r.stress        ?? null,
        }));

      setAthleteChartData(chartPoints);
    } finally {
      setStatsLoading(false);
    }
  }

  /* ELIMINAR ATLETA */
  async function handleDelete() {
    if (!deleteAthlete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/athletes/${deleteAthlete.id}`);
      if (selected?.id === deleteAthlete.id) {
        setSelected(null);
        setSelectedStats(null);
        setAthleteChartData([]);
      }
      setDeleteAthlete(null);
      await loadData();
    } finally {
      setDeleteLoading(false);
    }
  }

  /* NOMBRE DEL EQUIPO */
  function teamName(id: number) {
    return teams.find((t) => t.id === id)?.name ?? "—";
  }

  /* FILTRADO */
  const filtered = athletes
    .filter((a) => teamFilter === "all" || a.team_id === teamFilter)
    .filter((a) => {
      const s = stats[a.id];
      if (typeFilter === "alert") return s?.alert_high_fatigue;
      if (typeFilter === "no_register") {
        if (!s?.last_date) return true;
        const diff = Math.floor(
          (new Date().getTime() - new Date(s.last_date).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return diff > 0;
      }
      return true;
    });

  return (
    <div className="trainer-layout">
      <Sidebar />

      <main className="trainer-main">

        {/* TOPBAR */}
        <div className="trainer-topbar">
          <div>
            <h1 className="trainer-page-title">Atletas</h1>
            <p className="trainer-page-sub">
              Monitoriza el estado de tus atletas
            </p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="athletes-filters">
          <select
            className="athletes-filter-select"
            value={teamFilter}
            onChange={(e) =>
              setTeamFilter(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
          >
            <option value="all">Todos los equipos</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <div className="athletes-filter-sep" />

          {(["all", "alert", "no_register"] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`athletes-filter-pill ${typeFilter === f ? "active" : ""}`}
              onClick={() => setTypeFilter(f)}
            >
              {f === "all"
                ? "Todos"
                : f === "alert"
                ? "Con alerta"
                : "Sin registro hoy"}
            </button>
          ))}
        </div>

        {/* CARGA */}
        {isLoading && (
          <div className="loading-state">Cargando atletas...</div>
        )}

        {/* LAYOUT */}
        {!isLoading && (
          <div className="athletes-layout">

            {/* TABLA */}
            <div className="athletes-table-wrap">
              <div className="athletes-table">

                <div className="athletes-table-head">
                  <div className="athletes-th">Atleta</div>
                  <div className="athletes-th">Equipo</div>
                  <div className="athletes-th">Último registro</div>
                  <div className="athletes-th">Fatiga 7d</div>
                  <div className="athletes-th">Acciones</div>
                </div>

                {filtered.length === 0 && (
                  <div className="empty-state">
                    No hay atletas para mostrar
                  </div>
                )}

                {filtered.map((athlete) => {
                  const s = stats[athlete.id];
                  const fatigue = s?.avg_7d_fatigue
                    ? Number(s.avg_7d_fatigue)
                    : null;
                  const color = fatigueColor(fatigue);
                  const isSelected = selected?.id === athlete.id;

                  return (
                    <div
                      key={athlete.id}
                      className={`athlete-row ${isSelected ? "selected" : ""}`}
                      onClick={() => selectAthlete(athlete)}
                    >
                      <div className="athlete-identity">
                        <div className="athlete-avatar">
                          {initials(athlete.name)}
                        </div>
                        <div>
                          <div className="athlete-name">
                            {s?.alert_high_fatigue && (
                              <span className="alert-dot" />
                            )}
                            {athlete.name}
                          </div>
                          <div className="athlete-email">{athlete.email}</div>
                        </div>
                      </div>

                      <div className="athlete-td muted">
                        {teamName(athlete.team_id)}
                      </div>

                      <div className="athlete-td">
                        {lastRegisterLabel(s?.last_date ?? null)}
                      </div>

                      <div className="athlete-fatigue" style={{ color }}>
                        {fatigue ?? "—"}
                      </div>

                      <div className="athlete-actions">
                        <button
                          className="icon-btn"
                          title="Ver detalle"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAthlete(athlete);
                          }}
                        >
                          <LuEye size={14} />
                        </button>
                        <button
                          className="icon-btn danger"
                          title="Eliminar atleta"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteAthlete(athlete);
                          }}
                        >
                          <LuTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PANEL DETALLE */}
            <div className="athlete-detail-panel">
              {!selected ? (
                <div className="detail-empty">
                  <div className="detail-empty-icon"><LuUser size={18} /></div>
                  <p>Selecciona un atleta para ver su detalle</p>
                </div>
              ) : statsLoading ? (
                <div className="detail-empty">
                  <p>Cargando datos...</p>
                </div>
              ) : (
                <>
                  {/* CABECERA */}
                  <div className="detail-header">
                    <div className="detail-big-avatar">
                      {initials(selected.name)}
                    </div>
                    <div>
                      <div className="detail-athlete-name">
                        {selected.name}
                      </div>
                      <div className="detail-athlete-meta">
                        {teamName(selected.team_id)} · {selected.email}
                      </div>
                    </div>
                  </div>

                  {/* STATS */}
                  <div className="detail-stats">
                    <div className="detail-stat-box">
                      <div className="detail-stat-label">Fatiga 7d</div>
                      <div
                        className="detail-stat-value"
                        style={{
                          color: fatigueColor(
                            selectedStats?.avg_7d_fatigue ?? null
                          ),
                        }}
                      >
                        {selectedStats?.avg_7d_fatigue
                          ? Number(selectedStats.avg_7d_fatigue).toFixed(1)
                          : "—"}
                      </div>
                    </div>
                    <div className="detail-stat-box">
                      <div className="detail-stat-label">Fatiga 28d</div>
                      <div
                        className="detail-stat-value"
                        style={{
                          color: fatigueColor(
                            selectedStats?.avg_28d_fatigue ?? null
                          ),
                        }}
                      >
                        {selectedStats?.avg_28d_fatigue
                          ? Number(selectedStats.avg_28d_fatigue).toFixed(1)
                          : "—"}
                      </div>
                    </div>
                    <div className="detail-stat-box">
                      <div className="detail-stat-label">Último</div>
                      <div
                        className="detail-stat-value"
                        style={{
                          fontSize: "13px",
                          color: "var(--color-text)",
                        }}
                      >
                        {lastRegisterLabel(selectedStats?.last_date ?? null)}
                      </div>
                    </div>
                  </div>

                  {/* TENDENCIA */}
                  {selectedStats?.trend && (
                    <div className="detail-trend">
                      <span className="detail-trend-label">
                        Tendencia de fatiga
                      </span>
                      <span
                        className="detail-trend-value"
                        style={{
                          color: trendLabel(
                            selectedStats.trend.fatigue_trend
                          ).color,
                        }}
                      >
                        {trendLabel(selectedStats.trend.fatigue_trend).text}
                      </span>
                    </div>
                  )}

                  {/* ÚLTIMO REGISTRO */}
                  {selectedStats?.last_fatigue != null && (
                    <div className="detail-stat-box">
                      <div className="detail-stat-label">
                        Último registro de fatiga
                      </div>
                      <div
                        className="detail-stat-value"
                        style={{
                          color: fatigueColor(selectedStats.last_fatigue),
                        }}
                      >
                        {selectedStats.last_fatigue}
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--color-text-muted)",
                            fontWeight: 400,
                            marginLeft: "4px",
                          }}
                        >
                          / 10
                        </span>
                      </div>
                    </div>
                  )}

                  {/* GRÁFICA FATIGA */}
                  {athleteChartData.length > 0 && (
                    <div className="section-card">
                      <div className="section-card-head">
                        <span className="section-card-title">
                          Evolución de fatiga
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Últimos 7 días
                        </span>
                      </div>
                      <div style={{ padding: "12px 16px", height: "180px" }}>
                        <LoadChart
                          data={athleteChartData}
                          fatigueOnly={true}
                        />
                      </div>
                    </div>
                  )}

                  {athleteChartData.length === 0 &&
                    !statsLoading && selected && (
                      <div className="detail-stat-box">
                        <div className="detail-stat-label">
                          Evolución de fatiga
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-text-muted)",
                            paddingTop: "6px",
                          }}
                        >
                          Sin datos de los últimos 7 días
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>

          </div>
        )}

      </main>

      {/* MODAL ELIMINAR */}
      {deleteAthlete && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteAthlete(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Eliminar atleta</h2>
            <p className="modal-sub">
              Esta acción eliminará al atleta y todos sus datos de carga
              diaria. No se puede deshacer.
            </p>

            <div className="delete-modal-athlete">
              <div
                className="athlete-avatar"
                style={{ width: "36px", height: "36px" }}
              >
                {initials(deleteAthlete.name)}
              </div>
              <div>
                <div className="delete-modal-athlete-name">
                  {deleteAthlete.name}
                </div>
                <div className="delete-modal-athlete-meta">
                  {deleteAthlete.email} · {teamName(deleteAthlete.team_id)}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setDeleteAthlete(null)}
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
                {deleteLoading ? "Eliminando..." : "Confirmar eliminación"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}