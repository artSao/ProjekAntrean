import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Cek password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    // Payload JWT sesuai tipe
    const payload: AuthTokenPayload = {
      userId: user.id,
      role: user.role as AuthTokenPayload["role"],
      branchId: user.branchId || undefined, // kalau ada
    };

    // Buat token JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1d" });

    // Kirim response tanpa password
    return NextResponse.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
