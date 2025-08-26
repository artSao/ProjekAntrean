import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
// import { sendPasswordResetEmail } from "@/lib/email"; // Untuk production

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email wajib diisi" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Tidak memberitahu apakah user ada atau tidak (security best practice)
    if (!user) {
      return NextResponse.json({
        message: "Jika email terdaftar, Anda akan menerima link reset.",
      });
    }

    // Hapus token lama supaya tidak menumpuk
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Buat token aman
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Set expired 1 jam
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    // Simpan ke database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // Buat link reset
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // TODO: kirim email ke user
    // await sendPasswordResetEmail(user.email, resetLink);

    // Development mode: log / return token supaya bisa dites
    if (process.env.NODE_ENV !== "production") {
      console.log("Password Reset Link:", resetLink);
      return NextResponse.json({
        message: "Jika email terdaftar, Anda akan menerima link reset.",
        devResetLink: resetLink,
        devToken: resetToken,
      });
    }

    // Production mode: hanya return pesan
    return NextResponse.json({
      message: "Jika email terdaftar, Anda akan menerima link reset.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
