/**
 * Currency and date formatting utilities for Oakridge School Operations System
 */

export const RUPEE_SYMBOL = '₹';

/**
 * Formats a monetary number in Indian Rupees (INR, ₹)
 * Examples:
 *   formatCurrency(40000) -> "₹40,000"
 *   formatCurrency(7750, true) -> "₹7,750.00"
 *   formatCurrency("31000.00") -> "₹31,000"
 */
export const formatCurrency = (amount, forceDecimals = false) => {
  if (amount === undefined || amount === null || amount === '') {
    return '₹0';
  }
  const num = Number(amount);
  if (isNaN(num)) {
    return '₹0';
  }

  const hasFractions = num % 1 !== 0;
  const decimals = forceDecimals ? 2 : (hasFractions ? 2 : 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2
  }).format(num);
};

export default {
  RUPEE_SYMBOL,
  formatCurrency
};
