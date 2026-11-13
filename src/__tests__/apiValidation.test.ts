/**
 * API validation tests — covers numeric guards added in the LOS validation fixes:
 *   - loanAmount: type, finite, non-negative, max ₹100 Crore
 *   - monthlyIncome: type, finite, positive, max ₹5 Crore
 *   - existingLoans[].outstandingAmount: type, finite, non-negative
 *   - expectedEMI: negative reset-to-0 (not rejected)
 *   - preferredTenure: positive (eligibility route)
 *
 * Also covers:
 *   - formValidation: name maxLength (25), address maxLength (150),
 *     collateral address maxLength (150), loan amount max, monthly income max
 *   - Numeric input safety: values that would result from silent coercions
 *     (e.g. parseInt("1e9") === 1) are caught by the validation rules
 */

// ── Module mocks (hoisted before imports) ────────────────────────────────────

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));

jest.mock('@/models/Application', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('@/lib/eligibility', () => ({
  __esModule: true,
  calculateEligibility: jest.fn().mockReturnValue({
    score: 80,
    status: 'likely_approved',
    reasons: ['Good score'],
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
import { POST as postApplications } from '../app/api/applications/route';
import { POST as postEligibility } from '../app/api/eligibility/route';
import { validateFormStep } from '../lib/formValidation';
import { ApplicationFormData } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Minimal fully-valid payload that passes all existing + new guards. */
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

/** Returns an ISO YYYY-MM-DD date string for someone exactly `ageYears` old. */
function dobForAge(ageYears: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - ageYears);
  return d.toISOString().split('T')[0];
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

beforeEach(() => {
  jest.clearAllMocks();
  (Application.create as jest.Mock).mockResolvedValue({ _id: 'mock-id', ...minValidPayload() });
});

// ── POST /api/applications — loanAmount ──────────────────────────────────────

describe('POST /api/applications — loanAmount guards', () => {
  it('rejects loanAmount as null (Infinity/NaN serialise to null in JSON)', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), loanAmount: null }));
    expect(res.status).toBe(400);
  });

  it('rejects loanAmount = -1', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), loanAmount: -1 }));
    expect(res.status).toBe(400);
  });

  it('rejects loanAmount = 0 (old code had falsy-bypass; new guard catches it)', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), loanAmount: 0 }));
    expect(res.status).toBe(400);
  });

  it('rejects loanAmount as string "500000"', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), loanAmount: '500000' }));
    expect(res.status).toBe(400);
  });

  it('rejects loanAmount > ₹100 Crore', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), loanAmount: 1_00_00_00_001 }));
    expect(res.status).toBe(400);
  });

  it('accepts loanAmount = ₹100 Crore exactly (at limit)', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), loanAmount: 1_00_00_00_000 }));
    expect(res.status).toBe(200);
  });

  it('accepts loanAmount = ₹500,000 (well within limit)', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), loanAmount: 500_000 }));
    expect(res.status).toBe(200);
  });
});

// ── POST /api/applications — monthlyIncome ────────────────────────────────────

describe('POST /api/applications — monthlyIncome guards', () => {
  it('rejects monthlyIncome as null', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), monthlyIncome: null }));
    expect(res.status).toBe(400);
  });

  it('rejects monthlyIncome = 0 (would cause division by zero in eligibility)', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), monthlyIncome: 0 }));
    expect(res.status).toBe(400);
  });

  it('rejects monthlyIncome = -1', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), monthlyIncome: -1 }));
    expect(res.status).toBe(400);
  });

  it('rejects monthlyIncome > ₹5 Crore', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), monthlyIncome: 5_00_00_001 }));
    expect(res.status).toBe(400);
  });

  it('accepts monthlyIncome = ₹5 Crore exactly (at limit)', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), monthlyIncome: 5_00_00_000 }));
    expect(res.status).toBe(200);
  });

  it('accepts monthlyIncome = ₹100,000', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), monthlyIncome: 100_000 }));
    expect(res.status).toBe(200);
  });
});

// ── POST /api/applications — existingLoans outstandingAmount ──────────────────

describe('POST /api/applications — existingLoans outstandingAmount guard', () => {
  const withLoan = (outstandingAmount: unknown) => ({
    ...minValidPayload(),
    hasExistingLoans: 'yes',
    existingLoans: [{ loanType: 'car-loan', outstandingAmount, emi: 3000, tenure: 'monthly' }],
  });

  it('rejects negative outstandingAmount (can game analyzeDebtLoad score)', async () => {
    const res = await postApplications(makeRequest(withLoan(-1)));
    expect(res.status).toBe(400);
  });

  it('rejects null outstandingAmount', async () => {
    const res = await postApplications(makeRequest(withLoan(null)));
    expect(res.status).toBe(400);
  });

  it('rejects non-array existingLoans', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), existingLoans: 'invalid' }));
    expect(res.status).toBe(400);
  });

  it('rejects null entry in existingLoans array', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), existingLoans: [null] }));
    expect(res.status).toBe(400);
  });

  it('accepts outstandingAmount = 0', async () => {
    const res = await postApplications(makeRequest(withLoan(0)));
    expect(res.status).toBe(200);
  });

  it('accepts outstandingAmount = 100000', async () => {
    const res = await postApplications(makeRequest(withLoan(100_000)));
    expect(res.status).toBe(200);
  });
});

