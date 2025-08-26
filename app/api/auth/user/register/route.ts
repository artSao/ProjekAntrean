import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, branchId, specialization } = body;

    // Validasi input dasar
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Cek user sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tentukan role akhir
    let finalRole: Role = Role.CUSTOMER;

    if (role === "BRANCH_ADMIN") {
      if (!branchId) {
        return NextResponse.json(
          { error: "BranchId is required for BRANCH_ADMIN" },
          { status: 400 }
        );
      }
      finalRole = Role.BRANCH_ADMIN;
    }

    if (role === "MECHANIC") {
      if (!branchId || !specialization) {
        return NextResponse.json(
          { error: "BranchId and specialization are required for MECHANIC" },
          { status: 400 }
        );
      }
      finalRole = Role.MECHANIC;
    }

    // Buat user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: finalRole,
        branchId: branchId ?? null,
        mechanic:
          finalRole === Role.MECHANIC
            ? {
                create: {
                  branchId: branchId!,
                  specialization: specialization!,
                },
              }
            : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
        mechanic: {
          select: {
            id: true,
            specialization: true,
            branchId: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "User registered successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      // PENTING: Pilih hanya data yang aman untuk ditampilkan.
      // Jangan pernah mengirim password client!
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}