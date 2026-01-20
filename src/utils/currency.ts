export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) {
    return '0 CFA';
  }

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    return '0 CFA';
  }

  const integerPrice = Math.round(numericPrice);

  return `${integerPrice.toLocaleString('fr-FR')} CFA`;
}

export function parsePrice(priceString: string): number {
  const cleaned = priceString.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}
