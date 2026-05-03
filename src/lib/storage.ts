const TOKEN_KEY = "onami_token";

//GUARDA EL TOKEN CUANDO EL USER HACE LOGIN
export function saveToken(token: string, remember: boolean): void {
    if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        sessionStorage.setItem(TOKEN_KEY, token);
    }
}

// LEE EL TOKEN GUARDADO (DEVUELVE NULL SI NO EXISTE)
export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

//BORRAA EL TOKEN CUANDO EL USER CIERRA SESIÓN
export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
}

// Devuelve true si el token JWT ha expirado (sin llamar al servidor)
export function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}