import type { SiteSettings } from "@/lib/settings";

const GRAPH_VERSION = "v21.0";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("57")) return digits;
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

async function uploadMedia(phoneNumberId: string, token: string, png: Buffer): Promise<string> {
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append(
    "file",
    new Blob([new Uint8Array(png)], { type: "image/png" }),
    "boleta.png"
  );

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/media`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || "Error subiendo la imagen a WhatsApp");
  }
  return json.id as string;
}

export type SendTicketWhatsAppInput = {
  to: string;
  nombre: string;
  ticketCode: string;
  ticketPng: Buffer;
  settings: SiteSettings;
};

export async function sendTicketWhatsApp(input: SendTicketWhatsAppInput) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "boleta_evento";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "es_CO";

  if (!phoneNumberId || !token) {
    throw new Error(
      "WhatsApp Cloud API no configurada. Define WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN."
    );
  }

  const { to, nombre, ticketCode, ticketPng, settings } = input;
  const waTo = normalizePhone(to);
  const mediaId = await uploadMedia(phoneNumberId, token, ticketPng);

  const payload = {
    messaging_product: "whatsapp",
    to: waTo,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: "header",
          parameters: [{ type: "image", image: { id: mediaId } }],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: nombre },
            { type: "text", text: ticketCode },
            { type: "text", text: settings.eventoFechaTexto },
            { type: "text", text: settings.eventoLugar },
          ],
        },
      ],
    },
  };

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || "Error enviando el mensaje de WhatsApp");
  }
  return json;
}
