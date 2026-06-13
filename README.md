# Figuritas Cartagena ⚽

Plataforma para intercambiar y vender figuritas del álbum **Usa Méx Can 26** en Cartagena, Colombia.

---

## ¿Qué necesitas instalar?

1. **Node.js** (versión 18 o superior) → https://nodejs.org
2. **Git** → https://git-scm.com
3. **Supabase CLI** (para desplegar Edge Functions) → https://supabase.com/docs/guides/cli

Para instalar Supabase CLI en Mac:
```bash
brew install supabase/tap/supabase
```

---

## Paso 1 — Crear cuenta en Supabase

1. Ve a https://supabase.com y crea una cuenta gratuita.
2. Haz clic en **"New project"**.
3. Escoge un nombre (ej: `figuritas-cartagena`), una contraseña fuerte para la base de datos, y la región **South America (São Paulo)**.
4. Espera 1–2 minutos mientras el proyecto se crea.

---

## Paso 2 — Crear las tablas (schema.sql)

1. En el panel de Supabase, haz clic en **"SQL Editor"** en el menú izquierdo.
2. Haz clic en **"New query"**.
3. Copia todo el contenido del archivo `supabase/schema.sql` de este proyecto.
4. Pégalo en el editor y haz clic en **"Run"** (o presiona Ctrl+Enter).
5. Deberías ver el mensaje `Success. No rows returned.`

---

## Paso 3 — Obtener las claves de Supabase

1. En el panel de Supabase, haz clic en el ícono de engranaje ⚙️ **"Settings"**.
2. Haz clic en **"API"** en el menú de la izquierda.
3. Copia estos dos valores:
   - **Project URL** → será tu `VITE_SUPABASE_URL`
   - **anon / public key** → será tu `VITE_SUPABASE_ANON_KEY`

⚠️ NUNCA uses la clave `service_role` en el frontend.

---

## Paso 4 — Crear el archivo .env.local

En la raíz del proyecto, crea un archivo llamado `.env.local` (copia desde `.env.example`):

```bash
cp .env.example .env.local
```

Abre `.env.local` y completa los valores:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_OWNER_WHATSAPP=573001234567
VITE_PUBLIC_SITE_URL=https://figuritascartagena.pages.dev
```

**VITE_OWNER_WHATSAPP**: El número de WhatsApp de Michel, sin + ni espacios, con código de país. Ej: `573001234567`

---

## Paso 5 — Instalar dependencias y ejecutar localmente

```bash
cd intercambio-figuritas-mundial
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.

---

## Paso 6 — Configurar y desplegar las Edge Functions

### 6.1 Iniciar sesión en Supabase CLI

```bash
supabase login
```

Se abrirá el navegador para autenticarte.

### 6.2 Conectar el proyecto

```bash
supabase link --project-ref TU_PROJECT_REF
```

Reemplaza `TU_PROJECT_REF` con el ID de tu proyecto. Lo encuentras en Supabase → Settings → General → **Reference ID**.

### 6.3 Configurar los secretos de las Edge Functions

```bash
supabase secrets set SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
supabase secrets set ADMIN_PASSWORD=TU_CONTRASEÑA_SEGURA
supabase secrets set PUBLIC_SITE_URL=https://figuritascartagena.pages.dev
```

Donde:
- `SUPABASE_SERVICE_ROLE_KEY` → la encuentras en Supabase → Settings → API → **service_role / secret**
- `ADMIN_PASSWORD` → escoge una contraseña segura (solo la usarás tú)
- `PUBLIC_SITE_URL` → la URL donde quedará publicada la página

### 6.4 Desplegar las Edge Functions

```bash
supabase functions deploy create-listing
supabase functions deploy get-manage-listing
supabase functions deploy update-listing
supabase functions deploy update-sticker-status
supabase functions deploy close-listing
supabase functions deploy renew-listing
supabase functions deploy admin-login
supabase functions deploy admin-listings
supabase functions deploy admin-update-listing
```

O para desplegar todas de una vez:

```bash
supabase functions deploy
```

---

## Paso 7 — Probar el formulario localmente

Con `npm run dev` corriendo:

1. Ve a http://localhost:5173/publicar
2. Llena el formulario con datos de prueba.
3. En el campo de figuritas, pega:
   ```
   COL 🇨🇴: 2, 6, 11
   FWC 🏆: 3, 4
   ```
4. Haz clic en **"Agregar figuritas"**.
5. Completa el resto del formulario y haz clic en **"Publicar mis figuritas"**.

Si todo funciona, verás la pantalla de éxito con tu enlace privado.

---

## Paso 8 — Probar el enlace privado

1. Copia el enlace que aparece en la pantalla de éxito. Tiene la forma:
   ```
   http://localhost:5173/editar/UUID?token=TOKEN_LARGO
   ```
2. Ábrelo en otra pestaña. Deberías ver la página de gestión.
3. Intenta modificar una figurita.

---

## Paso 9 — Marcar una figurita como vendida y verificar que desaparece

1. En la página de gestión (`/editar/...`), haz clic en **"Vendida"** junto a una figurita.
2. Ve al catálogo principal (`/`).
3. Busca esa figurita — ya no debería aparecer.

---

