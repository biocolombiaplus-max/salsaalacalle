import path from "path";
import fs from "fs/promises";
import { chromium } from "playwright-core";
import type { SiteSettings } from "@/lib/settings";

// Chromium preinstalado en el entorno de desarrollo de este sandbox.
const LOCAL_CHROMIUM_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

async function fetchAsDataUri(url: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const type = res.headers.get("content-type") || "image/jpeg";
  return `data:${type};base64,${buf.toString("base64")}`;
}

async function toDataUri(src: string): Promise<string | null> {
  if (!src) return null;
  try {
    if (src.startsWith("http://") || src.startsWith("https://")) {
      return await fetchAsDataUri(src);
    }
    if (src.startsWith("data:")) return src;

    const rel = src.startsWith("/") ? src.slice(1) : src;
    try {
      const filePath = path.join(process.cwd(), "public", rel);
      const buf = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const type =
        ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
      return `data:${type};base64,${buf.toString("base64")}`;
    } catch {
      // En despliegues serverless (Vercel) los assets de /public no siempre son
      // accesibles por el sistema de archivos dentro de la función; como respaldo
      // los pedimos por HTTP al propio sitio.
      const base = process.env.NEXT_PUBLIC_SITE_URL;
      if (!base) return null;
      return await fetchAsDataUri(`${base}${src}`);
    }
  } catch {
    return null;
  }
}

