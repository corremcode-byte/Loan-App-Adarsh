import { toMonthlyEMI } from '../lib/emi';
import { calculateEligibility } from '../lib/eligibility';
import { ApplicationFormData } from '../types';

// ── toMonthlyEMI unit tests ───────────────────────────────────────────────────

describe('toMonthlyEMI — frequency normalization', () => {
  // Required equivalences from AF-4 spec
  it('₹3,000 monthly = ₹3,000 monthly equivalent', () => {
    expect(toMonthlyEMI(3000, 'monthly')).toBe(3000);
  });

  it('₹9,000 quarterly = ₹3,000 monthly equivalent', () => {
    expect(toMonthlyEMI(9000, 'quarterly')).toBe(3000);
  });

  it('₹18,000 half-yearly = ₹3,000 monthly equivalent', () => {
    expect(toMonthlyEMI(18000, 'half-yearly')).toBe(3000);
  });

  it('₹36,000 yearly = ₹3,000 monthly equivalent', () => {
    expect(toMonthlyEMI(36000, 'yearly')).toBe(3000);
  });

  // All four frequencies produce the same monthly equivalent for equivalent inputs
  it('monthly/quarterly/half-yearly/yearly equivalents are consistent', () => {
    const amount = 12000;
    expect(toMonthlyEMI(amount, 'monthly')).toBe(12000);
    expect(toMonthlyEMI(amount * 3, 'quarterly')).toBe(12000);
    expect(toMonthlyEMI(amount * 6, 'half-yearly')).toBe(12000);
    expect(toMonthlyEMI(amount * 12, 'yearly')).toBe(12000);
  });

  // Boundary: zero amount
  it('zero amount returns 0 for all frequencies', () => {
    expect(toMonthlyEMI(0, 'monthly')).toBe(0);
    expect(toMonthlyEMI(0, 'quarterly')).toBe(0);
    expect(toMonthlyEMI(0, 'half-yearly')).toBe(0);
    expect(toMonthlyEMI(0, 'yearly')).toBe(0);
  });

  // Boundary: negative amount
  it('negative amount returns 0', () => {
    expect(toMonthlyEMI(-5000, 'monthly')).toBe(0);
    expect(toMonthlyEMI(-9000, 'quarterly')).toBe(0);
  });

  // Boundary: NaN / Infinity
  it('NaN amount returns 0', () => {
    expect(toMonthlyEMI(NaN, 'monthly')).toBe(0);
  });

  it('Infinity amount returns 0', () => {
    expect(toMonthlyEMI(Infinity, 'monthly')).toBe(0);
  });

  // ── Explicit handling of null / undefined / unrecognised frequencies ─────────
  // These tests document the guaranteed behaviour so callers cannot rely on silent
  // fall-through. null and undefined are resolved via ?? before the switch; empty
  // string and unrecognised strings hit the default case. In all cases the full
  // amount is returned (treated as monthly) — the most conservative choice for
  // this app's frequency set (monthly or less frequent), never understating.

  it('null frequency → resolved to monthly via ?? → returns full amount', () => {
    // toMonthlyEMI signature accepts null; ?? resolves to 'monthly'
    expect(toMonthlyEMI(9000, null)).toBe(9000);
  });

  it('undefined frequency → resolved to monthly via ?? → returns full amount', () => {
    expect(toMonthlyEMI(9000, undefined)).toBe(9000);
  });

  it('empty string frequency → hits default case explicitly → returns full amount', () => {
    // '' does not match any known frequency; default branch returns full amount
    expect(toMonthlyEMI(5000, '')).toBe(5000);
  });

  it('unrecognised string frequency → hits default case explicitly → returns full amount', () => {
    expect(toMonthlyEMI(5000, 'weekly')).toBe(5000);
    expect(toMonthlyEMI(5000, 'fortnightly')).toBe(5000);
    expect(toMonthlyEMI(5000, 'MONTHLY')).toBe(5000); // wrong case — also unrecognised
  });

  it('null/undefined frequency cannot understate: result ≥ result for monthly', () => {
    // For any valid app frequency, monthly equivalent ≤ original amount.
    // Treating null/undefined as monthly returns the FULL amount, so no understatement.
    const withNull = toMonthlyEMI(9000, null);
    const withMonthly = toMonthlyEMI(9000, 'monthly');
    expect(withNull).toBe(withMonthly);
  });

  // No double normalization: calling toMonthlyEMI on an already-monthly amount is idempotent
  it('monthly input is idempotent — no double normalization', () => {
    const original = 5000;
    const once = toMonthlyEMI(original, 'monthly');
    const twice = toMonthlyEMI(once, 'monthly');
    expect(once).toBe(original);
    expect(twice).toBe(original);
  });
});

