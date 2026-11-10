'use client';

import React, { useState, useEffect } from 'react';
import Select from '@/components/ui/Select';
import { calculateEMI, formatCurrency, formatNumber, Frequency } from '@/lib/emi';

export default function EMICalculator() {
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [interestRate, setInterestRate] = useState<number>(12);
  const [tenure, setTenure] = useState<number>(5);
  const [frequency, setFrequency] = useState<Frequency>('monthly');

  const [result, setResult] = useState<{
    emi: number;
    totalPayment: number;
    totalInterest: number;
    totalPayments: number;
  } | null>(null);

  useEffect(() => {
    if (loanAmount > 0 && interestRate >= 0 && tenure > 0) {
      const emiResult = calculateEMI(loanAmount, interestRate, tenure, frequency);
      setResult(emiResult);
    }
  }, [loanAmount, interestRate, tenure, frequency]);

  const frequencyOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'half-yearly', label: 'Half-Yearly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const tenureOptions = [
    { value: '1', label: '1 Year' },
    { value: '2', label: '2 Years' },
    { value: '3', label: '3 Years' },
    { value: '5', label: '5 Years' },
    { value: '7', label: '7 Years' },
    { value: '10', label: '10 Years' },
    { value: '15', label: '15 Years' },
    { value: '20', label: '20 Years' },
    { value: '25', label: '25 Years' },
    { value: '30', label: '30 Years' },
  ];

  // Calculate breakdown for donut chart — logic unchanged
  const principalPercentage = result
    ? Math.round((loanAmount / result.totalPayment) * 100)
    : 0;
  const interestPercentage = 100 - principalPercentage;

  return (
    <div className="max-w-5xl mx-auto">

      {/* Page header */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2">
          EMI Calculator
        </h1>
        <p className="text-sm sm:text-base text-slate-500">
          Plan your loan repayments before you apply.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

        {/* ── Inputs ───────────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 sm:p-7">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-6">
            Loan Details
          </h2>

          <div className="space-y-6">

            {/* Loan Amount */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label htmlFor="emi-loan-amount" className="text-sm font-medium text-slate-700">
                  Loan Amount
                </label>
                <span className="text-sm font-semibold text-navy">
                  {formatCurrency(loanAmount)}
                </span>
              </div>
              <input
                id="emi-loan-amount"
                type="number"
                value={loanAmount || ''}
                onChange={(e) => setLoanAmount(parseInt(e.target.value) || 0)}
                min={10000}
                max={100000000}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors"
              />
              <input
                type="range"
                min={10000}
                max={10000000}
                step={10000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                aria-label="Loan amount slider"
                className="w-full mt-3 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#223265]"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>&#8377;10K</span>
                <span>&#8377;1 Cr</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label htmlFor="emi-interest-rate" className="text-sm font-medium text-slate-700">
                  Interest Rate (p.a.)
                </label>
                <span className="text-sm font-semibold text-navy">{interestRate}%</span>
              </div>
              <input
                id="emi-interest-rate"
                type="number"
                value={interestRate || ''}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                step="0.1"
                min={1}
                max={30}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-colors"
              />
              <input
                type="range"
                min={1}
                max={30}
                step={0.5}
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                aria-label="Interest rate slider"
                className="w-full mt-3 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#223265]"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1%</span>
                <span>30%</span>
              </div>
            </div>

            <Select
              label="Loan Tenure"
              options={tenureOptions}
              value={tenure.toString()}
              onChange={(e) => setTenure(parseInt(e.target.value))}
            />

            <Select
              label="EMI Frequency"
              options={frequencyOptions}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
            />
          </div>
        </div>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {result && (
            <>
              {/* Navy EMI panel */}
              <div className="relative overflow-hidden bg-navy rounded-xl p-6 sm:p-7">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 bg-white/[0.04] rounded-full"
                />

                <div className="relative">
                  <p className="text-gold text-xs font-bold tracking-[0.18em] uppercase mb-2">
                    Your {frequency} EMI
                  </p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-5">
                    {formatCurrency(result.emi)}
                  </p>

                  <div className="border-t border-white/[0.12] pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/50 text-xs mb-0.5">Principal</p>
                      <p className="text-white text-sm font-semibold">
                        {formatCurrency(loanAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-0.5">Total Interest</p>
                      <p className="text-gold text-sm font-semibold">
                        {formatCurrency(result.totalInterest)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.12] mt-4 pt-4 flex justify-between items-center">
                    <p className="text-white/50 text-xs">Total Payable</p>
                    <p className="text-white font-bold">{formatCurrency(result.totalPayment)}</p>
                  </div>
                </div>
              </div>

              {/* Breakdown card */}
              <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
                  Principal vs Interest
                </h3>

                {/* Donut chart — logic unchanged */}
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="18"
                      />
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#223265"
                        strokeWidth="18"
                        strokeDasharray={`${principalPercentage * 2.51} 251`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="18"
                        strokeDasharray={`${interestPercentage * 2.51} 251`}
                        strokeDashoffset={-principalPercentage * 2.51}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground leading-none">
                          {formatNumber(result.totalPayments)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">payments</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-3 py-2.5 bg-navy/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-navy flex-shrink-0" />
                      <span className="text-sm text-slate-600">Principal</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-slate-400">{principalPercentage}%</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(loanAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-3 py-2.5 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
                      <span className="text-sm text-slate-600">Interest</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-slate-400">{interestPercentage}%</span>
                      <span className="text-sm font-semibold text-orange-600">
                        {formatCurrency(result.totalInterest)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-3 py-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-foreground">Total Payable</span>
                    <span className="text-base font-bold text-foreground">
                      {formatCurrency(result.totalPayment)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Formula reference */}
      <div className="mt-6 sm:mt-8 bg-white border border-slate-100 rounded-xl shadow-sm p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          How is EMI Calculated?
        </h3>
        <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 font-mono text-center mb-4 text-xs sm:text-sm overflow-x-auto">
          EMI = [P &times; R &times; (1+R)<sup>N</sup>] / [(1+R)<sup>N</sup> &minus; 1]
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div>
            <p className="font-semibold text-foreground">P = Principal</p>
            <p className="text-slate-500 mt-0.5">The loan amount you borrow</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">R = Rate of Interest</p>
            <p className="text-slate-500 mt-0.5">Interest rate per period</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">N = Number of Payments</p>
            <p className="text-slate-500 mt-0.5">Total number of EMI payments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
