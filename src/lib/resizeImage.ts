// Redimensiona una imagen en el navegador antes de subirla. Un logo nunca
// necesita más de unos cientos de píxeles de lado — subirlo a resolución
// nativa (a veces miles de píxeles, varios MB) hace que el navegador se
// trabe al renderizarlo o al aplicarle efectos (ej. el contorno blanco),
// además de pesar innecesariamente. Se re-codifica siempre a PNG para
// conservar la transparencia del logo original.

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

export async function resizeImageFile(file: File, maxDim = 500): Promise<File> {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
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
