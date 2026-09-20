import Link from "next/link";
import Image from "next/image";
import { getSettings } from "@/lib/settings";
import Countdown from "@/components/Countdown";

export const revalidate = 0;

const SOCIAL_ICONS = {
  redesInstagram: "Instagram",
  redesFacebook: "Facebook",
  redesTiktok: "TikTok",
  redesYoutube: "YouTube",
  redesWhatsapp: "WhatsApp",
};

export default async function Home() {
  const s = await getSettings();
  const heroImg = s.heroImagenes[0] || "";
  const socials = (Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[])
    .map((key) => ({ key, label: SOCIAL_ICONS[key], url: s[key] as string }))
    .filter((x) => x.url);

  return (
    <main className="bg-background text-foreground">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-8 py-3">
          <div className="flex items-center gap-3">
            {s.logoUrl ? (
              <Image
                src={s.logoUrl}
                alt={s.eventoNombre}
                width={s.logoAltura * 2}
                height={s.logoAltura * 2}
                style={{ height: `clamp(2rem, 10vw, ${s.logoAltura}px)` }}
                className="w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-wine to-gold flex items-center justify-center font-display font-bold text-sm">
                SC
              </div>
            )}
            <span className="font-display text-lg tracking-wide">{s.eventoNombre}</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <a href="#evento" className="hover:text-gold transition-colors">El evento</a>
            <a href="#programa" className="hover:text-gold transition-colors">Programación</a>
            <a href="#galeria" className="hover:text-gold transition-colors">Galería</a>
            <a href="#seguridad" className="hover:text-gold transition-colors">Seguridad</a>
          </nav>
          <Link
            href="/registro"
            className="rounded-full bg-gold text-[#1a1408] font-semibold text-sm px-5 py-2.5 hover:brightness-110 transition"
          >
            Registro gratis
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          {heroImg ? (
            <Image src={heroImg} alt={s.eventoEdicion} fill priority className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(252,144,0,0.18),transparent_55%),linear-gradient(135deg,#1a0d12_0%,#2b0f16_45%,#0c0708_100%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-black/70" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full px-5 sm:px-8 pb-20 pt-40">
          {s.logoUrl && (
            <Image
              src={s.logoUrl}
              alt={s.eventoNombre}
              width={320}
              height={320}
              priority
              className="h-28 sm:h-32 md:h-36 w-auto object-contain mb-6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
            />
          )}
          <p className="uppercase tracking-[0.35em] text-gold text-xs sm:text-sm mb-5">
            {s.eventoCiudad} · Norte de Santander
          </p>
          <h1 className="font-display font-extrabold leading-[0.95] text-5xl sm:text-7xl md:text-8xl text-white drop-shadow-lg">
            {s.eventoNombre}
          </h1>
          <p className="font-display text-2xl sm:text-3xl text-gold mt-3 mb-8">{s.eventoEdicion}</p>

          <div className="flex flex-wrap items-center gap-6 mb-10 text-white/90 text-sm sm:text-base">
            <span className="flex items-center gap-2">📅 {s.eventoFechaTexto}</span>
            <span className="flex items-center gap-2">🕓 {s.eventoHoraTexto}</span>
            {s.googleMapsUrl ? (
              <a
                href={s.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-gold transition-colors underline decoration-white/20 underline-offset-4"
              >
                📍 {s.eventoLugar}
              </a>
            ) : (
              <span className="flex items-center gap-2">📍 {s.eventoLugar}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-full bg-wine px-8 py-4 font-semibold text-white shadow-[0_10px_30px_-8px_rgba(240,36,12,0.55)] hover:brightness-110 transition text-base sm:text-lg"
            >
              Reservar mi boleta gratis
            </Link>
            <Countdown fechaISO={s.eventoFechaISO} />
          </div>
          <p className="mt-6 text-xs sm:text-sm text-white/60 max-w-md">
            Entrada libre · {s.eventoCupo} · Registro con QR de ingreso, sin filas ni costo.
          </p>
        </div>
      </section>

      {/* SOBRE EL EVENTO */}
      <section id="evento" className="relative py-24 sm:py-32 px-5 sm:px-8">
        {s.sobreImagenUrl ? (
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10">
              <Image src={s.sobreImagenUrl} alt={s.eventoEdicion} fill className="object-cover" />
            </div>
            <div>
              <p className="uppercase tracking-[0.3em] text-gold text-xs sm:text-sm mb-4">Sobre el evento</p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold mb-6">Vive la salsa como nunca antes</h2>
              <p className="text-white/70 text-base sm:text-lg leading-relaxed">{s.eventoDescripcion}</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center">
            <p className="uppercase tracking-[0.3em] text-gold text-xs sm:text-sm mb-4">Sobre el evento</p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mb-6">
              Vive la salsa como nunca antes
            </h2>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed">{s.eventoDescripcion}</p>
          </div>
        )}

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
          {[
            { title: "Fecha", value: s.eventoFechaTexto, icon: "📅" },
            { title: "Hora", value: s.eventoHoraTexto, icon: "🕓" },
            { title: "Lugar", value: `${s.eventoLugar} · ${s.eventoDireccion}`, icon: "📍" },
          ].map((it) => (
            <div key={it.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center flex flex-col">
              <div className="text-3xl mb-4">{it.icon}</div>
              <p className="uppercase tracking-widest text-xs text-gold mb-2">{it.title}</p>
              <p className="text-white/90 font-medium">{it.value}</p>
              {it.title === "Lugar" && s.googleMapsUrl && (
                <a
                  href={s.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-1.5 mx-auto rounded-full border border-gold/40 text-gold text-xs font-semibold px-4 py-2 hover:bg-gold hover:text-[#1a1408] transition"
                >
                  Cómo llegar →
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PROGRAMA */}
      <section id="programa" className="relative py-24 sm:py-32 px-5 sm:px-8 border-y border-white/10 overflow-hidden">
        {s.programaImagenUrl ? (
          <div className="absolute inset-0">
            <Image src={s.programaImagenUrl} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/85" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-white/[0.02]" />
        )}
        <div className="relative max-w-3xl mx-auto text-center mb-16">
          <p className="uppercase tracking-[0.3em] text-gold text-xs sm:text-sm mb-4">Programación</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold">Así se vivirá la noche</h2>
        </div>
        <div className="relative max-w-2xl mx-auto">
          {s.eventoPrograma.map((item, i) => (
            <div key={i} className="flex gap-6 items-start py-5 border-b border-white/10 last:border-0">
              <span className="font-display text-gold font-bold w-24 shrink-0 text-right">{item.hora}</span>
              <span className="text-white/85">{item.actividad}</span>
            </div>
          ))}
        </div>
      </section>

      {/* GALERIA */}
      {s.galeriaImagenes.length > 0 && (
        <section id="galeria" className="relative py-24 sm:py-32 px-5 sm:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="uppercase tracking-[0.3em] text-gold text-xs sm:text-sm mb-4">Momentos</p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold">La calle se prende de salsa</h2>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
            {s.galeriaImagenes.map((src, i) => (
              <div key={i} className={`relative rounded-2xl overflow-hidden aspect-square ${i % 5 === 0 ? "md:col-span-2 md:row-span-2 md:aspect-auto" : ""}`}>
                <Image src={src} alt={`Salsa a la Calle ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SEGURIDAD / CONFIANZA */}
      <section id="seguridad" className="relative py-24 sm:py-32 px-5 sm:px-8 border-y border-white/10 overflow-hidden">
        {s.seguridadImagenUrl ? (
          <div className="absolute inset-0">
            <Image src={s.seguridadImagenUrl} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/80" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-wine/10 to-transparent" />
        )}
        <div className="relative max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="uppercase tracking-[0.3em] text-gold text-xs sm:text-sm mb-4">Registro y seguridad</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Un ingreso ágil, seguro y sin filas
            </h2>
            <p className="text-white/70 leading-relaxed mb-6">
              Este año implementamos un sistema de registro con boleta digital y código QR, igual al que usan
              las grandes plataformas de eventos. Al registrarte recibirás tu boleta por correo y WhatsApp con
              un número único y un código QR que se valida en segundos en el punto de ingreso.
            </p>
            <ul className="space-y-3 text-white/80 text-sm sm:text-base">
              <li className="flex gap-3"><span className="text-green">✓</span> Tu boleta <strong className="text-white">no tiene ningún costo</strong>.</li>
              <li className="flex gap-3"><span className="text-green">✓</span> No es personal: puede ser usada por cualquier persona (es transferible).</li>
              <li className="flex gap-3"><span className="text-green">✓</span> El QR solo se usa para organizar el ingreso, agilizar filas y cuidar la seguridad de todos.</li>
              <li className="flex gap-3"><span className="text-green">✓</span> Tus datos están protegidos conforme a la ley colombiana de protección de datos.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10 text-center">
            <div className="text-5xl mb-4">🎟️</div>
            <p className="font-display text-2xl font-bold mb-2">Boleta 100% gratuita</p>
            <p className="text-white/60 text-sm mb-8">Regístrate en menos de un minuto y recibe tu invitación al instante.</p>
            <Link
              href="/registro"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold text-[#1a1408] font-semibold px-8 py-4 hover:brightness-110 transition w-full sm:w-auto"
            >
              Quiero mi boleta gratis
            </Link>
            <p className="mt-4 text-[11px] text-white/40">
              Tratamos tus datos según la{" "}
              <Link href="/politica-de-datos" className="underline hover:text-gold">
                Política de Tratamiento de Datos
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* PATROCINADORES */}
      {s.patrocinadores.length > 0 && (
        <section className="relative py-20 sm:py-24 px-5 sm:px-8 border-b border-white/10 overflow-hidden">
          <p className="text-center uppercase tracking-[0.3em] text-gold text-xs sm:text-sm mb-12">
            Con el respaldo de
          </p>
          <div
            className="relative max-w-6xl mx-auto overflow-hidden"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            }}
          >
            <div className="flex w-max animate-marquee gap-16 items-center">
              {[...s.patrocinadores, ...s.patrocinadores].map((p, i) => (
                <div
                  key={`${p.nombre}-${i}`}
                  className="shrink-0 flex items-center justify-center h-20 w-40 rounded-2xl border border-white/10 bg-white/[0.04] px-6 hover:border-gold/40 transition-colors"
                  title={p.nombre}
                >
                  <Image
                    src={p.logoUrl}
                    alt={p.nombre}
                    width={140}
                    height={70}
                    className="max-h-12 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="relative py-24 sm:py-32 px-5 sm:px-8 text-center overflow-hidden">
        {s.ctaImagenUrl && (
          <div className="absolute inset-0">
            <Image src={s.ctaImagenUrl} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/95" />
          </div>
        )}
        <p className="relative uppercase tracking-[0.3em] text-gold text-xs sm:text-sm mb-4">{s.eventoCupo}</p>
        <h2 className="relative font-display text-3xl sm:text-6xl font-bold mb-8 max-w-3xl mx-auto">
          No te quedes por fuera de {s.eventoEdicion}
        </h2>
        <Link
          href="/registro"
          className="relative inline-flex items-center gap-2 rounded-full bg-wine px-10 py-5 font-semibold text-white text-lg shadow-[0_10px_30px_-8px_rgba(240,36,12,0.55)] hover:brightness-110 transition"
        >
          Reservar mi boleta gratis
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-5 sm:px-8 py-14">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-10">
          <div>
            <span className="font-display text-xl">{s.eventoNombre}</span>
            <p className="text-white/50 text-sm mt-2 max-w-xs">
              {s.eventoCiudad}, Colombia. El encuentro que une a toda la comunidad salsera.
            </p>
            {socials.length > 0 && (
              <div className="flex gap-4 mt-5 text-sm">
                {socials.map((soc) => (
                  <a
                    key={soc.key}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-gold transition-colors"
                  >
                    {soc.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="text-sm text-white/50 space-y-2">
            {s.contactoEmail && <p>{s.contactoEmail}</p>}
            {s.contactoTelefono && <p>{s.contactoTelefono}</p>}
            <p>
              <Link href="/politica-de-datos" className="hover:text-gold underline">
                Política de tratamiento de datos
              </Link>
            </p>
          </div>
        </div>
        {s.creditoBoleteria && (
          <div className="max-w-6xl mx-auto border-t border-white/10 mt-12 pt-6 flex justify-center">
            <p className="text-center text-white/40 text-xs uppercase tracking-widest">
              Proceso de boletería y registro gestionado por{" "}
              {s.creditoBoleteriaUrl ? (
                <a
                  href={s.creditoBoleteriaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-gold transition-colors font-semibold"
                >
                  {s.creditoBoleteria}
                </a>
              ) : (
                <span className="text-white/70 font-semibold">{s.creditoBoleteria}</span>
              )}
            </p>
          </div>
        )}
        <div className="flex flex-col items-center gap-3 mt-6">
          <p className="text-center text-white/30 text-xs">
            © {new Date().getFullYear()} {s.eventoNombre}. Todos los derechos reservados.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-white/35 hover:text-gold text-[11px] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Acceso administrativo
          </Link>
        </div>
      </footer>
    </main>
  );
}
