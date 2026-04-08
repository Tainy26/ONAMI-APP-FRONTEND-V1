import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import api from "../../lib/api";
import "./login.css";

export function RegisterPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: "",
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
      await api.post("/auth/register", formData);
      await login(formData.email, formData.password, false);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">

      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="auth-card">

        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
          <div className="auth-logo-text">
            <h2>Crear cuenta</h2>
            <p>Únete a ONAMI hoy.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>

          {error && <p className="form-error">{error}</p>}

          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              placeholder="Tu nombre"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
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
            <label>Soy...</label>
            <select
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
            >
              <option value="athlete">Atleta</option>
              <option value="trainer">Entrenador</option>
            </select>
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