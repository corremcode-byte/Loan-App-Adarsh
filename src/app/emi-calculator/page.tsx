'use client';

import React from 'react';
import EMICalculator from '@/components/EMICalculator';
import Button from '@/components/ui/Button';
import SiteHeader from '@/components/layout/SiteHeader';

export default function EMICalculatorPage() {
  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <EMICalculator />

        <div className="text-center mt-8 sm:mt-12 px-4">
          <p className="text-sm sm:text-base text-slate-500 mb-4">
            Ready to apply for a loan? Start your application now.
          </p>
          <Button href="/apply" size="lg" className="w-full sm:w-auto">
            Apply for Loan
          </Button>
        </div>
      </main>
    </div>
  );
}