// ── POST /api/applications — expectedEMI normalisation ───────────────────────

describe('POST /api/applications — expectedEMI normalisation', () => {
  it('negative expectedEMI is reset to 0 and does not cause 400 (recalculation fires)', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), expectedEMI: -1 }));
    expect(res.status).toBe(200);
  });

  it('positive expectedEMI is accepted unchanged', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), expectedEMI: 11122 }));
    expect(res.status).toBe(200);
  });

  it('null expectedEMI is normalised to 0 and does not cause 400', async () => {
    const res = await postApplications(makeRequest({ ...minValidPayload(), expectedEMI: null }));
    expect(res.status).toBe(200);
  });
});

// ── POST /api/eligibility — numeric guards ────────────────────────────────────

describe('POST /api/eligibility — numeric guards', () => {
  it('rejects loanAmount > ₹100 Crore', async () => {
    const res = await postEligibility(makeRequest({ ...minValidPayload(), loanAmount: 1_00_00_00_001 }));
    expect(res.status).toBe(400);
  });

  it('rejects loanAmount as null', async () => {
    const res = await postEligibility(makeRequest({ ...minValidPayload(), loanAmount: null }));
    expect(res.status).toBe(400);
  });

  it('rejects monthlyIncome > ₹5 Crore', async () => {
    const res = await postEligibility(makeRequest({ ...minValidPayload(), monthlyIncome: 5_00_00_001 }));
    expect(res.status).toBe(400);
  });

  it('rejects monthlyIncome = 0', async () => {
    const res = await postEligibility(makeRequest({ ...minValidPayload(), monthlyIncome: 0 }));
    expect(res.status).toBe(400);
  });

  it('rejects preferredTenure = 0', async () => {
    const res = await postEligibility(makeRequest({ ...minValidPayload(), preferredTenure: 0 }));
    expect(res.status).toBe(400);
  });

  it('rejects negative outstandingAmount in existingLoans', async () => {
    const res = await postEligibility(makeRequest({
      ...minValidPayload(),
      hasExistingLoans: 'yes',
      existingLoans: [{ loanType: 'car-loan', outstandingAmount: -1, emi: 3000, tenure: 'monthly' }],
    }));
    expect(res.status).toBe(400);
  });

  it('accepts valid payload at boundary limits', async () => {
    const res = await postEligibility(makeRequest({
      ...minValidPayload(),
      loanAmount: 1_00_00_00_000,
      monthlyIncome: 5_00_00_000,
    }));
    expect(res.status).toBe(200);
  });
});

// ── formValidation — name maxLength (25 chars) ───────────────────────────────

describe('formValidation — name fields max 25 characters', () => {
  it('rejects firstName longer than 25 chars', () => {
    const errors = validateFormStep('personal', baseForm({ firstName: 'A'.repeat(26) }));
    expect(errors.firstName).toBeTruthy();
  });

  it('accepts firstName at exactly 25 chars', () => {
    const errors = validateFormStep('personal', baseForm({ firstName: 'A'.repeat(25) }));
    expect(errors.firstName).toBeFalsy();
  });

  it('rejects lastName longer than 25 chars', () => {
    const errors = validateFormStep('personal', baseForm({ lastName: 'B'.repeat(26) }));
    expect(errors.lastName).toBeTruthy();
  });

  it('rejects middleName longer than 25 chars', () => {
    const errors = validateFormStep('personal', baseForm({ middleName: 'C'.repeat(26) }));
    expect(errors.middleName).toBeTruthy();
  });

  it('accepts middleName at exactly 25 chars', () => {
    const errors = validateFormStep('personal', baseForm({ middleName: 'C'.repeat(25) }));
    expect(errors.middleName).toBeFalsy();
  });
});

// ── formValidation — address maxLength (150 chars) ───────────────────────────

describe('formValidation — address fields max 150 characters', () => {
  it('rejects street longer than 150 chars', () => {
    const errors = validateFormStep('address', baseForm({
      address: { street: 'A'.repeat(151), city: 'Mumbai', state: 'maharashtra', pincode: '400001' },
    }));
    expect(errors.street).toBeTruthy();
  });

  it('accepts street at exactly 150 chars', () => {
    const errors = validateFormStep('address', baseForm({
      address: { street: 'A'.repeat(150), city: 'Mumbai', state: 'maharashtra', pincode: '400001' },
    }));
    expect(errors.street).toBeFalsy();
  });

  it('rejects city longer than 150 chars', () => {
    const errors = validateFormStep('address', baseForm({
      address: { street: '1 MG Road', city: 'B'.repeat(151), state: 'maharashtra', pincode: '400001' },
    }));
    expect(errors.city).toBeTruthy();
  });

  it('accepts city at exactly 150 chars', () => {
    const errors = validateFormStep('address', baseForm({
      address: { street: '1 MG Road', city: 'B'.repeat(150), state: 'maharashtra', pincode: '400001' },
    }));
    expect(errors.city).toBeFalsy();
  });
});

