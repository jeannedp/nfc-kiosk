// src/lib/auth.ts
import { NextRequest } from "next/server";

export function isAdminAuthorized(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return token === password;
}
