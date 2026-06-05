// src/app/api/lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeUID, isValidUID } from "@/lib/uid";

export async function POST(req: NextRequest) {
  let body: { uid?: string; device?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ found: false, message: "Invalid JSON" }, { status: 400 });
  }

  const { uid: rawUID, device } = body;

  if (!rawUID || typeof rawUID !== "string") {
    return NextResponse.json({ found: false, message: "uid is required" }, { status: 400 });
  }

  const uid = normalizeUID(rawUID);

  if (!isValidUID(uid)) {
    return NextResponse.json({ found: false, message: "Invalid UID format" }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent") ?? undefined;

  // Look up mapping
  const mapping = await prisma.cardMapping.findUnique({
    where: { uid_normalized: uid },
  });

  const matched = !!(mapping && mapping.enabled);

  // Write scan log (fire-and-forget, don't block response)
  prisma.scanLog
    .create({
      data: {
        uid_normalized: uid,
        matched,
        destination_url: matched ? mapping!.destination_url : null,
        device: device ?? null,
        user_agent: userAgent ?? null,
      },
    })
    .catch(console.error);

  if (matched) {
    return NextResponse.json({ found: true, url: mapping!.destination_url });
  }

  return NextResponse.json({ found: false, message: "Card not recognised" });
}
