# Guía de despliegue

La aplicación está dividida en dos piezas:

1. **Frontend (Vite + React)**: se despliega en Vercel u otro hosting estático y consume un API REST propio.
2. **Backend (Express + SQLite)**: vive en la carpeta `serve/`, expone `/api` y puede ejecutarse con **PM2** sobre cualquier servidor Linux/Windows.

Supabase se usa exclusivamente para autenticación (registro/inicio de sesión). Toda la data de catálogo, foro y perfiles vive en SQLite.

---

## 1. Requisitos

- Node.js 18+ instalado tanto para frontend como backend.
- Cuenta de Supabase (para obtener `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).
- Acceso a un servidor donde puedas instalar PM2 (por ejemplo, un VPS con Ubuntu) y a una cuenta de Vercel para el frontend.

---

## 2. Variables de entorno

Crea un archivo `.env` en la raíz del frontend (o configúralas en Vercel):

```bash
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
VITE_API_BASE_URL=https://api.midominio.com/api
```

En el backend (`serve/`) puedes definir estas variables (PM2 también permite fijarlas en `ecosystem.config.cjs`):

```bash
PORT=4000
CORS_ORIGIN=https://tu-app.vercel.app,https://tu-dominio.com
```

> Si `CORS_ORIGIN` no está definido el API aceptará peticiones desde cualquier origen. Usa la lista separada por comas para producción.

---

## 3. Preparar la base de datos SQLite

El archivo se ubica en `serve/db/data.sqlite` y se crea automáticamente. Para crear el esquema y poblar datos ejemplo:

```bash
cd serve
npm install
npm run migrate   # ejecuta scripts/migrate.js
npm run seed      # datos iniciales opcionales
```

Los scripts ejecutan `serve/db/migrations/001_init.sql` y `db/seedData.js` usando sqlite3.

---

## 4. Desarrollo local

1. **Backend**
   ```bash
   cd serve
   npm install
   npm run dev
   ```
   Esto levanta `http://localhost:4000/api` con recarga vía Nodemon.

2. **Frontend**
   ```bash
   npm install
   npm run dev
   ```
   El cliente usará los valores de `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_API_BASE_URL` definidos en tu `.env`.

---

## 5. Despliegue del backend con PM2

En tu servidor:

```bash
# Clona el repo o copia solo la carpeta serve
cd serve
npm install --production
npm run migrate
npm run seed   # opcional en producción
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup    # opcional para iniciar junto al sistema
```

- El archivo `ecosystem.config.cjs` arranca `index.js` en modo producción.
- Ajusta `PORT` y `CORS_ORIGIN` (por variables de entorno del sistema o editando `env` dentro del archivo) para que coincidan con el dominio que usará Vercel.
- Verifica que el puerto elegido esté abierto (por ejemplo 4000) y configura tu reverse proxy o firewall según corresponda.

---

## 6. Despliegue del frontend en Vercel

1. Conecta el repositorio en Vercel y selecciona el proyecto raíz (no la carpeta `serve`).
2. Configura los *Environment Variables* en Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`). El tercer valor debe apuntar al dominio donde corre el backend (`https://api.miapp.com/api`).
3. Vercel detectará Vite automáticamente (`npm run build`).
4. Una vez publicado, asegúrate de actualizar `CORS_ORIGIN` en tu backend con el dominio generado por Vercel si cambia (`https://<proyecto>.vercel.app`).

> Si usas un dominio personalizado, actualiza tanto Vercel como la lista de CORS para mantenerlos sincronizados.

---

## 7. Operación y mantenimiento

- **Migraciones futuras**: agrega nuevos archivos SQL en `serve/db/migrations`. Actualiza `scripts/migrate.js` si necesitas ejecutar varios en orden.
- **Logros/monitoreo**: `pm2 logs media-forum-api --lines 100` muestra los últimos registros. `pm2 status` detalla si el proceso está vivo.
- **Respaldos**: haz copia del archivo `serve/db/data.sqlite` periódicamente. Es una base SQLite estándar.
- **Actualizaciones del frontend**: vuelve a desplegar en Vercel cada vez que hagas `git push main` si el proyecto está conectado.
- **Supabase**: solo gestiona autenticación. Revisa la consola de Supabase para administrar usuarios o reglas de correo.

Con estos pasos tendrás el frontend sirviéndose desde Vercel consumiendo tu API propia en PM2, con variables adecuadas y CORS restringido a la ruta pública. Ajusta los dominios según tu infraestructura final.