// ── Mixed-frequency loan summation ───────────────────────────────────────────

describe('mixed-frequency existing loans summed correctly', () => {
  it('sums 3 loans with different frequencies to correct monthly total', () => {
    const loans = [
      { emi: 3000, tenure: 'monthly' as const },     // = 3,000/month
      { emi: 9000, tenure: 'quarterly' as const },   // = 3,000/month
      { emi: 36000, tenure: 'yearly' as const },     // = 3,000/month
    ];
    const total = loans.reduce((sum, l) => sum + toMonthlyEMI(l.emi, l.tenure), 0);
    expect(total).toBe(9000); // 3+3+3
  });

  it('a single quarterly loan of ₹9,000 sums the same as 3 monthly loans of ₹3,000', () => {
    const quarterly = toMonthlyEMI(9000, 'quarterly');
    const monthly = toMonthlyEMI(3000, 'monthly');
    expect(quarterly).toBe(monthly);
  });

  it('half-yearly and monthly loans sum correctly', () => {
    const loans = [
      { emi: 18000, tenure: 'half-yearly' as const }, // = 3,000/month
      { emi: 7000, tenure: 'monthly' as const },       // = 7,000/month
    ];
    const total = loans.reduce((sum, l) => sum + toMonthlyEMI(l.emi, l.tenure), 0);
    expect(total).toBe(10000); // 3,000 + 7,000
  });
});

// ── DTI / FOIR normalization via calculateEligibility ────────────────────────

function base(overrides: Partial<ApplicationFormData> = {}): ApplicationFormData {
  return {
    phoneNumber: '9999999999',
    isPhoneVerified: true,
    loanType: 'unsecured',
    firstName: 'Test',
    middleName: '',
    lastName: 'User',
    gender: 'male',
    dateOfBirth: '1985-06-15',
    maritalStatus: 'single',
    email: 'test@example.com',
    address: { street: '1 MG Road', city: 'Mumbai', state: 'maharashtra', pincode: '400001' },
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '123456789012',
    occupation: 'salaried',
    employerName: 'Acme Corp',
    monthlyIncome: 100000,
    yearsOfExperience: 10,
    hasExistingLoans: 'no',
    existingLoans: [],
    loanAmount: 500000,
    loanPurpose: 'home-renovation',
    preferredTenure: 60,
    interestRate: 12,
    expectedEMI: 11122,
    cibilScore: 750,
    ...overrides,
  };
}

