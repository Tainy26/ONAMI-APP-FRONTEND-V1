import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";

import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";

import { TrainerDashboardPage } from "../pages/trainer/TrainerDashboard";
import { AthleteDashboardPage } from "../pages/athlete/AthleteDashboard";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* RUTAS PROTEGIDAS DEL TRAINER */}
        <Route
          path="/trainer/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute role="trainer">
                <TrainerDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/teams"
          element={
            <ProtectedRoute>
              <RoleRoute role="trainer">
                <div>Equipos — próximamente</div>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/sessions"
          element={
            <ProtectedRoute>
              <RoleRoute role="trainer">
                <div>Sesiones — próximamente</div>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/athletes"
          element={
            <ProtectedRoute>
              <RoleRoute role="trainer">
                <div>Atletas — próximamente</div>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/profile"
          element={
            <ProtectedRoute>
              <RoleRoute role="trainer">
                <div>Perfil — próximamente</div>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* RUTAS PROTEGIDAS DEL ATHLETE */}
        <Route
          path="/athlete/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute role="athlete">
                <AthleteDashboardPage/>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* REDIRIGIR LA RAÍZ AL LOGIN */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* RUTA 404 — cualquier URL desconocida va al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}