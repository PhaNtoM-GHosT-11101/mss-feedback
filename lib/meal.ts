import type { Meal } from "./types";

export function mealEmoji(meal: { name: string }): string {
  const n = meal.name.toLowerCase();
  if (/morning|breakfast|सुबह/.test(n)) return "🍞";
  if (/afternoon|lunch|दोपहर/.test(n)) return "🍛";
  if (/evening|snack|tea|शाम/.test(n)) return "🍵";
  if (/night|dinner|रात/.test(n)) return "🍜";
  return "🍽️";
}

export function isMealOpen(meal: Meal, date = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Kolkata",
    }).format(date),
  );
  if (meal.start_hour <= meal.end_hour) {
    return hour >= meal.start_hour && hour < meal.end_hour;
  }
  return hour >= meal.start_hour || hour < meal.end_hour;
}

export function windowLabel(meal: Meal): string {
  const f = (h: number) => {
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}${h < 12 ? "am" : "pm"}`;
  };
  return `${f(meal.start_hour)}–${f(meal.end_hour)}`;
}

export function todayMenuItems<T extends { menu_date: string | null; weekday: number | null; is_template: boolean }>(
  items: T[],
): T[] {
  const dow = (new Date().getUTCDay() + 1) % 7; // JS: 0=Sun..6=Sat → SQL dow: 0=Sun..6=Sat
  return items.filter(
    (i) =>
      i.menu_date === todayISO() ||
      (i.is_template && i.weekday === dow),
  );
}

export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(),
  );
}
