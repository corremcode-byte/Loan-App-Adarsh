/**
 * UAT validation tests — covers three UAT-reported issues:
 *   1. GSTIN format and checksum validation (gstinValidation.ts)
 *   2. Email format validation (formValidation.ts + API routes)
 *   3. existingLoans[].outstandingAmount maximum ₹500 crore
 *      (formValidation.ts + both API routes)
 */

// ── Module mocks (hoisted) ────────────────────────────────────────────────────

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));

jest.mock('@/models/Application', () => ({
  __esModule: true,
  default: { create: jest.fn(), find: jest.fn() },
}));

jest.mock('@/lib/eligibility', () => ({
  __esModule: true,
  calculateEligibility: jest.fn().mockReturnValue({
    score: 80,
    status: 'likely_approved',
    reasons: [],
    recommendations: [],
  }),
}));

jest.mock('@/lib/emi', () => ({
  __esModule: true,
  calculateEMI: jest.fn().mockReturnValue({ emi: 11122, totalPayment: 0, totalInterest: 0 }),
  toMonthlyEMI: jest.fn().mockReturnValue(0),
  formatCurrency: jest.fn().mockReturnValue(''),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import Application from '@/models/Application';
import { validateGSTIN } from '../lib/gstinValidation';
import { validateFormStep, MAX_OUTSTANDING_AMOUNT, EMPLOYER_NAME_MAX_LENGTH } from '../lib/formValidation';
import { POST as postApplications } from '../app/api/applications/route';
import { POST as postEligibility } from '../app/api/eligibility/route';
import { ApplicationFormData } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function dobForAge(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split('T')[0];
}

/** Minimal fully-valid API payload. */
function minValidPayload(): Record<string, unknown> {
  return {
    loanType: 'unsecured',
    loanAmount: 500_000,
    monthlyIncome: 100_000,
    preferredTenure: 60,
    dateOfBirth: '1990-06-15',
    occupation: 'salaried',
    employerName: 'Acme Corp',
    yearsOfExperience: 5,
    cibilScore: 750,
    hasExistingLoans: 'no',
    existingLoans: [],
    firstName: 'Test',
    middleName: '',
    lastName: 'User',
    gender: 'male',
    maritalStatus: 'single',
    email: 'test@example.com',
    address: { street: '1 MG Road', city: 'Mumbai', state: 'maharashtra', pincode: '400001' },
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '123456789012',
    isPhoneVerified: true,
    phoneNumber: '9999999999',
    loanPurpose: 'home-renovation',
    interestRate: 12,
    expectedEMI: 11122,
  };
}

/** Minimal fully-valid ApplicationFormData for formValidation tests. */
function baseForm(overrides: Partial<ApplicationFormData> = {}): ApplicationFormData {
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
    monthlyIncome: 100_000,
    yearsOfExperience: 5,
    hasExistingLoans: 'no',
    existingLoans: [],
    loanAmount: 500_000,
    loanPurpose: 'home-renovation',
    preferredTenure: 60,
    interestRate: 12,
    expectedEMI: 11122,
    cibilScore: 750,
    ...overrides,
  };
}

function withLoan(outstandingAmount: unknown): Record<string, unknown> {
  return {
    ...minValidPayload(),
    hasExistingLoans: 'yes',
    existingLoans: [{ loanType: 'car-loan', outstandingAmount, emi: 3000, tenure: 'monthly' }],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (Application.create as jest.Mock).mockResolvedValue({ _id: 'mock-id', ...minValidPayload() });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. GSTIN Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('validateGSTIN — valid GSTINs', () => {
  it('accepts 27AAPFU0939F1ZV (real-world example, verified checksum)', () => {
    expect(validateGSTIN('27AAPFU0939F1ZV')).toBeNull();
  });

  it('accepts 22AAAAA0000A1ZC (computed checksum C)', () => {
    expect(validateGSTIN('22AAAAA0000A1ZC')).toBeNull();
  });

  it('accepts 99AAAAA0000A1ZR (state code 99 — NRI taxpayer)', () => {
    expect(validateGSTIN('99AAAAA0000A1ZR')).toBeNull();
  });

  it('accepts 38AAAAA0000A1ZZ (state code 38 — Ladakh)', () => {
    expect(validateGSTIN('38AAAAA0000A1ZZ')).toBeNull();
  });

  it('normalises lowercase input to uppercase before validating', () => {
    expect(validateGSTIN('27aapfu0939f1zv')).toBeNull();
  });
});

describe('validateGSTIN — invalid length', () => {
  it('rejects a 14-character string', () => {
    const err = validateGSTIN('22AAAAA0000A1Z');
    expect(err).toBeTruthy();
    expect(err).toMatch(/15 characters/i);
  });

  it('rejects a 16-character string', () => {
    const err = validateGSTIN('22AAAAA0000A1ZC1');
    expect(err).toBeTruthy();
    expect(err).toMatch(/15 characters/i);
  });

  it('rejects an empty string', () => {
    expect(validateGSTIN('')).toBeTruthy();
  });
});

describe('validateGSTIN — invalid state code', () => {
  it('rejects state code 00', () => {
    const err = validateGSTIN('00AAAAA0000A1ZX');
    expect(err).toBeTruthy();
    expect(err).toMatch(/state code/i);
  });

  it('rejects state code 39 (above valid range)', () => {
    const err = validateGSTIN('39AAAAA0000A1ZX');
    expect(err).toBeTruthy();
    expect(err).toMatch(/state code/i);
  });

  it('rejects state code 50 (above valid range)', () => {
    const err = validateGSTIN('50AAAAA0000A1ZX');
    expect(err).toBeTruthy();
    expect(err).toMatch(/state code/i);
  });

  it('accepts state code 01 (Jammu & Kashmir)', () => {
    // Compute valid checksum for 01AAAAA0000A1Z:
    // sum: i=0:'0'→0,f1=0; i=1:'1'→1,f2=2; rest same as 22 from i=2 onward
    // 22AAAAA0000A1Z sum=132; for 01: i=0 gives 0 (was 2 for '2') → -2; i=1 gives 2 (was 4) → -2; total=132-4=128
    // checksum=(36-128%36)%36=(36-128+3*36)%36=(36-(128-108))%36=(36-20)%36=16=CHARSET[16]='G'
    expect(validateGSTIN('01AAAAA0000A1ZG')).toBeNull();
  });
});

describe('validateGSTIN — invalid PAN structure', () => {
  it('rejects when PAN portion has digits where letters are expected', () => {
    // 22 1AAAA0000A1ZX — first PAN char is digit
    const err = validateGSTIN('221AAAA0000A1ZX');
    expect(err).toBeTruthy();
    expect(err).toMatch(/PAN/i);
  });

  it('rejects when PAN portion has only 4 letters instead of 5', () => {
    // 22AAAA00000A1ZX — 4 letters + 5 digits + 1 letter = invalid
    const err = validateGSTIN('22AAAA00000A1ZX');
    expect(err).toBeTruthy();
  });
});

describe('validateGSTIN — invalid entity number', () => {
  it('rejects entity number 0 (position 13)', () => {
    const err = validateGSTIN('22AAAAA0000A0ZX');
    expect(err).toBeTruthy();
    expect(err).toMatch(/entity number/i);
  });
});

describe('validateGSTIN — position 14 not Z', () => {
  it("rejects when position 14 is 'A' instead of 'Z'", () => {
    const err = validateGSTIN('22AAAAA0000A1AC');
    expect(err).toBeTruthy();
    expect(err).toMatch(/position 14/i);
  });
});

describe('validateGSTIN — invalid checksum', () => {
  it("rejects 22AAAAA0000A1Z5 (placeholder example — checksum '5' should be 'C')", () => {
    const err = validateGSTIN('22AAAAA0000A1Z5');
    expect(err).toBeTruthy();
    expect(err).toMatch(/checksum/i);
  });

  it('rejects 27AAPFU0939F1ZX (valid format but wrong checksum, should be V)', () => {
    const err = validateGSTIN('27AAPFU0939F1ZX');
    expect(err).toBeTruthy();
    expect(err).toMatch(/checksum/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Email Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('email validation — formValidation.ts (personal step)', () => {
  describe('UAT failing examples — must be rejected', () => {
    it('rejects AAAAAAAAAAAAAAAAAAAAAAA***@BJJ.com (asterisks in local part)', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'AAAAAAAAAAAAAAAAAAAAAAA***@BJJ.com' }));
      expect(errors.email).toBeTruthy();
    });

    it('rejects Adfghjfdrertyuiouytfha%$#@#$%^&.com (special chars in local part and domain)', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'Adfghjfdrertyuiouytfha%$#@#$%^&.com' }));
      expect(errors.email).toBeTruthy();
    });
  });

  describe('legitimate formats — must be accepted', () => {
    it('accepts test@example.com', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'test@example.com' }));
      expect(errors.email).toBeUndefined();
    });

    it('accepts user.name+tag@domain.co.in (plus-addressing, subdomain TLD)', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'user.name+tag@domain.co.in' }));
      expect(errors.email).toBeUndefined();
    });

    it('accepts john_doe@company.org (underscore)', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'john_doe@company.org' }));
      expect(errors.email).toBeUndefined();
    });

    it('accepts user@mail.company.co.uk (subdomain)', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'user@mail.company.co.uk' }));
      expect(errors.email).toBeUndefined();
    });

    it('accepts a@b.io (minimal valid address)', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'a@b.io' }));
      expect(errors.email).toBeUndefined();
    });

    it('accepts firstname.lastname@example.com', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'firstname.lastname@example.com' }));
      expect(errors.email).toBeUndefined();
    });
  });

  describe('malformed addresses — must be rejected', () => {
    it('rejects address with no @', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'notanemail' }));
      expect(errors.email).toBeTruthy();
    });

    it('rejects address with empty local part', () => {
      const errors = validateFormStep('personal', baseForm({ email: '@domain.com' }));
      expect(errors.email).toBeTruthy();
    });

    it('rejects address with no domain after @', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'user@' }));
      expect(errors.email).toBeTruthy();
    });

    it('rejects address with no TLD', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'user@domain' }));
      expect(errors.email).toBeTruthy();
    });

    it('rejects address with special characters in domain', () => {
      const errors = validateFormStep('personal', baseForm({ email: 'user@domain!.com' }));
      expect(errors.email).toBeTruthy();
    });

    it('rejects empty string (required field)', () => {
      const errors = validateFormStep('personal', baseForm({ email: '' }));
      expect(errors.email).toBeTruthy();
    });
  });
});

