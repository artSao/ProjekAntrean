import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, address, openTime, closeTime } = body;

    if (!name || !address || !openTime || !closeTime) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        openTime,
        closeTime,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Branch register error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// --- TAMBAHKAN FUNGSI INI UNTUK MELIHAT SEMUA BRANCH ---
export async function GET() {
  try {
    const branches = await prisma.branch.findMany();
    return NextResponse.json(branches);
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data cabang" },
      { status: 500 }
    );
  }
}