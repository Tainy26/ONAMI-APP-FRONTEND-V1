import  { useState, useEffect } from "react";
import { flushSync } from "react-dom";

type Theme = "dark" | "light";

export function useTheme() {
    function getInitialTheme(): Theme {
        const saved = localStorage.getItem("onami_theme");
        if (saved === "light" || saved === "dark") return saved;
        //DETECCIÓN DEL TEMA DEL SO DEL USER
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        return prefersDark ? "dark" : "light";
    }

    const [theme, setTheme] = useState<Theme>(getInitialTheme);
    //CADA VEZ QUE CAMBIA EL TEMA, ACTUALIZAMOS EL HTML Y GUARDAMOS
    useEffect(() => {
        const html = document.documentElement;
        if (theme === "light") {
            html.classList.add("light");
        } else {
            html.classList.remove("light");
        }
        localStorage.setItem("onami_theme", theme);
    }, [theme]);

    function toggleTheme() {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }
    return { theme, toggleTheme };
}