describe('email validation — POST /api/applications', () => {
  it('rejects AAAAAAAAAAAAAAAAAAAAAAA***@BJJ.com', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), email: 'AAAAAAAAAAAAAAAAAAAAAAA***@BJJ.com' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  it('rejects Adfghjfdrertyuiouytfha%$#@#$%^&.com', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), email: 'Adfghjfdrertyuiouytfha%$#@#$%^&.com' }));
    expect(res.status).toBe(400);
  });

  it('accepts valid email test@example.com', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), email: 'test@example.com' }));
    expect(res.status).toBe(200);
  });

  it('accepts plus-addressed email user+tag@example.com', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), email: 'user+tag@example.com' }));
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Outstanding Loan Amount Maximum (₹500 crore)
// ─────────────────────────────────────────────────────────────────────────────

describe('MAX_OUTSTANDING_AMOUNT constant', () => {
  it('equals 5,000,000,000 (₹500 crore)', () => {
    expect(MAX_OUTSTANDING_AMOUNT).toBe(5_00_00_00_000);
  });
});

describe('outstandingAmount — formValidation.ts (financial step)', () => {
  const withLoans = (outstandingAmount: number) =>
    baseForm({
      hasExistingLoans: 'yes',
      existingLoans: [{ loanType: 'car-loan', outstandingAmount, emi: 3000, tenure: 'monthly' }],
    });

  it('accepts outstandingAmount = 0', () => {
    const errors = validateFormStep('financial', withLoans(0));
    expect(errors.outstandingAmount_0).toBeUndefined();
  });

  it('accepts outstandingAmount = 100,000', () => {
    const errors = validateFormStep('financial', withLoans(100_000));
    expect(errors.outstandingAmount_0).toBeUndefined();
  });

  it('accepts outstandingAmount = 2,000,000 (₹20 lakh — normal home loan remainder)', () => {
    const errors = validateFormStep('financial', withLoans(2_000_000));
    expect(errors.outstandingAmount_0).toBeUndefined();
  });

  it('accepts outstandingAmount = ₹500 crore exactly (at limit)', () => {
    const errors = validateFormStep('financial', withLoans(5_00_00_00_000));
    expect(errors.outstandingAmount_0).toBeUndefined();
  });

  it('rejects outstandingAmount = ₹500 crore + 1 rupee', () => {
    const errors = validateFormStep('financial', withLoans(5_00_00_00_001));
    expect(errors.outstandingAmount_0).toBeTruthy();
    expect(errors.outstandingAmount_0).toMatch(/500 Crore/i);
  });

  it('rejects outstandingAmount = ₹1 trillion', () => {
    const errors = validateFormStep('financial', withLoans(1_000_000_000_000));
    expect(errors.outstandingAmount_0).toBeTruthy();
  });

  it('validates all loans in the array independently', () => {
    const data = baseForm({
      hasExistingLoans: 'yes',
      existingLoans: [
        { loanType: 'car-loan', outstandingAmount: 100_000, emi: 3000, tenure: 'monthly' },
        { loanType: 'home-loan', outstandingAmount: 5_00_00_00_001, emi: 50000, tenure: 'monthly' },
      ],
    });
    const errors = validateFormStep('financial', data);
    expect(errors.outstandingAmount_0).toBeUndefined();
    expect(errors.outstandingAmount_1).toBeTruthy();
  });

  it('no outstandingAmount error when existingLoans is empty', () => {
    const errors = validateFormStep('financial', baseForm({ hasExistingLoans: 'no', existingLoans: [] }));
    expect(Object.keys(errors).filter(k => k.startsWith('outstandingAmount_'))).toHaveLength(0);
  });
});

