import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./sidebar.css";

/* CADA ITEM DEL MENU */
const navItems = [
    { label: "Dashboard", icon: "📊", path: "/trainer/dashboard" },
    { label: "Equipos", icon: "📊", path: "/trainer/teams" },
    { label: "Sesiones", icon: "📊", path: "/trainer/sessions" },
    { label: "Atletas", icon: "📊", path: "/trainer/athletes" },

];

const accountItems = [
    { label: "Perfil", icon: "📊", path: "/trainer/profile" },
]

export function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("login", { replace: true });
    }

    /* INICIALES DEL USUARIO PARA EL ICONO DE PERFIL */
    const initials = user?.name
      .split(" ")
      .map((n) => n[0])
      .join(" ")
      .toUpperCase()
      .slice(0, 2) ?? "??";

    return (
      <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">⚡</div>
        <span className="sidebar-brand-name">ONAMI</span>
      </div>

      /* NAVEGACIÓN PRINCIPAL */
       <span className="sidebar-section">Principal</span>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-item-icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      /* CUENTA */
      <span className="sidebar-section">Cuenta</span>
      {accountItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-item-icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      /* USUARIO Y LOGOUT */
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">Entrenador</div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            →
          </button>
        </div>
      </div>
      </aside>
    )
}