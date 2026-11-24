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

const MIN_DIM = 400;
const MAX_DIM = 1200;

export async function removeSolidBackground(logoUrl: string, tolerance = 42): Promise<Blob> {
  const img = await loadImage(resolveImageSrcForCanvas(logoUrl));
  const longSide = Math.max(img.naturalWidth, img.naturalHeight);
  const shortSide = Math.min(img.naturalWidth, img.naturalHeight);
  // Igual que en resizeImage.ts: respeta un mínimo en el lado corto para no
  // dejar el logo borroso en pantallas retina, aunque eso implique superar
  // un poco MAX_DIM en logos de proporciones muy extremas.
  const scaleForMax = MAX_DIM / longSide;
  const scaleForMin = shortSide > 0 ? MIN_DIM / shortSide : 1;
  const scale = Math.min(1, Math.max(scaleForMax, scaleForMin));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

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
  let aSum = 0;
  for (const c of corners) {
    rSum += data[c];
    gSum += data[c + 1];
    bSum += data[c + 2];
    aSum += data[c + 3];
  }
  const bgR = rSum / 4;
  const bgG = gSum / 4;
  const bgB = bSum / 4;
  const bgA = aSum / 4;
  const tol2 = tolerance * tolerance;

  // Si las esquinas ya son transparentes, la imagen no tiene un fondo sólido
  // que quitar (ya viene con transparencia real, con degradados o sombras
  // suaves). Procesarla de todos modos puede "morder" esos bordes suaves y
  // dejar ruido. Mejor no tocarla.
  if (bgA < 200) {
    throw new Error("Esta imagen ya tiene fondo transparente, no hace falta quitarlo.");
  }

  const visited = new Uint8Array(w * h);
  // [x, y, refR, refG, refB] por cada pixel en cola.
  const stack: number[] = [];

  // Compara cada pixel contra el color de SU VECINO ya aceptado (no contra un
  // único color fijo de referencia). Esto deja avanzar el flood-fill a través
  // de degradados suaves, viñetas o ruido de compresión JPEG en el fondo,
  // sin dejar "islas" sin limpiar, pero sigue frenando en seco al llegar a
  // los colores del logo (el salto de color ahí es mucho más brusco).
  function tryEnqueue(x: number, y: number, refR: number, refG: number, refB: number) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    const o = idx * 4;
    // Solo se considera "fondo" un pixel ya casi opaco. Uno que ya viene
    // semi-transparente (sombra suave, degradado del propio logo) se deja
    // intacto, sin importar qué tan parecido sea su color al del fondo.
    if (data[o + 3] < 200) return;
    const dr = data[o] - refR;
    const dg = data[o + 1] - refG;
    const db = data[o + 2] - refB;
    if (dr * dr + dg * dg + db * db <= tol2) {
      data[o + 3] = 0;
      stack.push(x, y, data[o], data[o + 1], data[o + 2]);
    }
  }

  for (let x = 0; x < w; x++) {
    tryEnqueue(x, 0, bgR, bgG, bgB);
    tryEnqueue(x, h - 1, bgR, bgG, bgB);
  }
  for (let y = 0; y < h; y++) {
    tryEnqueue(0, y, bgR, bgG, bgB);
    tryEnqueue(w - 1, y, bgR, bgG, bgB);
  }

  while (stack.length) {
    const refB = stack.pop()!;
    const refG = stack.pop()!;
    const refR = stack.pop()!;
    const y = stack.pop()!;
    const x = stack.pop()!;
    tryEnqueue(x + 1, y, refR, refG, refB);
    tryEnqueue(x - 1, y, refR, refG, refB);
    tryEnqueue(x, y + 1, refR, refG, refB);
    tryEnqueue(x, y - 1, refR, refG, refB);
  }

  // Limpieza final: algún pixel ruidoso puede sobrevivir aislado justo en el
  // borde entre el fondo ya removido y el logo. Si un pixel que sigue opaco
  // está rodeado mayormente de transparencia y su color todavía se parece al
  // fondo (con un margen más amplio), también se quita.
  const looseTol2 = tolerance * 1.6 * (tolerance * 1.6);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const o = idx * 4;
        if (data[o + 3] < 200) continue;
        let transparentNeighbors = 0;
        let totalNeighbors = 0;
        for (const [nx, ny] of [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ]) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          totalNeighbors++;
          if (data[(ny * w + nx) * 4 + 3] === 0) transparentNeighbors++;
        }
        if (totalNeighbors === 0 || transparentNeighbors / totalNeighbors < 0.5) continue;
        const dr = data[o] - bgR;
        const dg = data[o + 1] - bgG;
        const db = data[o + 2] - bgB;
        if (dr * dr + dg * dg + db * db <= looseTol2) {
          data[o + 3] = 0;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen"));
    }, "image/png");
  });
}