describe('outstandingAmount — POST /api/applications', () => {
  it('accepts outstandingAmount = 0', async () => {
    const res = await postApplications(makeRequest(withLoan(0)));
    expect(res.status).toBe(200);
  });

  it('accepts outstandingAmount = ₹500 crore exactly (at limit)', async () => {
    const res = await postApplications(makeRequest(withLoan(5_00_00_00_000)));
    expect(res.status).toBe(200);
  });

  it('rejects outstandingAmount = ₹500 crore + 1', async () => {
    const res = await postApplications(makeRequest(withLoan(5_00_00_00_001)));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/500 Crore/i);
  });

  it('rejects outstandingAmount = negative (pre-existing guard)', async () => {
    const res = await postApplications(makeRequest(withLoan(-1)));
    expect(res.status).toBe(400);
  });

  it('rejects outstandingAmount = null (NaN coercion guard)', async () => {
    const res = await postApplications(makeRequest(withLoan(null)));
    expect(res.status).toBe(400);
  });

  it('rejects outstandingAmount = Infinity serialised as null', async () => {
    // JSON.stringify(Infinity) = 'null'
    const res = await postApplications(makeRequest(withLoan(null)));
    expect(res.status).toBe(400);
  });
});

describe('outstandingAmount — POST /api/eligibility', () => {
  it('accepts outstandingAmount = ₹500 crore exactly', async () => {
    const res = await postEligibility(makeRequest(withLoan(5_00_00_00_000)));
    expect(res.status).toBe(200);
  });

  it('rejects outstandingAmount = ₹500 crore + 1', async () => {
    const res = await postEligibility(makeRequest(withLoan(5_00_00_00_001)));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/500 Crore/i);
  });

  it('rejects negative outstandingAmount', async () => {
    const res = await postEligibility(makeRequest(withLoan(-1)));
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Employer Name / Business Name length validation
// ─────────────────────────────────────────────────────────────────────────────

describe('EMPLOYER_NAME_MAX_LENGTH constant', () => {
  it('equals 50', () => {
    expect(EMPLOYER_NAME_MAX_LENGTH).toBe(50);
  });
});

describe('employerName — formValidation.ts (financial step)', () => {
  it('accepts exactly 50 characters', () => {
    const errors = validateFormStep('financial', baseForm({ employerName: 'A'.repeat(50) }));
    expect(errors.employerName).toBeUndefined();
  });

  it('rejects 51 characters', () => {
    const errors = validateFormStep('financial', baseForm({ employerName: 'A'.repeat(51) }));
    expect(errors.employerName).toBeTruthy();
    expect(errors.employerName).toMatch(/50 characters/i);
  });

  it('rejects empty string (required)', () => {
    const errors = validateFormStep('financial', baseForm({ employerName: '' }));
    expect(errors.employerName).toBeTruthy();
  });

  it('accepts short valid name', () => {
    const errors = validateFormStep('financial', baseForm({ employerName: 'Acme Corp' }));
    expect(errors.employerName).toBeUndefined();
  });

  it('accepts business name with punctuation (AT&T India Pvt. Ltd.)', () => {
    const errors = validateFormStep('financial', baseForm({ employerName: 'AT&T India Pvt. Ltd.' }));
    expect(errors.employerName).toBeUndefined();
  });

  it('accepts business name with Unicode (Bhārat Forge Ltd.)', () => {
    const errors = validateFormStep('financial', baseForm({ employerName: 'Bhārat Forge Ltd.' }));
    expect(errors.employerName).toBeUndefined();
  });

  it('accepts name with slash (M/s. ABC Enterprises)', () => {
    const errors = validateFormStep('financial', baseForm({ employerName: 'M/s. ABC Enterprises' }));
    expect(errors.employerName).toBeUndefined();
  });

  it('accepts name with apostrophe (O\'Brien & Sons)', () => {
    const errors = validateFormStep('financial', baseForm({ employerName: "O'Brien & Sons" }));
    expect(errors.employerName).toBeUndefined();
  });

  it('raw length 50 with leading/trailing spaces rejected (raw length exceeds 50)', () => {
    // '  ' + 48 'A's + '  ' = 52 chars raw → rejected
    const errors = validateFormStep('financial', baseForm({ employerName: '  ' + 'A'.repeat(48) + '  ' }));
    expect(errors.employerName).toBeTruthy();
  });

  it('raw string of exactly 50 chars that includes spaces is accepted', () => {
    // 'AT&T ' repeated = 5 chars × 10 = 50 chars raw
    const errors = validateFormStep('financial', baseForm({ employerName: 'AT&T '.repeat(10) }));
    expect(errors.employerName).toBeUndefined();
  });

  it('whitespace-only employerName is rejected (required check via trim)', () => {
    const errors = validateFormStep('financial', baseForm({ employerName: '     ' }));
    expect(errors.employerName).toBeTruthy();
  });
});

describe('employerName — POST /api/applications', () => {
  it('accepts exactly 50 characters', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), employerName: 'A'.repeat(50) }));
    expect(res.status).toBe(200);
  });

  it('rejects 51 characters with 400', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), employerName: 'A'.repeat(51) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/50 characters/i);
  });

  it('rejects empty employerName with 400', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), employerName: '' }));
    expect(res.status).toBe(400);
  });

  it('accepts business name with punctuation', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), employerName: 'AT&T India Pvt. Ltd.' }));
    expect(res.status).toBe(200);
  });

  it('rejects raw length >50 even when non-space chars ≤50 (surrounding spaces count)', async () => {
    // '  ' + 'A'.repeat(50) + '  ' = 54 chars raw → rejected
    const res = await postApplications(makeRequest({ ...minValidPayload(), employerName: '  ' + 'A'.repeat(50) + '  ' }));
    expect(res.status).toBe(400);
  });
});

