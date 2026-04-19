const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export function getCycleStart(date: Date = new Date(), salaryDay: number = 27): Date {
  const d = new Date(date);
  if (d.getDate() >= salaryDay) {
    return new Date(d.getFullYear(), d.getMonth(), salaryDay, 0, 0, 0, 0);
  }
  return new Date(d.getFullYear(), d.getMonth() - 1, salaryDay, 0, 0, 0, 0);
}

export function getCycleEnd(cycleStart: Date): Date {
  // Day before next salary day (e.g., start=Mar 27 → end=Apr 26)
  return new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, cycleStart.getDate() - 1, 23, 59, 59, 999);
}

export function getCycleLabel(start: Date, end: Date): string {
  return `${start.getDate()} ${MONTHS_AR[start.getMonth()]} – ${end.getDate()} ${MONTHS_AR[end.getMonth()]}`;
}

export function getDaysRemaining(cycleEnd: Date): number {
  return Math.max(0, Math.ceil((cycleEnd.getTime() - Date.now()) / 86400000));
}

export function getCycleKey(cycleStart: Date): string {
  return `${cycleStart.getFullYear()}-${String(cycleStart.getMonth() + 1).padStart(2, "0")}-${cycleStart.getDate()}`;
}

export function toDate(v: any): Date {
  if (!v) return new Date(0);
  if (v?.toDate) return v.toDate();
  if (v instanceof Date) return v;
  if (v?.seconds) return new Date(v.seconds * 1000);
  return new Date(0);
}
