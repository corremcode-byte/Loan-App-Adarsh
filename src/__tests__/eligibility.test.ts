import { calculateEligibility } from '../lib/eligibility';
import { ApplicationFormData } from '../types';

// Base valid application — all fields populated; individual tests override what they need.
function base(overrides: Partial<ApplicationFormData> = {}): ApplicationFormData {
  return {
    phoneNumber: '9999999999',
    isPhoneVerified: true,
    loanType: 'unsecured',
    firstName: 'Test',
    middleName: '',
    lastName: 'User',
    gender: 'male',
    dateOfBirth: '1985-06-15', // age ~40
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

// ─── Bug 7: insufficient collateral adds reason/recommendation; status follows score ───
describe('Bug 7 — collateral insufficiency adds reason but does not override status', () => {
  it('status follows score (not collateral coverage); insufficient-collateral reason still added', () => {
    // High score: low DTI, low FOIR, manageable LTI, strong experience, no existing loans
    const result = calculateEligibility(
      base({
        loanType: 'secured',
        loanAmount: 5000000,
        monthlyIncome: 200000,
        expectedEMI: 10000,
        collateral: {
          propertyType: 'residential',
          estimatedValue: 2000000, // less than 5000000 — insufficient
          ownershipStatus: 'self-owned',
          propertyAddress: '1 MG Road',
        },
      })
    );
    // Score is high enough → likely_approved; collateral shortfall must NOT override this
    expect(result.status).toBe('likely_approved');
    expect(result.reasons.some((r) => r.toLowerCase().includes('collateral value is less'))).toBe(true);
    expect(result.recommendations.some((r) => r.toLowerCase().includes('providing additional collateral'))).toBe(true);
  });

  it('allows likely_approved when collateral >= loanAmount (and score qualifies)', () => {
    const result = calculateEligibility(
      base({
        loanType: 'secured',
        loanAmount: 1000000,
        monthlyIncome: 200000,
        expectedEMI: 20000,
        yearsOfExperience: 10,
        collateral: {
          propertyType: 'residential',
          estimatedValue: 2000000, // >= loanAmount
          ownershipStatus: 'self-owned',
          propertyAddress: '1 MG Road',
        },
      })
    );
    expect(result.status).toBe('likely_approved');
  });
});

// ─── Bug 8: no duplicate loan-amount-reduction recommendations ─────────────────
describe('Bug 8 — deduplicate loan-reduction recommendations', () => {
  it('emits at most one loan-amount recommendation when DTI, FOIR and LTI all fail', () => {
    // ₹6 Cr loan on ₹50K income — DTI, FOIR, and LTI all fail simultaneously
    const result = calculateEligibility(
      base({
        loanType: 'unsecured',
        loanAmount: 60000000,
        monthlyIncome: 50000,
        expectedEMI: 1200000,
      })
    );
    // Only count PURE loan-reduction recs (not hybrid ones that also mention debt clearing)
    const pureLoanRecs = result.recommendations.filter((r) => {
      const lower = r.toLowerCase();
      const addressesLoanAmount = lower.includes('loan amount') || lower.includes('loan size');
      const alsoAddressesDebtClearing =
        lower.includes('existing debts') || lower.includes('existing loans') || lower.includes('pay off');
      return addressesLoanAmount && !alsoAddressesDebtClearing;
    });
    expect(pureLoanRecs.length).toBeLessThanOrEqual(1);
  });
});

// ─── Correction 3: hybrid debt-clearing recs preserved alongside pure loan recs ──
describe('Correction 3 — debt-clearing advice preserved when DTI and FOIR both fail', () => {
  it('keeps distinct debt-clearing advice when DTI > 50% and FOIR fails with existing loans', () => {
    // DTI = (10000 + 42000) / 100000 = 52% > 50% → DTI fails (hybrid rec fires)
    // FOIR = 52% > 50% (salaried) → FOIR fails (pure loan-reduction rec fires)
    const result = calculateEligibility(
      base({
        monthlyIncome: 100000,
        existingLoans: [{ loanType: 'personal-loan', outstandingAmount: 200000, emi: 10000, tenure: 'monthly' }],
        hasExistingLoans: 'yes',
        expectedEMI: 42000,
      })
    );
    // A pure loan-reduction rec (from FOIR) must be present
    expect(result.recommendations.some((r) => r.toLowerCase().includes('tenure') || r.toLowerCase().includes('smaller loan'))).toBe(true);
    // The hybrid DTI-fail rec's debt-clearing advice must NOT be dropped
    expect(result.recommendations.some((r) => r.toLowerCase().includes('existing debts') || r.toLowerCase().includes('existing loans'))).toBe(true);
  });
});

// ─── Bug 11/13: experience capped by age in scoring ───────────────────────────
describe('Bug 11/13 — experience capped by age in eligibility scoring', () => {
  it('scores a 25-year-old with claimed 30 years of experience as if they had 7 (25-18)', () => {
    // age=25, claimed experience=30, effective=7, minExp*3=3 → strong (7pts)
    const youngExperienced = calculateEligibility(
      base({
        dateOfBirth: new Date(Date.now() - 25 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        yearsOfExperience: 30,
        occupation: 'salaried',
      })
    );
    // For a 25-year-old, effective experience = 7, which is >= 1*3=3, so "Strong"
    expect(youngExperienced.reasons.some((r) => r.includes('Strong work experience of 7'))).toBe(true);
  });

  it('a 331-year-old-equivalent input does not give unrealistic experience score', () => {
    // With capping, unrealistically high experience gets capped to age-18
    const result = calculateEligibility(
      base({
        dateOfBirth: '1990-01-01',
        yearsOfExperience: 331,
        occupation: 'self-employed',
      })
    );
    // effective experience = age - 18 (not 331)
    const experienceReason = result.reasons.find((r) =>
      r.includes('work experience of')
    );
    expect(experienceReason).toBeDefined();
    expect(experienceReason).not.toContain('331');
  });
});

// ─── Bug 15: DTI moderate recommendation conditional on existing loans ─────────
describe('Bug 15 — DTI moderate recommendation is conditional on existing loans', () => {
  it('suggests reducing loan amount (not clearing loans) when DTI is 40-50% with no existing loans', () => {
    // DTI = (proposedEMI) / income — no existing loans
    // We need DTI between 40% and 50%.  With income=100000, we need EMI between 40000 and 50000.
    const result = calculateEligibility(
      base({
        monthlyIncome: 100000,
        existingLoans: [],
        hasExistingLoans: 'no',
        expectedEMI: 42000, // 42% DTI
      })
    );
    const dtiRec = result.recommendations.find((r) =>
      r.toLowerCase().includes('loan amount') || r.toLowerCase().includes('tenure')
    );
    expect(dtiRec).toBeDefined();
    // Must NOT suggest clearing existing loans when there are none
    expect(dtiRec).not.toMatch(/existing loans/i);
  });

  it('suggests clearing existing loans when DTI is 40-50% with existing loans', () => {
    const result = calculateEligibility(
      base({
        monthlyIncome: 100000,
        existingLoans: [{ loanType: 'personal-loan', outstandingAmount: 200000, emi: 10000, tenure: 'monthly' }],
        hasExistingLoans: 'yes',
        expectedEMI: 32000, // 42% DTI total
      })
    );
    const dtiRec = result.recommendations.find((r) =>
      r.toLowerCase().includes('existing loans')
    );
    expect(dtiRec).toBeDefined();
  });
});

// ─── Bug 4: very high DTI/FOIR correctly produces likely_rejected ─────────────
describe('Bug 4 — extreme violations produce likely_rejected', () => {
  it('₹6Cr loan on ₹50K income is likely_rejected', () => {
    const result = calculateEligibility(
      base({
        loanType: 'unsecured',
        loanAmount: 60000000,
        monthlyIncome: 50000,
        expectedEMI: 1300000,
      })
    );
    expect(result.status).toBe('likely_rejected');
  });
});
