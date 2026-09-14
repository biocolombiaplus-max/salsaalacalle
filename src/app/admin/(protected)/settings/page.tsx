import SettingsForm from "@/components/admin/SettingsForm";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Personalizar landing</h1>
      <p className="text-white/50 text-sm mb-8">
        Actualiza el logo, las imágenes, la información del evento y las redes sociales que se muestran en la página pública.
      </p>
      <SettingsForm />
    </div>
  );
}
