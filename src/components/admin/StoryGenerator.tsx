"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteSettings } from "@/lib/settings";

const CANVAS_W = 1080;
const CANVAS_H = 1920;

type LogoColorMode = "original" | "white" | "black" | "gold" | "custom";
type LogoPosition = "arriba" | "tres-cuartos" | "medio" | "abajo";

const inputClass =
  "w-full rounded-xl bg-black/30 border border-white/15 px-4 py-2.5 text-sm outline-none focus:border-gold transition";
const colorInputClass = "h-11 w-full rounded-xl bg-black/30 border border-white/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">{label}</label>
      {children}
    </div>
  );
}

function useImageElement(src: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!src) {
      queueMicrotask(() => {
        if (!cancelled) setImg(null);
      });
      return () => {
        cancelled = true;
      };
    }
    const el = new window.Image();
    el.crossOrigin = "anonymous";
    el.onload = () => {
      if (!cancelled) setImg(el);
    };
    el.onerror = () => {
      if (!cancelled) setImg(null);
    };
    el.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return img;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawRecolored(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");
  if (!octx) return;
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  octx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = color;
  octx.fillRect(0, 0, w, h);
  ctx.drawImage(off, x, y);
}

export default function StoryGenerator() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [exportError, setExportError] = useState("");

  const [sponsorIndex, setSponsorIndex] = useState(0);

  const [backgroundMode, setBackgroundMode] = useState<"imagen" | "color">("color");
  const [backgroundColor, setBackgroundColor] = useState("#120b0d");
  const [backgroundLocalUrl, setBackgroundLocalUrl] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(45);

  const [showEventLogo, setShowEventLogo] = useState(true);

  const [eyebrowVisible, setEyebrowVisible] = useState(true);
  const [eyebrowText, setEyebrowText] = useState("Patrocinador oficial");
  const [eyebrowColor, setEyebrowColor] = useState("#fc9000");

  const [logoColorMode, setLogoColorMode] = useState<LogoColorMode>("original");
  const [logoCustomColor, setLogoCustomColor] = useState("#ffffff");
  const [logoSizePct, setLogoSizePct] = useState(60);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("medio");

  const [bottomBarVisible, setBottomBarVisible] = useState(true);
  const [bottomBarColor, setBottomBarColor] = useState("#3d1f5c");
  const [bottomBarText, setBottomBarText] = useState("");
  const [bottomBarTextColor, setBottomBarTextColor] = useState("#ffffff");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d: { settings: SiteSettings }) => {
        setSettings(d.settings);
        setBottomBarText(d.settings.patrocinadores[0]?.link || "");
      });
  }, []);

  const sponsor = settings?.patrocinadores[sponsorIndex] ?? null;

  function handleSponsorChange(index: number) {
    setSponsorIndex(index);
    setBottomBarText(settings?.patrocinadores[index]?.link || "");
  }

  const eventLogoImg = useImageElement(showEventLogo ? settings?.logoUrl || null : null);
  const sponsorLogoImg = useImageElement(sponsor?.logoUrl || null);
  const backgroundImg = useImageElement(backgroundMode === "imagen" ? backgroundLocalUrl : null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (backgroundMode === "imagen" && backgroundImg) {
      drawCover(ctx, backgroundImg, 0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = `rgba(0,0,0,${overlayOpacity / 100})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    if (showEventLogo && eventLogoImg) {
      drawContain(ctx, eventLogoImg, CANVAS_W / 2 - 220, 90, 440, 190);
    }

    if (eyebrowVisible && eyebrowText.trim()) {
      ctx.fillStyle = eyebrowColor;
      ctx.font = "700 38px Arial, sans-serif";
      ctx.textAlign = "center";
      const spaced = eyebrowText.trim().toUpperCase().split("").join("  ");
      ctx.fillText(spaced, CANVAS_W / 2, 350);
    }

    if (sponsorLogoImg) {
      const boxW = CANVAS_W * (logoSizePct / 100);
      const boxH = boxW * 0.62;
      const boxX = (CANVAS_W - boxW) / 2;
      const anchors: Record<LogoPosition, number> = {
        arriba: CANVAS_H * 0.22,
        "tres-cuartos": CANVAS_H * 0.42,
        medio: CANVAS_H / 2 - boxH / 2,
        abajo: CANVAS_H * 0.68,
      };
      const boxY = anchors[logoPosition];

      if (logoColorMode === "original") {
        drawContain(ctx, sponsorLogoImg, boxX, boxY, boxW, boxH);
      } else {
        const color =
          logoColorMode === "white" ? "#ffffff" : logoColorMode === "black" ? "#000000" : logoColorMode === "gold" ? "#fc9000" : logoCustomColor;
        drawRecolored(ctx, sponsorLogoImg, boxX, boxY, boxW, boxH, color);
      }
    }

    if (bottomBarVisible) {
      const barH = 190;
      ctx.fillStyle = bottomBarColor;
      ctx.fillRect(0, CANVAS_H - barH, CANVAS_W, barH);
      if (bottomBarText.trim()) {
        ctx.fillStyle = bottomBarTextColor;
        ctx.font = "600 34px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(bottomBarText.trim(), CANVAS_W / 2, CANVAS_H - barH / 2 + 12, CANVAS_W - 120);
      }
    }
  }, [
    backgroundMode,
    backgroundImg,
    backgroundColor,
    overlayOpacity,
    showEventLogo,
    eventLogoImg,
    eyebrowVisible,
    eyebrowText,
    eyebrowColor,
    sponsorLogoImg,
    logoColorMode,
    logoCustomColor,
    logoSizePct,
    logoPosition,
    bottomBarVisible,
    bottomBarColor,
    bottomBarText,
    bottomBarTextColor,
  ]);

  function handleBackgroundFile(file: File) {
    setBackgroundLocalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExportError("");
    try {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(sponsor?.nombre || "patrocinador").trim().toLowerCase().replace(/\s+/g, "-")}-historia.png`;
      a.click();
    } catch {
      setExportError(
        "No se pudo exportar la imagen por una restricción de seguridad del navegador. Prueba usando una imagen de fondo subida por ti en vez de una URL externa."
      );
    }
  }

  if (!settings) {
    return <p className="text-white/50 text-sm">Cargando...</p>;
  }

  if (settings.patrocinadores.length === 0) {
    return (
      <p className="text-white/50 text-sm">
        Todavía no has agregado patrocinadores. Ve a{" "}
        <a href="/admin/settings" className="text-gold underline">
          Personalizar → Patrocinadores
        </a>{" "}
        y agrega al menos uno para poder crear historias.
      </p>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      <div className="space-y-6 max-w-2xl">
        <Field label="Patrocinador">
          <select
            className={inputClass}
            value={sponsorIndex}
            onChange={(e) => handleSponsorChange(Number(e.target.value))}
          >
            {settings.patrocinadores.map((p, i) => (
              <option key={`${p.nombre}-${i}`} value={i}>
                {p.nombre || `Patrocinador ${i + 1}`}
              </option>
            ))}
          </select>
        </Field>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/50">Fondo</p>
          <div className="flex gap-2">
            <button
              onClick={() => setBackgroundMode("color")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm transition ${
                backgroundMode === "color" ? "bg-gold text-[#1a1408] font-semibold" : "bg-black/30 text-white/70 hover:bg-white/5"
              }`}
            >
              Color sólido
            </button>
            <button
              onClick={() => setBackgroundMode("imagen")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm transition ${
                backgroundMode === "imagen" ? "bg-gold text-[#1a1408] font-semibold" : "bg-black/30 text-white/70 hover:bg-white/5"
              }`}
            >
              Imagen
            </button>
          </div>

          {backgroundMode === "color" ? (
            <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className={colorInputClass} />
          ) : (
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleBackgroundFile(e.target.files[0])}
                className="w-full text-xs text-white/60"
              />
              <div>
                <label className="flex items-center justify-between text-[11px] uppercase tracking-widest text-white/50 mb-1.5">
                  <span>Oscurecer fondo</span>
                  <span className="text-gold normal-case tracking-normal">{overlayOpacity}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={90}
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  className="w-full accent-gold"
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/50">Logo del patrocinador</p>

          <Field label="Color del logo">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {(
                [
                  ["original", "Original"],
                  ["white", "Blanco"],
                  ["black", "Negro"],
                  ["gold", "Dorado"],
                  ["custom", "Otro"],
                ] as [LogoColorMode, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setLogoColorMode(mode)}
                  className={`rounded-lg px-2 py-2 text-xs transition ${
                    logoColorMode === mode ? "bg-gold text-[#1a1408] font-semibold" : "bg-black/30 text-white/70 hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {logoColorMode === "custom" && (
              <input
                type="color"
                value={logoCustomColor}
                onChange={(e) => setLogoCustomColor(e.target.value)}
                className={`${colorInputClass} mt-3`}
              />
            )}
          </Field>

          <Field label="Posición vertical">
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ["arriba", "Arriba"],
                  ["tres-cuartos", "3/4"],
                  ["medio", "Medio"],
                  ["abajo", "Abajo"],
                ] as [LogoPosition, string][]
              ).map(([pos, label]) => (
                <button
                  key={pos}
                  onClick={() => setLogoPosition(pos)}
                  className={`rounded-lg px-2 py-2 text-xs transition ${
                    logoPosition === pos ? "bg-gold text-[#1a1408] font-semibold" : "bg-black/30 text-white/70 hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <div>
            <label className="flex items-center justify-between text-[11px] uppercase tracking-widest text-white/50 mb-1.5">
              <span>Tamaño del logo</span>
              <span className="text-gold normal-case tracking-normal">{logoSizePct}%</span>
            </label>
            <input
              type="range"
              min={20}
              max={85}
              value={logoSizePct}
              onChange={(e) => setLogoSizePct(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
            <input type="checkbox" checked={showEventLogo} onChange={(e) => setShowEventLogo(e.target.checked)} className="h-4 w-4 accent-gold" />
            Logo del evento arriba
          </label>

          <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
            <input type="checkbox" checked={eyebrowVisible} onChange={(e) => setEyebrowVisible(e.target.checked)} className="h-4 w-4 accent-gold" />
            Texto &quot;Patrocinador oficial&quot;
          </label>
          {eyebrowVisible && (
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <Field label="Texto">
                <input className={inputClass} value={eyebrowText} onChange={(e) => setEyebrowText(e.target.value)} />
              </Field>
              <input type="color" value={eyebrowColor} onChange={(e) => setEyebrowColor(e.target.value)} className={`${colorInputClass} w-14`} />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
            <input
              type="checkbox"
              checked={bottomBarVisible}
              onChange={(e) => setBottomBarVisible(e.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            Barra inferior (web o red social)
          </label>
          {bottomBarVisible && (
            <>
              <Field label="Texto (link, @usuario, etc.)">
                <input className={inputClass} value={bottomBarText} onChange={(e) => setBottomBarText(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Color de la barra">
                  <input type="color" value={bottomBarColor} onChange={(e) => setBottomBarColor(e.target.value)} className={colorInputClass} />
                </Field>
                <Field label="Color del texto">
                  <input
                    type="color"
                    value={bottomBarTextColor}
                    onChange={(e) => setBottomBarTextColor(e.target.value)}
                    className={colorInputClass}
                  />
                </Field>
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleDownload}
          className="btn-shine btn-glow-gold inline-flex items-center justify-center gap-2 rounded-full bg-gold text-[#1a1408] font-semibold px-8 py-4 hover:brightness-110 transition"
        >
          Descargar imagen (1080×1920)
        </button>
        {exportError && <p className="text-red-400 text-sm">{exportError}</p>}
      </div>

      <div className="lg:sticky lg:top-8">
        <div className="mx-auto w-[270px] rounded-[1.75rem] overflow-hidden ring-1 ring-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]">
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ width: "270px", height: "480px", display: "block" }} />
        </div>
        <p className="text-center text-white/40 text-xs mt-3">Vista previa · tamaño real 1080×1920</p>
      </div>
    </div>
  );
}
