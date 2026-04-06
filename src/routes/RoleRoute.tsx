import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ESTO EVITA QUE UN ATLETA ACCEDA AL DASHBOARD DEL TRAINER ESCRIBIENDO
LA URL A MANO EN EL NAVEGADOR */
interface Props {
    children: React.ReactNode;
    role: "trainer" | "athlete";
}

export function RoleRoute({ children, role }: Props) {
    const { user } = useAuth();
    if (user?.role !== role){
        return <Navigate to="/unauthorized" replace />;
    }
    return <>{children}</>
}