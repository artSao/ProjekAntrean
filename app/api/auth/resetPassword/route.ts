import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token dan password baru wajib diisi" }, { status: 400 });
    }

    // 1. Hash token yang diterima dari client
    // Kita perlu mencari padanan hash-nya di DB
    const passwordResetTokens = await prisma.passwordReset.findMany({
      where: {
        expiresAt: { gt: new Date() }, // Belum kedaluwarsa
        used: false,
      },
    });

    let validTokenRecord = null;
    for (const record of passwordResetTokens) {
      const isMatch = await bcrypt.compare(token, record.token);
      if (isMatch) {
        validTokenRecord = record;
        break;
      }
    }

    if (!validTokenRecord) {
      return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    }

    // 2. Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Gunakan transaksi untuk update password dan menandai token sudah digunakan
    await prisma.$transaction(async (tx) => {
      // Update password user
      await tx.user.update({
        where: { id: validTokenRecord.userId },
        data: { password: hashedPassword },
      });

      // Tandai token sudah digunakan untuk mencegah pemakaian ulang
      await tx.passwordReset.update({
        where: { id: validTokenRecord.id },
        data: { used: true },
      });
    });

    return NextResponse.json({ message: "Password berhasil direset" });
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mereset password" }, { status: 500 });
  }
}