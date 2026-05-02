import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LuLayoutDashboard,
  LuUsers,
  LuCalendar,
  LuZap,
  LuFlame,
  LuUser,
  LuLogOut,
} from "react-icons/lu";
import "./sidebar.css";
import onamiLogoLight from "../../assets/onamiLogoLight.png";

/* NAVEGACIÓN TRAINER */
const trainerNavItems = [
  { label: "Dashboard", icon: <LuLayoutDashboard size={17} strokeWidth={2.2} />, path: "/trainer/dashboard" },
  { label: "Equipos",   icon: <LuUsers size={17} strokeWidth={2.2} />,           path: "/trainer/teams"     },
  { label: "Sesiones",  icon: <LuCalendar size={17} strokeWidth={2.2} />,        path: "/trainer/sessions"  },
  { label: "Atletas",   icon: <LuZap size={17} strokeWidth={2.2} />,             path: "/trainer/athletes"  },
];

/* NAVEGACIÓN ATLETA */
const athleteNavItems = [
  { label: "Dashboard", icon: <LuLayoutDashboard size={17} strokeWidth={2.2} />, path: "/athlete/dashboard"  },
  { label: "Mi carga",  icon: <LuFlame size={17} strokeWidth={2.2} />,           path: "/athlete/daily-load" },
  { label: "Sesiones",  icon: <LuCalendar size={17} strokeWidth={2.2} />,        path: "/athlete/sessions"   },
];

/* CUENTA TRAINER */
const trainerAccountItems = [
  { label: "Perfil", icon: <LuUser size={17} strokeWidth={2.2} />, path: "/trainer/profile" },
];

/* CUENTA ATLETA */
const athleteAccountItems = [
  { label: "Perfil", icon: <LuUser size={17} strokeWidth={2.2} />, path: "/athlete/profile" },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = user?.role === "trainer" ? trainerNavItems : athleteNavItems;
  const accountItems = user?.role === "trainer" ? trainerAccountItems : athleteAccountItems;
  const allMobileItems = [...navItems, ...accountItems];

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const initials = (() => {
    if (!user?.name) return "??";
    const parts = user.name.trim().split(/\s+/);
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  return (
    <>
      {/* ── SIDEBAR — solo desktop ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <img
              src={onamiLogoLight}
              alt="Onami Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        </div>

        <span className="sidebar-section">Principal</span>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <span className="sidebar-section">Cuenta</span>
        {accountItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

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
              <LuLogOut size={15} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE HEADER — logo + marca centrada + usuario ── */}
      <header className="mobile-header">
        <img className="mobile-header-logo" src={onamiLogoLight} alt="ONAMI" />
        <span className="mobile-header-brand">ONAMI</span>
        <div className="mobile-header-right">
          <div className="mobile-header-avatar">{initials}</div>
          <button className="mobile-header-logout" onClick={handleLogout}>
            <LuLogOut size={14} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* ── MOBILE BOTTOM NAV — solo iconos ── */}
      <nav className="mobile-nav">
        <div className="mobile-nav-container">
          {allMobileItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mobile-nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="mobile-nav-icon">{item.icon}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
