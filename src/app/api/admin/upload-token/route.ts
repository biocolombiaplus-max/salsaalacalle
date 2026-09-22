import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth";

// Autoriza subidas directas del navegador a Vercel Blob (sin pasar por el
// cuerpo de esta función serverless). Se usa para el hero y la galería, que
// ahora también aceptan video: un archivo de video de varios MB supera el
// límite de tamaño de body que Vercel impone a las funciones serverless, así
// que subirlo "de servidor" (como las imágenes sueltas del resto del panel)
// fallaría. Con este flujo, el navegador sube el archivo directo al Blob
// store usando un token de un solo uso que se genera aquí.
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const MAX_BYTES = 100 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar el token de subida";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
