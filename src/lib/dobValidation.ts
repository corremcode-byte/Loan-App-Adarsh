const MIN_AGE_YEARS = 24;
const MAX_AGE_YEARS = 110;

/**
 * Parses a YYYY-MM-DD date string as a LOCAL calendar date (not UTC).
 * Prevents off-by-one errors in UTC±N server environments.
 * Returns null if the string is not a valid calendar date.
 */
export function parseLocalDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  // Verify the date did not roll over (e.g. Feb 30 → Mar 2)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

/**
 * Calendar-accurate age calculation. Never uses millisecond / 365.25 approximation.
 * Both arguments are assumed to be local-midnight Date values.
 */
export function calendarAge(dob: Date, referenceDate: Date): number {
  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDiff = referenceDate.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validates a date-of-birth string.
 * Returns a human-readable error message, or null when the value is valid.
 *
 * Rules enforced:
 *   - Must be a parseable YYYY-MM-DD calendar date
 *   - Must not be today or any future date
 *   - Age must be >= MIN_AGE_YEARS (24)
 *   - Age must be <= MAX_AGE_YEARS (110)
 */
export function validateDOB(dobString: string): string | null {
  if (!dobString) return 'Date of birth is required';

  const dob = parseLocalDate(dobString);
  if (!dob) return 'Invalid date of birth';

  const today = new Date();
  today.setHours(0, 0, 0, 0); // compare calendar dates only

  if (dob >= today) {
    return 'Date of birth cannot be today or a future date';
  }

  const age = calendarAge(dob, today);

  if (age < MIN_AGE_YEARS) {
    return `Applicant must be at least ${MIN_AGE_YEARS} years old`;
  }

  if (age > MAX_AGE_YEARS) {
    return `Applicant age exceeds the maximum of ${MAX_AGE_YEARS} years`;
  }

  return null;
}
