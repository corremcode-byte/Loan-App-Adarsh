import { calculateEMI, formatCurrency, formatNumber } from '../lib/emi';

describe('calculateEMI', () => {
  // ── Existing tests (preserved, not weakened) ──────────────────────────────

  it('returns zeros when principal is 0', () => {
    const result = calculateEMI(0, 12, 5);
    expect(result.emi).toBe(0);
  });

  it('returns zeros when tenure is 0', () => {
    const result = calculateEMI(500000, 12, 0);
    expect(result.emi).toBe(0);
  });

  it('computes a reasonable EMI for ₹5L at 12% over 5 years (monthly)', () => {
    const result = calculateEMI(500000, 12, 5, 'monthly');
    // Standard formula: ~₹11,122/month
    expect(result.emi).toBeGreaterThan(11000);
    expect(result.emi).toBeLessThan(11300);
  });

  it('total payment > principal (interest is non-zero)', () => {
    const result = calculateEMI(1000000, 10, 10, 'monthly');
    expect(result.totalPayment).toBeGreaterThan(1000000);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  // Bug 3: interestRate is now part of formData — verify EMI uses the correct rate
  it('higher interest rate produces a higher EMI for the same principal and tenure', () => {
    const low = calculateEMI(500000, 10.5, 5, 'monthly');
    const high = calculateEMI(500000, 18, 5, 'monthly');
    expect(high.emi).toBeGreaterThan(low.emi);
  });

  // ── Bug 21: Zero interest rate ────────────────────────────────────────────

  it('zero interest rate: EMI = principal / totalPayments (no interest accrual)', () => {
    // ₹6,00,000 at 0% over 5 years monthly = ₹10,000/month exactly
    const result = calculateEMI(600000, 0, 5, 'monthly');
    expect(result.emi).toBe(10000);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPayment).toBe(600000);
  });

  it('zero interest rate: totalPayment equals principal (rounding may cause emi*n ≠ principal by paise)', () => {
    const result = calculateEMI(1000000, 0, 10, 'monthly');
    expect(result.totalInterest).toBe(0);
    // totalPayment is set to principal exactly; rounded emi * n may differ by paise
    expect(result.totalPayment).toBe(1000000);
    expect(Math.abs(result.emi * result.totalPayments - 1000000)).toBeLessThan(1);
  });

  // ── Bug 21: Minimum permitted loan amounts ────────────────────────────────

  it('minimum unsecured loan ₹50,000 at 10.5% over 1 year: valid finite EMI', () => {
    const result = calculateEMI(50000, 10.5, 1, 'monthly');
    expect(result.emi).toBeGreaterThan(0);
    expect(isFinite(result.emi)).toBe(true);
    expect(isNaN(result.emi)).toBe(false);
    // ~₹4,406/month
    expect(result.emi).toBeGreaterThan(4300);
    expect(result.emi).toBeLessThan(4500);
  });

  it('minimum secured loan ₹1,00,000 at 10.5% over 1 year: valid finite EMI', () => {
    const result = calculateEMI(100000, 10.5, 1, 'monthly');
    expect(result.emi).toBeGreaterThan(0);
    expect(isFinite(result.emi)).toBe(true);
    // ~₹8,813/month
    expect(result.emi).toBeGreaterThan(8700);
    expect(result.emi).toBeLessThan(8950);
  });

  // ── Bug 21: Large secured loan amounts ───────────────────────────────────

  it('large secured loan ₹5 Crore at 12% over 20 years: finite non-NaN result', () => {
    const result = calculateEMI(50000000, 12, 20, 'monthly');
    expect(isFinite(result.emi)).toBe(true);
    expect(isNaN(result.emi)).toBe(false);
    expect(result.emi).toBeGreaterThan(0);
    // ₹5Cr at 12% / 240 months ≈ ₹5,50,543/month
    expect(result.emi).toBeGreaterThan(500000);
    expect(result.emi).toBeLessThan(600000);
    expect(result.totalPayment).toBeGreaterThan(result.emi * 230);
  });

  it('large secured loan ₹5 Crore at 12% over 15 years: finite result', () => {
    const result = calculateEMI(50000000, 12, 15, 'monthly');
    expect(isFinite(result.emi)).toBe(true);
    expect(isNaN(result.emi)).toBe(false);
    // Higher EMI than 20-year version
    const result20yr = calculateEMI(50000000, 12, 20, 'monthly');
    expect(result.emi).toBeGreaterThan(result20yr.emi);
  });

  // ── Bug 21: Large unsecured loan amounts ─────────────────────────────────

  it('large unsecured loan ₹40 Lakh at 18% over 5 years: finite non-NaN result', () => {
    const result = calculateEMI(4000000, 18, 5, 'monthly');
    expect(isFinite(result.emi)).toBe(true);
    expect(isNaN(result.emi)).toBe(false);
    expect(result.emi).toBeGreaterThan(0);
    // ₹40L at 18% / 60 months ≈ ₹1,01,520/month
    expect(result.emi).toBeGreaterThan(90000);
    expect(result.emi).toBeLessThan(110000);
  });

  // ── Bug 21: Different tenures ─────────────────────────────────────────────

  it('shorter tenure = higher EMI for same principal and rate', () => {
    const short = calculateEMI(1000000, 12, 5, 'monthly');
    const long = calculateEMI(1000000, 12, 10, 'monthly');
    expect(short.emi).toBeGreaterThan(long.emi);
  });

  it('shorter tenure = less total interest', () => {
    const short = calculateEMI(1000000, 12, 5, 'monthly');
    const long = calculateEMI(1000000, 12, 10, 'monthly');
    expect(short.totalInterest).toBeLessThan(long.totalInterest);
  });

  it('1-year tenure: 12 monthly payments', () => {
    const result = calculateEMI(100000, 12, 1, 'monthly');
    expect(result.totalPayments).toBe(12);
  });

  it('30-year secured tenure: 360 monthly payments', () => {
    const result = calculateEMI(5000000, 12, 30, 'monthly');
    expect(result.totalPayments).toBe(360);
    expect(isFinite(result.emi)).toBe(true);
    expect(isNaN(result.emi)).toBe(false);
  });

  // ── Bug 21: Frequency variants ────────────────────────────────────────────

  it('quarterly EMI is roughly 3× monthly EMI for same principal/rate/tenure', () => {
    const monthly = calculateEMI(1000000, 12, 5, 'monthly');
    const quarterly = calculateEMI(1000000, 12, 5, 'quarterly');
    // Quarterly has fewer compounding periods so total interest differs slightly
    expect(quarterly.emi).toBeGreaterThan(monthly.emi * 2.9);
    expect(quarterly.emi).toBeLessThan(monthly.emi * 3.1);
  });

  it('half-yearly EMI is roughly 6× monthly for same principal/rate/tenure', () => {
    const monthly = calculateEMI(1000000, 12, 5, 'monthly');
    const halfYearly = calculateEMI(1000000, 12, 5, 'half-yearly');
    expect(halfYearly.emi).toBeGreaterThan(monthly.emi * 5.7);
    expect(halfYearly.emi).toBeLessThan(monthly.emi * 6.3);
  });

  it('yearly EMI produces 12 payments for 12-year tenure', () => {
    const result = calculateEMI(1000000, 12, 12, 'yearly');
    expect(result.totalPayments).toBe(12);
    expect(isFinite(result.emi)).toBe(true);
  });

  // ── Bug 21: Invalid and boundary inputs ──────────────────────────────────

  it('negative principal returns zeros', () => {
    const result = calculateEMI(-100000, 12, 5);
    expect(result.emi).toBe(0);
  });

  it('negative tenure returns zeros', () => {
    const result = calculateEMI(500000, 12, -1);
    expect(result.emi).toBe(0);
  });

  it('negative rate returns zeros', () => {
    const result = calculateEMI(500000, -5, 5);
    expect(result.emi).toBe(0);
  });

  // ── Bug 21: NaN / Infinity guard ─────────────────────────────────────────

  it('extreme rate×tenure does not produce NaN or Infinity', () => {
    // 999% annual rate for 100 years: rateFactor = (1 + 999/100/12)^1200 → Infinity in JS
    const result = calculateEMI(1000000, 999, 100, 'monthly');
    expect(isNaN(result.emi)).toBe(false);
    expect(isFinite(result.emi)).toBe(true);
    expect(isNaN(result.totalPayment)).toBe(false);
    expect(isNaN(result.totalInterest)).toBe(false);
    expect(result.emi).toBeGreaterThan(0);
  });

  it('maximum realistic rate (30%) over maximum realistic tenure (30yr): no NaN', () => {
    const result = calculateEMI(50000000, 30, 30, 'monthly');
    expect(isNaN(result.emi)).toBe(false);
    expect(isFinite(result.emi)).toBe(true);
    expect(result.emi).toBeGreaterThan(0);
  });

  // ── Bug 21: Rounding consistency ─────────────────────────────────────────

  it('totalInterest = totalPayment - principal (within 1 rupee rounding)', () => {
    const result = calculateEMI(1000000, 12, 5, 'monthly');
    const expected = result.totalPayment - 1000000;
    expect(Math.abs(result.totalInterest - expected)).toBeLessThan(1);
  });

  it('all returned values are non-negative for valid inputs', () => {
    const result = calculateEMI(500000, 10.5, 3, 'monthly');
    expect(result.emi).toBeGreaterThanOrEqual(0);
    expect(result.totalPayment).toBeGreaterThanOrEqual(0);
    expect(result.totalInterest).toBeGreaterThanOrEqual(0);
  });
});

// ── formatCurrency ──────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats ₹5L in Indian notation', () => {
    expect(formatCurrency(500000)).toContain('5,00,000');
  });

  it('formats ₹1 Crore in Indian notation', () => {
    expect(formatCurrency(10000000)).toContain('1,00,00,000');
  });

  it('formats ₹5 Crore correctly', () => {
    expect(formatCurrency(50000000)).toContain('5,00,00,000');
  });

  it('includes INR currency symbol', () => {
    const formatted = formatCurrency(100000);
    expect(formatted).toMatch(/[₹]/);
  });

  it('zero amount formats without crashing', () => {
    const formatted = formatCurrency(0);
    expect(formatted).toBeTruthy();
    expect(isNaN(Number(formatted.replace(/[^0-9]/g, '')))).toBe(false);
  });
});

// ── formatNumber ────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formats 1000000 as 10,00,000 (Indian system)', () => {
    expect(formatNumber(1000000)).toBe('10,00,000');
  });

  it('formats small numbers without extra commas', () => {
    expect(formatNumber(360)).toBe('360');
  });
});
