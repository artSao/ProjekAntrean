// lib/middleware.ts
import { NextResponse, NextRequest } from "next/server";
import { verifyAuth, AuthTokenPayload } from "./auth";

type RequireAuthOptions = {
  roles?: AuthTokenPayload["role"][]; // daftar role yang diizinkan
  branchId?: string;                  // optional, batasi cabang tertentu
  allowSameBranchOnly?: boolean;      // true = user hanya boleh akses cabangnya sendiri
};

export function requireAuth(
  request: NextRequest,
  options: RequireAuthOptions = {}
): AuthTokenPayload | NextResponse {
  const token = verifyAuth(request);

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Token tidak valid atau tidak ada" },
      { status: 401 }
    );
  }

  // Validasi role
  if (options.roles && !options.roles.includes(token.role)) {
    return NextResponse.json(
      { error: "Forbidden", message: `Role ${token.role} tidak diizinkan` },
      { status: 403 }
    );
  }

  // Validasi branchId tertentu
  if (options.branchId && token.branchId?.toString() !== options.branchId) {
    return NextResponse.json(
      { error: "Forbidden", message: "Tidak boleh akses cabang ini" },
      { status: 403 }
    );
  }

  // Validasi hanya boleh akses cabangnya sendiri
  if (options.allowSameBranchOnly && !token.branchId) {
    return NextResponse.json(
      { error: "Forbidden", message: "User tidak memiliki cabang terdaftar" },
      { status: 403 }
    );
  }

  return token; // Lolos semua validasi
}
