// file: app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Tidak perlu import 'verifyAuth' lagi

export async function GET(req: NextRequest) {
  try {
    // Ambil payload dari header yang sudah divalidasi oleh middleware
    const payloadString = req.headers.get("X-User-Payload");

    if (!payloadString) {
      return NextResponse.json({ error: "Unauthorized: Missing user payload" }, { status: 401 });
    }
    
    const payload = JSON.parse(payloadString);
    const branchId = payload.branchId;

    if (!branchId) {
      return NextResponse.json({ error: "Unauthorized: Missing branchId" }, { status: 401 });
    }

    // Sisa kode query Prisma Anda tetap sama persis
    // const today = new Date();
    // ...dan seterusnya...

    const antrean = await prisma.booking.count({ where: { branchId } });
    const mekanik = await prisma.mechanic.count({ where: { branchId } });
    const konsumen = await prisma.user.count({ where: { branchId } });
    const laporan = await prisma.booking.count({ where: { branchId } });

    return NextResponse.json({ antrean, mekanik, konsumen, laporan });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}