// src/app/api/admin/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/auth";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const take = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);
  const skip = parseInt(searchParams.get("offset") ?? "0", 10);

  const [logs, total] = await Promise.all([
    prisma.scanLog.findMany({
      orderBy: { created_at: "desc" },
      take,
      skip,
    }),
    prisma.scanLog.count(),
  ]);

  return NextResponse.json({ logs, total });
}
