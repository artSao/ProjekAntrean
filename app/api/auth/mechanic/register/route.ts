import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  // Asumsikan Anda sudah menambahkan proteksi (langkah 1) di sini

  try {
    const body = await req.json();
    const { userId, branchId, specialization } = body;

    if (!userId || !branchId || !specialization) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    // Gunakan transaksi untuk memastikan konsistensi data
    const newMechanic = await prisma.$transaction(async (tx) => {
      // Langkah A: Buat profil mekanik
      const mechanic = await tx.mechanic.create({
        data: {
          userId,
          branchId,
          specialization,
        },
      });

      // Langkah B: Update role di tabel User
      await tx.user.update({
        where: { id: userId },
        data: { role: 'MECHANIC' }, // Ubah role menjadi MECHANIC
      });

      return mechanic; // Kembalikan data mekanik yang baru dibuat
    });

    // Ambil data lengkap untuk response
    const result = await prisma.mechanic.findUnique({
        where: { id: newMechanic.id },
        include: { user: true, branch: true }
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error("Mechanic register error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Unique constraint failed (userId)
        return NextResponse.json({ error: "User ini sudah terdaftar sebagai mekanik." }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// --- TAMBAHKAN FUNGSI INI UNTUK MELIHAT SEMUA MEKANIK ---
export async function GET() {
  try {
    const mechanics = await prisma.mechanic.findMany({
      // Gunakan 'include' untuk mengambil data user dan branch terkait
      include: {
        user: {
          // Pilih hanya field yang relevan dari user
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        branch: true, // Ambil semua data dari branch
      },
    });

    return NextResponse.json(mechanics);
  } catch (error) {
    console.error("Failed to fetch mechanics:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data mekanik" },
      { status: 500 }
    );
  }
}