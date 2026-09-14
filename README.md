# Salsa a la Calle — Landing + Sistema de Registro y Boletería

Landing page premium para el grupo salsero **Salsa a la Calle** (Cúcuta), con sistema de
pre-registro gratuito de asistentes, generación automática de boletas digitales con código QR,
envío por correo y WhatsApp, panel administrativo para personalizar el sitio y control de ingreso
al evento (check-in por escaneo de QR).

## Stack técnico

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **Prisma** + **PostgreSQL** (Neon, Vercel Postgres, Supabase, etc. — cualquier proveedor sirve)
- **Vercel Blob** para las imágenes que sube el admin (logo, hero, galería, fondo de boleta); en
  desarrollo local, si no configuras Blob, se guardan en `public/uploads/` automáticamente
- **Playwright (Chromium)** para renderizar la boleta como imagen (diseño tipo "boarding pass");
  en Vercel usa `@sparticuz/chromium`, un binario empaquetado para funciones serverless
- **Nodemailer** (SMTP) para el envío de correo
- **WhatsApp Cloud API (Meta)** para el envío de la boleta por WhatsApp
- Autenticación de administrador con JWT en cookie httpOnly

Todo el proyecto está preparado para desplegarse tal cual en **Vercel** (ver la guía al final de
este documento).

## Estructura principal

```
src/app/                landing pública, /registro, /politica-de-datos
src/app/admin/          panel administrativo (login, dashboard, check-in, personalización)
src/app/api/            endpoints (registro, admin login, checkin, settings, upload, stats)
src/lib/                lógica de negocio (settings, tickets/QR, email, whatsapp, auth, db)
src/components/         componentes de UI (landing, formulario, panel admin)
prisma/schema.prisma    modelos de datos
scripts/create-admin.mjs script para crear/actualizar el usuario administrador
```

## Configuración inicial (desarrollo local)

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env` y completa las variables (ver detalle abajo). Necesitas una base
   de datos PostgreSQL incluso en local: la más rápida de crear gratis es
   [Neon](https://neon.tech) o [Supabase](https://supabase.com) (copia la cadena de conexión que
   te dan a `DATABASE_URL`).
3. Crea la base de datos y aplica las migraciones:
   ```bash
   npx prisma migrate deploy
   ```
4. Crea el usuario administrador (usa `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`):
   ```bash
   npm run seed:admin
   ```
5. Levanta el entorno de desarrollo:
   ```bash
   npm run dev
   ```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión de PostgreSQL, ej. `postgresql://usuario:password@host:5432/db?sslmode=require`. |
