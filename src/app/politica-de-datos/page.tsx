import { getSettings } from "@/lib/settings";
import Link from "next/link";

export const revalidate = 0;

export default async function PoliticaDatosPage() {
  const s = await getSettings();

  return (
    <main className="min-h-screen bg-background text-foreground px-5 sm:px-8 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-gold text-sm hover:underline">← Volver al inicio</Link>
        <p className="uppercase tracking-[0.3em] text-gold text-xs mt-8 mb-3">Documento legal</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
          Política de Tratamiento de Datos Personales
        </h1>
        <p className="text-white/50 text-sm mb-12">
          {s.eventoNombre} — Vigente para {s.eventoEdicion}. Última actualización: {new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}.
        </p>

        <div className="space-y-8 text-white/80 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="font-display text-xl text-white font-bold mb-3">1. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de los datos personales recolectados a través del formulario de
              registro de <strong>{s.eventoEdicion}</strong> es <strong>{s.legalResponsable || s.eventoNombre}</strong>
              {s.legalNit ? <> (NIT {s.legalNit})</> : null}, con domicilio en {s.eventoCiudad}, Colombia.
              {s.contactoEmail ? (
                <> Puede contactarnos a través del correo electrónico <strong>{s.contactoEmail}</strong></>
              ) : null}
              {s.contactoTelefono ? <> o del número de contacto {s.contactoTelefono}.</> : "."}
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white font-bold mb-3">2. Marco normativo</h2>
            <p>
              Esta política se expide en cumplimiento de la Constitución Política de Colombia (artículo 15), la
              Ley Estatutaria 1581 de 2012 &quot;Por la cual se dictan disposiciones generales para la protección
              de datos personales&quot;, su Decreto Reglamentario 1377 de 2013, el Decreto Único Reglamentario 1074
              de 2015 y demás normas que los modifiquen, complementen o sustituyan, así como los lineamientos de
              la Superintendencia de Industria y Comercio (SIC) como autoridad de protección de datos en Colombia.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white font-bold mb-3">3. Datos que recolectamos</h2>
            <p className="mb-3">
              A través del formulario de pre-registro para el evento recolectamos únicamente los siguientes datos:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-white/75">
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Número de WhatsApp / teléfono de contacto</li>
              <li>Barrio de residencia</li>
            </ul>
            <p className="mt-3">
              No solicitamos ni almacenamos datos sensibles (origen racial o étnico, orientación política,
              convicciones religiosas o filosóficas, datos de salud, datos biométricos, entre otros) en este
              proceso de registro.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white font-bold mb-3">4. Finalidad del tratamiento</h2>
            <p className="mb-3">Los datos recolectados serán utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-1 text-white/75">
              <li>Gestionar tu inscripción y expedir tu boleta digital de asistencia al evento (número de boleta y código QR de ingreso).</li>
              <li>Validar tu ingreso al evento de forma ágil y ordenada, evitando filas y congestión.</li>
              <li>Enviarte, por correo electrónico y/o WhatsApp, tu boleta, recordatorios e información logística relacionada con el evento.</li>
              <li>Elaborar estadísticas internas y análisis de asistencia por zonas de la ciudad, con fines exclusivamente organizativos y de mejora logística de futuras ediciones.</li>
              <li>Dar cumplimiento a obligaciones legales o requerimientos de autoridades competentes, cuando aplique.</li>
            </ul>
            <p className="mt-3">
              Tus datos <strong>no serán utilizados con fines comerciales, publicitarios de terceros, ni serán
              vendidos, arrendados o cedidos</strong> a ningún tercero distinto de los proveedores tecnológicos
              estrictamente necesarios para el envío del correo electrónico y del mensaje de WhatsApp (encargados
              del tratamiento), quienes actúan bajo instrucciones expresas y confidencialidad.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white font-bold mb-3">5. Autorización</h2>
            <p>
              Al marcar la casilla de aceptación en el formulario de registro y enviar tus datos, manifiestas de
              manera libre, previa, expresa e informada tu autorización para el tratamiento de tus datos
              personales conforme a esta política. Esta autorización es indispensable para poder expedir tu
              boleta de ingreso al evento.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white font-bold mb-3">6. Derechos del titular (Derechos ARCO)</h2>
            <p className="mb-3">Como titular de tus datos personales, tienes derecho a:</p>
            <ul className="list-disc pl-6 space-y-1 text-white/75">
              <li>Conocer, actualizar y rectificar tus datos personales.</li>
              <li>Solicitar prueba de la autorización otorgada.</li>
              <li>Ser informado sobre el uso que se le ha dado a tus datos.</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.</li>
              <li>Revocar la autorización y/o solicitar la supresión de tus datos, cuando no exista un deber legal o contractual que impida su eliminación.</li>
              <li>Acceder de forma gratuita a tus datos personales que hayan sido objeto de tratamiento.</li>
            </ul>
            <p className="mt-3">
              Puedes ejercer estos derechos enviando una solicitud
              {s.contactoEmail ? <> al correo electrónico <strong>{s.contactoEmail}</strong></> : " a nuestros canales de contacto oficiales"},
              indicando tu nombre completo, el derecho que deseas ejercer y una descripción clara de tu solicitud.
              Responderemos dentro de los términos establecidos por la Ley 1581 de 2012 (10 días hábiles para
              consultas y 15 días hábiles para reclamos, prorrogables conforme a la ley).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white font-bold mb-3">7. Seguridad de la información</h2>
            <p>
              Implementamos medidas técnicas, humanas y administrativas razonables para proteger tus datos
              personales contra pérdida, uso indebido, acceso no autorizado, alteración o divulgación. El acceso
              a la base de datos de registrados está restringido al personal organizador autorizado del evento.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white font-bold mb-3">8. Tiempo de conservación</h2>
            <p>
              Tus datos serán conservados durante el tiempo necesario para cumplir con la finalidad del
              registro y el control de ingreso al evento, y posteriormente durante el período requerido para
              fines estadísticos internos o por obligación legal, tras lo cual serán eliminados o anonimizados
              de forma segura.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white font-bold mb-3">9. Sobre la boleta digital</h2>
            <p>
              La boleta generada a partir de tu registro <strong>no tiene ningún costo</strong>. El código QR
              asociado es únicamente un mecanismo de control de acceso para brindar seguridad, orden y agilidad
              en el ingreso al evento; en ningún caso implica un cobro. La boleta no es personal ni intransferible,
              por lo que puede ser presentada por cualquier persona portadora de la misma.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white font-bold mb-3">10. Modificaciones</h2>
            <p>
              Esta política podrá actualizarse en cualquier momento. Los cambios serán publicados en esta misma
              página con la fecha de última actualización correspondiente.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
