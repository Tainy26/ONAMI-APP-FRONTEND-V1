import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./sidebar.css";

/* NAVEGACIÓN TRAINER */
const trainerNavItems = [
  { label: "Dashboard", icon: "📊", path: "/trainer/dashboard" },
  { label: "Equipos",   icon: "👥", path: "/trainer/teams"     },
  { label: "Sesiones",  icon: "📅", path: "/trainer/sessions"  },
  { label: "Atletas",   icon: "⚡", path: "/trainer/athletes"  },
];

/* NAVEGACIÓN ATLETA */
const athleteNavItems = [
  { label: "Dashboard", icon: "📊", path: "/athlete/dashboard"  },
  { label: "Mi carga",  icon: "🔥", path: "/athlete/daily-load" },
  { label: "Sesiones",  icon: "📅", path: "/athlete/sessions"   },
];

/* CUENTA TRAINER */
const trainerAccountItems = [
  { label: "Perfil", icon: "👤", path: "/trainer/profile" },
];

/* CUENTA ATLETA */
const athleteAccountItems = [
  { label: "Perfil", icon: "👤", path: "/athlete/profile" },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = user?.role === "trainer"
    ? trainerNavItems
    : athleteNavItems;

  const accountItems = user?.role === "trainer"
    ? trainerAccountItems
    : athleteAccountItems;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  /* INICIALES DEL USUARIO */
  const initials = user?.name
  ? user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) 
    : "??";

  return (
    <aside className="sidebar">

      {/* MARCA */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">⚡</div>
        <span className="sidebar-brand-name">ONAMI</span>
      </div>

      {/* NAVEGACIÓN PRINCIPAL */}
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

      {/* CUENTA */}
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

      {/* USUARIO Y LOGOUT */}
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">
              {user?.role === "trainer" ? "Entrenador" : "Atleta"}
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            →
          </button>
        </div>
      </div>

    </aside>
  );
}