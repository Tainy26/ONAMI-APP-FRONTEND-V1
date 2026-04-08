import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { LoginPage } from "../pages/auth/LoginPage";
import { TrainerDashboardPage } from "../pages/auth/trainer/trainerDashboradPage";
import { AthleteDashboardPage } from "../pages/auth/athlete/athleteDashboardPage";
import { RegisterPage } from "../pages/auth/RegisterPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        //RUTA PÚBLICA
        <Route path="/login" element={<LoginPage/>}/>
          
        //RUTAS PROTEGIDAS DEL TRAINER
        <Route
          path="/trainer/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute role="trainer">
                <TrainerDashboardPage/>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        //RUTAS PROTEGIDAS DEL ATHLETE
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

        //REDIRIGIR LA RAIZ AL LOGIN
        <Route path="/" element={<Navigate to="/login" replace/>}/>
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}