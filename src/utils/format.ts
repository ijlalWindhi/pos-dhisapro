// Format number with thousand separator (dot)
export const formatNumber = (value: number): string => {
  if (value === 0) return '';
  return value.toLocaleString('id-ID');
};

// Parse formatted string back to number
export const parseNumber = (value: string): number => {
  if (!value) return 0;
  // Remove all non-digit characters
  return parseInt(value.replace(/\D/g, ''), 10) || 0;
};

// Format currency for display (with Rp prefix)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Handle input change for number fields with formatting
export const handleNumberInputChange = (
  value: string,
  setter: (value: number) => void
): string => {
  // Remove all non-digit characters
  const numericValue = value.replace(/\D/g, '');
  const numberValue = parseInt(numericValue, 10) || 0;
  setter(numberValue);
  // Return formatted string for display
  return numberValue > 0 ? numberValue.toLocaleString('id-ID') : '';
};
