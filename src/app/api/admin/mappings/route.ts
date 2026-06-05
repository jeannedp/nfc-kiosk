// src/app/api/admin/mappings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/auth";
import { normalizeUID, isValidUID, isValidURL } from "@/lib/uid";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// GET all mappings
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) return unauthorized();
  const mappings = await prisma.cardMapping.findMany({
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(mappings);
}

// POST create mapping
export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) return unauthorized();

  const body = await req.json();
  const { uid: rawUID, destination_url, label, enabled } = body;

  if (!rawUID || !destination_url) {
    return NextResponse.json({ error: "uid and destination_url are required" }, { status: 400 });
  }

  const uid = normalizeUID(rawUID);
  if (!isValidUID(uid)) {
    return NextResponse.json({ error: "Invalid UID format" }, { status: 400 });
  }
  if (!isValidURL(destination_url)) {
    return NextResponse.json(
      { error: "destination_url must be a valid http:// or https:// URL" },
      { status: 400 }
    );
  }

  try {
    const mapping = await prisma.cardMapping.create({
      data: {
        uid_normalized: uid,
        destination_url,
        label: label ?? null,
        enabled: enabled !== false,
      },
    });
    return NextResponse.json(mapping, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "UID already exists" }, { status: 409 });
    }
    throw e;
  }
}
