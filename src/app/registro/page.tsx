import { getSettings } from "@/lib/settings";
import RegistroForm from "@/components/RegistroForm";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 0;

export default async function RegistroPage() {
  const s = await getSettings();

  return (
    <main className="min-h-screen bg-background text-foreground px-5 sm:px-8 py-14 sm:py-20">
      <div className="max-w-lg mx-auto">
        <div className="flex flex-col items-center text-center mb-10">
          <Link href="/" className="flex items-center gap-3 mb-6">
            {s.logoUrl ? (
              <Image
                src={s.logoUrl}
                alt={s.eventoNombre}
                width={160}
                height={160}
                className="h-24 w-auto object-contain drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-wine to-gold" />
            )}
          </Link>
          <p className="uppercase tracking-[0.3em] text-gold text-xs mb-3">Registro gratuito</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">{s.eventoEdicion}</h1>
          <p className="text-white/60 text-sm mt-3">
            {s.eventoFechaTexto} · {s.eventoLugar}
          </p>
        </div>

        <RegistroForm />

        <p className="text-center text-[11px] text-white/40 mt-8 leading-relaxed">
          Tu boleta no tiene ningún costo. Este registro es un nuevo control de ingreso pensado
          únicamente para brindarte seguridad y una entrada más ágil, sin filas.
        </p>
      </div>
    </main>
  );
}
