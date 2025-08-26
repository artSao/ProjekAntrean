// src/app/api/auth/password-reset/confirm/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token dan password baru wajib diisi" }, { status: 400 });
    }

    const resetEntry = await prisma.passwordReset.findFirst({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!resetEntry) {
      return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(token, resetEntry.token);
    if (!isValid) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password user
    await prisma.user.update({
      where: { id: resetEntry.userId },
      data: { password: hashedPassword },
    });

    // Hapus token setelah dipakai
    await prisma.passwordReset.delete({ where: { id: resetEntry.id } });

    return NextResponse.json({ message: "Password berhasil direset" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
