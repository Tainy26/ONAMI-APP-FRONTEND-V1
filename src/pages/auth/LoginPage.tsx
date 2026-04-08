import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import "./login.css";

export function LoginPage() {
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    navigate(user.role === "trainer"
      ? "/trainer/dashboard"
      : "/athlete/dashboard",
      { replace: true }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password, remember);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Email o contraseña incorrectos");
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
            <h2>Bienvenido de nuevo</h2>
            <p>Introduce tus datos para entrar.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>

          {error && <p className="form-error">{error}</p>}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-group-row">
              <label>Contraseña</label>
              <button type="button" className="link-small">
                ¿Olvidaste la contraseña?
              </button>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <label className="remember-row">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Recuérdame</span>
          </label>

          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Iniciar sesión"}
          </button>

          {/* BOTONES SOCIALES */}
          <div className="social-divider">O continúa con</div>

          <div className="social-buttons">
          <button type="button" className="btn-social" onClick={() => alert("Próximamente disponible")}>
              🍎 Apple
          </button>
          <button type="button" className="btn-social" onClick={() => alert("Próximamente disponible")}>
              <span style={{ fontWeight: 700, fontSize: "15px" }}>G</span> Google
          </button>
          </div>

        </form>

        <p className="auth-bottom">
          ¿No tienes cuenta?{" "}
          <Link to="/register">Regístrate</Link>
        </p>

      </div>
    </div>
  );
}