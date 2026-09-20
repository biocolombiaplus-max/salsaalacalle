import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { buildQrPayload, createTicketCode, generateQrDataUrl } from "@/lib/ticket";
import { sendTicketEmail } from "@/lib/email";
import { sendTicketWhatsApp } from "@/lib/whatsapp";
// `renderTicketPng` carga playwright-core (Chromium), un paquete pesado que
// solo hace falta en el trabajo de fondo. Se importa de forma dinámica dentro
// de enviarBoleta() para que un problema al cargarlo (p. ej. empaquetado en
// Vercel) nunca tumbe la respuesta principal del registro.

// Da más margen para el trabajo en segundo plano (boleta + correo + WhatsApp)
// que sigue corriendo después de responder al navegador.
export const maxDuration = 60;

const schema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "Ingresa tu nombre completo")
    .max(120)
    .regex(/^[\p{L}\s'.-]+$/u, "El nombre solo puede contener letras"),
  correo: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[\d\s+()-]{7,20}$/, "Número de WhatsApp inválido"),
  barrio: z.string().trim().min(2, "Indica tu barrio").max(120),
  aceptaPolitica: z.literal(true, {
    error: "Debes aceptar la política de tratamiento de datos",
  }),
});

async function enviarBoleta(params: {
  registrationId: string;
  nombre: string;
  correo: string;
  whatsapp: string;
  ticketCode: string;
  siteUrl: string;
  ticketPngPrerendered: Buffer | null;
}) {
  const { registrationId, nombre, correo, whatsapp, ticketCode, siteUrl, ticketPngPrerendered } = params;
  try {
    const settings = await getSettings();
    let ticketPng = ticketPngPrerendered;
    if (!ticketPng) {
      const qrDataUrl = await generateQrDataUrl(buildQrPayload(ticketCode));
      const { renderTicketPng } = await import("@/lib/ticketImage");
      ticketPng = await renderTicketPng({ nombre, ticketCode, qrDataUrl, settings });
    }

    try {
      await sendTicketEmail({ to: correo, nombre, ticketCode, ticketPng, settings, siteUrl });
      await prisma.registration.update({
        where: { id: registrationId },
        data: { emailSentAt: new Date(), emailError: null },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      console.error("Error enviando correo", message);
      await prisma.registration.update({ where: { id: registrationId }, data: { emailError: message } });
    }

    try {
      await sendTicketWhatsApp({ to: whatsapp, nombre, ticketCode, ticketPng, settings });
      await prisma.registration.update({
        where: { id: registrationId },
        data: { whatsappSentAt: new Date(), whatsappError: null },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      console.error("Error enviando WhatsApp", message);
      await prisma.registration.update({ where: { id: registrationId }, data: { whatsappError: message } });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error generando la boleta", message);
    await prisma.registration.update({
      where: { id: registrationId },
      data: { emailError: message, whatsappError: message },
    });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Datos inválidos" }, { status: 400 });
  }

  const { nombre, correo, whatsapp, barrio } = parsed.data;

  try {
    const settings = await getSettings();
    const edicionNumero = settings.eventoEdicion.match(/\d+/)?.[0] || "4";

    let ticketCode = createTicketCode(edicionNumero);
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.registration.findUnique({ where: { ticketCode } });
      if (!exists) break;
      ticketCode = createTicketCode(edicionNumero);
    }

    const qrPayload = buildQrPayload(ticketCode);

    const registration = await prisma.registration.create({
      data: { ticketCode, nombre, correo, whatsapp, barrio, qrToken: qrPayload },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // Genera la boleta (imagen con QR) antes de responder para poder mostrarla,
    // descargarla y compartirla de inmediato en pantalla, evitando que la
    // persona tenga que esperar al correo. Si algo falla aquí (p. ej. un
    // problema cargando Chromium), no se rompe el registro: simplemente no se
    // muestra la boleta en pantalla y se reintenta en el envío por correo/WhatsApp.
    let ticketPngBase64: string | null = null;
    let ticketPngBuffer: Buffer | null = null;
    try {
      const qrDataUrl = await generateQrDataUrl(qrPayload);
      const { renderTicketPng } = await import("@/lib/ticketImage");
      ticketPngBuffer = await renderTicketPng({ nombre, ticketCode, qrDataUrl, settings });
      ticketPngBase64 = `data:image/png;base64,${ticketPngBuffer.toString("base64")}`;
    } catch (err) {
      console.error("Error generando la boleta en vivo", err);
    }

    // El envío de correo/WhatsApp sigue en segundo plano para no alargar más
    // la respuesta ni arriesgar un timeout si algún proveedor está lento.
    after(() =>
      enviarBoleta({
        registrationId: registration.id,
        nombre,
        correo,
        whatsapp,
        ticketCode,
        siteUrl,
        ticketPngPrerendered: ticketPngBuffer,
      })
    );

    return NextResponse.json({ ok: true, ticketCode, ticketPngBase64 });
  } catch (err) {
    console.error("Error en registro", err);
    return NextResponse.json(
      { error: "No fue posible completar tu registro. Intenta nuevamente en unos minutos." },
      { status: 500 }
    );
  }
}
