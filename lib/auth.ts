import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// ✅ Pastikan secret tersedia
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables");
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthTokenPayload {
  userId: number;
  role: "ADMIN" | "BRANCH_ADMIN" | "MECHANIC" | "CUSTOMER";
  branchId?: number;
}

// 🔑 Generate token (dipakai saat login)
export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// 🔎 Verifikasi dari request (cookie `token` atau header Authorization)
export function verifyAuth(request: NextRequest): AuthTokenPayload | null {
  let token = request.cookies.get("token")?.value;

  // fallback ke header Authorization
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (err) {
    console.error("verifyAuth error:", err);
    return null;
  }
}

// 🔎 Verifikasi langsung dari token string
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (err) {
    console.error("verifyToken error:", err);
    return null;
  }
}

// 🔐 RequireAuth → enforce role & branch pada route API
export function requireAuth(
  req: NextRequest,
  opts?: { roles?: AuthTokenPayload["role"][]; branchId?: string }
): AuthTokenPayload | NextResponse {
  const payload = verifyAuth(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // cek role (opsional)
  if (opts?.roles && !opts.roles.includes(payload.role)) {
    return NextResponse.json(
      { error: "Forbidden - insufficient role" },
      { status: 403 }
    );
  }

  // cek branch (opsional)
  if (opts?.branchId && String(payload.branchId) !== String(opts.branchId)) {
    return NextResponse.json(
      { error: "Forbidden - wrong branch" },
      { status: 403 }
    );
  }

  return payload;
}
