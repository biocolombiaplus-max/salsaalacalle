import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "sac_admin_session";
const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export type AdminSession = {
  sub: string;
  email: string;
  nombre: string;
};

export function signSession(payload: AdminSession): string {
  return jwt.sign(payload, SECRET, { expiresIn: "12h" });
}

export function verifySession(token: string): AdminSession | null {
  try {
    return jwt.verify(token, SECRET) as AdminSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(payload: AdminSession) {
  const store = await cookies();
  store.set(COOKIE_NAME, signSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
