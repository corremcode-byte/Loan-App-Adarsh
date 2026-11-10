'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';

export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-surface"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 120% 45% at 50% 0%, rgba(34,50,101,0.05) 0%, transparent 70%)',
      }}
    >
      <SiteHeader sticky />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-24 sm:pt-32 md:pt-36 pb-28 sm:pb-36 text-center">
          {/* Gold glow — right side warmth, toned down */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-10 -right-16 sm:right-0 w-60 h-60 rounded-full blur-3xl"
            style={{ background: 'rgba(249,191,76,0.07)' }}
          />
          {/* Navy echo — bottom left, toned down */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-8 -left-16 w-48 h-48 rounded-full blur-3xl"
            style={{ background: 'rgba(34,50,101,0.03)' }}
          />

          {/* Badge */}
          <div className="relative inline-flex items-center gap-2 bg-navy/8 text-navy text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-gold rounded-full" aria-hidden="true" />
            Fast &amp; Trusted Loan Processing
          </div>

          {/* Two-line heading — scaled down slightly for desktop */}
          <h1 className="relative mb-7 px-2">
            <span className="block text-2xl sm:text-3xl md:text-[2.5rem] font-extrabold text-foreground leading-tight tracking-tight">
              Get Your Loan Approved
            </span>
            <span className="relative mt-2 inline-block">
              <span className="text-4xl sm:text-5xl md:text-[3.25rem] font-extrabold text-navy tracking-tight leading-none">
                Fast &amp; Easy
              </span>
              <span
                aria-hidden="true"
                className="absolute -bottom-2.5 left-0 right-0 h-1 bg-gold rounded-full"
              />
            </span>
          </h1>

          <p className="relative text-base text-slate-500 max-w-[33rem] mx-auto mb-10 px-4 leading-loose">
            Apply for personal or secured loans with our simple online process.
            Get instant eligibility check and competitive interest rates.
          </p>

          <div className="relative flex justify-center px-4">
            <Button
              href="/apply"
              variant="gold"
              size="lg"
            >
              Apply for Loan
            </Button>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <section className="pb-16 sm:pb-20" aria-label="Key features">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                ),
                title: 'Quick Processing',
                desc: 'Instant eligibility check and fast loan approval from start to finish.',
                topBorderColor: '#223265',
                iconBg: 'bg-navy/8 group-hover:bg-navy/[0.12]',
                iconColor: 'text-navy',
              },
              {
                icon: (
                  <path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                ),
                title: 'Secured & Unsecured',
                desc: 'Choose from secured loans with collateral or flexible personal loans.',
                topBorderColor: '#F9BF4C',
                iconBg: 'bg-[#FDE9B8] group-hover:bg-[#FDDEA0]',
                iconColor: 'text-[#92600A]',
              },
              {
                icon: (
                  <path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                ),
                title: 'EMI Calculator',
                desc: 'Plan your finances before you apply with our built-in EMI tool.',
                topBorderColor: '#10b981',
                iconBg: 'bg-emerald-50 group-hover:bg-emerald-100',
                iconColor: 'text-emerald-600',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-slate-100 border-t-2 rounded-xl p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                style={{ borderTopColor: feature.topBorderColor }}
              >
                <div
                  className={`w-12 h-12 ${feature.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-200`}
                >
                  <svg
                    className={`w-6 h-6 ${feature.iconColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Loan Types ───────────────────────────────────────────────────── */}
        <section className="pb-16 sm:pb-20" aria-label="Loan types">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Choose Your Loan Type
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Tailored options whether you have collateral to offer or prefer a
              quick personal loan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                iconPath:
                  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                title: 'Secured Loan',
                features: [
                  'Lower interest rates',
                  'Higher loan amounts (up to ₹5 Cr)',
                  'Tenure up to 20 years',
                ],
                note: 'Requires collateral like property, vehicle, or gold.',
                leftBorderColor: '#223265',
                iconBg: 'bg-navy/8',
                iconColor: 'text-navy',
                iconHoverBg: 'group-hover:bg-navy/[0.13]',
              },
              {
                iconPath:
                  'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                title: 'Unsecured Loan',
                features: [
                  'No collateral needed',
                  'Quick approval process',
                  'Loans up to ₹40 Lakhs',
                ],
                note: 'Personal loans based on income and credit profile.',
                leftBorderColor: '#F9BF4C',
                iconBg: 'bg-[#FDE9B8]',
                iconColor: 'text-[#92600A]',
                iconHoverBg: 'group-hover:bg-[#FDDEA0]',
              },
            ].map((loan) => (
              <div
                key={loan.title}
                className="bg-white border border-slate-200 border-l-[3px] rounded-xl p-7 hover:shadow-md transition-all duration-200 group flex flex-col"
                style={{ borderLeftColor: loan.leftBorderColor }}
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-12 h-12 ${loan.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 ${loan.iconHoverBg} transition-colors duration-200`}
                  >
                    <svg
                      className={`w-6 h-6 ${loan.iconColor}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d={loan.iconPath}
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{loan.title}</h3>
                </div>

                {/* Feature list */}
                <ul className="space-y-3 mb-2 flex-1">
                  {loan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <svg
                        className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Footer */}
                <div className="pt-5 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">{loan.note}</p>
                  <Button href="/apply" variant="outline" size="sm" className="w-full">
                    Apply for {loan.title}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
        <section className="pb-16 sm:pb-24" aria-label="Call to action">
          <div className="relative overflow-hidden bg-navy rounded-2xl py-14 px-6 sm:px-14 text-center">
            {/* Decorative shapes */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-white/[0.04] rounded-full"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 bg-gold/[0.07] rounded-full"
            />

            <div className="relative">
              <p className="text-gold text-xs font-bold tracking-[0.2em] uppercase mb-4">
                Start Your Journey
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Ready to get started?
              </h2>
              <p className="text-white/60 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                Apply now and get an instant eligibility check — it only takes a few minutes.
              </p>
              <Button
                href="/apply"
                variant="gold"
                size="lg"
                className="w-full sm:w-auto shadow-lg hover:shadow-xl"
              >
                Start Application
              </Button>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
