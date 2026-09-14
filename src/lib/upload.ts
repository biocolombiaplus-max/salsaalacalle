import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { put } from "@vercel/blob";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function saveUploadedImage(file: File, folder: "hero" | "gallery" | "misc"): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen supera el tamaño máximo de 8MB.");
  }
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

  // En Vercel el sistema de archivos es de solo lectura (salvo /tmp, que no persiste),
  // así que las imágenes que sube el admin se guardan en Vercel Blob cuando está disponible.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${folder}/${name}`, file, {
      access: "public",
      contentType: file.type,
    });
    return blob.url;
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, name);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buf);
  return `/uploads/${folder}/${name}`;
}
