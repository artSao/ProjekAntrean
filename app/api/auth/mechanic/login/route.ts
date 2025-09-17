import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== Role.MECHANIC) {
      return NextResponse.json(
        { error: "Hanya mekanik yang bisa login" },
        { status: 403 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    const payload: AuthTokenPayload = {
      userId: user.id,
      role: user.role,
      branchId: user.branchId ?? undefined,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    return NextResponse.json({
      message: "Login mechanic berhasil",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      },
    });
  } catch (error) {
    console.error("Login mechanic error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
