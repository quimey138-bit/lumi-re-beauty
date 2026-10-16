export const timeZone = 'America/Argentina/Buenos_Aires';
export function reminderAt(start: string, now = new Date()): string | null {
  const due = new Date(new Date(start).getTime() - 86400000);
  return Number.isFinite(due.getTime()) && due > now ? due.toISOString() : null;
}
type Availability = { date: string; open: string; close: string; duration: number; busy: {start: string; end: string}[]; now?: Date };
export function availableSlots({ date, open, close, duration, busy, now = new Date() }: Availability): string[] {
  const midnight = new Date(`${date}T00:00:00-03:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(midnight.getTime()) || new Date(midnight.getTime()-10800000).toISOString().slice(0,10) !== date || !Number.isInteger(duration) || duration < 15) return [];
  const minutes = (s: string) => Number(s.slice(0,2))*60 + Number(s.slice(3,5));
  const slots: string[] = [];
  for (let m = minutes(open); m + duration <= minutes(close); m += 30) {
    const label = `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    const start = new Date(`${date}T${label}:00-03:00`).getTime();
    const end = start + duration*60000;
    if (start > now.getTime() && !busy.some(b => start < Date.parse(b.end) && end > Date.parse(b.start))) slots.push(label);
  }
  return slots;
}
