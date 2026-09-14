import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSettings, updateSettings, DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const settings = await getSettings(true);
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const allowedKeys = new Set(Object.keys(DEFAULT_SETTINGS));
  const partial: Partial<SiteSettings> = {};
  for (const [key, value] of Object.entries(body)) {
    if (allowedKeys.has(key)) {
      (partial as Record<string, unknown>)[key] = value;
    }
  }

  await updateSettings(partial);
  return NextResponse.json({ ok: true });
}