## Paso 10 — Subir el repositorio a GitHub

1. Crea una cuenta en https://github.com si no tienes una.
2. Crea un nuevo repositorio vacío (sin README, sin .gitignore).
3. En tu terminal, dentro de la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Figuritas Cartagena - versión inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

---

## Paso 11 — Conectar GitHub con Cloudflare Pages

1. Ve a https://pages.cloudflare.com y crea una cuenta gratuita.
2. Haz clic en **"Create a project"** → **"Connect to Git"**.
3. Conecta tu cuenta de GitHub y selecciona el repositorio.
4. Configura el build:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

---

## Paso 12 — Configurar variables de entorno en Cloudflare Pages

En la configuración del proyecto en Cloudflare Pages, ve a **"Settings" → "Environment variables"** y agrega:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | tu URL de Supabase |
| `VITE_SUPABASE_ANON_KEY` | tu clave anon de Supabase |
| `VITE_OWNER_WHATSAPP` | número de WhatsApp de Michel |
| `VITE_PUBLIC_SITE_URL` | URL de Cloudflare Pages (ej: `https://figuritascartagena.pages.dev`) |

⚠️ NUNCA agregues `SUPABASE_SERVICE_ROLE_KEY` ni `ADMIN_PASSWORD` aquí.

---

## Paso 13 — Publicar

Haz clic en **"Save and Deploy"**. Cloudflare Pages construirá y publicará la página automáticamente.

Cada vez que hagas `git push`, la página se actualizará sola.

---

## Paso 14 — Actualizar la página después

Para hacer cambios:

```bash
# Edita los archivos que necesites
git add .
git commit -m "Descripción del cambio"
git push
```

Cloudflare Pages detecta el push y actualiza la página en 1–2 minutos.

---

## Paso 15 — Actualizar la lista de Michel

Abre el archivo `src/data/michel.ts` y edita las variables `MICHEL_OFFERED_RAW` y `MICHEL_WANTED_RAW`.

Usa el mismo formato que genera Figuritas App:
```
COL 🇨🇴: 2, 6, 11, 13
FWC 🏆: 3, 4
```

Luego haz `git push` y la página se actualizará.

Para cambiar el WhatsApp de Michel, edita `MICHEL_WHATSAPP` en el mismo archivo, o actualiza la variable de entorno `VITE_OWNER_WHATSAPP` en Cloudflare Pages.

---

## Paso 16 — Acceder al panel administrativo

Ve a `/admin` en tu página (ej: `https://figuritascartagena.pages.dev/admin`).

Este enlace no aparece en el menú público — solo tú lo conoces.

Ingresa la contraseña que configuraste en `ADMIN_PASSWORD`.

Desde ahí puedes:
- Ver y buscar publicaciones por estado
- Ocultar, cerrar o reactivar publicaciones
- Agregar notas de moderación

---

## Paso 17 — Revisar publicaciones desde Supabase

En el panel de Supabase, ve a **"Table editor"** y selecciona la tabla `listings` para ver todas las publicaciones directamente en la base de datos.

---

## Paso 18 — Cambiar la contraseña administrativa

1. En tu terminal:
```bash
supabase secrets set ADMIN_PASSWORD=NUEVA_CONTRASEÑA
```
2. Redesplega las Edge Functions de admin:
```bash
supabase functions deploy admin-login
supabase functions deploy admin-listings
supabase functions deploy admin-update-listing
```

---

## Paso 19 — Configurar el WhatsApp de Michel

Opción A — Variable de entorno (recomendado):
- En Cloudflare Pages → Settings → Environment variables
- Actualiza `VITE_OWNER_WHATSAPP` con el nuevo número
- Redespliega

Opción B — Directo en el código:
- Edita `src/data/michel.ts`
- Cambia la línea: `export const MICHEL_WHATSAPP = '573001234567'`

---

## Seguridad importante

- `SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_PASSWORD` **NUNCA** deben aparecer en el frontend ni en variables `VITE_*`.
- El token de edición nunca se guarda completo en la base de datos, solo su hash SHA-256.
- Row Level Security está activado: el navegador solo puede leer publicaciones activas y no vencidas.
- Todas las escrituras van por Edge Functions que verifican el token.

---

## Estructura del proyecto

```
figuritas-cartagena/
├── public/
│   └── _redirects          ← necesario para Cloudflare Pages
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── StickerCard.tsx
│   │   ├── StickerInput.tsx
│   │   ├── Comparator.tsx
│   │   └── MichelSection.tsx
│   ├── data/
│   │   └── michel.ts       ← edita aquí las listas de Michel
│   ├── lib/
│   │   ├── parser.ts       ← parsea listas de Figuritas App
│   │   ├── supabase.ts
│   │   └── types.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── PublishPage.tsx
│   │   ├── ListingPage.tsx
│   │   ├── EditPage.tsx
│   │   └── AdminPage.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── schema.sql
│   └── functions/
│       ├── create-listing/
│       ├── get-manage-listing/
│       ├── update-listing/
│       ├── update-sticker-status/
│       ├── close-listing/
│       ├── renew-listing/
│       ├── admin-login/
│       ├── admin-listings/
│       └── admin-update-listing/
├── .env.example
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```
