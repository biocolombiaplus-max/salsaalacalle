// Quita un fondo de color sólido (ej. blanco) de un logo subido, para que
// el contorno/borde blanco y el carrusel de patrocinadores se vean bien sobre
// el fondo oscuro del sitio, sin un bloque rectangular opaco alrededor.
// Usa flood-fill desde el borde de la imagen: solo vuelve transparentes los
// píxeles conectados al borde que son parecidos al color del fondo, así que
// no perfora huecos dentro del propio logo.

function resolveImageSrcForCanvas(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return `/api/admin/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
}

const MAX_DIM = 900;

export async function removeSolidBackground(logoUrl: string, tolerance = 42): Promise<Blob> {
  const img = await loadImage(resolveImageSrcForCanvas(logoUrl));
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (Math.max(w, h) > MAX_DIM) {
    const scale = MAX_DIM / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Color de referencia del fondo: promedio de las 4 esquinas.
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  for (const c of corners) {
    rSum += data[c];
    gSum += data[c + 1];
    bSum += data[c + 2];
  }
  const bgR = rSum / 4;
  const bgG = gSum / 4;
  const bgB = bSum / 4;
  const tol2 = tolerance * tolerance;

  const visited = new Uint8Array(w * h);
  const stack: number[] = [];

  function tryEnqueue(x: number, y: number) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    const o = idx * 4;
    const dr = data[o] - bgR;
    const dg = data[o + 1] - bgG;
    const db = data[o + 2] - bgB;
    if (dr * dr + dg * dg + db * db <= tol2) {
      data[o + 3] = 0;
      stack.push(x, y);
    }
  }

  for (let x = 0; x < w; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryEnqueue(0, y);
    tryEnqueue(w - 1, y);
  }

  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    tryEnqueue(x + 1, y);
    tryEnqueue(x - 1, y);
    tryEnqueue(x, y + 1);
    tryEnqueue(x, y - 1);
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen"));
    }, "image/png");
  });
}
