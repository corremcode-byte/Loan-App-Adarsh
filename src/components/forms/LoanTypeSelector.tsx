'use client';

import Card, { CardTitle, CardDescription } from '@/components/ui/Card';

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
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <div className="grid md:grid-cols-2 gap-5">
        {loanTypes.map((loan) => (
          <Card
            key={loan.type}
            className={`cursor-pointer transition-all duration-200 ${
              selectedType === loan.type
                ? 'ring-2 ring-[#223265] border-[#223265]'
                : 'hover:border-[#223265]/30 hover:shadow-md'
            }`}
            hover={selectedType !== loan.type}
            onClick={() => onSelect(loan.type)}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl flex-shrink-0 ${
                  selectedType === loan.type
                    ? 'bg-[#223265] text-white'
                    : 'bg-[#223265]/8 text-[#223265]'
                }`}
              >
                {loan.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-[#1E293B]">{loan.title}</h3>
                <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{loan.description}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  selectedType === loan.type
                    ? 'border-[#223265] bg-[#223265]'
                    : 'border-slate-300'
                }`}
              >
                {selectedType === loan.type && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">Benefits</p>
              <ul className="space-y-1.5">
                {loan.benefits.map((benefit, index) => (
                  <li key={index} className="text-sm text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
