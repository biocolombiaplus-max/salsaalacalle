// Traza un contorno blanco pegado a la silueta de un logo (sin fondo/tarjeta),
// apilando varios drop-shadow sin blur alrededor en círculo. Se usa tanto en
// la landing como en la vista previa del panel admin, para que ambas luzcan igual.
export function whiteOutlineFilter(thicknessPx: number, steps = 10): string {
  const shadows: string[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const x = (Math.cos(angle) * thicknessPx).toFixed(2);
    const y = (Math.sin(angle) * thicknessPx).toFixed(2);
    shadows.push(`drop-shadow(${x}px ${y}px 0 #fff)`);
  }
  return shadows.join(" ");
}
