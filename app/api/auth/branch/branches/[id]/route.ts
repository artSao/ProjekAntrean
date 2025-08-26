// app/api/branches/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(request, { roles: ["BRANCH_ADMIN"], branchId: params.id });
  if (auth instanceof NextResponse) return auth; // kalau gagal auth

  // kalau lolos
  return NextResponse.json({ message: `Halo admin cabang ${params.id}` });
}
