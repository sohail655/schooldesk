export type AttendanceStatus = "present" | "absent" | "late" | "leave" | "half_day";

/** Present, late and half-day count toward attendance; leave is excluded from both sides. */
export function attendancePercent(records: AttendanceStatus[]): number | null {
  const counted = records.filter((s) => s !== "leave");
  if (counted.length === 0) return null;
  const score = counted.reduce((sum, s) => sum + (s === "present" || s === "late" ? 1 : s === "half_day" ? 0.5 : 0), 0);
  return Math.round((score / counted.length) * 1000) / 10;
}

/** Haversine distance in metres, used for teacher GPS check-in. */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** "HH:MM" school time vs check-in time in Asia/Karachi. */
export function isLate(checkIn: Date, lateAfter: string, timeZone = "Asia/Karachi") {
  const local = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(checkIn);
  return local > lateAfter.slice(0, 5);
}

/** Working days in a month, excluding weekly-off weekdays and holidays (YYYY-MM-DD). */
export function workingDays(year: number, month: number, weeklyOff: number[] = [0], holidays: string[] = []) {
  const days: string[] = [];
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let d = 1; d <= count; d++) {
    const date = new Date(Date.UTC(year, month - 1, d));
    const iso = date.toISOString().slice(0, 10);
    if (!weeklyOff.includes(date.getUTCDay()) && !holidays.includes(iso)) days.push(iso);
  }
  return days;
}
