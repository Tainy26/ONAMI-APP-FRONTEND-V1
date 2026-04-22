import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";

import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";

import { TrainerDashboardPage } from "../pages/trainer/TrainerDashboard";
import { TeamsPage } from "../pages/trainer/TeamsPage";
import { SessionsPage } from "../pages/trainer/SessionsPage";
import { AthletesPage } from "../pages/trainer/AthletesPage";
import { ProfilePage } from "../pages/trainer/ProfilePage";

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
                <TeamsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/sessions"
          element={
            <ProtectedRoute>
              <RoleRoute role="trainer">
                <SessionsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/athletes"
          element={
            <ProtectedRoute>
              <RoleRoute role="trainer">
                <AthletesPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/profile"
          element={
            <ProtectedRoute>
              <RoleRoute role="trainer">
                <ProfilePage />
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
                <AthleteDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/athlete/daily-load"
          element={
            <ProtectedRoute>
              <RoleRoute role="athlete">
                <div>Carga diaria — próximamente</div>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/athlete/sessions"
          element={
            <ProtectedRoute>
              <RoleRoute role="athlete">
                <div>Sesiones atleta — próximamente</div>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/athlete/profile"
          element={
            <ProtectedRoute>
              <RoleRoute role="athlete">
                <div>Perfil atleta — próximamente</div>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* REDIRIGIR LA RAÍZ AL LOGIN */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* RUTA 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}