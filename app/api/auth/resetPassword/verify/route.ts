// src/app/api/auth/password-reset/verify/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token wajib diisi" }, { status: 400 });
    }

    const resetEntry = await prisma.passwordReset.findFirst({
      where: { expiresAt: { gt: new Date() } }, // hanya token yang belum expired
      orderBy: { createdAt: "desc" }, // ambil yang terbaru
    });

    if (!resetEntry) {
      return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(token, resetEntry.token);
    if (!isValid) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
    }

    return NextResponse.json({ message: "Token valid", userId: resetEntry.userId });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
