'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

interface SiteHeaderProps {
  /**
   * 'public' — three-zone nav: centered links + right actions.
   * 'apply'  — minimal: logo + one utility link. No marketing nav during the flow.
   */
  variant?: 'public' | 'apply';
  sticky?: boolean;
}

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'EMI Calculator', href: '/emi-calculator' },
];

export default function SiteHeader({ variant = 'public', sticky = true }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const positionClass = sticky ? 'sticky top-0 z-50' : 'relative';

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // ── Apply variant — minimal strip, no marketing nav ─────────────────────────
  if (variant === 'apply') {
    return (
      <header className={`bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm ${positionClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
          <Link href="/" aria-label="LoanEase home">
            <Logo />
          </Link>
          <Link
            href="/emi-calculator"
            className="text-sm font-medium text-slate-500 hover:text-navy transition-colors"
          >
            EMI Calculator
          </Link>
        </div>
      </header>
    );
  }

  // ── Public variant — three-zone desktop layout ───────────────────────────────
  return (
    <header className={`bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm ${positionClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[72px]">

          {/* Left zone — logo, flex-1 keeps center nav truly centered */}
          <div className="flex-1 flex items-center">
            <Link href="/" aria-label="LoanEase home">
              <Logo />
            </Link>
          </div>

          {/* Center zone — primary navigation, desktop only */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Main navigation"
          >
            {navLinks.map(({ label, href }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                    active
                      ? 'text-navy bg-navy/[0.06]'
                      : 'text-slate-500 hover:text-navy hover:bg-navy/[0.04]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right zone — actions on desktop, hamburger on mobile */}
          <div className="flex-1 flex items-center justify-end">
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-5">
              <Link
                href="/admin/login"
                aria-current={isActive('/admin/login') ? 'page' : undefined}
                className={`text-sm font-medium transition-colors ${
                  isActive('/admin/login')
                    ? 'text-navy'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Team Login
              </Link>

              <Link
                href="/apply"
                className="inline-flex items-center justify-center bg-gold text-navy-dark hover:bg-gold-dark font-bold text-sm px-5 py-2 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 active:scale-[0.98]"
              >
                Apply Now
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-navy rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-navy/30"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <nav
            id="mobile-menu"
            className="md:hidden border-t border-slate-100 py-3"
            aria-label="Mobile navigation"
          >
            {/* Nav links */}
            <div className="space-y-0.5 mb-3">
              {navLinks.map(({ label, href }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'text-navy bg-navy/[0.06]'
                        : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                    }`}
                  >
                    {label}
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-navy flex-shrink-0" aria-hidden="true" />
                    )}
                  </Link>
                );
              })}

              {/* Team Login — utility, slightly de-emphasised */}
              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive('/admin/login') ? 'page' : undefined}
                className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin/login')
                    ? 'text-navy bg-navy/[0.06]'
                    : 'text-slate-500 hover:text-navy hover:bg-slate-50'
                }`}
              >
                Team Login
              </Link>
            </div>

            {/* Primary CTA */}
            <div className="border-t border-slate-100 pt-3">
              <Link
                href="/apply"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full py-3 px-4 bg-gold text-navy-dark rounded-lg font-bold text-sm hover:bg-gold-dark transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                Apply for Loan
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
