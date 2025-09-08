import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "@/lib/auth";

// Helper untuk apply CORS
function applyCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "http://localhost:3001"); // sesuaikan dengan frontend
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

// Handle preflight (OPTIONS)
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  return applyCors(res);
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return applyCors(
        NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
      );
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return applyCors(
        NextResponse.json({ error: "Email atau password salah" }, { status: 401 })
      );
    }

    const payload: AuthTokenPayload = {
      userId: user.id,
      role: user.role as AuthTokenPayload["role"],
      branchId: user.branchId || undefined,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1d" });

    return applyCors(
      NextResponse.json({
        message: "Login berhasil",
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
        },
      })
    );
  } catch (error) {
    console.error(error);
    return applyCors(
      NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
    );
  }
}
