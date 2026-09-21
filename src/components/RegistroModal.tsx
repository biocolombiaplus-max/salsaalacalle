"use client";

import { useEffect, useSyncExternalStore } from "react";

const REGISTRO_HASH = "#registro";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getSnapshot() {
  return window.location.hash === REGISTRO_HASH;
}

function getServerSnapshot() {
  return false;
}

function closeModal() {
  window.location.hash = "";
}

export default function RegistroModal({
  eventoNombre,
  eventoEdicion,
}: {
  eventoNombre: string;
  eventoEdicion: string;
}) {
  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-[#0b0b0d] ring-1 ring-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition"
        >
          ✕
        </button>
        <div className="overflow-y-auto max-h-[92vh]">
          <iframe
            src="https://eventosid.com/evento/salsa-a-la-calle-4to-encuentro-salsero-2026/embed"
            title={`Registro · ${eventoNombre} · ${eventoEdicion}`}
            width="100%"
            height={750}
            frameBorder={0}
            allow="payment"
            style={{ border: "none", width: "100%", minHeight: "750px", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}