describe('AF-4: DTI/FOIR use monthly-normalized obligations', () => {
  it('₹9,000/quarter existing loan is treated the same as ₹3,000/month for DTI/FOIR', () => {
    const withMonthly = calculateEligibility(
      base({
        hasExistingLoans: 'yes',
        existingLoans: [
          { loanType: 'personal-loan', outstandingAmount: 100000, emi: 3000, tenure: 'monthly' },
        ],
      })
    );
    const withQuarterly = calculateEligibility(
      base({
        hasExistingLoans: 'yes',
        existingLoans: [
          { loanType: 'personal-loan', outstandingAmount: 100000, emi: 9000, tenure: 'quarterly' },
        ],
      })
    );
    // Same monthly obligation → same eligibility score and status
    expect(withQuarterly.score).toBe(withMonthly.score);
    expect(withQuarterly.status).toBe(withMonthly.status);
  });

  it('₹36,000/year existing loan is treated the same as ₹3,000/month for eligibility', () => {
    const withMonthly = calculateEligibility(
      base({
        hasExistingLoans: 'yes',
        existingLoans: [
          { loanType: 'car-loan', outstandingAmount: 200000, emi: 3000, tenure: 'monthly' },
        ],
      })
    );
    const withYearly = calculateEligibility(
      base({
        hasExistingLoans: 'yes',
        existingLoans: [
          { loanType: 'car-loan', outstandingAmount: 200000, emi: 36000, tenure: 'yearly' },
        ],
      })
    );
    expect(withYearly.score).toBe(withMonthly.score);
    expect(withYearly.status).toBe(withMonthly.status);
  });

  it('₹18,000 half-yearly = ₹3,000/month: same DTI outcome', () => {
    const withMonthly = calculateEligibility(
      base({
        hasExistingLoans: 'yes',
        existingLoans: [
          { loanType: 'home-loan', outstandingAmount: 500000, emi: 3000, tenure: 'monthly' },
        ],
      })
    );
    const withHalfYearly = calculateEligibility(
      base({
        hasExistingLoans: 'yes',
        existingLoans: [
          { loanType: 'home-loan', outstandingAmount: 500000, emi: 18000, tenure: 'half-yearly' },
        ],
      })
    );
    expect(withHalfYearly.score).toBe(withMonthly.score);
  });

  it('no existing loans: eligibility unaffected by normalization change', () => {
    const result = calculateEligibility(base({ existingLoans: [], hasExistingLoans: 'no' }));
    expect(result.status).toBe('likely_approved');
  });

  it('a high quarterly EMI that should genuinely fail DTI still fails after normalization', () => {
    // ₹1,50,000/quarter = ₹50,000/month. Income = ₹100,000.
    // DTI = (50,000 + 11,122) / 100,000 = 61.1% → should fail (> 50%)
    const result = calculateEligibility(
      base({
        hasExistingLoans: 'yes',
        existingLoans: [
          { loanType: 'home-loan', outstandingAmount: 2000000, emi: 150000, tenure: 'quarterly' },
        ],
        expectedEMI: 11122,
      })
    );
    // DTI > 50% → low DTI score (5/25); FOIR > 50% → low FOIR score (5/20)
    // Combined score should be low enough for likely_rejected
    expect(result.status).toBe('likely_rejected');
  });

  it('a low quarterly EMI that should pass DTI passes after normalization', () => {
    // ₹6,000/quarter = ₹2,000/month. Income = ₹100,000. proposedEMI = 11,122.
    // DTI = (2,000 + 11,122) / 100,000 = 13.1% → passes
    const result = calculateEligibility(
      base({
        hasExistingLoans: 'yes',
        existingLoans: [
          { loanType: 'personal-loan', outstandingAmount: 50000, emi: 6000, tenure: 'quarterly' },
        ],
        expectedEMI: 11122,
      })
    );
    expect(result.status).toBe('likely_approved');
    expect(result.reasons.some((r) => r.toLowerCase().includes('excellent dti') || r.toLowerCase().includes('13'))).toBe(true);
  });
});

// ── Original data unchanged (no mutation) ────────────────────────────────────

describe('AF-4: original loan data not mutated by eligibility calculation', () => {
  it('existingLoans emi and tenure are unchanged after calculateEligibility', () => {
    const loans = [
      { loanType: 'car-loan', outstandingAmount: 100000, emi: 9000, tenure: 'quarterly' as const },
    ];
    const data = base({ hasExistingLoans: 'yes', existingLoans: loans });
    const originalEMI = data.existingLoans[0].emi;
    const originalTenure = data.existingLoans[0].tenure;

    calculateEligibility(data);

    // Original values must remain unchanged — normalization is computed, not stored
    expect(data.existingLoans[0].emi).toBe(originalEMI);      // still 9000
    expect(data.existingLoans[0].tenure).toBe(originalTenure); // still 'quarterly'
  });
});
