'use client';

import React, { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card, { CardTitle, CardDescription } from '@/components/ui/Card';
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

  // Calculate breakdown for pie chart
  const principalPercentage = result
    ? Math.round((loanAmount / result.totalPayment) * 100)
    : 0;
  const interestPercentage = 100 - principalPercentage;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <CardTitle className="text-2xl sm:text-3xl">EMI Calculator</CardTitle>
        <CardDescription className="mt-2 text-base sm:text-lg px-4">
          Calculate your Equated Monthly Installment
        </CardDescription>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Input Section */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Loan Details
          </h3>

          <div className="space-y-6">
            <div>
              <Input
                label="Loan Amount (₹)"
                type="number"
                value={loanAmount || ''}
                onChange={(e) => setLoanAmount(parseInt(e.target.value) || 0)}
                min={10000}
                max={100000000}
              />
              <input
                type="range"
                min={10000}
                max={10000000}
                step={10000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                className="w-full mt-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>₹10K</span>
                <span>₹1 Cr</span>
              </div>
            </div>

            <div>
              <Input
                label="Interest Rate (% per annum)"
                type="number"
                value={interestRate || ''}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                step="0.1"
                min={1}
                max={30}
              />
              <input
                type="range"
                min={1}
                max={30}
                step={0.5}
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                className="w-full mt-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
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
        </Card>

        {/* Result Section */}
        <div className="space-y-6">
          {result && (
            <>
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <div className="text-center">
                  <p className="text-blue-100 text-xs sm:text-sm uppercase tracking-wide">
                    Your {frequency} EMI
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 break-words">
                    {formatCurrency(result.emi)}
                  </p>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Breakdown
                </h3>

                {/* Visual Breakdown */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="20"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="20"
                        strokeDasharray={`${principalPercentage * 2.51} 251`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="20"
                        strokeDasharray={`${interestPercentage * 2.51} 251`}
                        strokeDashoffset={-principalPercentage * 2.51}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-sm font-bold">
                          {formatNumber(result.totalPayments)}
                        </p>
                        <p className="text-xs text-gray-500">payments</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">Principal Amount</span>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(loanAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-700">Total Interest</span>
                    </div>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(result.totalInterest)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg border-2 border-gray-200">
                    <span className="text-gray-900 font-medium">
                      Total Amount Payable
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(result.totalPayment)}
                    </span>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Formula Info */}
      <Card className="mt-6 sm:mt-8 bg-gray-50">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          How is EMI Calculated?
        </h3>
        <div className="bg-white p-3 sm:p-4 rounded-lg font-mono text-center mb-4 text-xs sm:text-sm overflow-x-auto">
          EMI = [P × R × (1+R)<sup>N</sup>] / [(1+R)<sup>N</sup> - 1]
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div>
            <p className="font-medium text-gray-700">P = Principal</p>
            <p className="text-gray-500">The loan amount you borrow</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">R = Rate of Interest</p>
            <p className="text-gray-500">Interest rate per period</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">N = Number of Payments</p>
            <p className="text-gray-500">Total number of EMI payments</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
