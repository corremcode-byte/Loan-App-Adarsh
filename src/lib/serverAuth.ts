/**
 * Returns true when NEXTAUTH_SECRET is set at runtime.
 * Never logs or exposes the secret value.
 * Exported for unit testing.
 */
export function isNextAuthSecretConfigured(): boolean {
  return typeof process.env.NEXTAUTH_SECRET === 'string' &&
    process.env.NEXTAUTH_SECRET.length > 0;
}
