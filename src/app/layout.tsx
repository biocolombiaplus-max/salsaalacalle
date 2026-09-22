import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { isVideoUrl } from "@/lib/media";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function absoluteUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = `${settings.eventoNombre} · ${settings.eventoEdicion}`;
  // La vista previa de WhatsApp/Facebook usa el logo de la marca primero
  // (identidad reconocible, como hacen las grandes marcas); si no hay logo,
  // cae a una foto del hero (nunca un video: esas vistas previas necesitan
  // una imagen estática).
  const heroForPreview = settings.heroImagenes.find((url) => !isVideoUrl(url));
  const previewImage = absoluteUrl(settings.logoUrl || heroForPreview || "");

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: settings.eventoDescripcion,
    icons: settings.logoUrl ? { icon: settings.logoUrl, apple: settings.logoUrl } : undefined,
    openGraph: {
      title,
      description: settings.eventoDescripcion,
      url: SITE_URL,
      siteName: settings.eventoNombre,
      locale: "es_CO",
      type: "website",
      images: previewImage ? [{ url: previewImage, width: 1200, height: 1200, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: settings.eventoDescripcion,
      images: previewImage ? [previewImage] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html lang="es">
      <head>
        <style>{`:root{--wine:${settings.colorPrimario};--gold:${settings.colorSecundario};--green:${settings.colorTerciario};}`}</style>
      </head>
      <body className={`${playfair.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
