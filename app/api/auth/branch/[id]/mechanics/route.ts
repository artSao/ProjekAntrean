import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // cek auth & role
  const auth = requireAuth(req, { roles: ["ADMIN", "BRANCH_ADMIN"], branchId: params.id });
  if (auth instanceof NextResponse) return auth; // kalau unauthorized/forbidden

  try {
    const mechanics = await prisma.user.findMany({
      where: {
        branchId: parseInt(params.id),
        role: "MECHANIC",
      },
    });

    return NextResponse.json(mechanics);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
