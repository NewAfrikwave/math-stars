import { db } from "@/lib/db";
import { readSessionValue, type AppSession } from "@/lib/auth";

export function sessionHasAccountAccess(session: AppSession | null, accountStatus: string | null) {
  if (!session) return false;
  if (session.kind === "legacy") return true;
  return accountStatus === "active";
}

export async function activeSessionFromValue(value?: string | null) {
  const session = readSessionValue(value);
  if (!session || session.kind === "legacy") return session;
  const account = await db.familyAccount.findUnique({
    where: { id: session.familyId },
    select: { status: true },
  });
  return sessionHasAccountAccess(session, account?.status ?? null) ? session : null;
}
