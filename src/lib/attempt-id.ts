const ATTEMPT_ID_PATTERN = /^[a-zA-Z0-9_-]{16,100}$/;

export function progressAttemptId(
  value: unknown,
  createId: () => string = () => crypto.randomUUID(),
): string | null {
  const supplied = typeof value === "string" ? value.trim() : "";
  if (supplied && !ATTEMPT_ID_PATTERN.test(supplied)) return null;

  // Cached pre-rollout PWA bundles do not send an attempt id. Give those
  // requests a unique non-idempotent id while newer clients retain their
  // stable retry protection.
  return supplied || `legacy-${createId()}`;
}
