import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "transitops-super-secret-key-2026";
export const JWT_EXPIRES_IN = "7d";

export function signToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string; role: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
}
