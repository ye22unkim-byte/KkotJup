/** 양재꽃시장 기준: 평일 09:30 ~ 20:00 */
export const MARKET_OPEN_HOUR = 9;
export const MARKET_OPEN_MINUTE = 30;
export const MARKET_CLOSE_HOUR = 20;
export const MARKET_CLOSE_MINUTE = 0;

export function getMarketWindow(now = new Date()) {
  const open = new Date(now);
  open.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);

  const close = new Date(now);
  close.setHours(MARKET_CLOSE_HOUR, MARKET_CLOSE_MINUTE, 0, 0);

  return { open, close };
}

export function isMarketOpen(now = new Date()) {
  const { open, close } = getMarketWindow(now);
  return now >= open && now < close;
}

export function getSecondsUntilClose(now = new Date()) {
  const { close } = getMarketWindow(now);
  return Math.max(0, Math.floor((close.getTime() - now.getTime()) / 1000));
}

export function getSecondsUntilOpen(now = new Date()) {
  const { open, close } = getMarketWindow(now);
  if (now < open) {
    return Math.floor((open.getTime() - now.getTime()) / 1000);
  }
  if (now >= close) {
    const tomorrowOpen = new Date(open);
    tomorrowOpen.setDate(tomorrowOpen.getDate() + 1);
    return Math.floor((tomorrowOpen.getTime() - now.getTime()) / 1000);
  }
  return 0;
}

export function formatCountdown(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getTodayCloseIso(now = new Date()) {
  const { close } = getMarketWindow(now);
  return close.toISOString();
}
