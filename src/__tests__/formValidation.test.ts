import { validateFormStep } from '../lib/formValidation';
import { indianStates, UT_VALUES } from '../lib/indiaData';
import { ApplicationFormData } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns an ISO date string (YYYY-MM-DD) for a person exactly `ageYears` old. */
function dobForAge(ageYears: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - ageYears);
  return d.toISOString().split('T')[0];
}

/** Minimal fully-valid ApplicationFormData. Individual tests override what they need. */
function base(overrides: Partial<ApplicationFormData> = {}): ApplicationFormData {
  return {
    phoneNumber: '9999999999',
    isPhoneVerified: true,
    loanType: 'unsecured',
    firstName: 'Test',
    middleName: '',
    lastName: 'User',
    gender: 'male',
    dateOfBirth: dobForAge(30),
    maritalStatus: 'single',
    email: 'test@example.com',
    address: { street: '1 MG Road', city: 'Mumbai', state: 'maharashtra', pincode: '400001' },
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '123456789012',
    occupation: 'salaried',
    employerName: 'Acme Corp',
    monthlyIncome: 100000,
    yearsOfExperience: 5,
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

// ─────────────────────────────────────────────────────────────────────────────
// Bug 1 — State/UT dropdown has all 36 entries including all 8 UTs
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 1 — State/UT dropdown completeness', () => {
  it('has exactly 36 entries (28 states + 8 UTs)', () => {
    expect(indianStates).toHaveLength(36);
  });

  it('contains all 8 Union Territories', () => {
    const values = indianStates.map((s) => s.value);
    for (const ut of UT_VALUES) {
      expect(values).toContain(ut);
    }
  });

  it('every entry has a non-empty value and label', () => {
    for (const state of indianStates) {
      expect(state.value.trim()).not.toBe('');
      expect(state.label.trim()).not.toBe('');
    }
  });

  it('no duplicate values', () => {
    const values = indianStates.map((s) => s.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 2 — Interest rate validation enforces minimum 10.5%
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 2 — Interest rate minimum validation', () => {
  it('rejects rate = 0', () => {
    const errors = validateFormStep('loan-details', base({ interestRate: 0 }));
    expect(errors.interestRate).toBeTruthy();
  });

  it('rejects rate = 10.4 (below minimum)', () => {
    const errors = validateFormStep('loan-details', base({ interestRate: 10.4 }));
    expect(errors.interestRate).toBeTruthy();
  });

  it('accepts rate = 10.5 (minimum allowed)', () => {
    const errors = validateFormStep('loan-details', base({ interestRate: 10.5 }));
    expect(errors.interestRate).toBeUndefined();
  });

  it('accepts rate = 12 (default)', () => {
    const errors = validateFormStep('loan-details', base({ interestRate: 12 }));
    expect(errors.interestRate).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 3 — Loan purpose and interest rate are present in ApplicationFormData
// (review section rendering requires those fields to exist on the type)
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 3 — Loan purpose and interest rate fields exist on ApplicationFormData', () => {
  it('ApplicationFormData has loanPurpose field', () => {
    const data = base();
    expect(Object.prototype.hasOwnProperty.call(data, 'loanPurpose')).toBe(true);
    expect(data.loanPurpose).toBeDefined();
  });

  it('ApplicationFormData has interestRate field', () => {
    const data = base();
    expect(Object.prototype.hasOwnProperty.call(data, 'interestRate')).toBe(true);
    expect(typeof data.interestRate).toBe('number');
  });

  it('loan-details step requires loanPurpose', () => {
    const errors = validateFormStep('loan-details', base({ loanPurpose: '' }));
    expect(errors.loanPurpose).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 5 — Minimum loan amount validation
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 5 — Minimum loan amount enforced', () => {
  describe('unsecured loans (minimum ₹50,000)', () => {
    it('rejects amount = 0', () => {
      const errors = validateFormStep('loan-details', base({ loanType: 'unsecured', loanAmount: 0 }));
      expect(errors.loanAmount).toBeTruthy();
    });

    it('rejects amount = 49,999 (below minimum)', () => {
      const errors = validateFormStep('loan-details', base({ loanType: 'unsecured', loanAmount: 49999 }));
      expect(errors.loanAmount).toBeTruthy();
    });

    it('accepts amount = 50,000 (minimum allowed)', () => {
      const errors = validateFormStep('loan-details', base({ loanType: 'unsecured', loanAmount: 50000 }));
      expect(errors.loanAmount).toBeUndefined();
    });

    it('accepts amount = 500,000', () => {
      const errors = validateFormStep('loan-details', base({ loanType: 'unsecured', loanAmount: 500000 }));
      expect(errors.loanAmount).toBeUndefined();
    });
  });

  describe('secured loans (minimum ₹1,00,000)', () => {
    it('rejects amount = 99,999 (below minimum)', () => {
      const errors = validateFormStep('loan-details', base({ loanType: 'secured', loanAmount: 99999 }));
      expect(errors.loanAmount).toBeTruthy();
    });

    it('accepts amount = 100,000 (minimum allowed)', () => {
      const errors = validateFormStep('loan-details', base({ loanType: 'secured', loanAmount: 100000 }));
      expect(errors.loanAmount).toBeUndefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 10 — Tenure must be explicitly selected before proceeding
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 10 — Loan tenure required before continuing', () => {
  it('rejects preferredTenure = 0 (unselected)', () => {
    const errors = validateFormStep('loan-details', base({ preferredTenure: 0 }));
    expect(errors.preferredTenure).toBeTruthy();
  });

  it('accepts preferredTenure = 60', () => {
    const errors = validateFormStep('loan-details', base({ preferredTenure: 60 }));
    expect(errors.preferredTenure).toBeUndefined();
  });

  it('accepts preferredTenure = 12 (minimum tenure option)', () => {
    const errors = validateFormStep('loan-details', base({ preferredTenure: 12 }));
    expect(errors.preferredTenure).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 14 — hasExistingLoans must be explicitly selected ('yes' or 'no')
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 14 — hasExistingLoans explicit selection required', () => {
  it("rejects '' (default unselected state)", () => {
    const errors = validateFormStep('financial', base({ hasExistingLoans: '' }));
    expect(errors.hasExistingLoans).toBeTruthy();
  });

  it("accepts 'no'", () => {
    const errors = validateFormStep('financial', base({ hasExistingLoans: 'no' }));
    expect(errors.hasExistingLoans).toBeUndefined();
  });

  it("accepts 'yes'", () => {
    const errors = validateFormStep('financial', base({ hasExistingLoans: 'yes' }));
    expect(errors.hasExistingLoans).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bugs 11/13 client-side — experience cannot exceed age − 18
// ─────────────────────────────────────────────────────────────────────────────
describe('Bugs 11/13 — client-side experience vs age validation', () => {
  it('rejects experience exceeding age−18 for a 25-year-old (max 7 years)', () => {
    const errors = validateFormStep(
      'financial',
      base({ dateOfBirth: dobForAge(25), yearsOfExperience: 8 })
    );
    expect(errors.yearsOfExperience).toMatch(/cannot exceed 7/i);
  });

  it('accepts experience exactly equal to age−18 for a 25-year-old (7 years)', () => {
    const errors = validateFormStep(
      'financial',
      base({ dateOfBirth: dobForAge(25), yearsOfExperience: 7 })
    );
    expect(errors.yearsOfExperience).toBeUndefined();
  });

  it('accepts experience well below age−18 for a 30-year-old (12 max, 5 claimed)', () => {
    const errors = validateFormStep(
      'financial',
      base({ dateOfBirth: dobForAge(30), yearsOfExperience: 5 })
    );
    expect(errors.yearsOfExperience).toBeUndefined();
  });

  it('rejects experience exceeding age−18 for a 21-year-old (max 3 years, 4 claimed)', () => {
    const errors = validateFormStep(
      'financial',
      base({ dateOfBirth: dobForAge(21), yearsOfExperience: 4 })
    );
    expect(errors.yearsOfExperience).toMatch(/cannot exceed 3/i);
  });

  it('error message includes both claimed and max experience values', () => {
    const errors = validateFormStep(
      'financial',
      base({ dateOfBirth: dobForAge(25), yearsOfExperience: 15 })
    );
    expect(errors.yearsOfExperience).toMatch(/15/);
    expect(errors.yearsOfExperience).toMatch(/7/);
  });

  it('rejects claimed 331 years experience for a 35-year-old (max 17)', () => {
    const errors = validateFormStep(
      'financial',
      base({ dateOfBirth: dobForAge(35), yearsOfExperience: 331 })
    );
    expect(errors.yearsOfExperience).toBeTruthy();
    expect(errors.yearsOfExperience).not.toMatch(/331.*cannot exceed 331/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Healthy path — no errors on a fully valid application
// ─────────────────────────────────────────────────────────────────────────────
describe('validateFormStep — healthy path', () => {
  it('financial step produces no errors for a valid 30-year-old with 5 years experience', () => {
    const errors = validateFormStep('financial', base());
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('loan-details step produces no errors for a fully valid loan request', () => {
    const errors = validateFormStep('loan-details', base());
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('address step produces no errors for a fully valid address', () => {
    const errors = validateFormStep('address', base());
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('personal step produces no errors for a valid personal section', () => {
    const errors = validateFormStep('personal', base());
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
