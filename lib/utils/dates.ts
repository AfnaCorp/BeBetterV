const DAY = 24 * 60 * 60 * 1000;

/**
 * Clé jour `YYYY-MM-DD` dans le fuseau LOCAL.
 * On décale du timezone offset avant `toISOString()`, sinon minuit local
 * repasse en UTC et fait basculer sur la veille (ex. UTC+2 → recule de 2h).
 */
export function toISODate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

/** Clé jour `YYYY-MM-DD` pour aujourd'hui, fuseau local. */
export function todayISODate() {
  return toISODate(new Date());
}

export function daysAgo(days: number) {
  return toISODate(new Date(Date.now() - days * DAY));
}

export function startOfWeek(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - day + 1);
  return next;
}

export function endOfWeek(date = new Date()) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

export function isWithinLastDays(date: string, days: number) {
  const value = new Date(date).getTime();
  return value >= Date.now() - days * DAY;
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short"
  }).format(new Date(date));
}

export function groupByWeek<T extends { date: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = toISODate(startOfWeek(new Date(item.date)));
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {});
}
