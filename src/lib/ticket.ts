import crypto from "crypto";
import QRCode from "qrcode";

const QR_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos

function randomCode(length: number): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export function createTicketCode(edicion = "4"): string {
  return `SAC${edicion}-${randomCode(3)}-${randomCode(3)}`;
}

function sign(ticketCode: string): string {
  return crypto
    .createHmac("sha256", QR_SECRET)
    .update(ticketCode)
    .digest("hex")
    .slice(0, 10);
}

/** Contenido compacto que se codifica en el QR físico de la boleta. */
export function buildQrPayload(ticketCode: string): string {
  return `SALSAALACALLE|${ticketCode}|${sign(ticketCode)}`;
}

export function verifyQrPayload(
  payload: string
): { valid: boolean; ticketCode?: string; reason?: string } {
  const parts = (payload || "").trim().split("|");
  if (parts.length !== 3 || parts[0] !== "SALSAALACALLE") {
    return { valid: false, reason: "Formato de código no reconocido" };
  }
  const [, ticketCode, signature] = parts;
  const expected = sign(ticketCode);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  const valid =
    sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  if (!valid) return { valid: false, reason: "Firma inválida, posible boleta falsa" };
  return { valid: true, ticketCode };
}

export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 8,
    color: { dark: "#1a1a1a", light: "#ffffffff" },
  });
}
