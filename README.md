# ONAMI — Frontend

> Plataforma de gestión deportiva para entrenadores y atletas.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Desplegado_en-Vercel-000000?style=flat&logo=vercel&logoColor=white)

---

## ✨ Características

- 🔐 **Autenticación con JWT** — Login y registro con roles diferenciados
- 👨‍💼 **Panel del entrenador** — Gestión de equipos, atletas y sesiones
- 🏃 **Panel del atleta** — Registro de carga diaria y visualización de sesiones
- 📊 **Gráficas interactivas** — Visualización de datos con Chart.js
- 🌙 **Modo oscuro/claro** — Tema adaptable según preferencia
- 🔒 **Rutas protegidas** — Acceso restringido por rol

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| React 19 | Framework de interfaz |
| TypeScript | Tipado estático |
| Vite | Bundler y servidor de desarrollo |
| React Router v7 | Navegación entre páginas |
| Axios | Peticiones HTTP a la API |
| Chart.js | Gráficas y visualización de datos |
| React Icons | Iconografía |

---

## 🚀 Instalación y uso

```bash
# Clonar el repositorio
git clone https://github.com/Tainy26/ONAMI-APP-FRONTEND-V1.git
cd ONAMI-APP-FRONTEND-V1

# Instalar dependencias
npm install

# Crear variables de entorno
echo "VITE_API_URL=http://localhost:3000" > .env.local

# Iniciar en desarrollo
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

---

## 📁 Estructura del proyecto

```
FRONTEND/
├── src/
│   ├── pages/
│   │   ├── auth/           # Login y registro
│   │   ├── trainer/        # Dashboard, equipos, atletas, sesiones
│   │   └── athlete/        # Dashboard, carga diaria, sesiones
│   ├── components/
│   │   ├── charts/         # Componentes de gráficas
│   │   └── layout/         # Navbar, sidebar y layout general
│   ├── context/
│   │   └── AuthContext.tsx # Estado global de autenticación
│   ├── routes/
│   │   ├── Router.tsx      # Definición de rutas
│   │   ├── ProtectedRoute  # Rutas que requieren sesión
│   │   └── RoleRoute       # Rutas restringidas por rol
│   ├── hooks/
│   │   └── useTheme.ts     # Hook para el tema oscuro/claro
│   └── lib/
│       ├── api.ts          # Instancia de Axios configurada
│       └── storage.ts      # Gestión del token en localStorage
├── .env.production         # Variables para producción
└── vite.config.ts          # Configuración de Vite
```

---

## 🗺️ Navegación

```
/login
├── /register
├── /trainer/dashboard
│   ├── /trainer/teams
│   ├── /trainer/sessions
│   ├── /trainer/athletes
│   └── /trainer/profile
└── /athlete/dashboard
    ├── /athlete/daily-load
    ├── /athlete/sessions
    └── /athlete/profile
```

---

## 🌐 Producción

La aplicación está desplegada en Vercel y conectada a la API REST del backend:

🔗 **[https://onami-app-frontend-v1.vercel.app](https://onami-app-frontend-v1.vercel.app)**
