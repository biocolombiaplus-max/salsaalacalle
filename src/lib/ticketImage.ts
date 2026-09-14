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
  html, body { width: 1200px; height: 520px; font-family: 'Georgia', 'Times New Roman', serif; }
  body { background: #0b0b0d; }
  .ticket {
    position: relative;
    width: 1200px; height: 520px;
    display: flex;
    overflow: hidden;
    border-radius: 22px;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.06);
  }
  .main {
    position: relative;
    flex: 1;
    background: ${bgDataUri ? `url(${bgDataUri}) center/cover no-repeat` : `radial-gradient(circle at 20% 20%, ${secondary}33, transparent 55%), linear-gradient(135deg, #1a0d12 0%, #2b0f16 45%, #120a0c 100%)`};
    color: #fff;
    padding: 46px 50px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .main::before {
    content: "";
    position: absolute; inset: 0;
    background: linear-gradient(100deg, rgba(6,4,5,0.92) 0%, rgba(10,6,7,0.72) 45%, rgba(10,6,7,0.55) 100%);
  }
  .main > * { position: relative; z-index: 1; }
  .top-row { display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 16px; }
  .brand img { height: 58px; width: auto; border-radius: 10px; }
  .brand-text .name { font-size: 26px; font-weight: 700; letter-spacing: 0.5px; color: #fff; }
  .brand-text .edition { font-size: 14px; letter-spacing: 3px; text-transform: uppercase; color: ${secondary}; margin-top: 4px; }
  .badge-free {
    border: 1.5px solid ${secondary};
    color: ${secondary};
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 8px 14px;
    border-radius: 999px;
    font-family: Arial, sans-serif;
  }
  .attendee { margin-top: 10px; }
  .attendee .label { font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: ${secondary}; margin-bottom: 8px; }
  .attendee .value { font-size: 40px; font-weight: 700; color: #fff; max-width: 640px; line-height: 1.15; }
  .meta-row { display: flex; gap: 46px; font-family: Arial, sans-serif; }
  .meta-row .item .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: ${secondary}; margin-bottom: 6px; }
  .meta-row .item .value { font-size: 17px; color: #f4eee7; font-weight: 600; }
  .stub {
    position: relative;
    width: 340px;
    background: linear-gradient(160deg, #121013 0%, #1c1518 100%);
    color: #fff;
    padding: 40px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    border-left: 2px dashed rgba(255,255,255,0.18);
  }
  .stub::before, .stub::after {
    content: "";
    position: absolute; left: -16px;
    width: 32px; height: 32px;
    background: #0b0b0d;
    border-radius: 50%;
  }
  .stub::before { top: -16px; }
  .stub::after { bottom: -16px; }
  .qr-wrap { background: #fff; padding: 14px; border-radius: 14px; }
  .qr-wrap img { width: 190px; height: 190px; display: block; }
  .code { font-family: 'Courier New', monospace; font-size: 22px; letter-spacing: 3px; font-weight: 700; color: ${secondary}; margin-top: 18px; }
  .instructions { font-family: Arial, sans-serif; font-size: 11px; color: #cbbfc2; text-align: center; line-height: 1.5; margin-top: 14px; }
  .watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%) rotate(-18deg);
    font-family: Arial, sans-serif;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: 8px;
    color: rgba(255,255,255,0.07);
    white-space: nowrap;
    z-index: 5;
    pointer-events: none;
  }
  .footer-note { font-family: Arial, sans-serif; font-size: 12px; color: #d8cfc9; opacity: 0.85; }
  .footer-note b { color: ${secondary}; }
</style>
</head>
<body>
  <div class="ticket">
    <div class="main">
      <div class="top-row">
        <div class="brand">
          ${logoDataUri ? `<img src="${logoDataUri}" />` : ""}
          <div class="brand-text">
            <div class="name">${escapeHtml(settings.eventoNombre)}</div>
            <div class="edition">${escapeHtml(settings.eventoEdicion)}</div>
          </div>
        </div>
        <div class="badge-free">Entrada libre · Sin costo</div>
      </div>
      <div class="attendee">
        <div class="label">Boleta de asistencia</div>
        <div class="value">${escapeHtml(nombre)}</div>
      </div>
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
      <div class="footer-note">Esta boleta <b>no tiene costo</b> y puede ser presentada por cualquier persona (es transferible). El código QR es un control de seguridad para el ingreso, no representa ningún cobro.</div>
    </div>
    <div class="stub">
      <div class="watermark">GRATIS · NO TIENE COSTO</div>
      <div class="qr-wrap"><img src="${qrDataUrl}" /></div>
      <div class="code">${escapeHtml(ticketCode)}</div>
      <div class="instructions">Presenta este código QR en el ingreso para validar tu entrada de forma rápida y sin filas.</div>
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 520 } });
  try {
    await page.setContent(html, { waitUntil: "networkidle" });
    const el = await page.$(".ticket");
    const buf = await (el ?? page).screenshot({ type: "png" });
    return buf as Buffer;
  } finally {
    await page.close();
  }
}
