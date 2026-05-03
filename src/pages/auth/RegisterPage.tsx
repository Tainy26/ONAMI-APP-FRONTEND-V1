import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { LuSun, LuMoon, LuUser, LuClipboardList } from "react-icons/lu";
import api from "../../lib/api";
import onamiLogoLight from "../../assets/onamiLogoLight.png";
import onamiLogoDark from "../../assets/onamiLogoDark.png";
import "./login.css";

export function RegisterPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    email: "",
    password: "",
    role: "athlete" as "athlete" | "trainer",
    join_code: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const firstName = formData.name.trim().split(/\s+/)[0];
      const firstLastName = formData.last_name.trim().split(/\s+/)[0];
      await api.post("/auth/register", {
        ...formData,
        name: `${firstName} ${firstLastName}`,
      });
      await login(formData.email, formData.password, false);
      navigate(formData.role === "trainer" ? "/trainer/dashboard" : "/athlete/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">

      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === "dark" ? <LuSun size={16} /> : <LuMoon size={16} />}
      </button>

      <div className="auth-card">

        <div className="auth-logo">
          <div className="auth-logo-icon">
            <img
              src={theme === "dark" ? onamiLogoLight : onamiLogoDark}
              alt="ONAMI"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div className="auth-logo-text">
            <h2>CREAR CUENTA</h2>
            <p>Únete a ONAMI</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>

          {error && <p className="form-error">{error}</p>}

          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              placeholder="Tu primer nombre"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Apellido</label>
            <input
              type="text"
              placeholder="Tu primer apellido"
              value={formData.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Profesión</label>
            <div className="role-picker">
              <button
                type="button"
                className={`role-option${formData.role === "athlete" ? " selected" : ""}`}
                onClick={() => handleChange("role", "athlete")}
              >
                <LuUser size={18} strokeWidth={2} />
                Atleta
              </button>
              <button
                type="button"
                className={`role-option${formData.role === "trainer" ? " selected" : ""}`}
                onClick={() => handleChange("role", "trainer")}
              >
                <LuClipboardList size={18} strokeWidth={2} />
                Entrenador
              </button>
            </div>
          </div>

          {formData.role === "athlete" && (
            <div className="form-group">
              <label>Código de equipo</label>
              <input
                type="text"
                placeholder="ONAMI-XXXXXX"
                value={formData.join_code}
                onChange={(e) => handleChange("join_code", e.target.value)}
                required
              />
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

        </form>

        <p className="auth-bottom">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login">Inicia sesión</Link>
        </p>

      </div>
    </div>
  );
}