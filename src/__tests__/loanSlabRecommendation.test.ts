import { recommendLoanSlab } from '../lib/loanSlabRecommendation';
import { ApplicationFormData } from '../types';

function base(overrides: Partial<ApplicationFormData> = {}): ApplicationFormData {
  return {
    phoneNumber: '9999999999',
    isPhoneVerified: true,
    loanType: 'unsecured',
    firstName: 'Test',
    middleName: '',
    lastName: 'User',
    gender: 'female',
    dateOfBirth: '1980-01-01',
    maritalStatus: 'married',
    email: 'test@example.com',
    address: { street: '1 MG Road', city: 'Mumbai', state: 'maharashtra', pincode: '400001' },
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '123456789012',
    occupation: 'self-employed',
    employerName: 'Self',
    monthlyIncome: 350000,
    yearsOfExperience: 8,
    hasExistingLoans: 'yes',
    existingLoans: [{ loanType: 'personal-loan', outstandingAmount: 500000, emi: 96000, tenure: 'monthly' }],
    loanAmount: 2000000,
    loanPurpose: 'business',
    preferredTenure: 60,
    interestRate: 14,
    expectedEMI: 46548,
    cibilScore: 899,
    ...overrides,
  };
}

// ─── Bug 12: reasoning.bindingConstraint is populated ─────────────────────────
describe('Bug 12 — SlabRecommendationResult exposes binding constraint reasoning', () => {
  it('includes a non-empty bindingConstraint in reasoning', () => {
    const result = recommendLoanSlab(base(), 91);
    expect(result.reasoning.bindingConstraint).toBeTruthy();
    expect(['FOIR', 'LTI', 'Turnover', 'Collateral', 'CIBIL', 'Score']).toContain(
      result.reasoning.bindingConstraint
    );
  });

  it('includes a reason string for the binding constraint', () => {
    const result = recommendLoanSlab(base(), 91);
    const { bindingConstraint, foirReason, ltiReason, turnoverReason, cibilReason, scoreReason } = result.reasoning;
    const reasonMap: Record<string, string | null> = {
      FOIR: foirReason,
      LTI: ltiReason,
      Turnover: turnoverReason,
      CIBIL: cibilReason,
      Score: scoreReason,
    };
    const constraintReason = reasonMap[bindingConstraint];
    expect(constraintReason).toBeTruthy();
  });

  it('Turnover binding constraint reason mentions actual figures', () => {
    // Self-employed with monthly income 350000 → annual turnover 42L → 15% = 6.3L
    const result = recommendLoanSlab(base(), 91);
    if (result.reasoning.bindingConstraint === 'Turnover') {
      expect(result.reasoning.turnoverReason).toMatch(/\d/); // contains numbers
    }
  });
});
