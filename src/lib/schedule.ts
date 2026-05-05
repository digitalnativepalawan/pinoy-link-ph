export function timeAgo(iso: string | null | undefined, lang: "EN" | "TL" = "EN"): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const en = (n: number, u: string) => `Updated ${n} ${u}${n === 1 ? "" : "s"} ago`;
  const tl = (n: number, u: string) => `${n} ${u} na ang nakalipas`;
  if (m < 1) return lang === "EN" ? "Just updated" : "Kakaupdate lang";
  if (m < 60) return lang === "EN" ? en(m, "minute") : tl(m, "minuto");
  if (h < 24) return lang === "EN" ? en(h, "hour") : tl(h, "oras");
  return lang === "EN" ? en(d, "day") : tl(d, "araw");
}

export const DAYS = [
  { key: "mon", en: "Mon", tl: "Lun" },
  { key: "tue", en: "Tue", tl: "Mar" },
  { key: "wed", en: "Wed", tl: "Miy" },
  { key: "thu", en: "Thu", tl: "Huw" },
  { key: "fri", en: "Fri", tl: "Biy" },
  { key: "sat", en: "Sat", tl: "Sab" },
  { key: "sun", en: "Sun", tl: "Lin" },
] as const;

export type DayKey = typeof DAYS[number]["key"];

export interface DaySchedule {
  open: boolean;
  start?: string; // "09:00"
  end?: string;   // "18:00"
}

export type ScheduleJson = Record<DayKey, DaySchedule>;

export const DEFAULT_SCHEDULE: ScheduleJson = {
  mon: { open: true, start: "09:00", end: "18:00" },
  tue: { open: true, start: "09:00", end: "18:00" },
  wed: { open: true, start: "09:00", end: "18:00" },
  thu: { open: true, start: "09:00", end: "18:00" },
  fri: { open: true, start: "09:00", end: "18:00" },
  sat: { open: false },
  sun: { open: false },
};

export function todayKey(): DayKey {
  // 0 = Sun
  const idx = new Date().getDay();
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as DayKey[])[idx];
}

export function formatTime12(t?: string): string {
  if (!t) return "";
  const [hStr, m] = t.split(":");
  let h = parseInt(hStr, 10);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}