describe('employerName — POST /api/eligibility', () => {
  it('accepts exactly 50 characters', async () => {
    const res = await postEligibility(makeRequest({ ...minValidPayload(), employerName: 'A'.repeat(50) }));
    expect(res.status).toBe(200);
  });

  it('rejects 51 characters with 400', async () => {
    const res = await postEligibility(makeRequest({ ...minValidPayload(), employerName: 'A'.repeat(51) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/50 characters/i);
  });

  it('accepts short valid name', async () => {
    const res = await postEligibility(makeRequest({ ...minValidPayload(), employerName: 'Acme Corp' }));
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Regression: existing validation still works
// ─────────────────────────────────────────────────────────────────────────────

describe('regression — existing validations unaffected', () => {
  it('valid personal step passes (email, name, DOB all valid)', () => {
    const errors = validateFormStep('personal', baseForm());
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('valid financial step passes (no existing loans)', () => {
    const errors = validateFormStep('financial', baseForm());
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('valid loan-details step passes', () => {
    const errors = validateFormStep('loan-details', baseForm());
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('POST /api/applications accepts a fully-valid payload', async () => {
    const res = await postApplications(makeRequest(minValidPayload()));
    expect(res.status).toBe(200);
  });

  it('POST /api/eligibility accepts a fully-valid payload', async () => {
    const res = await postEligibility(makeRequest(minValidPayload()));
    expect(res.status).toBe(200);
  });

  it('existing outstandingAmount negative guard still fires', async () => {
    const res = await postApplications(makeRequest(withLoan(-100)));
    expect(res.status).toBe(400);
  });

  it('EMI amount field unchanged — no outstandingAmount error on EMI value', () => {
    const errors = validateFormStep('financial', baseForm({
      hasExistingLoans: 'yes',
      existingLoans: [{ loanType: 'car-loan', outstandingAmount: 100_000, emi: 3000, tenure: 'monthly' }],
    }));
    // No error key for EMI
    expect(errors.emi_0).toBeUndefined();
    expect(errors.outstandingAmount_0).toBeUndefined();
  });
});
