import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// pastikan secret tersedia
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables");
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthTokenPayload {
  userId: number;
  role: "ADMIN" | "BRANCH_ADMIN" | "MECHANIC" | "CUSTOMER";
  branchId?: number;
}

// generate token (untuk login)
export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// verifikasi dari request (header Authorization: Bearer xxx)
export function verifyAuth(request: NextRequest): AuthTokenPayload | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

// verifikasi langsung dari token string
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

/**
 * 🔐 requireAuth → untuk enforce role dan branch pada route API
 */
export function requireAuth(
  req: NextRequest,
  opts?: { roles?: AuthTokenPayload["role"][]; branchId?: string }
): AuthTokenPayload | NextResponse {
  const payload = verifyAuth(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // cek role
  if (opts?.roles && !opts.roles.includes(payload.role)) {
    return NextResponse.json({ error: "Forbidden - insufficient role" }, { status: 403 });
  }

  // cek branch
  if (opts?.branchId && String(payload.branchId) !== String(opts.branchId)) {
    return NextResponse.json({ error: "Forbidden - wrong branch" }, { status: 403 });
  }

  return payload;
}
