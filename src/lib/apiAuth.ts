import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { authOptions } from './authOptions';
import { isNextAuthSecretConfigured } from './serverAuth';

type AuthSuccess = { session: Session; error: null };
type AuthFailure = { session: null; error: NextResponse };
export type AuthResult = AuthSuccess | AuthFailure;

// Fail closed on missing secret: returns HTTP 500, matching Phase 6C behavior.
// Check runs at request time (inside function body) — no module-level throw,
// no build-time failure when NEXTAUTH_SECRET is absent from the CI environment.
export async function requireSession(): Promise<AuthResult> {
  if (!isNextAuthSecretConfigured()) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      ),
    };
  }
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { session, error: null };
}

// Deny any role that is not exactly 'admin'.
// Missing session.user, missing role, unknown role, 'manager' — all receive 403.
// No unsafe non-null assertions: optional chaining on user.role.
export async function requireAdminRole(): Promise<AuthResult> {
  const result = await requireSession();
  if (result.error) return result;
  const role = result.session.user?.role;
  if (role !== 'admin') {
    return {
      session: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return result;
}
