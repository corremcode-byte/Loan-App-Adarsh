'use client';

import React from 'react';
import Link from 'next/link';
import EMICalculator from '@/components/EMICalculator';
import Button from '@/components/ui/Button';

export default function EMICalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">LoanEase</span>
            </Link>
            <Link href="/apply">
              <Button>Apply for Loan</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <EMICalculator />

        <div className="text-center mt-8 sm:mt-12 px-4">
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Ready to apply for a loan? Start your application now.
          </p>
          <Link href="/apply" className="inline-block w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">Apply for Loan</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
