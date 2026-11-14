const GSTIN_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Valid state codes: 01–38 (Indian states/UTs) and 99 (NRI taxpayers).
// Position 13 entity number: 1–9 or A–Z (not 0).
// Position 14: always 'Z'.
// Position 15: checksum digit/letter.
const GSTIN_FORMAT_PATTERN =
  /^(0[1-9]|[12][0-9]|3[0-8]|99)[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function computeGSTINChecksum(gstin: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const val = GSTIN_CHARSET.indexOf(gstin[i]);
    const factor = i % 2 === 0 ? 1 : 2;
    let product = val * factor;
    if (product >= 36) product = Math.floor(product / 36) + (product % 36);
    sum += product;
  }
  return GSTIN_CHARSET[(36 - (sum % 36)) % 36];
}

/**
 * Validates an Indian GSTIN string.
 * Returns null for a valid GSTIN, or an error message string for an invalid one.
 * Input is normalised to uppercase before checking.
 */
export function validateGSTIN(rawGstin: string): string | null {
  const gstin = rawGstin.toUpperCase();

  if (gstin.length !== 15) {
    return `GSTIN must be exactly 15 characters (entered ${gstin.length})`;
  }

  const stateStr = gstin.substring(0, 2);
  const stateNum = /^\d{2}$/.test(stateStr) ? parseInt(stateStr, 10) : NaN;
  if (isNaN(stateNum) || !((stateNum >= 1 && stateNum <= 38) || stateNum === 99)) {
    return 'Invalid state code — first two digits must be 01–38 or 99';
  }

  if (!GSTIN_FORMAT_PATTERN.test(gstin)) {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(gstin.substring(2, 12))) {
      return 'Invalid PAN structure in GSTIN (positions 3–12 must be AAAAA0000A)';
    }
    if (!/^[1-9A-Z]$/.test(gstin[12])) {
      return 'Invalid entity number — position 13 must be 1–9 or A–Z';
    }
    if (gstin[13] !== 'Z') {
      return "Position 14 must be 'Z'";
    }
    return 'Invalid GSTIN format';
  }

  const expected = computeGSTINChecksum(gstin);
  if (gstin[14] !== expected) {
    return 'Invalid GSTIN checksum — please verify and re-enter';
  }

  return null;
}
