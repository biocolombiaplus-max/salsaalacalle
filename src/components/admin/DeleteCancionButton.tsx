"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteCancionButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar esta canción pedida?")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/canciones?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      aria-label="Eliminar"
      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
    >
      ✕ Eliminar
    </button>
  );
}
