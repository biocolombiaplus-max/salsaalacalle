import CheckinScanner from "@/components/admin/CheckinScanner";

export default function CheckinPage() {
  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Control de ingreso</h1>
      <p className="text-white/50 text-sm mb-8">
        Escanea el código QR de la boleta o ingresa el código manualmente para confirmar el ingreso.
      </p>
      <CheckinScanner />
    </div>
  );
}
