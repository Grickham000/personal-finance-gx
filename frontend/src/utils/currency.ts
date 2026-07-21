export const formatCurrency = (value: number, currency: string = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (err) {
    console.error('Error formatting currency, falling back to basic layout:', err);
    const symbol = currency === 'MXN' ? '$' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${value.toFixed(2)}`;
  }
};
