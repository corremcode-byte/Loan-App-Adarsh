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

  // Guard: for extreme rate×tenure combinations rateFactor overflows to Infinity,
  // making emi = P*r*∞/(∞-1) = NaN. When rateFactor→∞ the formula simplifies to
  // emi ≈ P * ratePerPeriod (the full principal is consumed by interest each period).
  if (!isFinite(rateFactor)) {
    const emi = Math.round(principal * ratePerPeriod * 100) / 100;
    const totalPayment = Math.round(emi * totalPayments * 100) / 100;
    return {
      emi,
      totalPayment,
      totalInterest: Math.round((totalPayment - principal) * 100) / 100,
      paymentsPerYear,
      totalPayments,
    };
  }

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
 * Normalize an existing loan EMI amount to its monthly equivalent.
 *
 * The entered amount is the payment for the given frequency:
 *   monthly     → unchanged (÷ 1)
 *   quarterly   → ÷ 3  (₹9,000/quarter = ₹3,000/month)
 *   half-yearly → ÷ 6  (₹18,000/half-year = ₹3,000/month)
 *   yearly      → ÷ 12 (₹36,000/year = ₹3,000/month)
 *
 * Invalid amounts (zero, negative, NaN, Infinity) return 0.
 *
 * null / undefined frequency: resolved to 'monthly' via ?? before the switch so the
 * behaviour is explicit, not a silent switch fall-through.
 *
 * Unrecognised frequency string: the full amount is returned as-is (treated as a
 * monthly obligation). For every frequency this app supports — all of which are
 * monthly or less frequent — this is the most conservative option: it cannot
 * understate the monthly burden and surfaces the anomaly through tests rather than
 * silently losing it.
 */
export function toMonthlyEMI(amount: number, frequency: string | null | undefined): number {
  if (!amount || amount <= 0 || !isFinite(amount)) return 0;
  // Resolve null/undefined explicitly before entering the switch so there is no
  // silent fall-through; 'monthly' is the most conservative default for this app.
  const freq = frequency ?? 'monthly';
  switch (freq) {
    case 'monthly':     return amount;
    case 'quarterly':   return amount / 3;
    case 'half-yearly': return amount / 6;
    case 'yearly':      return amount / 12;
    default:
      // Unrecognised frequency: return the full amount (treat as monthly).
      // This is intentionally conservative — it cannot understate obligations for
      // any frequency that is monthly-or-less-frequent. Add a known frequency to
      // the switch above rather than relying on this path for new values.
      return amount;
  }
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
