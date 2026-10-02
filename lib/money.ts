/**
 * All money in this app is stored as an integer in the currency's minor unit
 * (pesewas for GHS, kobo for NGN, cents for USD). Never floats.
 */

const SYMBOLS: Record<string, string> = {
  GHS: "GH₵",
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  ZAR: "R",
  KES: "KSh",
};

export function formatMoney(minor: number, currency = "GHS") {
  const amount = (minor ?? 0) / 100;
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function toMajor(minor: number) {
  return (minor ?? 0) / 100;
}
