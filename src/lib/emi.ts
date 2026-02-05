export type Frequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';

interface EMIResult {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  paymentsPerYear: number;
  totalPayments: number;
}

/**
 * Calculate EMI using the formula:
 * EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
 *
 * Where:
 * P = Principal loan amount
 * R = Interest rate per period
 * N = Total number of payments
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureYears: number,
  frequency: Frequency = 'monthly'
): EMIResult {
  if (principal <= 0 || annualRate < 0 || tenureYears <= 0) {
    return {
      emi: 0,
      totalPayment: 0,
      totalInterest: 0,
      paymentsPerYear: 12,
      totalPayments: 0,
    };
  }

  // Determine payments per year based on frequency
  let paymentsPerYear: number;
  switch (frequency) {
    case 'monthly':
      paymentsPerYear = 12;
      break;
    case 'quarterly':
      paymentsPerYear = 4;
      break;
    case 'half-yearly':
      paymentsPerYear = 2;
      break;
    case 'yearly':
      paymentsPerYear = 1;
      break;
    default:
      paymentsPerYear = 12;
  }

  // Convert annual rate to rate per period
  const ratePerPeriod = annualRate / 100 / paymentsPerYear;
  const totalPayments = tenureYears * paymentsPerYear;

  // Handle edge case where rate is 0
  if (ratePerPeriod === 0) {
    const emi = principal / totalPayments;
    return {
      emi: Math.round(emi * 100) / 100,
      totalPayment: Math.round(principal * 100) / 100,
      totalInterest: 0,
      paymentsPerYear,
      totalPayments,
    };
  }

  // Calculate EMI using the formula
  const rateFactor = Math.pow(1 + ratePerPeriod, totalPayments);
  const emi = (principal * ratePerPeriod * rateFactor) / (rateFactor - 1);

  const totalPayment = emi * totalPayments;
  const totalInterest = totalPayment - principal;

  return {
    emi: Math.round(emi * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    paymentsPerYear,
    totalPayments,
  };
}

/**
 * Get frequency label for display
 */
export function getFrequencyLabel(frequency: Frequency): string {
  switch (frequency) {
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'half-yearly':
      return 'Half-Yearly';
    case 'yearly':
      return 'Yearly';
    default:
      return 'Monthly';
  }
}

/**
 * Format currency for Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with Indian number system
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}
