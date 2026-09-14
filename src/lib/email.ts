import nodemailer from "nodemailer";
import type { SiteSettings } from "@/lib/settings";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export type SendTicketEmailInput = {
  to: string;
  nombre: string;
  ticketCode: string;
  ticketPng: Buffer;
  settings: SiteSettings;
  siteUrl: string;
};

export async function sendTicketEmail(input: SendTicketEmailInput) {
  const transport = getTransport();
  if (!transport) {
    throw new Error(
      "SMTP no configurado. Define SMTP_HOST, SMTP_USER y SMTP_PASSWORD en las variables de entorno."
    );
  }

  const { to, nombre, ticketCode, ticketPng, settings, siteUrl } = input;
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER!;
  const fromName = process.env.SMTP_FROM_NAME || settings.eventoNombre;
  const primerNombre = nombre.trim().split(/\s+/)[0];

  const politicaUrl = `${siteUrl}/politica-de-datos`;

  const text = [
    `Hola ${primerNombre},`,
    ``,
    `Tu registro para ${settings.eventoEdicion} ha sido confirmado.`,
    ``,
    `Numero de boleta: ${ticketCode}`,
    `Fecha: ${settings.eventoFechaTexto}`,
    `Hora: ${settings.eventoHoraTexto}`,
    `Lugar: ${settings.eventoLugar}`,
    ``,
    `Esta boleta no tiene ningun costo. Es un control de ingreso para brindar mayor seguridad y orden en el evento; no representa ningun cobro y puede ser presentada por cualquier persona, ya que no es personal e intransferible.`,
    ``,
    `Adjuntamos tu boleta con el codigo QR. Debes presentarla (impresa o desde tu celular) en el punto de ingreso para validar tu entrada de forma rapida.`,
    ``,
    `Tratamiento de datos personales: tus datos seran usados unicamente para la organizacion y control de acceso de este evento, conforme a la Ley 1581 de 2012 de Colombia. Puedes consultar la politica completa en: ${politicaUrl}`,
    ``,
    `Nos vemos en la calle.`,
    `${settings.eventoNombre}`,
  ].join("\n");

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #2b2b2b;">
    <div style="padding: 24px 0; text-align: center; border-bottom: 3px solid ${settings.colorPrimario || "#c8102e"};">
      <h1 style="font-size: 20px; margin: 0; color: #1a1a1a;">${settings.eventoNombre}</h1>
      <p style="margin: 4px 0 0; color: #666; font-size: 13px;">${settings.eventoEdicion}</p>
    </div>
    <div style="padding: 24px 4px;">
      <p style="font-size: 15px; line-height: 1.6;">Hola ${primerNombre},</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Tu registro para <strong>${settings.eventoEdicion}</strong> ha sido confirmado correctamente.
        A continuacion encuentras el detalle de tu boleta de asistencia.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #777; width: 40%;">Numero de boleta</td>
          <td style="padding: 8px 0; font-weight: bold;">${ticketCode}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #777;">Fecha</td>
          <td style="padding: 8px 0;">${settings.eventoFechaTexto}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #777;">Hora</td>
          <td style="padding: 8px 0;">${settings.eventoHoraTexto}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #777;">Lugar</td>
          <td style="padding: 8px 0;">${settings.eventoLugar}</td>
        </tr>
      </table>
      <div style="background: #faf5ea; border: 1px solid #eadfc4; border-radius: 8px; padding: 14px 16px; font-size: 13px; line-height: 1.6; color: #6b5a2e;">
        Esta boleta <strong>no tiene ningun costo</strong>. Es un nuevo control de ingreso que implementamos para brindar mayor seguridad y orden a nuestros asistentes; no representa ningun cobro. La boleta no es personal, por lo que puede ser utilizada y presentada por cualquier persona.
      </div>
      <p style="font-size: 15px; line-height: 1.6; margin-top: 18px;">
        Adjuntamos tu boleta en imagen con el codigo QR de validacion. Debes presentarla, impresa o desde tu telefono, en el punto de ingreso para confirmar tu entrada de manera rapida y ordenada, sin generar filas.
      </p>
      <img src="cid:boleta" alt="Boleta ${ticketCode}" style="width: 100%; max-width: 520px; border-radius: 12px; margin-top: 10px;" />
    </div>
    <div style="border-top: 1px solid #eee; padding: 16px 4px; font-size: 11px; color: #999; line-height: 1.6;">
      <p style="margin: 0 0 6px;">
        Tratamiento de datos personales: tu nombre, correo, numero de WhatsApp y barrio se usan unicamente para la organizacion, control de acceso y comunicacion de este evento, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la Republica de Colombia.
        Puedes consultar la politica de tratamiento de datos completa aqui: <a href="${politicaUrl}" style="color: #999;">${politicaUrl}</a>
      </p>
      <p style="margin: 0;">${settings.eventoNombre} · Cucuta, Colombia</p>
    </div>
  </div>`;

  await transport.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: `Boleta confirmada · ${settings.eventoEdicion} · ${ticketCode}`,
    text,
    html,
    attachments: [
      {
        filename: `boleta-${ticketCode}.png`,
        content: ticketPng,
        cid: "boleta",
        contentType: "image/png",
      },
    ],
    headers: {
      "X-Entity-Ref-ID": ticketCode,
    },
  });
}
