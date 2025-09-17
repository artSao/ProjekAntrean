import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

// ✅ Create Booking
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, branchId, mechanicId, serviceType, scheduledTime } = body;

    const auth = requireAuth(req as any, { roles: ["CUSTOMER", "BRANCH_ADMIN"] });
    if (auth instanceof NextResponse) return auth;

    let finalBranchId: number;
    if (auth.role === "BRANCH_ADMIN") {
      finalBranchId = auth.branchId!;
    } else {
      if (!branchId) return NextResponse.json({ error: "branchId wajib diisi" }, { status: 400 });
      finalBranchId = branchId;
    }

    if (!userId || !scheduledTime) {
      return NextResponse.json({ error: "userId dan scheduledTime wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

    const branch = await prisma.branch.findUnique({ where: { id: finalBranchId } });
    if (!branch) return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });

    if (mechanicId) {
      const mechanic = await prisma.mechanic.findUnique({ where: { id: mechanicId } });
      if (!mechanic) return NextResponse.json({ error: "Mekanik tidak ditemukan" }, { status: 404 });
    }

    const scheduledDateTime = new Date(scheduledTime);
    if (isNaN(scheduledDateTime.getTime())) {
      return NextResponse.json({ error: "Format scheduledTime tidak valid" }, { status: 400 });
    }

    const startOfDay = new Date(scheduledDateTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledDateTime);
    endOfDay.setHours(23, 59, 59, 999);

    const lastBooking = await prisma.booking.findFirst({
      where: { branchId: finalBranchId, bookingDate: { gte: startOfDay, lte: endOfDay } },
      orderBy: { queueNumber: "desc" },
    });

    const nextQueueNumber = lastBooking ? lastBooking.queueNumber + 1 : 1;

    const booking = await prisma.booking.create({
      data: {
        userId,
        branchId: finalBranchId,
        mechanicId: mechanicId ?? undefined,
        serviceType: serviceType ?? undefined,
        scheduledTime: scheduledDateTime,
        bookingDate: scheduledDateTime,
        queueNumber: nextQueueNumber,
      },
      include: { user: true, branch: true, mechanic: true },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Booking creation error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Relasi tidak valid (user, cabang, atau mekanik)." }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ✅ Get Today's Bookings by Branch
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    if (!branchId) {
      return NextResponse.json({ error: "branchId wajib diisi" }, { status: 400 });
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: { branchId: Number(branchId), bookingDate: { gte: startOfDay, lte: endOfDay } },
      orderBy: { queueNumber: "asc" },
      include: { user: true, mechanic: true },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
