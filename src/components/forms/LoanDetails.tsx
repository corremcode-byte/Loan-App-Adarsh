'use client';

import React, { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { CardTitle, CardDescription } from '@/components/ui/Card';
import { calculateEMI, formatCurrency, Frequency } from '@/lib/emi';

interface LoanDetailsProps {
  data: {
    loanAmount: number;
    loanPurpose: string;
    preferredTenure: number;
  };
  onChange: (field: string, value: string | number) => void;
  onEMIChange: (emi: number) => void;
  errors?: Record<string, string>;
  loanType: 'secured' | 'unsecured' | '';
}

export default function LoanDetails({
  data,
  onChange,
  onEMIChange,
  errors = {},
  loanType,
}: LoanDetailsProps) {
  const [interestRate, setInterestRate] = useState(12);
  const [frequency, setFrequency] = useState<Frequency>('monthly');

  const purposeOptions = [
    { value: 'home-purchase', label: 'Home Purchase' },
    { value: 'home-renovation', label: 'Home Renovation' },
    { value: 'vehicle-purchase', label: 'Vehicle Purchase' },
    { value: 'education', label: 'Education' },
    { value: 'medical', label: 'Medical Expenses' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'travel', label: 'Travel' },
    { value: 'debt-consolidation', label: 'Debt Consolidation' },
    { value: 'business', label: 'Business Expansion' },
    { value: 'other', label: 'Other' },
  ];

  const tenureOptions =
    loanType === 'secured'
      ? [
          { value: '12', label: '1 Year' },
          { value: '24', label: '2 Years' },
          { value: '36', label: '3 Years' },
          { value: '60', label: '5 Years' },
          { value: '84', label: '7 Years' },
          { value: '120', label: '10 Years' },
          { value: '180', label: '15 Years' },
          { value: '240', label: '20 Years' },
        ]
      : [
          { value: '12', label: '1 Year' },
          { value: '24', label: '2 Years' },
          { value: '36', label: '3 Years' },
          { value: '48', label: '4 Years' },
          { value: '60', label: '5 Years' },
        ];

  const frequencyOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'half-yearly', label: 'Half-Yearly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  // Calculate EMI whenever loan details change
  useEffect(() => {
    if (data.loanAmount > 0 && data.preferredTenure > 0) {
      const result = calculateEMI(
        data.loanAmount,
        interestRate,
        data.preferredTenure / 12,
        frequency
      );
      onEMIChange(result.emi);
    }
  }, [data.loanAmount, data.preferredTenure, interestRate, frequency, onEMIChange]);

  const emiResult =
    data.loanAmount > 0 && data.preferredTenure > 0
      ? calculateEMI(
          data.loanAmount,
          interestRate,
          data.preferredTenure / 12,
          frequency
        )
      : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <CardTitle>Loan Details</CardTitle>
        <CardDescription className="mt-2">
          Tell us about your loan requirements
        </CardDescription>
      </div>

      <div className="space-y-6">
        <Input
          label="Loan Amount"
          type="number"
          placeholder="Enter loan amount in INR"
          value={data.loanAmount || ''}
          onChange={(e) =>
            onChange('loanAmount', parseInt(e.target.value) || 0)
          }
          error={errors.loanAmount}
          helperText={
            loanType === 'secured'
              ? 'Secured loans typically range from ₹1 Lakh to ₹5 Crore'
              : 'Personal loans typically range from ₹50,000 to ₹40 Lakh'
          }
          required
        />

        <Select
          label="Loan Purpose"
          options={purposeOptions}
          value={data.loanPurpose}
          onChange={(e) => onChange('loanPurpose', e.target.value)}
          error={errors.loanPurpose}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Preferred Tenure"
            options={tenureOptions}
            value={data.preferredTenure.toString()}
            onChange={(e) =>
              onChange('preferredTenure', parseInt(e.target.value) || 12)
            }
            error={errors.preferredTenure}
            required
          />

          <Input
            label="Expected Interest Rate (%)"
            type="number"
            placeholder="Enter rate"
            value={interestRate}
            onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
            helperText="Indicative rate for EMI calculation"
            step="0.1"
            min={5}
            max={30}
          />
        </div>

        <Select
          label="EMI Frequency"
          options={frequencyOptions}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Frequency)}
        />

        {/* EMI Preview */}
        {emiResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">
              Estimated EMI Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">EMI Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(emiResult.emi)}
                </p>
                <p className="text-xs text-gray-400 capitalize">{frequency}</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Total Payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(emiResult.totalPayment)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Principal</p>
                <p className="text-xl font-semibold text-gray-700">
                  {formatCurrency(data.loanAmount)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Total Interest</p>
                <p className="text-xl font-semibold text-orange-600">
                  {formatCurrency(emiResult.totalInterest)}
                </p>
              </div>
            </div>
            <p className="text-xs text-blue-600 text-center mt-4">
              * This is an indicative EMI. Actual EMI may vary based on final
              interest rate offered.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
