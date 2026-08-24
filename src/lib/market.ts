// US stock market holidays (NYSE/NASDAQ)
// Updated annually — add new years as needed
const MARKET_HOLIDAYS: Set<string> = new Set([
  // 2026
  "2026-01-01", // New Year's Day
  "2026-01-19", // MLK Day
  "2026-02-16", // Presidents' Day
  "2026-04-03", // Good Friday
  "2026-05-25", // Memorial Day
  "2026-06-19", // Juneteenth
  "2026-07-03", // Independence Day (observed)
  "2026-09-07", // Labor Day
  "2026-11-26", // Thanksgiving
  "2026-12-25", // Christmas
  // 2027
  "2027-01-01", // New Year's Day
  "2027-01-18", // MLK Day
  "2027-02-15", // Presidents' Day
  "2027-03-26", // Good Friday
  "2027-05-31", // Memorial Day
  "2027-06-18", // Juneteenth (observed)
  "2027-07-05", // Independence Day (observed)
  "2027-09-06", // Labor Day
  "2027-11-25", // Thanksgiving
  "2027-12-24", // Christmas (observed)
]);

export function isMarketHoliday(dateStr: string): boolean {
  return MARKET_HOLIDAYS.has(dateStr);
}

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
}

export function isMarketOpen(dateStr: string): boolean {
  return !isWeekend(dateStr) && !isMarketHoliday(dateStr);
}

export function nextTradingDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  do {
    d.setDate(d.getDate() + 1);
  } while (!isMarketOpen(d.toISOString().split("T")[0]));
  return d.toISOString().split("T")[0];
}

export function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export function isMarketClosedET(): boolean {
  const now = new Date();
  const etHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }));
  return etHour >= 16;
}

// Returns the date the prediction is FOR:
// - If market is still open today → today's date
// - If market has closed today → next trading day
export function predictionTargetDate(eodDate: string): string {
  const today = todayET();
  const todayIsMarketDay = isMarketOpen(today);

  if (todayIsMarketDay && !isMarketClosedET()) {
    // Market is open right now — prediction is for today
    return today;
  }

  // Market has closed or it's a non-market day — prediction is for next trading day
  return nextTradingDay(eodDate);
}
