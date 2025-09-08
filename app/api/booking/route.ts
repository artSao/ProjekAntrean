import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, branchId, mechanicId, serviceType, scheduledTime } = body;

    // 1. Validasi input dasar
    if (!userId || !branchId || !scheduledTime) {
      return NextResponse.json(
        { error: "userId, branchId, and scheduledTime are required" },
        { status: 400 }
      );
    }

    // 2. Validasi keberadaan data relasi
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: `User dengan ID ${userId} tidak ditemukan.` }, { status: 404 });
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return NextResponse.json({ error: `Cabang dengan ID ${branchId} tidak ditemukan.` }, { status: 404 });
    }

    if (mechanicId) {
      const mechanic = await prisma.mechanic.findUnique({ where: { id: mechanicId } });
      if (!mechanic) {
        return NextResponse.json({ error: `Mekanik dengan ID ${mechanicId} tidak ditemukan.` }, { status: 404 });
      }
    }
    
    // 3. Persiapkan data untuk disimpan
    const scheduledDateTime = new Date(scheduledTime);
    if (isNaN(scheduledDateTime.getTime())) {
        return NextResponse.json({ error: "Format scheduledTime tidak valid." }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        branchId,
        mechanicId: mechanicId ?? undefined, // Gunakan undefined agar Prisma tidak menyertakannya jika null
        serviceType: serviceType ?? undefined,
        scheduledTime: scheduledDateTime,
        // Prisma akan otomatis menangani konversi ke @db.Date dengan benar
        bookingDate: scheduledDateTime, 
      },
      include: {
        user: true,
        branch: true,
        mechanic: true,
      },
    });

    return NextResponse.json(booking, { status: 201 });

  } catch (error) {
    console.error("Booking creation error:", error);

    // Memberikan pesan error yang lebih baik untuk foreign key violation
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        { error: `Gagal membuat relasi. Salah satu ID (user, cabang, atau mekanik) tidak valid.` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}