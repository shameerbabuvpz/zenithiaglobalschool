import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE_NAME = "zgs_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Default 6-digit PIN applied on first run and on reset. */
export const DEFAULT_PIN = "345678";

/** A valid PIN is exactly 6 digits. */
export function isValidPin(pin: string) {
  return /^\d{6}$/.test(pin);
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

/** True when the signing secret is configured. */
export function hasAuthSecret() {
  return Boolean(process.env.AUTH_SECRET);
}

export type SessionPayload = {
  uid: string;
  email: string;
  name: string;
};

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

/** The single admin account that owns the panel. */
export async function getAdminUser() {
  return prisma.adminUser.findFirst({ orderBy: { createdAt: "asc" } });
}

/** Verify a 6-digit PIN against the admin account. */
export async function verifyPin(pin: string) {
  if (!isValidPin(pin)) return null;
  const user = await getAdminUser();
  if (!user) return null;
  const ok = await bcrypt.compare(pin, user.passwordHash);
  if (!ok) return null;
  return user;
}

/** Set (or reset) the admin login PIN, creating the admin if missing. */
export async function setAdminPin(pin: string) {
  const passwordHash = await bcrypt.hash(pin, 10);
  const user = await getAdminUser();
  if (user) {
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash },
    });
  } else {
    await prisma.adminUser.create({
      data: {
        email: (process.env.ADMIN_EMAIL || "admin@zenithia.net").toLowerCase(),
        passwordHash,
        name: "Administrator",
      },
    });
  }
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  if (!hasAuthSecret()) return null;
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      uid: String(payload.uid),
      email: String(payload.email),
      name: String(payload.name),
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
