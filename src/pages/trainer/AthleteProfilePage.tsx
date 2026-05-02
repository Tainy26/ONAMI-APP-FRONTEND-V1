import { useEffect, useState } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { LuCheck } from "react-icons/lu";
import api from "../../lib/api";
import "./athletes.css";
import "./athlete-profile.css";

/* TIPOS */
interface AthleteProfile {
  phone: string | null;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  position: string | null;
  bio: string | null;
}

interface AthleteStats {
  total_loads: number;
  total_sessions: number;
  avg_7d_fatigue: string | null;
}

/* HELPER — iniciales */
function initials(name: string | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export function AthleteProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<AthleteProfile>({
    phone: null,
    birth_date: null,
    height_cm: null,
    weight_kg: null,
    position: null,
    bio: null,
  });

  const [stats, setStats] = useState<AthleteStats>({
    total_loads: 0,
    total_sessions: 0,
    avg_7d_fatigue: null,
  });

  const [teamName, setTeamName] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /* FORM */
  const [formData, setFormData] = useState({
    phone: "",
    birth_date: "",
    height_cm: "",
    weight_kg: "",
    position: "",
    bio: "",
  });

  useEffect(() => {
    loadData();
  }, []);

async function loadData() {
  try {
    setIsLoading(true);

    const [profileRes, sessRes, loadRes] = await Promise.all([
      api.get("/profile/me"),
      api.get("/sessions/mine"),
      api.get("/daily-load/mine"),
    ]);

    /* PERFIL */
    const p: AthleteProfile = profileRes.data.athlete_profile ?? {
      phone: null, birth_date: null, height_cm: null,
      weight_kg: null, position: null, bio: null,
    };

    setProfile(p);
    setFormData({
      phone:      p.phone      ?? "",
      birth_date: p.birth_date ? p.birth_date.slice(0, 10) : "",
      height_cm:  p.height_cm  ? p.height_cm.toString()    : "",
      weight_kg:  p.weight_kg  ? p.weight_kg.toString()    : "",
      position:   p.position   ?? "",
      bio:        p.bio        ?? "",
    });

    /* EQUIPO — cargar por team_id */
    const teamId = profileRes.data.user?.team_id;
    if (teamId) {
      try {
        const teamRes = await api.get(`/teams/mine`);
        setTeamName(teamRes.data.team?.name ?? null);
        setJoinCode(teamRes.data.team?.join_code ?? null);
      } catch {
        setTeamName(null);
      }
    }

    /* STATS */
    const loads = loadRes.data.daily_load ?? [];
    const sessions = sessRes.data.sessions ?? [];

    /* Fatiga media 7d — calculada en frontend */
    const from7 = new Date();
    from7.setDate(from7.getDate() - 6);
    const last7loads = loads.filter(
      (d: any) => new Date(d.date) >= from7
    );
    const avg7 =
      last7loads.length > 0
        ? (
            last7loads.reduce((s: number, d: any) => s + d.fatigue, 0) /
            last7loads.length
          ).toFixed(1)
        : null;

    setStats({
      total_loads:    loads.length,
      total_sessions: sessions.length,
      avg_7d_fatigue: avg7,
    });

  } finally {
    setIsLoading(false);
  }
}

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSaving(true);
    try {
      await api.put("/profile/me", {
        phone:      formData.phone      || null,
        birth_date: formData.birth_date || null,
        height_cm:  formData.height_cm  ? Number(formData.height_cm)  : null,
        weight_kg:  formData.weight_kg  ? Number(formData.weight_kg)  : null,
        position:   formData.position   || null,
        bio:        formData.bio        || null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al guardar el perfil");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setFormData({
      phone:      profile.phone      ?? "",
      birth_date: profile.birth_date ? profile.birth_date.slice(0, 10) : "",
      height_cm:  profile.height_cm  ? profile.height_cm.toString()    : "",
      weight_kg:  profile.weight_kg  ? profile.weight_kg.toString()    : "",
      position:   profile.position   ?? "",
      bio:        profile.bio        ?? "",
    });
    setError("");
    setSuccess(false);
  }

  /* IMC */
  const imc =
    formData.height_cm && formData.weight_kg
      ? (
          Number(formData.weight_kg) /
          Math.pow(Number(formData.height_cm) / 100, 2)
        ).toFixed(1)
      : null;

  return (
    <div className="trainer-layout">
      <Sidebar />

      <main className="trainer-main">

        {/* TOPBAR */}
        <div className="trainer-topbar">
          <div>
            <h1 className="trainer-page-title">Mi perfil</h1>
            <p className="trainer-page-sub">
              Gestiona tu información personal
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="loading-state">Cargando perfil...</div>
        )}

        {!isLoading && user && (
          <div className="athlete-profile-layout">

            {/* IDENTIDAD */}
            <div className="athlete-identity-card">
              <div className="athlete-big-avatar">
                {initials(user.name)}
              </div>
              <div className="athlete-profile-name">{user.name}</div>
              <div className="athlete-profile-email">{user.email}</div>
              <span className="athlete-role-badge">Atleta</span>

              <div className="athlete-profile-divider" />

              {/* EQUIPO */}
              {teamName ? (
                <div className="athlete-team-badge">
                  <div className="athlete-team-label">Equipo</div>
                  <div className="athlete-team-name">{teamName}</div>
                </div>
              ) : (
                <div className="athlete-team-badge">
                  <div className="athlete-team-label">Equipo</div>
                  <div
                    className="athlete-team-name"
                    style={{ color: "var(--color-text-muted)", fontSize: "12px" }}
                  >
                    Sin equipo
                  </div>
                </div>
              )}

              {/* STATS */}
              <div className="athlete-profile-stats">
                <div className="athlete-profile-stat">
                  <div className="athlete-profile-stat-value">
                    {stats.total_loads}
                  </div>
                  <div className="athlete-profile-stat-label">Registros</div>
                </div>
                <div className="athlete-profile-stat">
                  <div className="athlete-profile-stat-value">
                    {stats.total_sessions}
                  </div>
                  <div className="athlete-profile-stat-label">Sesiones</div>
                </div>
                <div className="athlete-profile-stat">
                  <div
                    className="athlete-profile-stat-value"
                    style={{
                      color: stats.avg_7d_fatigue
                        ? Number(stats.avg_7d_fatigue) >= 8
                          ? "var(--color-error)"
                          : Number(stats.avg_7d_fatigue) >= 6
                          ? "var(--color-warning)"
                          : "var(--color-success)"
                        : "var(--color-accent)",
                    }}
                  >
                    {stats.avg_7d_fatigue
                      ? Number(stats.avg_7d_fatigue).toFixed(1)
                      : "—"}
                  </div>
                  <div className="athlete-profile-stat-label">Fatiga 7d</div>
                </div>
              </div>

              {/* IMC */}
              {imc && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    textAlign: "center",
                  }}
                >
                  IMC: <strong style={{ color: "var(--color-text)" }}>
                    {imc}
                  </strong>
                </div>
              )}
            </div>

            {/* FORMULARIO */}
            <div className="athlete-profile-form-card">
              <div className="athlete-profile-form-title">
                Información del perfil
              </div>

              <form onSubmit={handleSave}>
                {error && (
                  <p className="form-error">{error}</p>
                )}
                {success && (
                  <p className="athlete-profile-success">
                    <LuCheck size={16} /> Perfil actualizado correctamente
                  </p>
                )}

                <div className="athlete-profile-form-row">
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      placeholder="+34 600 000 000"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Posición</label>
                    <input
                      type="text"
                      placeholder="Ej: Delantero"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="athlete-profile-form-row">
                  <div className="form-group">
                    <label>Altura (cm)</label>
                    <input
                      type="number"
                      placeholder="175"
                      value={formData.height_cm}
                      onChange={(e) =>
                        setFormData({ ...formData, height_cm: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Peso (kg)</label>
                    <input
                      type="number"
                      placeholder="70"
                      value={formData.weight_kg}
                      onChange={(e) =>
                        setFormData({ ...formData, weight_kg: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="athlete-profile-form-row">
                  <div className="form-group">
                    <label>Fecha de nacimiento</label>
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) =>
                        setFormData({ ...formData, birth_date: e.target.value })
                      }
                    />
                  </div>
                  {joinCode && (
                    <div className="form-group">
                      <label>Código de equipo</label>
                      <input
                        type="text"
                        value={joinCode}
                        readOnly
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Biografía</label>
                  <textarea
                    placeholder="Cuéntanos algo sobre ti..."
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                  />
                </div>

                <div className="athlete-profile-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}