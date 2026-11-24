// Redimensiona una imagen en el navegador antes de subirla. Un logo a
// resolución nativa (a veces miles de píxeles, varios MB) hace que el
// navegador se trabe al renderizarlo o al aplicarle efectos (ej. el
// contorno blanco); pero reducirlo demasiado lo deja borroso/pixelado al
// mostrarse en tarjetas grandes o en pantallas retina. Se re-codifica
// siempre a PNG para conservar la transparencia del logo original.

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });
}

export async function resizeImageFile(file: File, minDim = 400, maxDim = 1200): Promise<File> {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const longSide = Math.max(img.naturalWidth, img.naturalHeight);
  const shortSide = Math.min(img.naturalWidth, img.naturalHeight);

  // Los logos se muestran por altura (el lado corto, casi siempre, en logos
  // horizontales tipo wordmark): si solo se limita el lado largo, un logo
  // muy ancho y bajo puede quedar con muy pocos píxeles de alto y verse
  // borroso/pixelado al mostrarse más grande o en pantallas retina. Por eso
  // se respeta un mínimo en el lado corto, aunque eso deje el lado largo
  // un poco por encima de maxDim en logos con proporciones muy extremas.
  const scaleForMax = maxDim / longSide;
  const scaleForMin = shortSide > 0 ? minDim / shortSide : 1;
  const scale = Math.min(1, Math.max(scaleForMax, scaleForMin));

  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return file;

  const name = file.name.replace(/\.\w+$/, "") + ".png";
  return new File([blob], name, { type: "image/png" });
}
