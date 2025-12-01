/**
 * Currency formatting utilities
 * Centralizes currency formatting logic across the app
 */

export const formatCurrency = (
  amount: number | null | undefined,
  currency: string = 'EUR',
  locale: string = 'es-ES'
): string => {
  if (amount === null || amount === undefined) {
    return '€0';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCompactCurrency = (
  amount: number | null | undefined,
  currency: string = 'EUR',
  locale: string = 'es-ES'
): string => {
  if (amount === null || amount === undefined) {
    return '€0';
  }

  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ${currency}`;
  }
  
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K ${currency}`;
  }

  return formatCurrency(amount, currency, locale);
};

export const parseCurrency = (value: string): number => {
  // Remove currency symbols and spaces, replace comma with dot
  const cleaned = value.replace(/[€$,\s]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

export const formatPercentage = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
};
