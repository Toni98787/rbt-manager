export function money(amount: number, currency = 'USD'): string {
  const n = Math.round(amount);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}

/** Whole-unit rounding (no decimals). */
export function round2(n: number): number {
  return Math.round(n);
}

export function calcTva(subtotalExTva: number, tvaPercent: number) {
  const base = round2(subtotalExTva);
  const tvaAmount = round2(base * (tvaPercent / 100));
  return {
    subtotalExTva: base,
    tvaAmount,
    totalIncTva: round2(base + tvaAmount),
  };
}
