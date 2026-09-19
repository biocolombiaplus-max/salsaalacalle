"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { SiteSettings, ProgramaItem, Patrocinador } from "@/lib/settings";

type Tab = "evento" | "imagenes" | "patrocinadores" | "redes" | "legal";

const TABS: { id: Tab; label: string }[] = [
  { id: "evento", label: "Evento" },
  { id: "imagenes", label: "Imágenes y marca" },
  { id: "patrocinadores", label: "Patrocinadores" },
  { id: "redes", label: "Redes y contacto" },
  { id: "legal", label: "Datos legales" },
];

type SingleImageKey = "logoUrl" | "boletaFondoUrl" | "sobreImagenUrl" | "seguridadImagenUrl";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl bg-black/30 border border-white/15 px-4 py-2.5 text-sm outline-none focus:border-gold transition";

async function uploadFile(file: File, folder: "hero" | "gallery" | "misc"): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al subir imagen");
  return data.url as string;
}

export default function SettingsForm() {
  const [tab, setTab] = useState<Tab>("evento");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings));
  }, []);

  if (!settings) {
    return <p className="text-white/50 text-sm">Cargando...</p>;
  }

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setMessage("Cambios guardados correctamente.");
    } catch {
      setMessage("No fue posible guardar los cambios.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  }

  async function handleSingleUpload(key: SingleImageKey, file: File) {
    setUploading(key);
    try {
      const url = await uploadFile(file, "misc");
      set(key, url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al subir imagen");
    } finally {
      setUploading(null);
    }
  }

  async function handleMultiUpload(key: "heroImagenes" | "galeriaImagenes", folder: "hero" | "gallery", files: FileList) {
    setUploading(key);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadFile(file, folder));
      }
      set(key, [...settings![key], ...urls]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al subir imágenes");
    } finally {
      setUploading(null);
    }
  }

  function removeFromArray(key: "heroImagenes" | "galeriaImagenes", index: number) {
    set(key, settings![key].filter((_, i) => i !== index));
  }

  function updatePrograma(index: number, patch: Partial<ProgramaItem>) {
    const next = settings!.eventoPrograma.map((it, i) => (i === index ? { ...it, ...patch } : it));
    set("eventoPrograma", next);
  }

  function addPrograma() {
    set("eventoPrograma", [...settings!.eventoPrograma, { hora: "", actividad: "" }]);
  }

  function removePrograma(index: number) {
    set("eventoPrograma", settings!.eventoPrograma.filter((_, i) => i !== index));
  }

  function addPatrocinador() {
    set("patrocinadores", [...settings!.patrocinadores, { nombre: "", logoUrl: "" }]);
  }

  function updatePatrocinador(index: number, patch: Partial<Patrocinador>) {
    const next = settings!.patrocinadores.map((p, i) => (i === index ? { ...p, ...patch } : p));
    set("patrocinadores", next);
  }

  function removePatrocinador(index: number) {
    set("patrocinadores", settings!.patrocinadores.filter((_, i) => i !== index));
  }

  async function handlePatrocinadorLogo(index: number, file: File) {
    const uploadKey = `patrocinador-${index}`;
    setUploading(uploadKey);
    try {
      const url = await uploadFile(file, "misc");
      updatePatrocinador(index, { logoUrl: url });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al subir el logo");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              tab === t.id ? "bg-gold text-[#1a1408] font-semibold" : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "evento" && (
        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
          <Field label="Nombre del grupo/evento">
            <input className={inputClass} value={settings.eventoNombre} onChange={(e) => set("eventoNombre", e.target.value)} />
          </Field>
          <Field label="Edición del evento">
            <input className={inputClass} value={settings.eventoEdicion} onChange={(e) => set("eventoEdicion", e.target.value)} />
          </Field>
          <Field label="Fecha y hora (para el conteo regresivo)">
            <input
              type="datetime-local"
              className={inputClass}
              value={settings.eventoFechaISO.slice(0, 16)}
              onChange={(e) => set("eventoFechaISO", e.target.value)}
            />
          </Field>
          <Field label="Fecha en texto (como se muestra)">
            <input className={inputClass} value={settings.eventoFechaTexto} onChange={(e) => set("eventoFechaTexto", e.target.value)} />
          </Field>
          <Field label="Hora en texto">
            <input className={inputClass} value={settings.eventoHoraTexto} onChange={(e) => set("eventoHoraTexto", e.target.value)} />
          </Field>
          <Field label="Cupo / disponibilidad">
            <input className={inputClass} value={settings.eventoCupo} onChange={(e) => set("eventoCupo", e.target.value)} />
          </Field>
          <Field label="Lugar">
            <input className={inputClass} value={settings.eventoLugar} onChange={(e) => set("eventoLugar", e.target.value)} />
          </Field>
          <Field label="Ciudad">
            <input className={inputClass} value={settings.eventoCiudad} onChange={(e) => set("eventoCiudad", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Dirección">
              <input className={inputClass} value={settings.eventoDireccion} onChange={(e) => set("eventoDireccion", e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Enlace de Google Maps (botón 'Cómo llegar')">
              <input
                className={inputClass}
                value={settings.googleMapsUrl}
                onChange={(e) => set("googleMapsUrl", e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
              />
              <p className="text-[11px] text-white/40 mt-2">
                En Google Maps busca el lugar → botón &quot;Compartir&quot; → &quot;Copiar enlace&quot;, y pégalo aquí.
              </p>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Descripción del evento">
              <textarea
                className={`${inputClass} min-h-28`}
                value={settings.eventoDescripcion}
                onChange={(e) => set("eventoDescripcion", e.target.value)}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-widest text-white/60 mb-3 mt-2">Programación</p>
            <div className="space-y-3">
              {settings.eventoPrograma.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={`${inputClass} w-32`}
                    placeholder="Hora"
                    value={item.hora}
                    onChange={(e) => updatePrograma(i, { hora: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Actividad"
                    value={item.actividad}
                    onChange={(e) => updatePrograma(i, { actividad: e.target.value })}
                  />
                  <button onClick={() => removePrograma(i)} className="text-red-400 text-xs px-2">✕</button>
                </div>
              ))}
              <button onClick={addPrograma} className="text-gold text-xs hover:underline">+ Agregar actividad</button>
            </div>
          </div>
        </div>
      )}

      {tab === "imagenes" && (
        <div className="max-w-3xl space-y-10">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Logo del evento</p>
              {settings.logoUrl && (
                <Image src={settings.logoUrl} alt="Logo" width={80} height={80} className="rounded-xl object-cover mb-3 h-20 w-20" />
              )}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSingleUpload("logoUrl", e.target.files[0])} className="text-xs text-white/60" />
              {uploading === "logoUrl" && <p className="text-xs text-gold mt-1">Subiendo...</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Imagen de fondo de la boleta</p>
              {settings.boletaFondoUrl && (
                <Image src={settings.boletaFondoUrl} alt="Fondo boleta" width={140} height={70} className="rounded-xl object-cover mb-3 h-[70px] w-[140px]" />
              )}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSingleUpload("boletaFondoUrl", e.target.files[0])} className="text-xs text-white/60" />
              {uploading === "boletaFondoUrl" && <p className="text-xs text-gold mt-1">Subiendo...</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Imagen sección &quot;Sobre el evento&quot;</p>
              {settings.sobreImagenUrl && (
                <Image src={settings.sobreImagenUrl} alt="Sobre el evento" width={140} height={100} className="rounded-xl object-cover mb-3 h-[100px] w-[140px]" />
              )}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSingleUpload("sobreImagenUrl", e.target.files[0])} className="text-xs text-white/60" />
              {uploading === "sobreImagenUrl" && <p className="text-xs text-gold mt-1">Subiendo...</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Imagen de fondo sección &quot;Seguridad&quot;</p>
              {settings.seguridadImagenUrl && (
                <Image src={settings.seguridadImagenUrl} alt="Seguridad" width={140} height={100} className="rounded-xl object-cover mb-3 h-[100px] w-[140px]" />
              )}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSingleUpload("seguridadImagenUrl", e.target.files[0])} className="text-xs text-white/60" />
              {uploading === "seguridadImagenUrl" && <p className="text-xs text-gold mt-1">Subiendo...</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <Field label="Color primario (rojo)">
              <input type="color" value={settings.colorPrimario} onChange={(e) => set("colorPrimario", e.target.value)} className="h-11 w-full rounded-xl bg-black/30 border border-white/15" />
            </Field>
            <Field label="Color secundario (naranja)">
              <input type="color" value={settings.colorSecundario} onChange={(e) => set("colorSecundario", e.target.value)} className="h-11 w-full rounded-xl bg-black/30 border border-white/15" />
            </Field>
            <Field label="Color terciario (verde)">
              <input type="color" value={settings.colorTerciario} onChange={(e) => set("colorTerciario", e.target.value)} className="h-11 w-full rounded-xl bg-black/30 border border-white/15" />
            </Field>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Imágenes del hero (portada)</p>
            <div className="flex flex-wrap gap-3 mb-3">
              {settings.heroImagenes.map((url, i) => (
                <div key={url} className="relative">
                  <Image src={url} alt="" width={120} height={80} className="rounded-lg object-cover h-20 w-30" />
                  <button onClick={() => removeFromArray("heroImagenes", i)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 text-xs">✕</button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleMultiUpload("heroImagenes", "hero", e.target.files)} className="text-xs text-white/60" />
            {uploading === "heroImagenes" && <p className="text-xs text-gold mt-1">Subiendo...</p>}
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Galería de fotos de salsa</p>
            <div className="flex flex-wrap gap-3 mb-3">
              {settings.galeriaImagenes.map((url, i) => (
                <div key={url} className="relative">
                  <Image src={url} alt="" width={90} height={90} className="rounded-lg object-cover h-[90px] w-[90px]" />
                  <button onClick={() => removeFromArray("galeriaImagenes", i)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 text-xs">✕</button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleMultiUpload("galeriaImagenes", "gallery", e.target.files)} className="text-xs text-white/60" />
            {uploading === "galeriaImagenes" && <p className="text-xs text-gold mt-1">Subiendo...</p>}
          </div>
        </div>
      )}

      {tab === "patrocinadores" && (
        <div className="max-w-3xl">
          <p className="text-white/50 text-sm mb-6">
            Los logos aparecen en una franja animada en la landing. Sube logos con fondo transparente
            (PNG) para mejor resultado.
          </p>
          <div className="space-y-4">
            {settings.patrocinadores.map((p, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="h-16 w-24 shrink-0 rounded-lg bg-black/30 flex items-center justify-center overflow-hidden">
                  {p.logoUrl ? (
                    <Image src={p.logoUrl} alt={p.nombre || "Patrocinador"} width={96} height={64} className="max-h-14 w-auto object-contain" />
                  ) : (
                    <span className="text-white/30 text-[10px]">Sin logo</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    className={inputClass}
                    placeholder="Nombre del patrocinador"
                    value={p.nombre}
                    onChange={(e) => updatePatrocinador(i, { nombre: e.target.value })}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handlePatrocinadorLogo(i, e.target.files[0])}
                    className="text-xs text-white/60"
                  />
                  {uploading === `patrocinador-${i}` && <p className="text-xs text-gold">Subiendo...</p>}
                </div>
                <button onClick={() => removePatrocinador(i)} className="text-red-400 text-xs px-2 self-start">
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={addPatrocinador} className="text-gold text-xs hover:underline mt-4">
            + Agregar patrocinador
          </button>
        </div>
      )}

      {tab === "redes" && (
        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
          <Field label="Instagram (URL)">
            <input className={inputClass} value={settings.redesInstagram} onChange={(e) => set("redesInstagram", e.target.value)} placeholder="https://instagram.com/..." />
          </Field>
          <Field label="Facebook (URL)">
            <input className={inputClass} value={settings.redesFacebook} onChange={(e) => set("redesFacebook", e.target.value)} placeholder="https://facebook.com/..." />
          </Field>
          <Field label="TikTok (URL)">
            <input className={inputClass} value={settings.redesTiktok} onChange={(e) => set("redesTiktok", e.target.value)} placeholder="https://tiktok.com/@..." />
          </Field>
          <Field label="YouTube (URL)">
            <input className={inputClass} value={settings.redesYoutube} onChange={(e) => set("redesYoutube", e.target.value)} placeholder="https://youtube.com/..." />
          </Field>
          <Field label="WhatsApp comunidad (URL wa.me)">
            <input className={inputClass} value={settings.redesWhatsapp} onChange={(e) => set("redesWhatsapp", e.target.value)} placeholder="https://wa.me/57..." />
          </Field>
          <Field label="Correo de contacto público">
            <input className={inputClass} value={settings.contactoEmail} onChange={(e) => set("contactoEmail", e.target.value)} />
          </Field>
          <Field label="Teléfono de contacto público">
            <input className={inputClass} value={settings.contactoTelefono} onChange={(e) => set("contactoTelefono", e.target.value)} />
          </Field>
        </div>
      )}

      {tab === "legal" && (
        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
          <Field label="Responsable del tratamiento de datos">
            <input className={inputClass} value={settings.legalResponsable} onChange={(e) => set("legalResponsable", e.target.value)} />
          </Field>
          <Field label="NIT (opcional)">
            <input className={inputClass} value={settings.legalNit} onChange={(e) => set("legalNit", e.target.value)} />
          </Field>
          <p className="sm:col-span-2 text-xs text-white/40">
            Estos datos se muestran en la Política de Tratamiento de Datos Personales del sitio. Recomendamos
            validar el texto legal completo con un abogado antes del lanzamiento oficial.
          </p>

          <div className="sm:col-span-2 pt-4 mt-2 border-t border-white/10">
            <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Crédito de boletería (footer)</p>
          </div>
          <Field label="Texto del crédito">
            <input
              className={inputClass}
              value={settings.creditoBoleteria}
              onChange={(e) => set("creditoBoleteria", e.target.value)}
              placeholder="SID & Biomarketing"
            />
          </Field>
          <Field label="Enlace del crédito (opcional)">
            <input
              className={inputClass}
              value={settings.creditoBoleteriaUrl}
              onChange={(e) => set("creditoBoleteriaUrl", e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <p className="sm:col-span-2 text-xs text-white/40">
            Aparece en el pie de página como &quot;Proceso de boletería y registro gestionado por [texto]&quot;,
            aclarando que ustedes administran el registro sin ser los organizadores del evento.
          </p>
        </div>
      )}

      <div className="sticky bottom-4 mt-10 flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-wine text-white font-semibold px-8 py-3 hover:brightness-110 transition disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        {message && <p className="text-sm text-white/70">{message}</p>}
      </div>
    </div>
  );
}