// ── formValidation — collateral address maxLength (150 chars) ─────────────────

describe('formValidation — collateral property address max 150 characters', () => {
  it('rejects collateral address longer than 150 chars', () => {
    const errors = validateFormStep('financial', baseForm({
      loanType: 'secured',
      collateral: {
        propertyType: 'residential',
        estimatedValue: 200_000,
        ownershipStatus: 'self-owned',
        propertyAddress: 'A'.repeat(151),
      },
    }));
    expect(errors.propertyAddress).toBeTruthy();
  });

  it('accepts collateral address at exactly 150 chars', () => {
    const errors = validateFormStep('financial', baseForm({
      loanType: 'secured',
      collateral: {
        propertyType: 'residential',
        estimatedValue: 200_000,
        ownershipStatus: 'self-owned',
        propertyAddress: 'A'.repeat(150),
      },
    }));
    expect(errors.propertyAddress).toBeFalsy();
  });
});

// ── formValidation — loan amount maximum ─────────────────────────────────────

describe('formValidation — loan amount maximum ₹100 Crore', () => {
  it('rejects loanAmount > ₹100 Crore', () => {
    const errors = validateFormStep('loan-details', baseForm({ loanAmount: 1_00_00_00_001 }));
    expect(errors.loanAmount).toBeTruthy();
  });

  it('accepts loanAmount = ₹100 Crore exactly', () => {
    const errors = validateFormStep('loan-details', baseForm({ loanAmount: 1_00_00_00_000 }));
    expect(errors.loanAmount).toBeFalsy();
  });
});

// ── formValidation — monthly income maximum ──────────────────────────────────

describe('formValidation — monthly income maximum ₹5 Crore', () => {
  it('rejects monthlyIncome > ₹5 Crore for salaried', () => {
    const errors = validateFormStep('financial', baseForm({ monthlyIncome: 5_00_00_001 }));
    expect(errors.monthlyIncome).toBeTruthy();
  });

  it('accepts monthlyIncome = ₹5 Crore exactly for salaried', () => {
    const errors = validateFormStep('financial', baseForm({ monthlyIncome: 5_00_00_000 }));
    expect(errors.monthlyIncome).toBeFalsy();
  });

  it('rejects monthlyIncome > ₹5 Crore for business (annual turnover > ₹60 Crore)', () => {
    const errors = validateFormStep('financial', baseForm({
      occupation: 'business',
      monthlyIncome: 5_00_00_001,
    }));
    expect(errors.monthlyIncome).toBeTruthy();
  });
});

// ── formValidation — silent coercions caught by min checks ───────────────────
// These tests verify that values that would result from silent numeric truncation
// (e.g. a broken parseInt("1e9") returning 1) are still caught by existing min guards,
// ensuring the full validation chain works even if a corrupted value somehow reaches it.

describe('formValidation — corrupted numeric values caught by existing min guards', () => {
  it('monthlyIncome = 1 (parseInt("1e9") result) fails minimum salary check', () => {
    const errors = validateFormStep('financial', baseForm({ monthlyIncome: 1 }));
    expect(errors.monthlyIncome).toBeTruthy();
  });

  it('loanAmount = 1 (parseInt("1e9") result) fails minimum loan check (unsecured)', () => {
    const errors = validateFormStep('loan-details', baseForm({ loanType: 'unsecured', loanAmount: 1 }));
    expect(errors.loanAmount).toBeTruthy();
  });
});

// ── formValidation — DOB age range (24–110 years) ────────────────────────────

describe('formValidation — DOB age validation (24–110 years)', () => {
  it('rejects applicant aged 23 (below minimum 24)', () => {
    const errors = validateFormStep('personal', baseForm({ dateOfBirth: dobForAge(23) }));
    expect(errors.dateOfBirth).toBeTruthy();
  });

  it('accepts applicant aged 24 (at minimum)', () => {
    const errors = validateFormStep('personal', baseForm({ dateOfBirth: dobForAge(24) }));
    expect(errors.dateOfBirth).toBeFalsy();
  });

  it('accepts applicant aged 110 (at maximum)', () => {
    const errors = validateFormStep('personal', baseForm({ dateOfBirth: dobForAge(110) }));
    expect(errors.dateOfBirth).toBeFalsy();
  });

  it('rejects applicant aged 111 (above maximum)', () => {
    const errors = validateFormStep('personal', baseForm({ dateOfBirth: dobForAge(111) }));
    expect(errors.dateOfBirth).toBeTruthy();
  });
});
