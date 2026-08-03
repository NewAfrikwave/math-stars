import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "admin-session-required" }, { status: 401 });
  const accounts = await db.familyAccount.findMany({
    orderBy: { createdAt: "desc" },
    take: 250,
    select: {
      id: true, email: true, displayName: true, status: true,
      createdAt: true, updatedAt: true, lastLoginAt: true, lastActiveAt: true,
      _count: { select: { students: true, devices: true } },
      devices: {
        orderBy: { lastSeenAt: "desc" },
        take: 5,
        select: {
          id: true, deviceType: true, platform: true, browser: true,
          launchMode: true, installed: true, firstSeenAt: true,
          lastSeenAt: true, visitCount: true,
        },
      },
    },
  });
  return NextResponse.json({
    accounts: accounts.map((account) => ({
      ...account,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      lastLoginAt: account.lastLoginAt?.toISOString() ?? null,
      lastActiveAt: account.lastActiveAt?.toISOString() ?? null,
      learners: account._count.students,
      deviceCount: account._count.devices,
      devices: account.devices.map((device) => ({
        ...device,
        firstSeenAt: device.firstSeenAt.toISOString(),
        lastSeenAt: device.lastSeenAt.toISOString(),
      })),
      _count: undefined,
    })),
  });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "admin-session-required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const accountId = typeof body?.accountId === "string" ? body.accountId : "";
  const action = body?.action;
  if (!accountId || (action !== "suspend" && action !== "activate")) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }
  const updated = await db.familyAccount.update({
    where: { id: accountId },
    data: { status: action === "suspend" ? "suspended" : "active" },
    select: { id: true, status: true },
  }).catch(() => null);
  if (!updated) return NextResponse.json({ error: "account not found" }, { status: 404 });
  return NextResponse.json({ ok: true, account: updated });
}
