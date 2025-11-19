# Guía de despliegue

La aplicación es un frontend construido con **Vite + React** que se conecta directamente a una instancia de **Supabase**. No hay un servidor Express ni endpoints REST intermedios: todo el CRUD se realiza usando el cliente oficial de Supabase desde el navegador.

## 1. Requisitos

- Node.js 18 o superior.
- Una cuenta y proyecto en [Supabase](https://supabase.com/).
- (Opcional) [Supabase CLI](https://supabase.com/docs/guides/cli) si prefieres aplicar las migraciones desde la terminal.

## 2. Configurar Supabase

1. Crea un nuevo proyecto en Supabase y espera a que finalice el aprovisionamiento.
2. Ejecuta la migración SQL incluida en `supabase/migrations/20251119150922_001_create_media_and_forum_tables.sql` para crear el esquema (tablas de catálogo, foro, listas y perfiles). Puedes hacerlo de dos formas:
   - Copia el contenido del archivo y ejecútalo en el **SQL Editor** del panel de Supabase.
   - O bien instala Supabase CLI, vincula el proyecto (`supabase login` + `supabase link --project-ref <tu-ref>`) y luego ejecuta `supabase db push` desde la raíz del repo.
3. Verifica que las políticas RLS se hayan creado correctamente (el archivo ya incluye todas las políticas necesarias para lectura pública y escritura autenticada).
4. Toma nota de la **URL del proyecto** y de la **Anon Key** desde `Project Settings → API`. Son los valores que usará el frontend para conectarse.

## 3. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto (o configura variables en tu servicio de hosting) con las credenciales de Supabase:

```bash
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

No se requiere ninguna otra URL: el frontend habla únicamente con Supabase.

## 4. Desarrollo local

```bash
npm install
npm run dev
```

- El comando `npm run dev` levanta Vite en `http://localhost:5173`.
- El cliente ya usará las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` que tengas definidas (por ejemplo en `.env`).
- Si cambias de proyecto en Supabase, solo debes actualizar estas variables y reiniciar Vite.

## 5. Compilación y despliegue del frontend

1. Construye la aplicación para producción:
   ```bash
   npm run build
   ```
2. Sirve el contenido de `dist/` en tu hosting estático preferido (Vercel, Netlify, GitHub Pages, S3 + CloudFront, etc.).
3. Configura en el hosting las mismas variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` utilizadas en local.
4. Asegúrate de habilitar el **history fallback** o rewrites para aplicaciones SPA: todas las rutas (`/`, `/share/<slug>`, etc.) deben resolver a `index.html` para que React maneje el enrutado de perfiles públicos y del foro.

## 6. Consideraciones adicionales

- No hay que desplegar ni mantener el paquete `serve/`; quedó como referencia histórica pero el frontend solo depende de Supabase.
- Para compartir perfiles públicos, el enlace final tendrá el formato `https://TU-DOMINIO/share/<slug>`; no es necesario configurar rutas adicionales siempre que tu hosting redirija cualquier URL a `index.html`.
- Si planeas poblar datos de ejemplo (catálogo o posts), puedes insertar registros directamente desde el dashboard o importarlos mediante el SQL Editor.
- Revisa periódicamente las reglas de RLS si modificas el esquema para asegurarte de que los usuarios autenticados puedan escribir y que las lecturas públicas sigan funcionando.

Con estos pasos tendrás el frontend apuntando exclusivamente a Supabase, listo para desarrollo local y despliegues productivos.
