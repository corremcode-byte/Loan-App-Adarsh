import { calculateEMI } from '../lib/emi';

describe('calculateEMI', () => {
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
});
