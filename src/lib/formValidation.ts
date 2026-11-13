import { ApplicationFormData, FormStep } from '@/types';
import { validateDOB } from './dobValidation';

// ─── Character-set patterns ──────────────────────────────────────────────────

// Bug 16: Unicode-aware name pattern.
// \p{L} = Unicode letters (all scripts), \p{M} = combining marks (required for
// Devanagari/Tamil/Telugu vowel signs like "ा" which are category Mc, not L).
// Also allows spaces, apostrophes (O'Brien), hyphens (Singh-Patel), and periods (K.).
const NAME_PATTERN = /^[\p{L}\p{M}\s'\-.]+$/u;

// Bug 18: PAN — exactly 5 uppercase letters, 4 digits, 1 uppercase letter.
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// Bug 17 / Bug 19: Address characters.
// Allows Unicode letters, digits, spaces, commas, hyphens, forward slashes,
// periods, #, &, apostrophes, and parentheses — covers all standard Indian
// address formats ("Flat #401, Sector 5/B, Near ABC School").
// Note: \# is invalid in Unicode mode; use literal # instead. \p{M} for combining marks.
const ADDRESS_PATTERN = /^[\p{L}\p{M}\d\s,\-.#&'()/]+$/u;

// Bug 17: City pattern — letters (including combining marks), spaces, hyphens, periods, ampersands.
// \p{M} included for the same reason as NAME_PATTERN. Ampersand for "Daman & Diu".
const CITY_PATTERN = /^[\p{L}\p{M}\s\-.&]+$/u;

// Rule: address fields (residential street, city, collateral property address) max 150 chars.
const COLLATERAL_ADDRESS_MAX_LENGTH = 150;
const STREET_MAX_LENGTH = 150;
const CITY_MAX_LENGTH = 150;

// Rule: name fields max 25 characters each.
const NAME_MAX_LENGTH = 25;

// Rule: monthly income max ₹5 crore (annual turnover equivalent: ₹60 crore).
const MAX_MONTHLY_INCOME = 5_00_00_000;

// Rule: loan amount max ₹100 crore.
const MAX_LOAN_AMOUNT = 1_00_00_00_000;

// ─── Main validation function ────────────────────────────────────────────────

/**
 * Pure client-side step validation.
 * Returns a map of fieldName → error message; empty map means the step is valid.
 */
export function validateFormStep(
  step: FormStep,
  formData: ApplicationFormData
): Record<string, string> {
  const errors: Record<string, string> = {};

  switch (step) {
    case 'personal': {
      // Bug 16: firstName required + character validation + max 25 chars
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required';
      } else if (formData.firstName.trim().length > NAME_MAX_LENGTH) {
        errors.firstName = `First name must be ${NAME_MAX_LENGTH} characters or fewer`;
      } else if (!NAME_PATTERN.test(formData.firstName.trim())) {
        errors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes';
      }

      // Bug 16: lastName — optional field but must be valid if provided, max 25 chars
      if (formData.lastName.trim()) {
        if (formData.lastName.trim().length > NAME_MAX_LENGTH) {
          errors.lastName = `Last name must be ${NAME_MAX_LENGTH} characters or fewer`;
        } else if (!NAME_PATTERN.test(formData.lastName.trim())) {
          errors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes';
        }
      }

      // Bug 16: middleName — optional field but must be valid if provided, max 25 chars
      if (formData.middleName.trim()) {
        if (formData.middleName.trim().length > NAME_MAX_LENGTH) {
          errors.middleName = `Middle name must be ${NAME_MAX_LENGTH} characters or fewer`;
        } else if (!NAME_PATTERN.test(formData.middleName.trim())) {
          errors.middleName = 'Middle name can only contain letters, spaces, hyphens, and apostrophes';
        }
      }

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Invalid email format';
      }

      if (!formData.gender) errors.gender = 'Please select gender';

      // Bug 20: calendar-accurate DOB validation
      if (!formData.dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required';
      } else {
        const dobError = validateDOB(formData.dateOfBirth);
        if (dobError) errors.dateOfBirth = dobError;
      }

      if (!formData.maritalStatus) errors.maritalStatus = 'Please select marital status';
      break;
    }

    case 'address': {
      // Bug 17: street character validation + max 150 chars
      if (!formData.address.street.trim()) {
        errors.street = 'Street address is required';
      } else if (formData.address.street.trim().length > STREET_MAX_LENGTH) {
        errors.street = `Street address must be ${STREET_MAX_LENGTH} characters or fewer`;
      } else if (!ADDRESS_PATTERN.test(formData.address.street.trim())) {
        errors.street = 'Street address contains invalid characters';
      }

      // Bug 17: city character validation + max 150 chars
      if (!formData.address.city.trim()) {
        errors.city = 'City is required';
      } else if (formData.address.city.trim().length > CITY_MAX_LENGTH) {
        errors.city = `City name must be ${CITY_MAX_LENGTH} characters or fewer`;
      } else if (!CITY_PATTERN.test(formData.address.city.trim())) {
        errors.city = 'City name can only contain letters, spaces, and hyphens';
      }

      if (!formData.address.state) errors.state = 'State is required';

      if (!formData.address.pincode || formData.address.pincode.length !== 6) {
        errors.pincode = 'Valid 6-digit PIN code is required';
      }
      break;
    }

    case 'documents': {
      // Bug 18: PAN format validation (AAAAA0000A)
      if (!formData.panNumber) {
        errors.panNumber = 'PAN number is required';
      } else if (!PAN_PATTERN.test(formData.panNumber)) {
        errors.panNumber = 'PAN must be in the format AAAAA0000A (5 letters, 4 digits, 1 letter)';
      }

      const aadhaar = formData.aadhaarNumber.replace(/\s/g, '');
      if (!aadhaar || aadhaar.length !== 12) {
        errors.aadhaarNumber = 'Valid 12-digit Aadhaar is required';
      }
      break;
    }

    case 'financial': {
      if (!formData.occupation) errors.occupation = 'Occupation is required';
      if (!formData.employerName.trim()) errors.employerName = 'Employer name is required';

      if (
        !formData.monthlyIncome ||
        formData.monthlyIncome < (formData.occupation === 'business' ? 833333 : 35000)
      ) {
        errors.monthlyIncome =
          formData.occupation === 'business'
            ? 'Annual turnover must be at least ₹1,00,00,000 (1 Crore)'
            : 'Monthly salary must be at least ₹35,000';
      } else if (formData.monthlyIncome > MAX_MONTHLY_INCOME) {
        errors.monthlyIncome =
          formData.occupation === 'business'
            ? 'Annual turnover must not exceed ₹60,00,00,000 (60 Crore)'
            : 'Monthly salary must not exceed ₹5,00,00,000 (5 Crore)';
      }

      if (formData.yearsOfExperience < 3) {
        errors.yearsOfExperience = 'Minimum 3 years of experience required';
      }

      // Bugs 11/13: experience cannot exceed age − 18
      if (formData.dateOfBirth) {
        const dob = new Date(formData.dateOfBirth);
        const today = new Date();
        const age = Math.floor(
          (today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        const maxExperience = Math.max(0, age - 18);
        if (formData.yearsOfExperience > maxExperience) {
          errors.yearsOfExperience = `Years of experience (${formData.yearsOfExperience}) cannot exceed ${maxExperience} years for someone aged ${age}`;
        }
      }

      if (!formData.cibilScore || formData.cibilScore < 700) {
        errors.cibilScore = 'Minimum required CIBIL score is 700';
      }

      // Bug 14: user must explicitly select yes or no for existing loans
      if (!formData.hasExistingLoans) {
        errors.hasExistingLoans = 'Please indicate whether you have existing loans';
      }

      // Bug 19: collateral fields for secured loans
      if (formData.loanType === 'secured') {
        if (!formData.collateral?.propertyType) {
          errors.propertyType = 'Property type is required';
        }
        if (!formData.collateral?.estimatedValue || formData.collateral.estimatedValue < 100000) {
          errors.estimatedValue = 'Valid estimated value is required';
        }
        if (!formData.collateral?.ownershipStatus) {
          errors.ownershipStatus = 'Ownership status is required';
        }
        const propertyAddress = formData.collateral?.propertyAddress?.trim() ?? '';
        if (!propertyAddress) {
          errors.propertyAddress = 'Property address is required';
        } else if (propertyAddress.length > COLLATERAL_ADDRESS_MAX_LENGTH) {
          errors.propertyAddress = `Property address must be ${COLLATERAL_ADDRESS_MAX_LENGTH} characters or fewer`;
        } else if (!ADDRESS_PATTERN.test(propertyAddress)) {
          errors.propertyAddress = 'Property address contains invalid characters';
        }
      }
      break;
    }

    case 'loan-details': {
      // Bug 5: enforce minimum loan amounts + spec maximum ₹100 crore
      const minLoanAmount = formData.loanType === 'secured' ? 100000 : 50000;
      const minLoanLabel = formData.loanType === 'secured' ? '₹1,00,000' : '₹50,000';
      if (!formData.loanAmount || formData.loanAmount < minLoanAmount) {
        errors.loanAmount = `Loan amount must be at least ${minLoanLabel}`;
      } else if (formData.loanAmount > MAX_LOAN_AMOUNT) {
        errors.loanAmount = 'Loan amount must not exceed ₹1,00,00,00,000 (100 Crore)';
      }

      if (!formData.loanPurpose) errors.loanPurpose = 'Loan purpose is required';

      // Bug 10: tenure must be explicitly selected
      if (!formData.preferredTenure) errors.preferredTenure = 'Tenure is required';

      // Bug 2: interest rate minimum
      if (!formData.interestRate || formData.interestRate < 10.5) {
        errors.interestRate = 'Minimum expected interest rate is 10.5%';
      }
      break;
    }
  }

  return errors;
}
