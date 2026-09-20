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

type SingleImageKey =
  | "logoUrl"
  | "boletaFondoUrl"
  | "sobreImagenUrl"
  | "seguridadImagenUrl"
  | "programaImagenUrl"
  | "ctaImagenUrl";

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

type PendingFile = { id: string; localUrl: string; name: string; error?: string };

function UploadSpinnerOverlay() {
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
      <div className="h-5 w-5 rounded-full border-2 border-gold border-t-transparent animate-spin" />
    </div>
  );
}

function PendingThumb({
  item,
  onDismiss,
  className,
}: {
  item: PendingFile;
  onDismiss: () => void;
  className: string;
}) {
  return (
    <div className={item.error ? "w-40" : className}>
      <div
        className={`relative rounded-lg overflow-hidden border ${className} ${
          item.error ? "border-red-500" : "border-transparent"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), next/image no la soporta */}
        <img src={item.localUrl} alt={item.name} className="h-full w-full object-cover" />
        {!item.error && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          </div>
        )}
      </div>
      {item.error && (
        <div className="mt-1 text-[10px] text-red-300 bg-red-950/60 rounded px-1.5 py-1 break-words">
          {item.error}
          <button onClick={onDismiss} className="block underline mt-0.5">
            Quitar
          </button>
        </div>
      )}
    </div>
  );
}

export default function SettingsForm() {
  const [tab, setTab] = useState<Tab>("evento");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessageState] = useState<{ text: string; ok: boolean } | null>(null);
  function setMessage(text: string, ok = false) {
    if (!text) {
      setMessageState(null);
      return;
    }
    setMessageState({ text, ok });
  }
  const [uploading, setUploading] = useState<string | null>(null);
  // Vista previa local mientras cada imagen se sube, para que se vea de
  // inmediato qué archivo se está agregando (antes de tener la URL final).
  const [singlePreview, setSinglePreview] = useState<Record<string, string>>({});
  const [pendingMulti, setPendingMulti] = useState<Record<string, PendingFile[]>>({});

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
      setMessage("Cambios guardados correctamente.", true);
    } catch {
      setMessage("No fue posible guardar los cambios.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  }

  async function handleSingleUpload(key: SingleImageKey, file: File) {
    const localUrl = URL.createObjectURL(file);
    setSinglePreview((prev) => ({ ...prev, [key]: localUrl }));
    setUploading(key);
    try {
      const url = await uploadFile(file, "misc");
      set(key, url);
    } catch (e) {
      setMessage(`${file.name}: ${e instanceof Error ? e.message : "Error al subir imagen"}`);
    } finally {
      setUploading(null);
      setSinglePreview((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      URL.revokeObjectURL(localUrl);
    }
  }

  async function handleMultiUpload(key: "heroImagenes" | "galeriaImagenes", folder: "hero" | "gallery", files: FileList) {
    const items: PendingFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      localUrl: URL.createObjectURL(file),
      name: file.name,
    }));
    setPendingMulti((prev) => ({ ...prev, [key]: [...(prev[key] || []), ...items] }));

    await Promise.all(
      items.map(async (item, i) => {
        const file = Array.from(files)[i];
        try {
          const url = await uploadFile(file, folder);
          setSettings((prev) => (prev ? { ...prev, [key]: [...prev[key], url] } : prev));
        } catch (e) {
          setPendingMulti((prev) => ({
            ...prev,
            [key]: (prev[key] || []).map((p) =>
              p.id === item.id ? { ...p, error: e instanceof Error ? e.message : "Error al subir" } : p
            ),
          }));
          return;
        }
        setPendingMulti((prev) => ({
          ...prev,
          [key]: (prev[key] || []).filter((p) => p.id !== item.id),
        }));
        URL.revokeObjectURL(item.localUrl);
      })
    );
  }

  function dismissPendingError(key: "heroImagenes" | "galeriaImagenes", id: string) {
    setPendingMulti((prev) => ({ ...prev, [key]: (prev[key] || []).filter((p) => p.id !== id) }));
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
              {(singlePreview.logoUrl || settings.logoUrl) && (
                <div className="relative mb-3 h-20 w-20 rounded-xl bg-black/30 flex items-center justify-center overflow-hidden">
                  <Image src={singlePreview.logoUrl || settings.logoUrl} alt="Logo" width={80} height={80} className="max-h-full w-auto object-contain" />
                  {uploading === "logoUrl" && <UploadSpinnerOverlay />}
                  {!uploading && settings.logoUrl && (
                    <button
                      onClick={() => set("logoUrl", "")}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full h-5 w-5 text-xs flex items-center justify-center"
                      title="Quitar logo"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSingleUpload("logoUrl", e.target.files[0])} className="text-xs text-white/60" />
              <div className="mt-4">
                <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2">
                  Tamaño del logo en la landing ({settings.logoAltura}px)
                </label>
                <input
                  type="range"
                  min={32}
                  max={140}
                  step={4}
                  value={settings.logoAltura}
                  onChange={(e) => set("logoAltura", Number(e.target.value))}
                  className="w-full accent-gold"
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Imagen de fondo de la boleta</p>
              {(singlePreview.boletaFondoUrl || settings.boletaFondoUrl) && (
                <div className="relative mb-3 h-[70px] w-[140px] rounded-xl overflow-hidden">
                  <Image src={singlePreview.boletaFondoUrl || settings.boletaFondoUrl} alt="Fondo boleta" width={140} height={70} className="rounded-xl object-cover h-[70px] w-[140px]" />
                  {uploading === "boletaFondoUrl" && <UploadSpinnerOverlay />}
                  {!uploading && settings.boletaFondoUrl && (
                    <button
                      onClick={() => set("boletaFondoUrl", "")}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full h-5 w-5 text-xs flex items-center justify-center"
                      title="Quitar imagen"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSingleUpload("boletaFondoUrl", e.target.files[0])} className="text-xs text-white/60" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Imagen sección &quot;Sobre el evento&quot;</p>
              {(singlePreview.sobreImagenUrl || settings.sobreImagenUrl) && (
                <div className="relative mb-3 h-[100px] w-[140px] rounded-xl overflow-hidden">
                  <Image src={singlePreview.sobreImagenUrl || settings.sobreImagenUrl} alt="Sobre el evento" width={140} height={100} className="rounded-xl object-cover h-[100px] w-[140px]" />
                  {uploading === "sobreImagenUrl" && <UploadSpinnerOverlay />}
                  {!uploading && settings.sobreImagenUrl && (
                    <button
                      onClick={() => set("sobreImagenUrl", "")}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full h-5 w-5 text-xs flex items-center justify-center"
                      title="Quitar imagen"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSingleUpload("sobreImagenUrl", e.target.files[0])} className="text-xs text-white/60" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Imagen de fondo sección &quot;Seguridad&quot;</p>
              {(singlePreview.seguridadImagenUrl || settings.seguridadImagenUrl) && (
                <div className="relative mb-3 h-[100px] w-[140px] rounded-xl overflow-hidden">
                  <Image src={singlePreview.seguridadImagenUrl || settings.seguridadImagenUrl} alt="Seguridad" width={140} height={100} className="rounded-xl object-cover h-[100px] w-[140px]" />
                  {uploading === "seguridadImagenUrl" && <UploadSpinnerOverlay />}
                  {!uploading && settings.seguridadImagenUrl && (
                    <button
                      onClick={() => set("seguridadImagenUrl", "")}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full h-5 w-5 text-xs flex items-center justify-center"
                      title="Quitar imagen"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSingleUpload("seguridadImagenUrl", e.target.files[0])} className="text-xs text-white/60" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Imagen de fondo sección &quot;Programación&quot;</p>
              {(singlePreview.programaImagenUrl || settings.programaImagenUrl) && (
                <div className="relative mb-3 h-[100px] w-[140px] rounded-xl overflow-hidden">
                  <Image src={singlePreview.programaImagenUrl || settings.programaImagenUrl} alt="Programación" width={140} height={100} className="rounded-xl object-cover h-[100px] w-[140px]" />
                  {uploading === "programaImagenUrl" && <UploadSpinnerOverlay />}
                  {!uploading && settings.programaImagenUrl && (
                    <button
                      onClick={() => set("programaImagenUrl", "")}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full h-5 w-5 text-xs flex items-center justify-center"
                      title="Quitar imagen"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSingleUpload("programaImagenUrl", e.target.files[0])} className="text-xs text-white/60" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Imagen de fondo del CTA final</p>
              {(singlePreview.ctaImagenUrl || settings.ctaImagenUrl) && (
                <div className="relative mb-3 h-[100px] w-[140px] rounded-xl overflow-hidden">
                  <Image src={singlePreview.ctaImagenUrl || settings.ctaImagenUrl} alt="CTA final" width={140} height={100} className="rounded-xl object-cover h-[100px] w-[140px]" />
                  {uploading === "ctaImagenUrl" && <UploadSpinnerOverlay />}
                  {!uploading && settings.ctaImagenUrl && (
                    <button
                      onClick={() => set("ctaImagenUrl", "")}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full h-5 w-5 text-xs flex items-center justify-center"
                      title="Quitar imagen"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSingleUpload("ctaImagenUrl", e.target.files[0])} className="text-xs text-white/60" />
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
              {(pendingMulti.heroImagenes || []).map((p) => (
                <PendingThumb key={p.id} item={p} onDismiss={() => dismissPendingError("heroImagenes", p.id)} className="h-20 w-30" />
              ))}
            </div>
            <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleMultiUpload("heroImagenes", "hero", e.target.files)} className="text-xs text-white/60" />
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
              {(pendingMulti.galeriaImagenes || []).map((p) => (
                <PendingThumb key={p.id} item={p} onDismiss={() => dismissPendingError("galeriaImagenes", p.id)} className="h-[90px] w-[90px]" />
              ))}
            </div>
            <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleMultiUpload("galeriaImagenes", "gallery", e.target.files)} className="text-xs text-white/60" />
          </div>
        </div>
      )}

      {tab === "patrocinadores" && (
        <div className="max-w-3xl">
          <p className="text-white/50 text-sm mb-6">
            Los logos aparecen en el banner animado fijo en la parte superior de la landing. Sube logos
            con fondo transparente (PNG) para mejor resultado.
          </p>
          <div className="mb-6 max-w-sm">
            <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2">
              Tamaño por defecto ({settings.patrocinadoresLogoAltura}px)
            </label>
            <input
              type="range"
              min={32}
              max={96}
              step={4}
              value={settings.patrocinadoresLogoAltura}
              onChange={(e) => set("patrocinadoresLogoAltura", Number(e.target.value))}
              className="w-full accent-gold"
            />
            <p className="text-[11px] text-white/40 mt-1.5">
              Se usa en los patrocinadores que no tengan un tamaño propio definido abajo.
            </p>
          </div>
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
                  <div className="pt-1">
                    <label className="flex items-center justify-between text-[11px] uppercase tracking-widest text-white/50 mb-1.5">
                      <span>Tamaño de este logo</span>
                      <span className="text-gold normal-case tracking-normal">{p.altura ?? settings.patrocinadoresLogoAltura}px</span>
                    </label>
                    <input
                      type="range"
                      min={32}
                      max={96}
                      step={4}
                      value={p.altura ?? settings.patrocinadoresLogoAltura}
                      onChange={(e) => updatePatrocinador(i, { altura: Number(e.target.value) })}
                      className="w-full accent-gold"
                    />
                  </div>
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

      {message && (
        <div
          className={`sticky bottom-20 mt-6 rounded-xl border text-sm px-4 py-3 shadow-lg ${
            message.ok
              ? "border-green/40 bg-green-950/80 text-green-200"
              : "border-red-500/40 bg-red-950/90 text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="sticky bottom-4 mt-4 flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-wine text-white font-semibold px-8 py-3 hover:brightness-110 transition disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
