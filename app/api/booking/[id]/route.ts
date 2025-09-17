import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get Booking Detail
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: Number(params.id) },
      include: { user: true, branch: true, mechanic: true },
    });
    if (!booking) return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Fetch booking detail error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Update Booking Status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status } = body;

    const booking = await prisma.booking.update({
      where: { id: Number(params.id) },
      data: { status },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Cancel Booking
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.booking.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ message: "Booking berhasil dihapus" });
  } catch (error) {
    console.error("Delete booking error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
