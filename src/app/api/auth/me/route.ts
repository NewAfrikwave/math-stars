import { NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  if (session.kind === "legacy") {
    return NextResponse.json({ authenticated: true, accountType: "legacy", displayName: "Site owner" });
  }
  const account = await db.familyAccount.findUnique({
    where: { id: session.familyId },
    select: { displayName: true, email: true, status: true, createdAt: true },
  });
  if (!account || account.status !== "active") return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({
    authenticated: true,
    accountType: "family",
    displayName: account.displayName,
    email: account.email,
    createdAt: account.createdAt.toISOString(),
  });
}
