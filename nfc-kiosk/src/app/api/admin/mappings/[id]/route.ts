// src/app/api/admin/mappings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/auth";
import { normalizeUID, isValidUID, isValidURL } from "@/lib/uid";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthorized(req)) return unauthorized();

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.uid !== undefined) {
    const uid = normalizeUID(body.uid);
    if (!isValidUID(uid)) {
      return NextResponse.json({ error: "Invalid UID format" }, { status: 400 });
    }
    data.uid_normalized = uid;
  }
  if (body.destination_url !== undefined) {
    if (!isValidURL(body.destination_url)) {
      return NextResponse.json(
        { error: "destination_url must be a valid http:// or https:// URL" },
        { status: 400 }
      );
    }
    data.destination_url = body.destination_url;
  }
  if (body.label !== undefined) data.label = body.label;
  if (body.enabled !== undefined) data.enabled = body.enabled;

  try {
    const updated = await prisma.cardMapping.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthorized(req)) return unauthorized();

  try {
    await prisma.cardMapping.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
  }
}
