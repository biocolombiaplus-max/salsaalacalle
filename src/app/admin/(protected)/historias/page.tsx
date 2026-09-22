import StoryGenerator from "@/components/admin/StoryGenerator";

export default function HistoriasPage() {
  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Historias de patrocinadores</h1>
      <p className="text-white/50 text-sm mb-8">
        Crea imágenes 9:16 listas para Instagram y TikTok con el logo de cada patrocinador, totalmente personalizables.
      </p>
      <StoryGenerator />
    </div>
  );
}
