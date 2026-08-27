export const formatPrice = (
  amount: number | string | null | undefined,
  currency: string = 'XOF'
): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0 FCFA';
  }
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(numericAmount);

  return `${formatted} ${currency === 'XOF' ? 'FCFA' : currency}`;
};
