import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
  try {
    // ✅ Ambil token dari cookie
    const cookie = req.headers.get("cookie") ?? "";
    const token = cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { branch: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch ? { id: user.branch.id, name: user.branch.name } : null,
    });
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
