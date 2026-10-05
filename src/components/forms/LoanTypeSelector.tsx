'use client';

import { CardTitle, CardDescription } from '@/components/ui/Card';

interface LoanTypeSelectorProps {
  selectedType: 'secured' | 'unsecured' | '';
  onSelect: (type: 'secured' | 'unsecured') => void;
}

export default function LoanTypeSelector({
  selectedType,
  onSelect,
}: LoanTypeSelectorProps) {
  const loanTypes = [
    {
      type: 'secured' as const,
      title: 'Secured Loan',
      description: 'Loan backed by collateral (property, vehicle, gold, etc.)',
      benefits: [
        'Lower interest rates',
        'Higher loan amounts',
        'Longer tenure options',
        'Better approval chances',
      ],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      type: 'unsecured' as const,
      title: 'Unsecured Loan',
      description: 'Personal loan without any collateral requirement',
      benefits: [
        'No collateral needed',
        'Quick processing',
        'Flexible usage',
        'Minimal documentation',
      ],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <CardTitle>Choose Your Loan Type</CardTitle>
        <CardDescription className="mt-2">
          Select the type of loan that best suits your needs
        </CardDescription>
      </div>

      {/* role="radiogroup" turns this into an accessible group of radio options.
          Tab moves focus to the group; Tab again exits. Space/Enter selects. */}
      <div
        role="radiogroup"
        aria-label="Loan type"
        className="grid md:grid-cols-2 gap-5"
      >
        {loanTypes.map((loan) => {
          const isSelected = selectedType === loan.type;

          return (
            <button
              key={loan.type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(loan.type)}
              className={`w-full text-left rounded-xl border bg-white p-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy/40 ${
                isSelected
                  ? 'ring-2 ring-navy border-navy shadow-sm'
                  : 'border-slate-100 hover:border-navy/30 hover:shadow-md shadow-sm'
              }`}
            >
              {/* Card header */}
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-navy text-white' : 'bg-navy/8 text-navy'
                  }`}
                >
                  {loan.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-foreground">{loan.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{loan.description}</p>
                </div>

                {/* Radio indicator */}
                <div
                  aria-hidden="true"
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    isSelected ? 'border-navy bg-navy' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Benefits list */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                  Benefits
                </p>
                <ul className="space-y-1.5">
                  {loan.benefits.map((benefit) => (
                    <li key={benefit} className="text-sm text-slate-600 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
