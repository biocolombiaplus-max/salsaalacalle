# Salsa a la Calle — Landing + Sistema de Registro y Boletería

Landing page premium para el grupo salsero **Salsa a la Calle** (Cúcuta), con sistema de
pre-registro gratuito de asistentes, generación automática de boletas digitales con código QR,
envío por correo y WhatsApp, panel administrativo para personalizar el sitio y control de ingreso
al evento (check-in por escaneo de QR).

## Stack técnico

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **Prisma** + **SQLite** (fácilmente migrable a PostgreSQL/MySQL cambiando `DATABASE_URL`)
- **Playwright (Chromium)** para renderizar la boleta como imagen (diseño tipo "boarding pass")
- **Nodemailer** (SMTP) para el envío de correo
- **WhatsApp Cloud API (Meta)** para el envío de la boleta por WhatsApp
- Autenticación de administrador con JWT en cookie httpOnly

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

## Configuración inicial

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env` y completa las variables (ver detalle abajo).
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
| `DATABASE_URL` | Cadena de conexión de la base de datos (`file:./dev.db` para SQLite). |
| `JWT_SECRET` | Secreto largo y aleatorio para firmar sesiones de admin **y** los códigos QR. Cámbialo antes de producción. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales usadas por `npm run seed:admin` para crear el primer administrador. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | Datos del proveedor de correo transaccional (ver recomendaciones abajo). |
| `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL` | Nombre y correo que verán los asistentes como remitente. |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` | Credenciales de WhatsApp Cloud API (Meta for Developers). |
| `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG` | Nombre e idioma de la plantilla de WhatsApp aprobada (ver más abajo). |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio en producción (para enlaces en el correo). |

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

Todas las imágenes subidas se guardan en `public/uploads/` (excluido de git).

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

## Despliegue en producción

1. Configura una base de datos persistente (SQLite en un volumen persistente, o PostgreSQL).
2. Define todas las variables de entorno en tu proveedor de hosting.
3. Ejecuta `npx prisma migrate deploy` y `npm run seed:admin` una sola vez.
4. `npm run build && npm run start`.
5. Verifica que `/opt/pw-browsers` (Chromium) esté disponible en el entorno de producción para la
   generación de boletas; si tu hosting no lo incluye, instala Playwright con
   `npx playwright install --with-deps chromium` en el proceso de build.
