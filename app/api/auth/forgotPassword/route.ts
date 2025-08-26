import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Email tidak ditemukan" }, { status: 404 });
    }

    // Buat reset token
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    // Simulasi: kirim token langsung di response (nanti bisa kirim via email)
    return NextResponse.json({
      message: "Link reset password telah dikirim ke email (simulasi)",
      resetToken,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
