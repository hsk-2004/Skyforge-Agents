// API endpoint: GET /api/me — the signed-in user's basic profile (name, email, role)
import { NextResponse } from "next/server";
import { auth } from "@/backend/auth";
import { prisma } from "@/backend/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, role: true },
  });
  return NextResponse.json({ success: true, user });
}
