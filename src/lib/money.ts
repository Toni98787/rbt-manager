export function money(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcTva(subtotalExTva: number, tvaPercent: number) {
  const tvaAmount = round2(subtotalExTva * (tvaPercent / 100));
  return {
    subtotalExTva: round2(subtotalExTva),
    tvaAmount,
    totalIncTva: round2(subtotalExTva + tvaAmount),
  };
}
