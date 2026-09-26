/**
 * Generates standardized location code based on business name and location count.
 * Format: "LOC - <Initials> <3-digit-padded-count>"
 *
 * Examples provided by user:
 * - "LVS CAFE", 1 -> "LOC - LC 001"
 * - "Palleturi Dosa", 1 -> "LOC - PD 001"
 * - "Palleturi Dosa", 2 -> "LOC - PD 002", etc.
 */
export function generateLocationCode(businessName: string, count: number): string {
  const cleanName = (businessName || "").trim();
  const words = cleanName.split(/\s+/).filter(Boolean);

  let initials = "";
  if (words.length >= 2) {
    initials = words
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, "")[0] || "")
      .join("")
      .toUpperCase();
  } else if (words.length === 1) {
    const wordClean = words[0].replace(/[^a-zA-Z0-9]/g, "");
    initials = wordClean.slice(0, 2).toUpperCase();
  }

  if (!initials) {
    initials = "LOC";
  }

  const paddedCount = String(Math.max(1, count)).padStart(3, "0");
  return `LOC - ${initials} ${paddedCount}`;
}
