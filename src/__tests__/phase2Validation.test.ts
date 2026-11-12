import { validateFormStep } from '../lib/formValidation';
import { validateDOB, calendarAge, parseLocalDate } from '../lib/dobValidation';
import { ApplicationFormData } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD for a person exactly `years` old as of today (local). */
function dobExactlyAged(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split('T')[0];
}

/** Returns YYYY-MM-DD for a date `days` from today (negative = past). */
function relativeDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Fully-valid base data; individual tests override what they need. */
function base(overrides: Partial<ApplicationFormData> = {}): ApplicationFormData {
  return {
    phoneNumber: '9999999999',
    isPhoneVerified: true,
    loanType: 'unsecured',
    firstName: 'Priya',
    middleName: '',
    lastName: 'Sharma',
    gender: 'female',
    dateOfBirth: dobExactlyAged(30),
    maritalStatus: 'single',
    email: 'test@example.com',
    address: { street: '12, MG Road', city: 'Mumbai', state: 'maharashtra', pincode: '400001' },
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
// dobValidation.ts unit tests
// ─────────────────────────────────────────────────────────────────────────────
describe('parseLocalDate', () => {
  it('parses a valid YYYY-MM-DD string as a local date', () => {
    const d = parseLocalDate('2000-06-15');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2000);
    expect(d!.getMonth()).toBe(5); // June = index 5
    expect(d!.getDate()).toBe(15);
  });

  it('returns null for a rolled-over date (Feb 30)', () => {
    expect(parseLocalDate('2024-02-30')).toBeNull();
  });

  it('returns null for an invalid format', () => {
    expect(parseLocalDate('15-06-2000')).toBeNull();
    expect(parseLocalDate('not-a-date')).toBeNull();
    expect(parseLocalDate('')).toBeNull();
  });
});

describe('calendarAge', () => {
  it('returns 18 on the exact 18th birthday', () => {
    const dob = new Date(2000, 5, 15); // 2000-06-15
    const ref = new Date(2018, 5, 15); // 2018-06-15
    expect(calendarAge(dob, ref)).toBe(18);
  });

  it('returns 17 one day before the 18th birthday', () => {
    const dob = new Date(2000, 5, 15);
    const ref = new Date(2018, 5, 14); // one day before birthday
    expect(calendarAge(dob, ref)).toBe(17);
  });

  it('accounts for leap years correctly', () => {
    // Born 2000-02-29 (leap year). On 2018-02-28 they haven't turned 18 yet.
    const dob = new Date(2000, 1, 29);
    const ref = new Date(2018, 1, 28);
    expect(calendarAge(dob, ref)).toBe(17);
  });

  it('returns correct age when birthday has passed this year', () => {
    const dob = new Date(2000, 0, 1); // Jan 1, 2000
    const ref = new Date(2025, 5, 15); // Jun 15, 2025
    expect(calendarAge(dob, ref)).toBe(25);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 20 — DOB validation
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 20 — validateDOB', () => {
  it('rejects empty string', () => {
    expect(validateDOB('')).not.toBeNull();
  });

  it('rejects today (age 0)', () => {
    const error = validateDOB(relativeDate(0));
    expect(error).toMatch(/cannot be today|future/i);
  });

  it('rejects tomorrow (future date)', () => {
    const error = validateDOB(relativeDate(1));
    expect(error).toMatch(/cannot be today|future/i);
  });

  it('rejects a date that produces age < 18 (yesterday = 1 day old)', () => {
    const error = validateDOB(relativeDate(-1));
    expect(error).toMatch(/at least 18/i);
  });

  it('rejects a person who turns 18 tomorrow (age = 17)', () => {
    // 18 years old tomorrow means DOB = today - 18 years + 1 day
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    d.setDate(d.getDate() + 1); // birthday is tomorrow
    const dobStr = d.toISOString().split('T')[0];
    const error = validateDOB(dobStr);
    expect(error).toMatch(/at least 18/i);
  });

  it('accepts a person born exactly 18 years ago today', () => {
    expect(validateDOB(dobExactlyAged(18))).toBeNull();
  });

  it('accepts a person aged 30', () => {
    expect(validateDOB(dobExactlyAged(30))).toBeNull();
  });

  it('accepts a person aged exactly 70', () => {
    expect(validateDOB(dobExactlyAged(70))).toBeNull();
  });

  it('rejects a person aged > 70 (BUSINESS_DECISION: confirm max age)', () => {
    // This test asserts the current implementation which uses 70 as max.
    // Update if the business confirms a different limit.
    const error = validateDOB(dobExactlyAged(71));
    expect(error).toMatch(/maximum of 70/i);
  });

  it('rejects an invalid calendar date (Feb 30)', () => {
    expect(validateDOB('2000-02-30')).not.toBeNull();
  });
});

describe('Bug 20 — personal step DOB validation via validateFormStep', () => {
  it('rejects today as DOB', () => {
    const errors = validateFormStep('personal', base({ dateOfBirth: relativeDate(0) }));
    expect(errors.dateOfBirth).toBeTruthy();
  });

  it('rejects a future date as DOB', () => {
    const errors = validateFormStep('personal', base({ dateOfBirth: relativeDate(10) }));
    expect(errors.dateOfBirth).toBeTruthy();
  });

  it('rejects DOB that makes applicant under 18', () => {
    const errors = validateFormStep('personal', base({ dateOfBirth: dobExactlyAged(17) }));
    expect(errors.dateOfBirth).toMatch(/at least 18/i);
  });

  it('accepts DOB that makes applicant exactly 18', () => {
    const errors = validateFormStep('personal', base({ dateOfBirth: dobExactlyAged(18) }));
    expect(errors.dateOfBirth).toBeUndefined();
  });

  it('accepts DOB for a 45-year-old', () => {
    const errors = validateFormStep('personal', base({ dateOfBirth: dobExactlyAged(45) }));
    expect(errors.dateOfBirth).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 16 — Personal details character validation
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 16 — Personal details character validation', () => {
  describe('firstName', () => {
    it('rejects empty firstName', () => {
      const errors = validateFormStep('personal', base({ firstName: '' }));
      expect(errors.firstName).toBeTruthy();
    });

    it('rejects firstName with digits ("Priya1")', () => {
      const errors = validateFormStep('personal', base({ firstName: 'Priya1' }));
      expect(errors.firstName).toBeTruthy();
    });

    it('rejects firstName with special chars ("Priya@")', () => {
      const errors = validateFormStep('personal', base({ firstName: 'Priya@' }));
      expect(errors.firstName).toBeTruthy();
    });

    it('accepts plain Indian name ("Priya")', () => {
      const errors = validateFormStep('personal', base({ firstName: 'Priya' }));
      expect(errors.firstName).toBeUndefined();
    });

    it('accepts hyphenated name ("Singh-Patel")', () => {
      const errors = validateFormStep('personal', base({ firstName: 'Singh-Patel' }));
      expect(errors.firstName).toBeUndefined();
    });

    it("accepts name with apostrophe (\"O'Brien\")", () => {
      const errors = validateFormStep('personal', base({ firstName: "O'Brien" }));
      expect(errors.firstName).toBeUndefined();
    });

    it('accepts name with period initial ("K.")', () => {
      const errors = validateFormStep('personal', base({ firstName: 'K.' }));
      expect(errors.firstName).toBeUndefined();
    });

    it('accepts Devanagari name ("राम")', () => {
      const errors = validateFormStep('personal', base({ firstName: 'राम' }));
      expect(errors.firstName).toBeUndefined();
    });
  });

  describe('middleName (optional)', () => {
    it('accepts empty middleName', () => {
      const errors = validateFormStep('personal', base({ middleName: '' }));
      expect(errors.middleName).toBeUndefined();
    });

    it('rejects middleName with digit', () => {
      const errors = validateFormStep('personal', base({ middleName: 'Kumar2' }));
      expect(errors.middleName).toBeTruthy();
    });

    it('accepts valid middleName ("Kumar")', () => {
      const errors = validateFormStep('personal', base({ middleName: 'Kumar' }));
      expect(errors.middleName).toBeUndefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 17 — Address and city character validation
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 17 — Address and city validation', () => {
  describe('city', () => {
    it('rejects city with digits ("Mumbai1")', () => {
      const errors = validateFormStep('address', base({ address: { ...base().address, city: 'Mumbai1' } }));
      expect(errors.city).toBeTruthy();
    });

    it('rejects city with special chars ("Mumbai@")', () => {
      const errors = validateFormStep('address', base({ address: { ...base().address, city: 'Mumbai@' } }));
      expect(errors.city).toBeTruthy();
    });

    it('accepts plain city ("Mumbai")', () => {
      const errors = validateFormStep('address', base({ address: { ...base().address, city: 'Mumbai' } }));
      expect(errors.city).toBeUndefined();
    });

    it('accepts hyphenated city name', () => {
      const errors = validateFormStep('address', base({ address: { ...base().address, city: 'Daman-Diu' } }));
      expect(errors.city).toBeUndefined();
    });

    it('accepts city with ampersand ("Daman & Diu")', () => {
      const errors = validateFormStep('address', base({ address: { ...base().address, city: 'Daman & Diu' } }));
      expect(errors.city).toBeUndefined();
    });
  });

  describe('street', () => {
    it('rejects empty street', () => {
      const errors = validateFormStep('address', base({ address: { ...base().address, street: '' } }));
      expect(errors.street).toBeTruthy();
    });

    it('accepts typical Indian street address ("Flat #401, Sector 5/B")', () => {
      const errors = validateFormStep('address', base({ address: { ...base().address, street: 'Flat #401, Sector 5/B' } }));
      expect(errors.street).toBeUndefined();
    });

    it('accepts address with comma and hyphen ("No. 5-6, 2nd Cross")', () => {
      const errors = validateFormStep('address', base({ address: { ...base().address, street: 'No. 5-6, 2nd Cross' } }));
      expect(errors.street).toBeUndefined();
    });

    it('rejects address with SQL injection chars (";--")', () => {
      const errors = validateFormStep('address', base({ address: { ...base().address, street: "1 MG Road; DROP TABLE" } }));
      expect(errors.street).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 18 — PAN format validation
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 18 — PAN format validation', () => {
  it('accepts valid PAN ("ABCDE1234F")', () => {
    const errors = validateFormStep('documents', base({ panNumber: 'ABCDE1234F' }));
    expect(errors.panNumber).toBeUndefined();
  });

  it('rejects PAN with length != 10 ("ABCDE123")', () => {
    const errors = validateFormStep('documents', base({ panNumber: 'ABCDE123' }));
    expect(errors.panNumber).toBeTruthy();
  });

  it('rejects PAN with wrong structure — 4 letters then digits ("ABCD12345F")', () => {
    const errors = validateFormStep('documents', base({ panNumber: 'ABCD12345F' }));
    expect(errors.panNumber).toBeTruthy();
  });

  it('rejects PAN with special characters ("ABCDE12#4F")', () => {
    const errors = validateFormStep('documents', base({ panNumber: 'ABCDE12#4F' }));
    expect(errors.panNumber).toBeTruthy();
  });

  it('rejects lowercase PAN ("abcde1234f")', () => {
    const errors = validateFormStep('documents', base({ panNumber: 'abcde1234f' }));
    expect(errors.panNumber).toBeTruthy();
  });

  it('rejects PAN ending in digit ("ABCDE12341")', () => {
    const errors = validateFormStep('documents', base({ panNumber: 'ABCDE12341' }));
    expect(errors.panNumber).toBeTruthy();
  });

  it('rejects empty PAN', () => {
    const errors = validateFormStep('documents', base({ panNumber: '' }));
    expect(errors.panNumber).toBeTruthy();
  });

  it('accepts another valid PAN format ("PQRST9876Z")', () => {
    const errors = validateFormStep('documents', base({ panNumber: 'PQRST9876Z' }));
    expect(errors.panNumber).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 19 — Collateral address validation
// ─────────────────────────────────────────────────────────────────────────────
function securedBase(overrides: Partial<ApplicationFormData> = {}): ApplicationFormData {
  return base({
    loanType: 'secured',
    collateral: {
      propertyType: 'residential',
      estimatedValue: 2000000,
      ownershipStatus: 'self-owned',
      propertyAddress: '12, MG Road, Mumbai',
    },
    ...overrides,
  });
}

describe('Bug 19 — Collateral address validation', () => {
  it('accepts a valid collateral address', () => {
    const errors = validateFormStep('financial', securedBase());
    expect(errors.propertyAddress).toBeUndefined();
  });

  it('rejects empty collateral address', () => {
    const errors = validateFormStep('financial', securedBase({
      collateral: { ...securedBase().collateral!, propertyAddress: '' },
    }));
    expect(errors.propertyAddress).toBeTruthy();
  });

  it('rejects an address exceeding 500 characters', () => {
    const longAddress = 'A'.repeat(501);
    const errors = validateFormStep('financial', securedBase({
      collateral: { ...securedBase().collateral!, propertyAddress: longAddress },
    }));
    expect(errors.propertyAddress).toMatch(/500/);
  });

  it('accepts an address exactly 500 characters long', () => {
    const address500 = 'A'.repeat(500);
    const errors = validateFormStep('financial', securedBase({
      collateral: { ...securedBase().collateral!, propertyAddress: address500 },
    }));
    expect(errors.propertyAddress).toBeUndefined();
  });

  it('rejects address with SQL injection characters', () => {
    const errors = validateFormStep('financial', securedBase({
      collateral: { ...securedBase().collateral!, propertyAddress: '12 MG Road; DROP TABLE' },
    }));
    expect(errors.propertyAddress).toBeTruthy();
  });

  it('accepts address with typical formatting chars ("Flat #5, Sector 3/B")', () => {
    const errors = validateFormStep('financial', securedBase({
      collateral: { ...securedBase().collateral!, propertyAddress: 'Flat #5, Sector 3/B, Pune' },
    }));
    expect(errors.propertyAddress).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 healthy path — full valid submission has no errors
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 2 healthy path', () => {
  it('personal step: no errors for a valid 30-year-old with standard Indian name', () => {
    const errors = validateFormStep('personal', base());
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('address step: no errors for a standard Indian address', () => {
    const errors = validateFormStep('address', base({
      address: { street: '12, MG Road, Andheri', city: 'Mumbai', state: 'maharashtra', pincode: '400001' },
    }));
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('documents step: no errors for a valid PAN and Aadhaar', () => {
    const errors = validateFormStep('documents', base());
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('financial step (secured): no errors for a fully valid secured loan form', () => {
    const errors = validateFormStep('financial', securedBase());
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
