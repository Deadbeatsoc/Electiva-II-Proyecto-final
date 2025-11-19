# Guía de despliegue

Esta aplicación está dividida en dos paquetes:

- **Frontend** (`/`) construido con Vite + React.
- **Backend** (`/serve`) con Express + SQLite (controlado con migraciones y semillas).

Sigue estos pasos para ejecutar el proyecto en local o desplegarlo en producción.

## 1. Requisitos

- Node.js 18 o superior.
- Acceso a las variables de entorno de Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) si deseas habilitar el inicio de sesión.

## 2. Backend (API)

1. Instala las dependencias en `serve` (en tu entorno real):
   ```bash
   cd serve
   npm install
   ```
2. Ejecuta las migraciones para crear el esquema de SQLite:
   ```bash
   npm run migrate
   ```
3. Inserta los datos iniciales (catálogo y posts de ejemplo):
   ```bash
   npm run seed
   ```
4. Inicia la API en desarrollo:
   ```bash
   npm run dev
   ```
   o en producción:
   ```bash
   PORT=4000 npm run start
   ```
5. Expone la API públicamente (por ejemplo, en Render, Railway o un VPS). Asegúrate de que la URL pública incluya el prefijo `/api` (ej. `https://mi-api.com/api`).

## 3. Frontend

1. Instala dependencias en la raíz del proyecto:
   ```bash
   npm install
   ```
2. Crea un archivo `.env` (opcional) para definir la URL del backend y las credenciales de Supabase:
   ```bash
   VITE_API_URL=https://mi-api.com/api
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
3. Ejecuta el modo desarrollo:
   ```bash
   npm run dev
   ```
4. Compila para producción:
   ```bash
   npm run build
   ```
5. Despliega el contenido de `dist/` en cualquier hosting estático (Vercel, Netlify, S3, etc.).

## 4. Pruebas locales rápidas

En una terminal inicia la API:
```bash
npm --prefix serve run dev
```

En otra terminal inicia el frontend:
```bash
npm run dev
```

Visita `http://localhost:5173` (o el puerto indicado por Vite). El frontend ya sabe apuntar al backend local (`http://localhost:4000/api`) si no defines `VITE_API_URL`.

## 5. Consideraciones para producción

- La base de datos es SQLite. Para despliegues de alto tráfico considera montarla en un volumen persistente o migrar a Postgres/MySQL y actualizar los scripts de migración.
- La URL compartible de perfiles es `https://TU-FRONTEND/share/<slug>`. Asegúrate de que tu hosting atienda cualquier ruta (`/*`) y delegue el enrutado a React (las plataformas tipo Vercel/Netlify ya lo hacen por defecto).
- Si cambias la URL pública del backend, actualiza `VITE_API_URL` antes de compilar el frontend.

Con estos pasos tendrás el backend y el frontend corriendo por separado, listos para pruebas locales y despliegues productivos.
