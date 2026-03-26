# Guía de despliegue — Colombia Matcher 2026

Esta guía explica cómo desplegar el proyecto completo de forma gratuita:
- **Backend** → Railway (Python/FastAPI)
- **Frontend** → Vercel (Next.js)

---

## Paso 1: Desplegar el backend en Railway

1. Crea una cuenta gratuita en [railway.app](https://railway.app).

2. Haz clic en **"New Project"** → **"Deploy from GitHub repo"**.

3. Autoriza Railway a acceder a tu cuenta de GitHub y selecciona el repositorio `colombia-matcher`.

4. Cuando te pida el directorio raíz, escribe: `backend`

5. Railway detectará el `Procfile` automáticamente y configurará el deploy. El comando de inicio es:
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

6. Una vez desplegado, Railway te dará una URL pública. Cópiala — la necesitarás en el siguiente paso. Ejemplo:
   ```
   https://colombia-matcher-backend.up.railway.app
   ```

7. Agrega la variable de entorno en Railway (Settings → Variables):
   ```
   CORS_ORIGINS=https://tu-url-de-vercel.vercel.app
   ```
   *(Puedes dejar este valor pendiente y actualizarlo después del paso 2.)*

**Variables de entorno del backend:**

| Variable | Valor | Notas |
|---|---|---|
| `CORS_ORIGINS` | `https://tu-url.vercel.app` | URL del frontend. Requerida en producción. |
| `PORT` | *(no configurar)* | Railway la inyecta automáticamente. |

---

## Paso 2: Desplegar el frontend en Vercel

1. Crea una cuenta gratuita en [vercel.com](https://vercel.com).

2. Haz clic en **"Add New Project"** → importa el repositorio `renzorico/colombia-matcher`.

3. Cuando te pida el directorio raíz, escribe: `frontend`

4. **Antes de hacer clic en Deploy**, agrega la variable de entorno:
   ```
   NEXT_PUBLIC_API_URL=https://tu-url-de-railway.up.railway.app
   ```
   Usa la URL que copiaste en el Paso 1, **sin barra al final**.

5. Haz clic en **Deploy**.

6. Una vez desplegado, Vercel te dará tu URL pública. Ejemplo:
   ```
   https://colombia-matcher.vercel.app
   ```

7. Vuelve a Railway y actualiza la variable `CORS_ORIGINS` con la URL real de Vercel.

**Variables de entorno del frontend:**

| Variable | Valor | Notas |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://tu-url.up.railway.app` | URL del backend. **Debe estar seteada antes del primer deploy.** |

---

## Paso 3: Verificar el despliegue

1. Abre la URL de Vercel en el navegador. Deberías ver la página de inicio del quiz.

2. Haz clic en "Comenzar" y completa el quiz. Si los resultados aparecen correctamente, el proxy funciona.

3. Verifica el backend directamente:
   ```
   https://tu-url-de-railway.up.railway.app/health
   ```
   Debe responder: `{"status": "ok"}`

4. Verifica que el proxy del frontend funciona:
   ```
   https://tu-url-de-vercel.vercel.app/api/backend/health
   ```
   Debe responder: `{"status": "ok"}`

---

## Desarrollo local con Docker

La forma más fácil de correr todo localmente:

```bash
# Clona el repositorio
git clone https://github.com/renzorico/colombia-matcher.git
cd colombia-matcher

# Levanta frontend + backend con Docker Compose
docker compose up --build

# Frontend disponible en: http://localhost:3000
# Backend disponible en:  http://localhost:8000
# Docs del backend en:    http://localhost:8000/docs
```

El `docker-compose.yml` monta `./backend/data` como volumen, por lo que los cambios en los archivos JSON son inmediatos sin necesidad de reconstruir la imagen.

---

## Desarrollo local sin Docker

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# Corre en http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Corre en http://localhost:3000
```

No es necesario configurar variables de entorno para desarrollo local. El proxy de Next.js apunta a `http://localhost:8000` por defecto.

---

## Archivos de referencia

- `backend/.env.example` — variables de entorno del backend
- `frontend/.env.example` — variables de entorno del frontend
- `backend/railway.toml` — configuración de Railway (nixpacks, healthcheck)
- `backend/Procfile` — comando de inicio para Railway
- `render.yaml` — alternativa a Railway usando Render.com
- `docker-compose.yml` — configuración de Docker para desarrollo local

---

## Post-despliegue: actualizar el README

Una vez que tengas las URLs reales, actualiza el archivo `README.md`:

1. Reemplaza la línea:
   ```
   > 🌐 **Demo en vivo:** [URL aquí una vez desplegado]
   ```
   por:
   ```
   > 🌐 **Demo en vivo:** https://colombia-matcher.vercel.app
   ```

2. Actualiza `CORS_ORIGINS` en Railway con la URL real de Vercel.

3. Haz commit y push para que el README refleje el deploy.
