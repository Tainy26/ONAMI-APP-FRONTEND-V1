import { createContext, useContext, useState, useEffect, Children } from "react";
import { saveToken, getToken, removeToken } from "../lib/storage";
import api from "../lib/api";

/* TIPOS TYPESCRIPT */
/* DEFINIMOS COMO VA A SER UN USE EN NUESTRA APP */
interface User {
    id: number;
    name: string;
    email: string;
    role: "trainer" | "athlete";
    team_id: number | null;
}

/* DEFINIMOS QUÉ FUNCIONES Y DATOS EXPONE EL CONTEXT */
interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

/* CREAMOS EL CONTEXT */
const AuthContext = createContext<AuthContextType | null>(null);

//PROVIDER: EL COMPONENTE QUE "ENVUELVE LA APP"
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /* AL INICIAR LA APP, COMPRBAMOS SI YA HABIA SESIÓN GUARDADA */
    useEffect(() => {
        async function checkSession() {
            const token = getToken();

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await api.get("/auth/me");
                setUser(res.data.user);
            } catch {
                removeToken();
            } finally {
                setIsLoading(false);
            }
        }

        checkSession();
    }, []);

    /* FUNCIÓN DE LOGIN */
    async function login(email: string, password: string) {
        const res = await api.post("/auth/login", { email, password});
        saveToken(res.data.token);
        setUser(res.data.user);
    }

    /* FUNCIÓN DEL LOGOUT */
    function logout() {
        removeToken();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{user, isLoading, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

/*HOOK PERSONALIZADO PARA USAR EL CONTEXT FÁCILMENTE*/
export function useAuth() {
    const context = useContext(AuthContext);

    if(!context) {
        throw new Error("useAuth debe usarse dentro de AuthProvider");
    }
    return context;
}