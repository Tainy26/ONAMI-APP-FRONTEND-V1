import axios from "axios";
import { getToken } from "./storage";

//CREAMOS UNA INSTANCIA DE AXIOS APUNTANDO AL BACKEND
const api = axios.create({
    baseURL: "http://localhost:3000",
});

/* INTERCEPTOR: SE EJECUTA ANTES DE CADA PETICIÓN, SU FUNCIÓN ES 
AÑADIR EL TOKEN JWT AL HEADER SI EXISTE */

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        //EL BACKEND ESPERA: AUTHORIZATION: BEARER <TOKEN>
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;

