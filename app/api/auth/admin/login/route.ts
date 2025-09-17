import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// daftar origin yang diizinkan
const allowedOrigins = [
  "http://localhost:3001",
  // "https://app-bengkel-anda.com",
];

function applyCorsHeaders(response: NextResponse, origin: string) {
  if (allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }
  return response;
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const res = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(res, origin);
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "";

  try {
    const { email, password } = await req.json();

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const res = NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
      return applyCorsHeaders(res, origin);
    }

    // Hanya boleh login jika role = BRANCH_ADMIN
    if (user.role !== "BRANCH_ADMIN") {
      const res = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return applyCorsHeaders(res, origin);
    }

    // Cek password (hash)
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const res = NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
      return applyCorsHeaders(res, origin);
    }

    // 🔑 Generate JWT hanya dengan userId + branchId
    const token = await new SignJWT({
      userId: user.id,
      branchId: user.branchId,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(SECRET);

    // Simpan token di cookie HttpOnly
    const res = NextResponse.json({ success: true });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000, // 1 hari
    });

    return applyCorsHeaders(res, origin);
  } catch (err) {
    console.error("Login error:", err);
    const res = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return applyCorsHeaders(res, origin);
  }
}
