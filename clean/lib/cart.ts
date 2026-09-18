import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { cartLineSchema, type CartLine } from "@/lib/integrations/types";

const COOKIE = "ag_cart";
const cartSchema = z.object({
  lines: z.array(cartLineSchema).max(100),
});

function secret(): string {
  return process.env.SESSION_SECRET || "dev-cart-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function encode(lines: CartLine[]): string {
  const body = Buffer.from(JSON.stringify({ lines }), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(raw: string | undefined): CartLine[] {
  if (!raw) return [];
  const [body, sig] = raw.split(".");
  if (!body || !sig) return [];
  const expected = sign(body);
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return [];
  } catch {
    return [];
  }
  try {
    const json = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const parsed = cartSchema.safeParse(json);
    return parsed.success ? parsed.data.lines : [];
  } catch {
    return [];
  }
}

export async function getCart(): Promise<CartLine[]> {
  if (process.env.STATIC_EXPORT === "1") return [];
  const jar = await cookies();
  return decode(jar.get(COOKIE)?.value);
}

export async function setCart(lines: CartLine[]): Promise<void> {
  if (process.env.STATIC_EXPORT === "1") return;
  const jar = await cookies();
  jar.set(COOKIE, encode(lines), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearCart(): Promise<void> {
  await setCart([]);
}

export async function addToCart(partId: string, qty = 1): Promise<CartLine[]> {
  const lines = await getCart();
  const idx = lines.findIndex((l) => l.partId === partId);
  if (idx >= 0) {
    const current = lines[idx]!;
    lines[idx] = { partId, qty: Math.min(999, current.qty + qty) };
  } else {
    lines.push({ partId, qty });
  }
  await setCart(lines);
  return lines;
}

export async function setCartQty(partId: string, qty: number): Promise<CartLine[]> {
  const clamped = Math.max(0, Math.min(999, Math.round(qty) || 0));
  const lines = await getCart();
  const next = clamped === 0
    ? lines.filter((l) => l.partId !== partId)
    : lines.map((l) => (l.partId === partId ? { partId, qty: clamped } : l));
  await setCart(next);
  return next;
}

export async function removeFromCart(partId: string): Promise<CartLine[]> {
  const lines = (await getCart()).filter((l) => l.partId !== partId);
  await setCart(lines);
  return lines;
}
