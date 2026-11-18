import type { BuyerSession, SellerSession } from "./types";

export const BUYER_SESSION_KEY = "kkotjup-buyer";
export const SELLER_SESSION_KEY = "kkotjup-seller";

export function readBuyerSession(): BuyerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BUYER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BuyerSession;
    return parsed.nickname?.trim() ? parsed : null;
  } catch {
    return null;
  }
}

export function writeBuyerSession(session: BuyerSession) {
  localStorage.setItem(BUYER_SESSION_KEY, JSON.stringify(session));
}

export function clearBuyerSession() {
  localStorage.removeItem(BUYER_SESSION_KEY);
}

export function readSellerSession(): SellerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SELLER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SellerSession;
    return parsed.sellerName?.trim() ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSellerSession(session: SellerSession) {
  localStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(session));
}

export function clearSellerSession() {
  localStorage.removeItem(SELLER_SESSION_KEY);
}
