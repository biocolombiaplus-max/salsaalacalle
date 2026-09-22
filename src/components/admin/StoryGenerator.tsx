"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteSettings } from "@/lib/settings";

const CANVAS_W = 1080;
const CANVAS_H = 1920;

type LogoColorMode = "original" | "white" | "black" | "gold" | "custom";
type Mode = "individual" | "grid";

const inputClass =
  "w-full rounded-xl bg-black/30 border border-white/15 px-4 py-2.5 text-sm outline-none focus:border-gold transition";
const colorInputClass = "h-11 w-full rounded-xl bg-black/30 border border-white/15";

// Los logos con URL absoluta (http/https) pueden vivir en un dominio
// externo sin cabeceras CORS — el navegador entonces se niega a cargarlos
// en modo crossOrigin, que es lo que el <canvas> necesita para poder
// exportarse después. Los rutamos por nuestro propio servidor para que
// siempre carguen, sin importar el dominio de origen. Las rutas propias
// (relativas, o ya subidas a nuestro blob) no lo necesitan.
function resolveImageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) {
    return `/api/admin/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">{label}</label>
      {children}
    </div>
  );
}

type ImageLoadState = { img: HTMLImageElement | null; failed: boolean };
const EMPTY_IMAGE_STATE: ImageLoadState = { img: null, failed: false };

function useImageElement(src: string | null): ImageLoadState {
  const [state, setState] = useState<ImageLoadState>(EMPTY_IMAGE_STATE);

  useEffect(() => {
    let cancelled = false;
    if (!src) {
      queueMicrotask(() => {
        if (!cancelled) setState(EMPTY_IMAGE_STATE);
      });
      return () => {
        cancelled = true;
      };
    }
    const el = new window.Image();
    el.crossOrigin = "anonymous";
    el.onload = () => {
      if (!cancelled) setState({ img: el, failed: false });
    };
    el.onerror = () => {
      if (!cancelled) setState({ img: null, failed: true });
    };
    el.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return state;
}

function useImageElements(urls: string[]): ImageLoadState[] {
  const [states, setStates] = useState<ImageLoadState[]>([]);
  const key = urls.join("|");

  useEffect(() => {
    let cancelled = false;
    if (urls.length === 0) {
      queueMicrotask(() => {
        if (!cancelled) setStates([]);
      });
      return () => {
        cancelled = true;
      };
    }
    const loaded: ImageLoadState[] = new Array(urls.length).fill(EMPTY_IMAGE_STATE);
    let remaining = urls.length;
    urls.forEach((url, i) => {
      const el = new window.Image();
      el.crossOrigin = "anonymous";
      const settle = () => {
        remaining -= 1;
        if (!cancelled && remaining === 0) setStates([...loaded]);
      };
      el.onload = () => {
        loaded[i] = { img: el, failed: false };
        settle();
      };
      el.onerror = () => {
        loaded[i] = { img: null, failed: true };
        settle();
      };
      el.src = url;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- urls comparado vía `key`
  }, [key]);

  return states;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type GridAlign = "arriba" | "medio" | "abajo";

function drawSponsorGrid(
  ctx: CanvasRenderingContext2D,
  logos: (HTMLImageElement | null)[],
  startY: number,
  endY: number,
  recolor: { mode: LogoColorMode; color: string },
  scalePct: number,
  align: GridAlign
) {
  const count = logos.length;
  if (count === 0) return;

  const cols = count === 1 ? 1 : count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);

  const marginX = 56;
  const gap = 24;
  const availW = CANVAS_W - marginX * 2;
  const availH = endY - startY;
  const cellW = (availW - gap * (cols - 1)) / cols;
  const cellH = (availH - gap * (rows - 1)) / rows;
  const labelH = 44;
  const innerPad = 22;

  logos.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = marginX + col * (cellW + gap);
    const y = startY + row * (cellH + gap);

    roundRectPath(ctx, x, y, cellW, cellH, 20);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(252,144,0,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (img) {
      const slotW = cellW - innerPad * 2;
      const slotH = cellH - labelH - innerPad * 1.4;
      const boxW = slotW * (scalePct / 100);
      const boxH = slotH * (scalePct / 100);
      const boxX = x + (cellW - boxW) / 2;
      const slotY = y + innerPad * 0.6;
      const boxY = align === "arriba" ? slotY : align === "abajo" ? slotY + (slotH - boxH) : slotY + (slotH - boxH) / 2;

      if (recolor.mode === "original") {
        drawContain(ctx, img, boxX, boxY, boxW, boxH);
      } else {
        drawRecolored(ctx, img, boxX, boxY, boxW, boxH, recolor.color);
      }
    }

    ctx.fillStyle = "rgba(252,144,0,0.9)";
    ctx.font = "600 18px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("OFICIAL", x + cellW / 2, y + cellH - labelH / 2 + 6);
  });
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

// Renderiza en una resolución interna más alta que el tamaño final del
// logo (hasta 2x, limitado al tamaño real de la imagen fuente) y luego
// la reduce al dibujarla — mismo truco que el supersampling, evita que
// el recoloreado (que redibuja el logo desde cero en un canvas aparte)
// se vea más blando que el logo original.
function drawRecolored(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  const supersample = Math.min(2, Math.max(1, img.width / w, img.height / h));
  const offW = Math.round(w * supersample);
  const offH = Math.round(h * supersample);

  const off = document.createElement("canvas");
  off.width = offW;
  off.height = offH;
  const octx = off.getContext("2d");
  if (!octx) return;
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";

  const scale = Math.min(offW / img.width, offH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  octx.drawImage(img, (offW - dw) / 2, (offH - dh) / 2, dw, dh);
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = color;
  octx.fillRect(0, 0, offW, offH);
  ctx.drawImage(off, x, y, w, h);
}

export default function StoryGenerator() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [exportError, setExportError] = useState("");

  const [mode, setMode] = useState<Mode>("individual");
  const [sponsorIndex, setSponsorIndex] = useState(0);

  const [backgroundMode, setBackgroundMode] = useState<"imagen" | "color">("color");
  const [backgroundColor, setBackgroundColor] = useState("#120b0d");
  const [backgroundLocalUrl, setBackgroundLocalUrl] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(45);

  const [showEventLogo, setShowEventLogo] = useState(true);
  const [eventLogoSizePct, setEventLogoSizePct] = useState(41);

  const [eyebrowVisible, setEyebrowVisible] = useState(true);
  const [eyebrowText, setEyebrowText] = useState("Patrocinador oficial");
  const [eyebrowColor, setEyebrowColor] = useState("#fc9000");
  const [eyebrowSize, setEyebrowSize] = useState(38);
  const [eyebrowYPct, setEyebrowYPct] = useState(18);

  const [logoColorMode, setLogoColorMode] = useState<LogoColorMode>("original");
  const [logoCustomColor, setLogoCustomColor] = useState("#ffffff");
  const [logoSizePct, setLogoSizePct] = useState(60);
  const [logoYPct, setLogoYPct] = useState(50);
  const [gridLogoScalePct, setGridLogoScalePct] = useState(70);
  const [gridLogoAlign, setGridLogoAlign] = useState<GridAlign>("medio");

  const [bottomBarVisible, setBottomBarVisible] = useState(true);
  const [bottomBarColor, setBottomBarColor] = useState("#3d1f5c");
  const [bottomBarText, setBottomBarText] = useState("");
  const [bottomBarTextColor, setBottomBarTextColor] = useState("#ffffff");
  const [bottomBarTextSize, setBottomBarTextSize] = useState(34);

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

  function handleModeChange(next: Mode) {
    setMode(next);
    setEyebrowText(next === "grid" ? "Patrocinadores oficiales" : "Patrocinador oficial");
    setBottomBarText(next === "grid" ? "" : settings?.patrocinadores[sponsorIndex]?.link || "");
  }

  const { img: eventLogoImg } = useImageElement(showEventLogo ? resolveImageSrc(settings?.logoUrl) : null);
  const { img: sponsorLogoImg, failed: sponsorLogoFailed } = useImageElement(
    mode === "individual" ? resolveImageSrc(sponsor?.logoUrl) : null
  );

  const gridSponsors = mode === "grid" ? settings?.patrocinadores.filter((p) => !!p.logoUrl) ?? [] : [];
  const gridLogoStates = useImageElements(gridSponsors.map((p) => resolveImageSrc(p.logoUrl) as string));
  const gridLogoImgs = gridLogoStates.map((s) => s.img);
  const gridFailedNames = gridSponsors.filter((_, i) => gridLogoStates[i]?.failed).map((p) => p.nombre || "Patrocinador");

  const { img: backgroundImg } = useImageElement(backgroundMode === "imagen" ? backgroundLocalUrl : null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (backgroundMode === "imagen" && backgroundImg) {
      drawCover(ctx, backgroundImg, 0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = `rgba(0,0,0,${overlayOpacity / 100})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    if (showEventLogo && eventLogoImg) {
      const evW = CANVAS_W * (eventLogoSizePct / 100);
      const evH = evW * (190 / 440);
      drawContain(ctx, eventLogoImg, CANVAS_W / 2 - evW / 2, 90, evW, evH);
    }

    if (eyebrowVisible && eyebrowText.trim()) {
      ctx.fillStyle = eyebrowColor;
      ctx.font = `700 ${eyebrowSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      const spaced = eyebrowText.trim().toUpperCase().split("").join("  ");
      ctx.fillText(spaced, CANVAS_W / 2, CANVAS_H * (eyebrowYPct / 100));
    }

    const recolorColor =
      logoColorMode === "white" ? "#ffffff" : logoColorMode === "black" ? "#000000" : logoColorMode === "gold" ? "#fc9000" : logoCustomColor;

    if (mode === "individual" && sponsorLogoImg) {
      const boxW = CANVAS_W * (logoSizePct / 100);
      const boxH = boxW * 0.62;
      const boxX = (CANVAS_W - boxW) / 2;
      const boxY = CANVAS_H * (logoYPct / 100) - boxH / 2;

      if (logoColorMode === "original") {
        drawContain(ctx, sponsorLogoImg, boxX, boxY, boxW, boxH);
      } else {
        drawRecolored(ctx, sponsorLogoImg, boxX, boxY, boxW, boxH, recolorColor);
      }
    } else if (mode === "grid" && gridLogoImgs.length > 0) {
      const gridStartY = 420;
      const gridEndY = CANVAS_H - (bottomBarVisible ? 190 + 50 : 70);
      drawSponsorGrid(
        ctx,
        gridLogoImgs,
        gridStartY,
        gridEndY,
        { mode: logoColorMode, color: recolorColor },
        gridLogoScalePct,
        gridLogoAlign
      );
    }

    if (bottomBarVisible) {
      const barH = 190;
      ctx.fillStyle = bottomBarColor;
      ctx.fillRect(0, CANVAS_H - barH, CANVAS_W, barH);
      if (bottomBarText.trim()) {
        ctx.fillStyle = bottomBarTextColor;
        ctx.font = `600 ${bottomBarTextSize}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(bottomBarText.trim(), CANVAS_W / 2, CANVAS_H - barH / 2 + bottomBarTextSize * 0.35, CANVAS_W - 120);
      }
    }
  }, [
    mode,
    backgroundMode,
    backgroundImg,
    backgroundColor,
    overlayOpacity,
    showEventLogo,
    eventLogoImg,
    eventLogoSizePct,
    eyebrowVisible,
    eyebrowText,
    eyebrowColor,
    eyebrowSize,
    eyebrowYPct,
    sponsorLogoImg,
    gridLogoImgs,
    logoColorMode,
    logoCustomColor,
    logoSizePct,
    logoYPct,
    gridLogoScalePct,
    gridLogoAlign,
    bottomBarVisible,
    bottomBarColor,
    bottomBarText,
    bottomBarTextColor,
    bottomBarTextSize,
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
      const baseName = mode === "grid" ? "patrocinadores" : sponsor?.nombre || "patrocinador";
      a.download = `${baseName.trim().toLowerCase().replace(/\s+/g, "-")}-historia.png`;
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
        <Field label="Qué mostrar">
          <div className="flex gap-2">
            <button
              onClick={() => handleModeChange("individual")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm transition ${
                mode === "individual" ? "bg-gold text-[#1a1408] font-semibold" : "bg-black/30 text-white/70 hover:bg-white/5"
              }`}
            >
              Un patrocinador
            </button>
            <button
              onClick={() => handleModeChange("grid")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm transition ${
                mode === "grid" ? "bg-gold text-[#1a1408] font-semibold" : "bg-black/30 text-white/70 hover:bg-white/5"
              }`}
            >
              Todos los patrocinadores
            </button>
          </div>
        </Field>

        {mode === "individual" ? (
          <>
            <Field label="Patrocinador">
              <select className={inputClass} value={sponsorIndex} onChange={(e) => handleSponsorChange(Number(e.target.value))}>
                {settings.patrocinadores.map((p, i) => (
                  <option key={`${p.nombre}-${i}`} value={i}>
                    {p.nombre || `Patrocinador ${i + 1}`}
                  </option>
                ))}
              </select>
            </Field>
            {sponsorLogoFailed && (
              <p className="text-red-400 text-sm">
                No se pudo cargar el logo de {sponsor?.nombre || "este patrocinador"}. Si pegaste un link de otra página web,
                es probable que esa página bloquee la descarga automática de sus imágenes. Solución: sube el logo como
                archivo en{" "}
                <a href="/admin/settings" className="underline">
                  Personalizar → Patrocinadores
                </a>{" "}
                en vez de pegar el link — así siempre va a funcionar.
              </p>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-white/50 text-sm">
              Se incluyen los {settings.patrocinadores.length} patrocinadores agregados, ordenados en una grilla que se acomoda
              automáticamente según cuántos haya. El orden es el mismo que en{" "}
              <a href="/admin/settings" className="text-gold underline">
                Personalizar → Patrocinadores
              </a>
              .
            </p>
            {gridFailedNames.length > 0 && (
              <p className="text-red-400 text-sm">
                No se pudo cargar el logo de: {gridFailedNames.join(", ")}. Si pegaste un link de otra página web para esos
                patrocinadores, es probable que esa página bloquee la descarga automática. Solución: sube esos logos como
                archivo en{" "}
                <a href="/admin/settings" className="underline">
                  Personalizar → Patrocinadores
                </a>{" "}
                en vez de pegar el link.
              </p>
            )}
          </div>
        )}

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
          <p className="text-xs uppercase tracking-widest text-white/50">
            {mode === "individual" ? "Logo del patrocinador" : "Logos de los patrocinadores"}
          </p>

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

          {mode === "individual" && (
            <div>
              <label className="flex items-center justify-between text-[11px] uppercase tracking-widest text-white/50 mb-1.5">
                <span>Posición vertical</span>
                <span className="text-gold normal-case tracking-normal">{logoYPct}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={90}
                value={logoYPct}
                onChange={(e) => setLogoYPct(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-1">
                <span>Arriba</span>
                <span>Abajo</span>
              </div>
            </div>
          )}

          {mode === "individual" && (
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
          )}
          {mode === "grid" && (
            <>
              <div>
                <label className="flex items-center justify-between text-[11px] uppercase tracking-widest text-white/50 mb-1.5">
                  <span>Tamaño de los logos</span>
                  <span className="text-gold normal-case tracking-normal">{gridLogoScalePct}%</span>
                </label>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={gridLogoScalePct}
                  onChange={(e) => setGridLogoScalePct(Number(e.target.value))}
                  className="w-full accent-gold"
                />
                <p className="text-white/40 text-[11px] mt-1">
                  Bájalo si los logos se ven muy pegados al borde de su tarjeta.
                </p>
              </div>
              <Field label="Posición dentro de la tarjeta">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["arriba", "Arriba"],
                      ["medio", "Medio"],
                      ["abajo", "Abajo"],
                    ] as [GridAlign, string][]
                  ).map(([align, label]) => (
                    <button
                      key={align}
                      onClick={() => setGridLogoAlign(align)}
                      className={`rounded-lg px-2 py-2 text-xs transition ${
                        gridLogoAlign === align ? "bg-gold text-[#1a1408] font-semibold" : "bg-black/30 text-white/70 hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
            <input type="checkbox" checked={showEventLogo} onChange={(e) => setShowEventLogo(e.target.checked)} className="h-4 w-4 accent-gold" />
            Logo del evento arriba
          </label>
          {showEventLogo && (
            <div>
              <label className="flex items-center justify-between text-[11px] uppercase tracking-widest text-white/50 mb-1.5">
                <span>Tamaño del logo del evento</span>
                <span className="text-gold normal-case tracking-normal">{eventLogoSizePct}%</span>
              </label>
              <input
                type="range"
                min={20}
                max={75}
                value={eventLogoSizePct}
                onChange={(e) => setEventLogoSizePct(Number(e.target.value))}
                className="w-full accent-gold"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
            <input type="checkbox" checked={eyebrowVisible} onChange={(e) => setEyebrowVisible(e.target.checked)} className="h-4 w-4 accent-gold" />
            Texto &quot;Patrocinador oficial&quot;
          </label>
          {eyebrowVisible && (
            <>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Field label="Texto">
                  <input className={inputClass} value={eyebrowText} onChange={(e) => setEyebrowText(e.target.value)} />
                </Field>
                <Field label="Color">
                  <input
                    type="color"
                    value={eyebrowColor}
                    onChange={(e) => setEyebrowColor(e.target.value)}
                    className="h-11 w-14 rounded-xl bg-black/30 border border-white/15"
                  />
                </Field>
              </div>
              <div>
                <label className="flex items-center justify-between text-[11px] uppercase tracking-widest text-white/50 mb-1.5">
                  <span>Tamaño del texto</span>
                  <span className="text-gold normal-case tracking-normal">{eyebrowSize}px</span>
                </label>
                <input
                  type="range"
                  min={22}
                  max={64}
                  value={eyebrowSize}
                  onChange={(e) => setEyebrowSize(Number(e.target.value))}
                  className="w-full accent-gold"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-[11px] uppercase tracking-widest text-white/50 mb-1.5">
                  <span>Posición vertical del texto</span>
                  <span className="text-gold normal-case tracking-normal">{eyebrowYPct}%</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={eyebrowYPct}
                  onChange={(e) => setEyebrowYPct(Number(e.target.value))}
                  className="w-full accent-gold"
                />
              </div>
            </>
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
              <div>
                <label className="flex items-center justify-between text-[11px] uppercase tracking-widest text-white/50 mb-1.5">
                  <span>Tamaño del texto</span>
                  <span className="text-gold normal-case tracking-normal">{bottomBarTextSize}px</span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={60}
                  value={bottomBarTextSize}
                  onChange={(e) => setBottomBarTextSize(Number(e.target.value))}
                  className="w-full accent-gold"
                />
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
