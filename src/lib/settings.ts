import { prisma } from "@/lib/db";

export type ProgramaItem = { hora: string; actividad: string };

export type SiteSettings = {
  eventoNombre: string;
  eventoEdicion: string;
  eventoFechaISO: string;
  eventoFechaTexto: string;
  eventoHoraTexto: string;
  eventoLugar: string;
  eventoDireccion: string;
  eventoCiudad: string;
  eventoDescripcion: string;
  eventoCupo: string;
  eventoPrograma: ProgramaItem[];
  logoUrl: string;
  colorPrimario: string;
  colorSecundario: string;
  colorTerciario: string;
  heroImagenes: string[];
  galeriaImagenes: string[];
  boletaFondoUrl: string;
  redesInstagram: string;
  redesFacebook: string;
  redesTiktok: string;
  redesYoutube: string;
  redesWhatsapp: string;
  contactoEmail: string;
  contactoTelefono: string;
  legalResponsable: string;
  legalNit: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  eventoNombre: "Salsa a la Calle",
  eventoEdicion: "4to Encuentro Salsero 2026",
  eventoFechaISO: "2026-09-26T19:00:00-05:00",
  eventoFechaTexto: "Sábado 26 de septiembre de 2026",
  eventoHoraTexto: "7:00 p.m. — 3:00 a.m.",
  eventoLugar: "Por confirmar",
  eventoDireccion: "Cúcuta, Norte de Santander",
  eventoCiudad: "Cúcuta",
  eventoDescripcion:
    "El encuentro salsero más esperado de Cúcuta regresa por cuarta vez consecutiva: una tarde y noche para bailar, compartir y vivir la salsa en comunidad, con música en vivo, DJ invitados, ruedas de casino y el mejor ambiente de la ciudad.",
  eventoCupo: "Cupos limitados",
  eventoPrograma: [
    { hora: "7:00 p.m.", actividad: "Apertura de puertas y registro de asistentes" },
    { hora: "8:00 p.m.", actividad: "Clase abierta de salsa y rueda de casino" },
    { hora: "9:00 p.m.", actividad: "Presentación de agrupaciones invitadas" },
    { hora: "10:30 p.m.", actividad: "Concurso social de baile" },
    { hora: "11:30 p.m.", actividad: "Salsa en vivo y DJ" },
    { hora: "3:00 a.m.", actividad: "Cierre del evento" },
  ],
  logoUrl: "/brand/logo-salsa-a-la-calle.jpg",
  colorPrimario: "#F0240C",
  colorSecundario: "#FC9000",
  colorTerciario: "#7FA30F",
  heroImagenes: [],
  galeriaImagenes: [],
  boletaFondoUrl: "",
  redesInstagram: "",
  redesFacebook: "",
  redesTiktok: "",
  redesYoutube: "",
  redesWhatsapp: "",
  contactoEmail: "",
  contactoTelefono: "",
  legalResponsable: "Salsa a la Calle",
  legalNit: "",
};

let cache: { data: SiteSettings; ts: number } | null = null;
const CACHE_MS = 5000;

export async function getSettings(forceFresh = false): Promise<SiteSettings> {
  if (!forceFresh && cache && Date.now() - cache.ts < CACHE_MS) {
    return cache.data;
  }
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const merged: SiteSettings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]) {
    const raw = map.get(key);
    if (raw === undefined) continue;
    const defaultVal = DEFAULT_SETTINGS[key];
    if (typeof defaultVal === "object") {
      try {
        (merged as Record<string, unknown>)[key] = JSON.parse(raw);
      } catch {
        // keep default if malformed
      }
    } else {
      (merged as Record<string, unknown>)[key] = raw;
    }
  }
  cache = { data: merged, ts: Date.now() };
  return merged;
}

export async function updateSettings(partial: Partial<SiteSettings>): Promise<void> {
  const entries = Object.entries(partial) as [keyof SiteSettings, unknown][];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value: typeof value === "object" ? JSON.stringify(value) : String(value),
        },
        update: {
          value: typeof value === "object" ? JSON.stringify(value) : String(value),
        },
      })
    )
  );
  cache = null;
}
