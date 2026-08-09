export function safeOffset(value: number) {
  return Number.isFinite(value) && Math.abs(value) <= 14 * 60 ? Math.round(value) : 0;
}

export function dateKeyAtOffset(date: Date, timezoneOffsetMinutes: number) {
  return new Date(date.getTime() - safeOffset(timezoneOffsetMinutes) * 60_000).toISOString().slice(0, 10);
}

export function middayForClientDate(date: Date, timezoneOffsetMinutes: number) {
  return new Date(`${dateKeyAtOffset(date, timezoneOffsetMinutes)}T12:00:00.000Z`);
}

export function offlineLessonDates(occurredAt: Date, timezoneOffsetMinutes: number) {
  return {
    completionAt: middayForClientDate(occurredAt, timezoneOffsetMinutes),
    practiceAt: occurredAt,
  };
}