| `JWT_SECRET` | Secreto largo y aleatorio para firmar sesiones de admin **y** los códigos QR. Cámbialo antes de producción. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales usadas por `npm run seed:admin` para crear el primer administrador. |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob para guardar las imágenes subidas desde el panel admin. En Vercel se crea solo al conectar un Blob store; en local puedes dejarlo vacío (usa `public/uploads/`). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | Datos del proveedor de correo transaccional (ver recomendaciones abajo). |
| `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL` | Nombre y correo que verán los asistentes como remitente. |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` | Credenciales de WhatsApp Cloud API (Meta for Developers). |
| `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG` | Nombre e idioma de la plantilla de WhatsApp aprobada (ver más abajo). |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio en producción (para enlaces en el correo y como respaldo al renderizar la boleta). |

### Correo profesional (sin caer en spam)

1. Usa un dominio propio (ej. `registro@salsaalacalle.com`) en lugar de un correo gratuito.
2. Configura los registros **SPF, DKIM y DMARC** de tu dominio apuntando al proveedor SMTP que
   uses (Zoho Mail, Google Workspace, Amazon SES, SendGrid, Mailgun, etc.).
3. El correo ya está diseñado sin emojis, sin mayúsculas sostenidas y con texto plano + HTML
   (multipart), lo cual reduce el riesgo de ser marcado como spam.

### WhatsApp Cloud API

1. Crea una app de tipo *Business* en [Meta for Developers](https://developers.facebook.com/) y
   habilita el producto **WhatsApp**.
2. Obtén el `Phone Number ID` y un `Access Token` (usa un token de sistema permanente en
   producción, no el token temporal de pruebas).
3. Como el primer mensaje que reciben los asistentes lo inicia el negocio (no el usuario), Meta
   exige una **plantilla de mensaje (Message Template)** aprobada. Crea una plantilla con:
   - **Encabezado**: tipo Imagen (aquí se envía la boleta).
   - **Cuerpo**: 4 variables de texto: `{{1}}` nombre, `{{2}}` número de boleta, `{{3}}` fecha,
     `{{4}}` lugar.
   - Nombre de la plantilla y su idioma deben coincidir con `WHATSAPP_TEMPLATE_NAME` y
     `WHATSAPP_TEMPLATE_LANG`.
4. Si un envío falla (por ejemplo, mientras se aprueba la plantilla), el registro del asistente
   **no se pierde**: queda guardado en la base de datos y el error se muestra en el panel para que
   puedas reenviar manualmente o contactar al asistente.

## Panel administrativo (`/admin`)

- **Login** (`/admin/login`): autenticación con el correo y contraseña creados por `seed:admin`.
- **Dashboard** (`/admin/dashboard`): estadísticas del día (registros, check-ins) y tabla completa
  de registrados con búsqueda por nombre, correo, WhatsApp, barrio o código de boleta.
- **Check-in** (`/admin/checkin`): escaneo de QR con la cámara del dispositivo (o ingreso manual
  del código) para validar el ingreso en segundos. Detecta boletas repetidas, inválidas o
  anuladas, y permite forzar un reingreso si el staff lo autoriza (la boleta es transferible).
- **Personalizar** (`/admin/settings`): logo, imagen de fondo de la boleta, imágenes del hero,
  galería de fotos, colores de marca, información del evento (fecha, lugar, programación), redes
  sociales, datos de contacto y datos legales del responsable del tratamiento.

En Vercel, las imágenes subidas se guardan en Vercel Blob; en local (sin `BLOB_READ_WRITE_TOKEN`)
se guardan en `public/uploads/` (excluido de git).

## Seguridad del código QR

Cada boleta incluye un token firmado con HMAC-SHA256 (usando `JWT_SECRET`), por lo que no es
posible fabricar boletas válidas sin conocer el secreto del servidor. El endpoint de check-in
verifica la firma antes de consultar la base de datos.

## Cumplimiento legal (Colombia)

El sitio incluye una página de **Política de Tratamiento de Datos Personales**
(`/politica-de-datos`) redactada conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013, con
autorización explícita en el formulario de registro. **Se recomienda que un abogado revise el
texto final** antes del lanzamiento oficial, y que completes el NIT/razón social real del
responsable del tratamiento en `/admin/settings`.

## Despliegue en Vercel (paso a paso)

El proyecto ya está listo para desplegarse en Vercel sin tocar código. Necesitas 3 cosas antes de
darle a "Deploy": una base de datos Postgres, un almacén de Blob para imágenes, y las variables de
entorno.

### 1. Sube el repositorio a Vercel

1. Entra a [vercel.com](https://vercel.com) e inicia sesión (puedes usar tu cuenta de GitHub).
2. **Add New → Project** y selecciona el repositorio `salsaalacalle` (rama
   `claude/gracious-carson-w7cfz0`, o la que hayas fusionado a tu rama principal).
3. Vercel detecta automáticamente que es un proyecto Next.js. No cambies el "Build Command" ni el
   "Install Command" (usa los definidos en `package.json`).
4. **Todavía no le des a Deploy** — primero completa los pasos 2 y 3 para tener las variables de
   entorno listas (si despliegas sin ellas, el build fallará porque no hay `DATABASE_URL`).

### 2. Crea la base de datos (Postgres)

1. Dentro del proyecto en Vercel, ve a la pestaña **Storage → Create Database → Postgres**
   (es Neon por debajo, tiene plan gratuito).
2. Al crearla, Vercel te ofrece **conectarla al proyecto** — acéptalo. Esto agrega automáticamente
   la variable `DATABASE_URL` (y algunas otras `POSTGRES_*`) al proyecto. Si solo ves variables
   como `POSTGRES_PRISMA_URL`, agrega manualmente una variable `DATABASE_URL` en
   **Settings → Environment Variables** con ese mismo valor, ya que es el nombre que usa este
   proyecto.

### 3. Crea el almacén de imágenes (Blob)

1. **Storage → Create Database → Blob**.
2. Conéctalo al proyecto igual que la base de datos — esto agrega automáticamente
   `BLOB_READ_WRITE_TOKEN`.

### 4. Completa las demás variables de entorno

En **Settings → Environment Variables**, agrega (para el ambiente "Production" al menos):

- `JWT_SECRET` — genera una cadena larga aleatoria (por ejemplo con `openssl rand -hex 32`).
- `ADMIN_EMAIL` y `ADMIN_PASSWORD` — las credenciales que quieras para el primer administrador.
- `NEXT_PUBLIC_SITE_URL` — la URL que Vercel te va a asignar, ej. `https://salsaalacalle.vercel.app`
  (o tu dominio propio una vez lo conectes).
- Las variables de `SMTP_*` y `WHATSAPP_*` cuando tengas esas credenciales listas (ver secciones
  arriba). Mientras tanto puedes dejarlas vacías: el registro seguirá funcionando, solo no se
  enviará el correo/WhatsApp.

### 5. Despliega

1. Dale a **Deploy**. El build corre automáticamente `prisma generate`, `prisma migrate deploy`
   (crea las tablas en tu base de datos) y `next build`.
2. Cuando termine, entra a la URL que te da Vercel (algo como
   `https://salsaalacalle.vercel.app`) — ya deberías ver la landing.
3. Crea el usuario administrador ejecutando el script una sola vez **desde tu máquina**, apuntando
   a la base de datos de producción (usa el mismo `DATABASE_URL` que configuraste en Vercel):
   ```bash
   DATABASE_URL="postgresql://...produccion..." ADMIN_EMAIL="tu@correo.com" ADMIN_PASSWORD="tuClave" npm run seed:admin
   ```
4. Entra a `https://tu-sitio.vercel.app/admin/login` con esas credenciales.

### 6. Dominio propio (opcional)

En **Settings → Domains** puedes conectar tu propio dominio (ej. `salsaalacalle.com`). Actualiza
`NEXT_PUBLIC_SITE_URL` a ese dominio y vuelve a desplegar.

### Notas de límites en el plan gratuito de Vercel

- Las funciones tienen un límite de tiempo de ejecución; la ruta de registro ya está configurada
  con `maxDuration = 60` segundos, suficiente para generar la boleta y enviar correo/WhatsApp.
- El plan gratuito de Neon/Vercel Postgres y de Vercel Blob tienen cuotas generosas para un evento
  de este tamaño, pero revisa los límites si esperas miles de registros.
