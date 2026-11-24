import { prisma } from "@/lib/db";

export type ProgramaItem = { hora: string; actividad: string };
export type Patrocinador = {
  nombre: string;
  logoUrl: string;
  altura?: number;
  link?: string;
  destacado?: boolean;
  bordeBlanco?: boolean;
  bordeGrosor?: number;
};

export type SiteSettings = {
  eventoNombre: string;
  eventoEdicion: string;
  eventoFechaISO: string;
  eventoFechaTexto: string;
  eventoHoraTexto: string;
  eventoLugar: string;
  eventoDireccion: string;
  eventoCiudad: string;
  googleMapsUrl: string;
  eventoDescripcion: string;
  eventoCupo: string;
  eventoPrograma: ProgramaItem[];
  logoUrl: string;
  logoAltura: number;
  colorPrimario: string;
  colorSecundario: string;
  colorTerciario: string;
  heroImagenes: string[];
  heroOcultarTitulo: boolean;
  galeriaImagenes: string[];
  boletaFondoUrl: string;
  sobreImagenUrl: string;
  seguridadImagenUrl: string;
  programaImagenUrl: string;
  ctaImagenUrl: string;
  patrocinadores: Patrocinador[];
  patrocinadoresLogoAltura: number;
  patrocinadoresFondoUrl: string;
  redesInstagram: string;
  redesFacebook: string;
  redesTiktok: string;
  redesYoutube: string;
  redesWhatsapp: string;
  contactoEmail: string;
  contactoTelefono: string;
  legalResponsable: string;
  legalNit: string;
  creditoBoleteria: string;
  creditoBoleteriaUrl: string;
  creditoSidLogoUrl: string;
  creditoSidUrl: string;
  creditoBioLogoUrl: string;
  creditoBioUrl: string;
  causaSocialActiva: boolean;
  causaSocialTitulo: string;
  causaSocialDescripcion: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  eventoNombre: "Salsa a la Calle",
  eventoEdicion: "VOLUMEN 5",
  eventoFechaISO: "2026-11-27T18:00:00-05:00",
  eventoFechaTexto: "Viernes 27 de noviembre de 2026",
  eventoHoraTexto: "Desde las 6:00 p.m.",
  eventoLugar: "Plazoleta de Ventura Plaza",
  eventoDireccion: "Junto a Movistar, Parque Fundadores (Calle 10 y Av. 0), Cúcuta",
  eventoCiudad: "Cúcuta",
  googleMapsUrl: "",
  eventoDescripcion:
    "El encuentro salsero más esperado de Cúcuta regresa por quinta vez consecutiva: una tarde y noche para bailar, compartir y vivir la salsa en comunidad, con música en vivo, DJ invitados, ruedas de casino y el mejor ambiente de la ciudad.",
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
  logoAltura: 64,
  colorPrimario: "#F0240C",
  colorSecundario: "#FC9000",
  colorTerciario: "#7FA30F",
  heroImagenes: [],
  heroOcultarTitulo: false,
  galeriaImagenes: [],
  boletaFondoUrl: "",
  sobreImagenUrl: "",
  seguridadImagenUrl: "",
  programaImagenUrl: "",
  ctaImagenUrl: "",
  patrocinadores: [],
  patrocinadoresLogoAltura: 32,
  patrocinadoresFondoUrl: "",
  redesInstagram: "",
  redesFacebook: "",
  redesTiktok: "",
  redesYoutube: "",
  redesWhatsapp: "",
  contactoEmail: "",
  contactoTelefono: "",
  legalResponsable: "Salsa a la Calle",
  legalNit: "",
  creditoBoleteria: "SID & Biomarketing",
  creditoBoleteriaUrl: "",
  creditoSidLogoUrl: "",
  creditoSidUrl: "",
  creditoBioLogoUrl: "",
  creditoBioUrl: "",
  causaSocialActiva: true,
  causaSocialTitulo: "Baila con causa",
  causaSocialDescripcion:
    "Este diciembre, Salsa a la Calle se une a una causa especial: trae un juguete nuevo o en buen estado y ayúdanos a regalarle una sonrisa a niños y niñas en condición de vulnerabilidad de Cúcuta. No tiene que ser costoso — un trompo, un yoyo, un balón, una muñeca, cualquier juguete que haga feliz a un niño cuenta. Más que pagar una entrada, es apoyar una bonita causa mientras disfrutas la mejor música del mundo.",
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
    } else if (typeof defaultVal === "number") {
      const num = Number(raw);
      if (!Number.isNaN(num)) (merged as Record<string, unknown>)[key] = num;
    } else if (typeof defaultVal === "boolean") {
      (merged as Record<string, unknown>)[key] = raw === "true";
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
