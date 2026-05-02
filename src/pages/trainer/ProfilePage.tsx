import { useEffect, useState } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { LuCheck } from "react-icons/lu";
import api from "../../lib/api";
import "./trainer.css";
import "./profile.css";

/* TIPOS */
interface TrainerProfile {
  phone: string | null;
  organization: string | null;
  bio: string | null;
  updated_at: string | null;
}

interface Stats {
  total_teams: number;
  total_athletes: number;
  total_sessions: number;
}

/* HELPER — iniciales */
function initials(name: string | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

/* HELPER — fecha de miembro */
function memberSince(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

export function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<TrainerProfile>({
    phone: "", organization: "", bio: "",  updated_at: null,
  });
  const [stats, setStats] = useState<Stats>({
    total_teams: 0, total_athletes: 0, total_sessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /* ESTADO DEL FORMULARIO */
  const [formData, setFormData] = useState({
    phone: "", organization: "", bio: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);

      const [profileRes, dashRes, sessionsRes] = await Promise.all([
        api.get("/profile/me"),
        api.get("/dashboard/trainer"),
        api.get("/sessions/mine"),
      ]);

      const p: TrainerProfile = profileRes.data.trainer_profile ?? {
        phone: null, organization: null, bio: null, updated_at: null,
      };

      setProfile(p);
      setFormData({
        phone:        p.phone        ?? "",
        organization: p.organization ?? "",
        bio:          p.bio          ?? "",
      });

      setStats({
        total_teams:    dashRes.data.summary.total_teams,
        total_athletes: dashRes.data.summary.total_athletes,
        total_sessions: sessionsRes.data.sessions?.length ?? 0,
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
        phone:        formData.phone        || null,
        organization: formData.organization || null,
        bio:          formData.bio          || null,
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
      phone:        profile.phone        ?? "",
      organization: profile.organization ?? "",
      bio:          profile.bio          ?? "",
    });
    setError("");
    setSuccess(false);
  }

  return (
    <div className="trainer-layout">
      <Sidebar />

      <main className="trainer-main trainer-profile">

        {/* TOPBAR */}
        <div className="trainer-topbar">
          <div>
            <h1 className="trainer-page-title">Mi perfil</h1>
            <p className="trainer-page-sub">
              Gestiona tu información personal
            </p>
          </div>
        </div>

        {/* CARGA */}
        {isLoading && (
          <div className="loading-state">Cargando perfil...</div>
        )}

        {/* CONTENIDO */}
        {!isLoading && user && (
          <div className="profile-layout">

            {/* IDENTIDAD */}
            <div className="profile-identity-card">
              <div className="profile-big-avatar">
                {initials(user.name)}
              </div>
              <div className="profile-name">{user.name}</div>
              <div className="profile-email">{user.email}</div>
              <span className="profile-role-badge">Entrenador</span>

              <div className="profile-divider" />

              <div className="profile-stats-row">
                <div className="profile-stat">
                  <div className="profile-stat-value">{stats.total_teams}</div>
                  <div className="profile-stat-label">Equipos</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{stats.total_athletes}</div>
                  <div className="profile-stat-label">Atletas</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{stats.total_sessions}</div>
                  <div className="profile-stat-label">Sesiones</div>
                </div>
              </div>

              {profile.updated_at && (
                <div className="profile-joined">
                  Actualizado en {memberSince(profile.updated_at)}
                </div>
              )}
            </div>

            {/* FORMULARIO */}
            <div className="profile-form-card">
              <div className="profile-form-title">
                Información del perfil
              </div>

              <form onSubmit={handleSave}>

                {error && (
                  <p className="form-error">{error}</p>
                )}
                {success && (
                  <p className="profile-success">
                    <LuCheck size={16} /> Perfil actualizado correctamente
                  </p>
                )}

                <div className="profile-form-row">
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
                    <label>Organización</label>
                    <input
                      type="text"
                      placeholder="Club o academia"
                      value={formData.organization}
                      onChange={(e) =>
                        setFormData({ ...formData, organization: e.target.value })
                      }
                    />
                  </div>
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

                <div className="profile-form-actions">
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