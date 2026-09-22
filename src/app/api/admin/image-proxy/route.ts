import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// El generador de historias dibuja logos de patrocinadores en un <canvas> y
// después exporta el resultado con canvas.toDataURL(). Eso requiere que las
// imágenes se carguen en modo CORS (crossOrigin="anonymous"); si el logo
// vive en un dominio externo (ej. el sitio propio del patrocinador) que no
// manda cabeceras CORS, el navegador ni siquiera carga la imagen. Este
// endpoint la trae desde el servidor (sin restricción CORS) y se la sirve
// al navegador desde nuestro propio origen, donde no hace falta CORS.
const MAX_BYTES = 15 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Falta el parámetro url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Protocolo no permitido" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(10000),
      headers: {
        // Algunos sitios bloquean peticiones que se identifican como bot
        // (protección contra hotlinking). Nos presentamos como un
        // navegador normal para que esos logos también se puedan traer.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: `${parsed.protocol}//${parsed.host}/`,
      },
    });
  } catch {
    return NextResponse.json({ error: "No se pudo descargar la imagen" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: `La imagen respondió ${upstream.status}` }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "El link no apunta a una imagen" }, { status: 415 });
  }

  const contentLength = Number(upstream.headers.get("content-length") || 0);
  if (contentLength > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen es demasiado pesada" }, { status: 413 });
  }

  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen es demasiado pesada" }, { status: 413 });
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
