'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-[#223265] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-[#1E293B]">LoanEase</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/emi-calculator" className="text-slate-500 hover:text-[#223265] font-medium transition-colors text-sm">
                EMI Calculator
              </Link>
              <Link href="/admin/login">
                <Button variant="outline" size="sm">Team Login</Button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-[#223265] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t border-slate-100 pt-4 space-y-3">
              <Link href="/emi-calculator" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" size="sm" className="w-full">EMI Calculator</Button>
              </Link>
              <Link href="/apply" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button size="sm" className="w-full">Apply for Loan</Button>
              </Link>
              <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" size="sm" className="w-full">Team Login</Button>
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20">
        <div className="text-center mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 bg-[#223265]/8 text-[#223265] text-xs font-semibold px-3 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-[#F9BF4C] rounded-full" />
            Fast &amp; Trusted Loan Processing
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1E293B] mb-5 px-2 leading-tight tracking-tight">
            Get Your Loan Approved{' '}
            <span className="text-[#223265]">Fast &amp; Easy</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto mb-8 px-4 leading-relaxed">
            Apply for personal or secured loans with our simple online process.
            Get instant eligibility check and competitive interest rates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
            <Link href="/apply" className="w-full sm:w-auto">
              <Button variant="gold" size="lg" className="px-10 w-full sm:w-auto">
                Apply for Loan
              </Button>
            </Link>
            <Link href="/emi-calculator" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="px-10 w-full sm:w-auto">
                Calculate EMI
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14 md:mb-20">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              ),
              title: 'Quick Processing',
              desc: 'Get instant eligibility check and fast loan approval process',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              ),
              title: 'Secured &amp; Unsecured',
              desc: 'Choose from secured loans with collateral or unsecured personal loans',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              ),
              title: 'EMI Calculator',
              desc: 'Calculate your monthly EMI before applying to plan your finances',
            },
          ].map((feature, i) => (
            <Card key={i} hover className="text-center">
              <div className="w-14 h-14 bg-[#223265]/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#223265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {feature.icon}
                </svg>
              </div>
              <h3
                className="text-base font-semibold text-[#1E293B] mb-2"
                dangerouslySetInnerHTML={{ __html: feature.title }}
              />
              <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
            </Card>
          ))}
        </div>

        {/* Loan Types */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 lg:p-12 mb-14 md:mb-20">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] text-center mb-8">
            Choose Your Loan Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {[
              {
                iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                title: 'Secured Loan',
                features: ['Lower interest rates', 'Higher loan amounts (up to 5 Cr)', 'Tenure up to 20 years'],
                note: 'Requires collateral like property, vehicle, or gold',
              },
              {
                iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                title: 'Unsecured Loan',
                features: ['No collateral needed', 'Quick approval process', 'Loans up to 40 Lakhs'],
                note: 'Personal loans based on income and credit profile',
              },
            ].map((loan) => (
              <div
                key={loan.title}
                className="border border-slate-100 rounded-xl p-6 hover:border-[#223265]/40 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-[#223265]/8 rounded-xl flex items-center justify-center group-hover:bg-[#223265]/12 transition-colors">
                    <svg className="w-6 h-6 text-[#223265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={loan.iconPath} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">{loan.title}</h3>
                </div>
                <ul className="space-y-2.5 mb-5">
                  {loan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400">{loan.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center px-4">
          <p className="text-sm text-slate-500 mb-5">
            Ready to get started? Apply now and get an instant eligibility check.
          </p>
          <Link href="/apply" className="inline-block w-full sm:w-auto">
            <Button variant="gold" size="lg" className="px-14 w-full sm:w-auto">
              Start Application
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#162247] text-slate-400 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#223265] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-white font-semibold">LoanEase</span>
            </div>
            <p className="text-sm text-slate-500">© 2024 LoanEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
