import { isNextAuthSecretConfigured } from '../lib/serverAuth';

const originalSecret = process.env.NEXTAUTH_SECRET;

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.NEXTAUTH_SECRET;
  } else {
    process.env.NEXTAUTH_SECRET = originalSecret;
  }
});

describe('isNextAuthSecretConfigured', () => {
  it('returns false when NEXTAUTH_SECRET is not set', () => {
    delete process.env.NEXTAUTH_SECRET;
    expect(isNextAuthSecretConfigured()).toBe(false);
  });

  it('returns false when NEXTAUTH_SECRET is an empty string', () => {
    process.env.NEXTAUTH_SECRET = '';
    expect(isNextAuthSecretConfigured()).toBe(false);
  });

  it('returns true when NEXTAUTH_SECRET is set to a non-empty string', () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    expect(isNextAuthSecretConfigured()).toBe(true);
  });

  it('returns a boolean — never exposes the secret value in its output', () => {
    process.env.NEXTAUTH_SECRET = 'my-sensitive-secret-value';
    const result = isNextAuthSecretConfigured();
    expect(typeof result).toBe('boolean');
    expect(String(result)).not.toContain('my-sensitive-secret-value');
  });
});
