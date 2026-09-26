/**
 * Utility functions for formatting last synchronization timestamps into human-readable relative formats.
 *
 * Requirements:
 * - Today: e.g. "Today" / "Today at 2:30 PM"
 * - Yesterday: e.g. "Yesterday" / "Yesterday at 4:15 PM"
 * - Within the current week: Day name e.g. "Monday", "Tuesday at 10:15 AM"
 * - Beyond a week: e.g. "1 week ago", "2 weeks ago"
 * - Beyond a month: e.g. "1 month ago", "3 months ago"
 * - Beyond a year: e.g. "1 year ago", "2 years ago"
 */

export interface LastSyncFormat {
  /** Short primary headline label: "Today", "Yesterday", "Monday", "1 week ago", etc. */
  main: string;
  /** Secondary subtitle (exact time for recent, or short date for older entries): "02:30 PM", "Sep 15, 2026" */
  sub: string;
  /** Full inline phrase: "Today at 2:30 PM", "Yesterday at 4:15 PM", "1 week ago" */
  combined: string;
  /** Full timestamp string suitable for hover tooltip */
  full: string;
}

/**
 * Safely parses Date, number, ISO string, or common relative strings into a valid Date object.
 */
export function parseSyncDate(dateInput?: string | Date | number | null): Date | null {
  if (dateInput === null || dateInput === undefined) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput === "number") {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(dateInput).trim();
  if (!str) return null;

  const lower = str.toLowerCase();
  const now = Date.now();

  if (lower === "just now") {
    return new Date(now);
  }

  const minMatch = lower.match(/^(\d+)\s*(?:min|mins|minute|minutes)\s*ago$/);
  if (minMatch) {
    return new Date(now - parseInt(minMatch[1], 10) * 60 * 1000);
  }

  const hrMatch = lower.match(/^(\d+)\s*(?:hr|hrs|hour|hours)\s*ago$/);
  if (hrMatch) {
    return new Date(now - parseInt(hrMatch[1], 10) * 60 * 60 * 1000);
  }

  const dayMatch = lower.match(/^(\d+)\s*(?:day|days)\s*ago$/);
  if (dayMatch) {
    return new Date(now - parseInt(dayMatch[1], 10) * 24 * 60 * 60 * 1000);
  }

  const weekMatch = lower.match(/^(\d+)\s*(?:week|weeks)\s*ago$/);
  if (weekMatch) {
    return new Date(now - parseInt(weekMatch[1], 10) * 7 * 24 * 60 * 60 * 1000);
  }

  const monthMatch = lower.match(/^(\d+)\s*(?:month|months)\s*ago$/);
  if (monthMatch) {
    return new Date(now - parseInt(monthMatch[1], 10) * 30 * 24 * 60 * 60 * 1000);
  }

  const yearMatch = lower.match(/^(\d+)\s*(?:year|years)\s*ago$/);
  if (yearMatch) {
    return new Date(now - parseInt(yearMatch[1], 10) * 365 * 24 * 60 * 60 * 1000);
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

/**
 * Formats a last sync timestamp into structured human-readable text.
 *
 * @param dateInput - Date object, ISO string, timestamp number, or relative phrase
 * @param referenceNow - Reference date for calculation (defaults to current time)
 */
export function formatLastSync(
  dateInput?: string | Date | number | null,
  referenceNow: Date = new Date()
): LastSyncFormat {
  const date = parseSyncDate(dateInput);

  if (!date) {
    const raw = dateInput ? String(dateInput) : "Never";
    return {
      main: raw,
      sub: "",
      combined: raw,
      full: raw,
    };
  }

  const full = date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const dateShort = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Calculate day difference by calendar day
  const startOfNow = new Date(
    referenceNow.getFullYear(),
    referenceNow.getMonth(),
    referenceNow.getDate()
  );
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const msInDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((startOfNow.getTime() - startOfTarget.getTime()) / msInDay);

  // Future timestamp (clock skew tolerance)
  if (diffDays < 0) {
    return {
      main: "Just now",
      sub: timeStr,
      combined: `Today at ${timeStr}`,
      full,
    };
  }

  // 1. Today
  if (diffDays === 0) {
    return {
      main: "Today",
      sub: timeStr,
      combined: `Today at ${timeStr}`,
      full,
    };
  }

  // 2. Yesterday
  if (diffDays === 1) {
    return {
      main: "Yesterday",
      sub: timeStr,
      combined: `Yesterday at ${timeStr}`,
      full,
    };
  }

  // 3. Within current week (2 to 6 days ago)
  if (diffDays < 7) {
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    return {
      main: weekday,
      sub: timeStr,
      combined: `${weekday} at ${timeStr}`,
      full,
    };
  }

  // 4. Beyond week (7 to 29 days)
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    const label = weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    return {
      main: label,
      sub: dateShort,
      combined: label,
      full,
    };
  }

  // 5. Beyond month (30 to 364 days)
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    const label = months === 1 ? "1 month ago" : `${months} months ago`;
    return {
      main: label,
      sub: dateShort,
      combined: label,
      full,
    };
  }

  // 6. Beyond year (365+ days)
  const years = Math.floor(diffDays / 365);
  const label = years === 1 ? "1 year ago" : `${years} years ago`;
  return {
    main: label,
    sub: dateShort,
    combined: label,
    full,
  };
}

/**
 * Convenience helper returning single-line relative text
 */
export function formatLastSyncString(
  dateInput?: string | Date | number | null,
  referenceNow?: Date
): string {
  return formatLastSync(dateInput, referenceNow).combined;
}
