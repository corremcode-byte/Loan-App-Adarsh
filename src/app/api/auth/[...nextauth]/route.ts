import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { isNextAuthSecretConfigured } from '@/lib/serverAuth';

const nextAuthHandler = NextAuth(authOptions);

// Request-time guard: if NEXTAUTH_SECRET is absent, fail closed with HTTP 500.
// Runs only during HTTP requests, not at module initialization or build time.
export const GET = async (...args: Parameters<typeof nextAuthHandler>) => {
  if (!isNextAuthSecretConfigured()) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return nextAuthHandler(...args);
};

export const POST = GET;