export type TicketData = {
  nombre: string;
  ticketCode: string;
  qrDataUrl: string;
  settings: SiteSettings;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ticketHtml(data: TicketData, bgDataUri: string | null, logoDataUri: string | null): string {
  const { nombre, ticketCode, qrDataUrl, settings } = data;
  const secondary = settings.colorSecundario || "#e0a638";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 900px; height: 1600px; font-family: 'Georgia', 'Times New Roman', serif; }
  body { background: #0b0b0d; }
  .ticket {
    position: relative;
    width: 900px; height: 1600px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 32px;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.06);
  }
  .main {
    position: relative;
    flex: 1;
    background: ${bgDataUri ? `url(${bgDataUri}) center/cover no-repeat` : `radial-gradient(circle at 30% 12%, ${secondary}33, transparent 55%), linear-gradient(160deg, #1a0d12 0%, #2b0f16 45%, #120a0c 100%)`};
    color: #fff;
    padding: 72px 64px 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .main::before {
    content: "";
    position: absolute; inset: 0;
    background: linear-gradient(190deg, rgba(6,4,5,0.55) 0%, rgba(8,5,6,0.82) 35%, rgba(8,5,6,0.94) 100%);
  }
  .main > * { position: relative; z-index: 1; }
  .watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%) rotate(-22deg);
    font-family: Arial, sans-serif;
    font-size: 46px;
    font-weight: 800;
    letter-spacing: 12px;
    color: rgba(255,255,255,0.05);
    white-space: nowrap;
    z-index: 0;
    pointer-events: none;
  }
  .brand { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .brand img { height: 92px; width: auto; border-radius: 16px; margin-bottom: 20px; }
  .brand .name { font-size: 38px; font-weight: 700; letter-spacing: 0.5px; color: #fff; }
  .brand .edition { font-size: 17px; letter-spacing: 4px; text-transform: uppercase; color: ${secondary}; margin-top: 10px; }
  .badge-free {
    margin-top: 26px;
    border: 1.5px solid ${secondary};
    color: ${secondary};
    font-size: 14px;
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 12px 26px;
    border-radius: 999px;
    font-family: Arial, sans-serif;
  }
  .attendee { margin-top: 56px; text-align: center; width: 100%; }
  .attendee .label { font-family: Arial, sans-serif; font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: ${secondary}; margin-bottom: 14px; }
  .attendee .value { font-size: 52px; font-weight: 700; color: #fff; line-height: 1.15; max-width: 760px; margin: 0 auto; }
  .divider { position: relative; width: 100%; margin: 56px 0; height: 0; border-top: 2px dashed rgba(255,255,255,0.22); }
  .divider::before, .divider::after {
    content: "";
    position: absolute; top: 50%;
    width: 44px; height: 44px;
    background: #0b0b0d;
    border-radius: 50%;
    transform: translateY(-50%);
  }
  .divider::before { left: -64px; }
  .divider::after { right: -64px; }
  .meta-row { display: flex; justify-content: space-between; gap: 20px; width: 100%; font-family: Arial, sans-serif; }
  .meta-row .item { text-align: center; flex: 1; }
  .meta-row .item .label { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: ${secondary}; margin-bottom: 10px; }
  .meta-row .item .value { font-size: 19px; color: #f4eee7; font-weight: 600; line-height: 1.35; }
  .qr-section { margin-top: 56px; display: flex; flex-direction: column; align-items: center; }
  .qr-wrap { background: #fff; padding: 26px; border-radius: 22px; }
  .qr-wrap img { width: 320px; height: 320px; display: block; }
  .code { font-family: 'Courier New', monospace; font-size: 32px; letter-spacing: 5px; font-weight: 700; color: ${secondary}; margin-top: 28px; }
  .instructions { font-family: Arial, sans-serif; font-size: 15px; color: #cbbfc2; text-align: center; line-height: 1.6; margin-top: 18px; max-width: 560px; }
  .footer-note { font-family: Arial, sans-serif; font-size: 14px; color: #d8cfc9; opacity: 0.85; text-align: center; line-height: 1.6; margin-top: auto; padding-top: 40px; max-width: 640px; }
  .footer-note b { color: ${secondary}; }
</style>
</head>
<body>
  <div class="ticket">
    <div class="main">
      <div class="watermark">GRATIS · NO TIENE COSTO</div>
      <div class="brand">
        ${logoDataUri ? `<img src="${logoDataUri}" />` : ""}
        <div class="name">${escapeHtml(settings.eventoNombre)}</div>
        <div class="edition">${escapeHtml(settings.eventoEdicion)}</div>
        <div class="badge-free">Entrada libre · Sin costo</div>
      </div>

      <div class="attendee">
        <div class="label">Boleta de asistencia</div>
        <div class="value">${escapeHtml(nombre)}</div>
      </div>

      <div class="divider"></div>

      <div class="meta-row">
        <div class="item">
          <div class="label">Fecha</div>
          <div class="value">${escapeHtml(settings.eventoFechaTexto)}</div>
        </div>
        <div class="item">
          <div class="label">Hora</div>
          <div class="value">${escapeHtml(settings.eventoHoraTexto)}</div>
        </div>
        <div class="item">
          <div class="label">Lugar</div>
          <div class="value">${escapeHtml(settings.eventoLugar)}</div>
        </div>
      </div>

      <div class="qr-section">
        <div class="qr-wrap"><img src="${qrDataUrl}" /></div>
        <div class="code">${escapeHtml(ticketCode)}</div>
        <div class="instructions">Presenta este código QR en el ingreso para validar tu entrada de forma rápida y sin filas.</div>
      </div>

      <div class="footer-note">Esta boleta <b>no tiene costo</b> y puede ser presentada por cualquier persona (es transferible). El código QR es un control de seguridad para el ingreso, no representa ningún cobro.</div>
    </div>
  </div>
</body>
</html>`;
}

let browserSingleton: import("playwright-core").Browser | null = null;

async function getBrowser() {
  if (browserSingleton && browserSingleton.isConnected()) return browserSingleton;

  if (process.env.VERCEL) {
    // Vercel (y otros entornos serverless) no traen Chromium preinstalado:
    // usamos un binario empaquetado para funciones serverless.
    const sparticuzChromium = (await import("@sparticuz/chromium")).default;
    browserSingleton = await chromium.launch({
      executablePath: await sparticuzChromium.executablePath(),
      args: sparticuzChromium.args,
    });
  } else {
    browserSingleton = await chromium.launch({
      executablePath: LOCAL_CHROMIUM_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserSingleton;
}

export async function renderTicketPng(data: TicketData): Promise<Buffer> {
  const [bgDataUri, logoDataUri] = await Promise.all([
    toDataUri(data.settings.boletaFondoUrl),
    toDataUri(data.settings.logoUrl),
  ]);
  const html = ticketHtml(data, bgDataUri, logoDataUri);
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width: 900, height: 1600 } });
  try {
    await page.setContent(html, { waitUntil: "networkidle" });
    const el = await page.$(".ticket");
    const buf = await (el ?? page).screenshot({ type: "png" });
    return buf as Buffer;
  } finally {
    await page.close();
  }
}
