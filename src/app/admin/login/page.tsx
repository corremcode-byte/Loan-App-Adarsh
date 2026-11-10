'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/layout/Logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Real-time eligibility scoring',
    'Centralized application management',
    'Business verification with MCA & BSE',
    'Configurable decision workflows',
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel — Navy brand, desktop only ──────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-navy flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'rgba(249,191,76,0.08)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />

        {/* Logo */}
        <div className="relative">
          <Link href="/" aria-label="LoanEase home">
            <Logo size="md" theme="dark" />
          </Link>
        </div>

        {/* Heading + features */}
        <div className="relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/60 text-xs font-semibold px-3 py-1.5 rounded-full mb-7 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-gold rounded-full" aria-hidden="true" />
            LOS Platform
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.15] tracking-tight mb-3">
            Process loans faster<br />
            <span className="text-gold">with intelligent LOS</span>
          </h2>
          <p className="text-white/55 text-sm mb-10 leading-relaxed max-w-xs">
            Streamline loan origination, eligibility assessment, and
            decision-making in one place.
          </p>

          <ul className="space-y-4">
            {features.map((feat) => (
              <li key={feat} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-gold/[0.15] border border-gold/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-2.5 h-2.5 text-gold"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-white/75 text-sm leading-relaxed">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Version */}
        <div className="relative">
          <span className="text-white/25 text-xs">Loan Origination System v1.0</span>
        </div>
      </div>

      {/* ── Right panel — Form ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-surface">

        {/* Mobile compact brand strip */}
        <div className="lg:hidden bg-navy px-6 py-5 flex items-center">
          <Link href="/" aria-label="LoanEase home">
            <Logo size="sm" theme="dark" />
          </Link>
        </div>

        {/* Form area — vertically centered in remaining space */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 sm:py-14">
          <div className="w-full max-w-[400px]">

            {/* Card surface */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-7 sm:p-9">
              <div className="mb-7">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-1.5">
                  Team Login
                </h1>
                <p className="text-sm text-slate-500">
                  Sign in to access the admin dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Username / Email"
                  type="text"
                  placeholder="Enter your username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm p-3.5 rounded-lg">
                    <svg
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </div>
                )}

                <Button type="submit" loading={loading} fullWidth size="lg">
                  Sign In
                </Button>
              </form>

              {/* Demo credentials */}
              <div className="mt-6 p-4 bg-navy/[0.04] border border-navy/10 rounded-xl">
                <p className="text-xs font-semibold text-navy/50 uppercase tracking-widest mb-1.5">
                  Demo Credentials
                </p>
                <p className="text-xs text-slate-600 font-mono">
                  admin@mail.com &middot; admin12
                </p>
              </div>
            </div>

            {/* Back to Home — below the card */}
            <div className="mt-5 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
