import { describe, it, expect } from "vitest";
import { formatLastSync, parseSyncDate, formatLastSyncString } from "../lib/date-utils";

describe("date-utils formatLastSync", () => {
  // Fixed reference time: Saturday, September 26, 2026, 16:00:00 local time
  const referenceNow = new Date("2026-09-26T16:00:00");

  it("formats today sync correctly with main 'Today' and time subtext", () => {
    // 2 hours ago today
    const syncedToday = new Date("2026-09-26T14:30:00");
    const result = formatLastSync(syncedToday, referenceNow);

    expect(result.main).toBe("Today");
    expect(result.sub).toMatch(/2:30\s*PM/i);
    expect(result.combined).toMatch(/^Today at 2:30\s*PM$/i);
    expect(result.full).toContain("2026");
  });

  it("formats yesterday sync correctly with main 'Yesterday' and time subtext", () => {
    // Yesterday
    const syncedYesterday = new Date("2026-09-25T17:15:00");
    const result = formatLastSync(syncedYesterday, referenceNow);

    expect(result.main).toBe("Yesterday");
    expect(result.sub).toMatch(/5:15\s*PM/i);
    expect(result.combined).toMatch(/^Yesterday at 5:15\s*PM$/i);
  });

  it("formats within-the-week sync with the weekday name (e.g. Wednesday, Monday)", () => {
    // 3 days ago (Wednesday, Sep 23, 2026)
    const syncedWednesday = new Date("2026-09-23T10:45:00");
    const resultWednesday = formatLastSync(syncedWednesday, referenceNow);

    expect(resultWednesday.main).toBe("Wednesday");
    expect(resultWednesday.sub).toMatch(/10:45\s*AM/i);
    expect(resultWednesday.combined).toMatch(/^Wednesday at 10:45\s*AM$/i);

    // 5 days ago (Monday, Sep 21, 2026)
    const syncedMonday = new Date("2026-09-21T09:20:00");
    const resultMonday = formatLastSync(syncedMonday, referenceNow);

    expect(resultMonday.main).toBe("Monday");
    expect(resultMonday.sub).toMatch(/9:20\s*AM/i);
    expect(resultMonday.combined).toMatch(/^Monday at 9:20\s*AM$/i);
  });

  it("formats beyond a week (7-13 days) as '1 week ago'", () => {
    // 10 days ago (Sep 16, 2026)
    const synced10DaysAgo = new Date("2026-09-16T12:00:00");
    const result = formatLastSync(synced10DaysAgo, referenceNow);

    expect(result.main).toBe("1 week ago");
    expect(result.sub).toContain("Sep 16");
    expect(result.combined).toBe("1 week ago");
  });

  it("formats beyond 2 weeks as 'X weeks ago'", () => {
    // 21 days ago (Sep 5, 2026)
    const synced3WeeksAgo = new Date("2026-09-05T12:00:00");
    const result = formatLastSync(synced3WeeksAgo, referenceNow);

    expect(result.main).toBe("3 weeks ago");
    expect(result.combined).toBe("3 weeks ago");
  });

  it("formats beyond a month as '1 month ago' or 'X months ago'", () => {
    // 35 days ago (Aug 22, 2026)
    const synced35DaysAgo = new Date("2026-08-22T12:00:00");
    const result1Month = formatLastSync(synced35DaysAgo, referenceNow);

    expect(result1Month.main).toBe("1 month ago");
    expect(result1Month.combined).toBe("1 month ago");

    // 95 days ago (Jun 23, 2026)
    const synced95DaysAgo = new Date("2026-06-23T12:00:00");
    const result3Months = formatLastSync(synced95DaysAgo, referenceNow);

    expect(result3Months.main).toBe("3 months ago");
    expect(result3Months.combined).toBe("3 months ago");
  });

  it("formats beyond a year as '1 year ago' or 'X years ago'", () => {
    // 400 days ago (Aug 2025)
    const synced1YearAgo = new Date("2025-08-22T12:00:00");
    const result1Year = formatLastSync(synced1YearAgo, referenceNow);

    expect(result1Year.main).toBe("1 year ago");
    expect(result1Year.combined).toBe("1 year ago");

    // 780 days ago (Aug 2024)
    const synced2YearsAgo = new Date("2024-08-07T12:00:00");
    const result2Years = formatLastSync(synced2YearsAgo, referenceNow);

    expect(result2Years.main).toBe("2 years ago");
    expect(result2Years.combined).toBe("2 years ago");
  });

  it("handles relative legacy strings like '2 min ago' and '1 day ago'", () => {
    const minResult = formatLastSync("2 min ago");
    expect(minResult.main).toBe("Today");

    const dayResult = formatLastSync("1 day ago");
    expect(dayResult.main).toBe("Yesterday");

    const justNowResult = formatLastSync("Just now");
    expect(justNowResult.main).toBe("Today");
  });

  it("handles empty / null inputs gracefully", () => {
    expect(formatLastSync(null).main).toBe("Never");
    expect(formatLastSync(undefined).main).toBe("Never");
    expect(formatLastSync("").main).toBe("Never");
  });

  it("formatLastSyncString returns combined text directly", () => {
    const todayDate = new Date("2026-09-26T10:00:00");
    expect(formatLastSyncString(todayDate, referenceNow)).toMatch(/^Today at 10:00\s*AM$/i);
  });

  it("parseSyncDate parses ISO string, Date object, timestamp, and relative phrases", () => {
    expect(parseSyncDate(null)).toBeNull();
    expect(parseSyncDate("")).toBeNull();
    const d = new Date();
    expect(parseSyncDate(d)).toEqual(d);
    expect(parseSyncDate("2026-09-26T10:00:00Z")).toBeInstanceOf(Date);
    expect(parseSyncDate("2 min ago")).toBeInstanceOf(Date);
    expect(parseSyncDate("invalid-date-string-xyz")).toBeNull();
  });
});
