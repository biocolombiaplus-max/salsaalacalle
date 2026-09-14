"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";

type ScanResult = {
  status: "ok" | "repetido" | "invalido" | "anulado";
  reason?: string;
  registration?: { nombre: string; ticketCode: string; barrio?: string; checkedInAt?: string };
};

export default function CheckinScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const lastCodeRef = useRef<{ code: string; ts: number } | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const submitCode = useCallback(async (code: string, force = false) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, force }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ status: "invalido", reason: "Error de conexión" });
    } finally {
      setLoading(false);
      setTimeout(() => {
        busyRef.current = false;
      }, 1200);
    }
  }, []);

  useEffect(() => {
    if (!cameraOn) return;
    let stream: MediaStream | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        setCameraError("No fue posible acceder a la cámara. Verifica los permisos del navegador.");
        setCameraOn(false);
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            const now = Date.now();
            const last = lastCodeRef.current;
            if (!last || last.code !== code.data || now - last.ts > 4000) {
              lastCodeRef.current = { code: code.data, ts: now };
              submitCode(code.data);
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [cameraOn, submitCode]);

  const resultStyles: Record<ScanResult["status"], string> = {
    ok: "border-green-500/40 bg-green-500/10 text-green-300",
    repetido: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
    invalido: "border-red-500/40 bg-red-500/10 text-red-300",
    anulado: "border-red-500/40 bg-red-500/10 text-red-300",
  };

  const resultTitles: Record<ScanResult["status"], string> = {
    ok: "✓ Ingreso confirmado",
    repetido: "⚠ Boleta ya utilizada",
    invalido: "✕ Código no válido",
    anulado: "✕ Boleta anulada",
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video relative flex items-center justify-center">
          {cameraOn ? (
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <button
              onClick={() => {
                setCameraError("");
                setCameraOn(true);
              }}
              className="rounded-full bg-gold text-[#1a1408] font-semibold px-6 py-3 text-sm hover:brightness-110 transition"
            >
              Activar cámara
            </button>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        {cameraOn && (
          <button onClick={() => setCameraOn(false)} className="text-xs text-white/50 mt-3 hover:text-white">
            Detener cámara
          </button>
        )}
        {cameraError && <p className="text-sm text-red-400 mt-3">{cameraError}</p>}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
            Ingreso manual de código
          </label>
          <div className="flex gap-2">
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && manualCode && submitCode(manualCode)}
              placeholder="SAC4-XXX-XXX"
              className="flex-1 rounded-xl bg-black/30 border border-white/15 px-4 py-2.5 text-sm outline-none focus:border-gold transition font-mono"
            />
            <button
              disabled={!manualCode || loading}
              onClick={() => submitCode(manualCode)}
              className="rounded-xl bg-gold text-[#1a1408] font-semibold px-5 py-2.5 text-sm hover:brightness-110 transition disabled:opacity-50"
            >
              Validar
            </button>
          </div>
        </div>
      </div>

      <div>
        {result ? (
          <div className={`rounded-2xl border p-6 ${resultStyles[result.status]}`}>
            <p className="font-display text-xl font-bold mb-3">{resultTitles[result.status]}</p>
            {result.registration && (
              <div className="space-y-1 text-sm">
                <p><span className="opacity-60">Nombre: </span>{result.registration.nombre}</p>
                <p><span className="opacity-60">Boleta: </span><span className="font-mono">{result.registration.ticketCode}</span></p>
              </div>
            )}
            {result.reason && <p className="text-sm mt-2 opacity-90">{result.reason}</p>}
            {result.status === "repetido" && result.registration && (
              <button
                onClick={() => submitCode(result.registration!.ticketCode, true)}
                className="mt-4 text-xs underline hover:opacity-80"
              >
                Confirmar ingreso de todas formas
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white/40 text-sm">
            Escanea una boleta para ver el resultado aquí.
          </div>
        )}
      </div>
    </div>
  );
}
