'use client';

import React, { useEffect } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { CardTitle, CardDescription } from '@/components/ui/Card';
import { ExistingLoan } from '@/types';
import { formatCurrency } from '@/lib/emi';

interface FinancialDetailsProps {
  data: {
    occupation: string;
    employerName: string;
    monthlyIncome: number;
    yearsOfExperience: number;
    existingLoans: ExistingLoan[];
  };
  onChange: (field: string, value: string | number | ExistingLoan[]) => void;
  errors?: Record<string, string>;
}

export default function FinancialDetails({
  data,
  onChange,
  errors = {},
}: FinancialDetailsProps) {
  const [hasExistingLoans, setHasExistingLoans] = React.useState<'yes' | 'no' | ''>(() => {
    return data.existingLoans.length > 0 ? 'yes' : '';
  });
  const [loanCount, setLoanCount] = React.useState<number>(() => {
    return data.existingLoans.length || 0;
  });

  const occupationOptions = [
    { value: 'salaried', label: 'Salaried' },
    { value: 'self-employed', label: 'Self Employed' },
    { value: 'business', label: 'Business Owner' },
    { value: 'retired', label: 'Retired' },
  ];

  const loanTypeOptions = [
    { value: 'home-loan', label: 'Home Loan' },
    { value: 'car-loan', label: 'Car Loan' },
    { value: 'personal-loan', label: 'Personal Loan' },
    { value: 'education-loan', label: 'Education Loan' },
    { value: 'credit-card', label: 'Credit Card EMI' },
    { value: 'gold-loan', label: 'Gold Loan' },
    { value: 'business-loan', label: 'Business Loan' },
    { value: 'other', label: 'Other' },
  ];

  const tenureOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'half-yearly', label: 'Half-Yearly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  // When hasExistingLoans changes to 'no', clear existing loans
  useEffect(() => {
    if (hasExistingLoans === 'no') {
      setLoanCount(0);
      onChange('existingLoans', []);
    }
  }, [hasExistingLoans, onChange]);

  // When loan count changes, adjust the existing loans array
  useEffect(() => {
    if (hasExistingLoans === 'yes' && loanCount > 0) {
      const currentLoans = [...data.existingLoans];

      if (currentLoans.length < loanCount) {
        // Add empty loan entries
        for (let i = currentLoans.length; i < loanCount; i++) {
          currentLoans.push({
            loanType: '',
            outstandingAmount: 0,
            emi: 0,
            tenure: 'monthly',
          });
        }
        onChange('existingLoans', currentLoans);
      } else if (currentLoans.length > loanCount) {
        // Remove extra loans
        onChange('existingLoans', currentLoans.slice(0, loanCount));
      }
    }
  }, [loanCount, hasExistingLoans]);

  const handleLoanUpdate = (index: number, field: keyof ExistingLoan, value: string | number) => {
    const updatedLoans = [...data.existingLoans];
    updatedLoans[index] = {
      ...updatedLoans[index],
      [field]: value,
    };
    onChange('existingLoans', updatedLoans);
  };

  const totalEMI = data.existingLoans.reduce((sum, loan) => sum + (loan.emi || 0), 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <CardTitle>Financial Details</CardTitle>
        <CardDescription className="mt-2">
          Please provide your employment and financial information
        </CardDescription>
      </div>

      <div className="space-y-6">
        <Select
          label="Occupation Type"
          options={occupationOptions}
          value={data.occupation}
          onChange={(e) => onChange('occupation', e.target.value)}
          error={errors.occupation}
          required
        />

        <Input
          label={
            data.occupation === 'salaried'
              ? 'Employer Name'
              : data.occupation === 'business'
              ? 'Business Name'
              : 'Source of Income'
          }
          placeholder={
            data.occupation === 'salaried'
              ? 'Enter your company name'
              : data.occupation === 'business'
              ? 'Enter your business name'
              : 'Enter source of income'
          }
          value={data.employerName}
          onChange={(e) => onChange('employerName', e.target.value)}
          error={errors.employerName}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Monthly Income"
            type="number"
            placeholder="Enter monthly income"
            value={data.monthlyIncome || ''}
            onChange={(e) =>
              onChange('monthlyIncome', parseInt(e.target.value) || 0)
            }
            error={errors.monthlyIncome}
            helperText="Net monthly income in INR"
            required
          />

          <Input
            label="Years of Experience"
            type="number"
            placeholder="Enter years"
            value={data.yearsOfExperience || ''}
            onChange={(e) =>
              onChange('yearsOfExperience', parseInt(e.target.value) || 0)
            }
            error={errors.yearsOfExperience}
            helperText={
              data.occupation === 'business'
                ? 'Years in business'
                : 'Total work experience'
            }
            min={0}
            required
          />
        </div>

        {/* Existing Loans Section */}
        <div className="border-t pt-6">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Existing Loans
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              Do you have any existing loans or EMIs?
            </p>

            {/* Yes/No Selection */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setHasExistingLoans('no')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  hasExistingLoans === 'no'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setHasExistingLoans('yes')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  hasExistingLoans === 'yes'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                Yes
              </button>
            </div>
          </div>

          {/* Number of Loans Input */}
          {hasExistingLoans === 'yes' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many existing loans do you have?
              </label>
              <select
                value={loanCount}
                onChange={(e) => setLoanCount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Select number of loans</option>
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'loan' : 'loans'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Loan Details Forms */}
          {hasExistingLoans === 'yes' && loanCount > 0 && (
            <div className="space-y-6">
              {data.existingLoans.map((loan, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <h5 className="font-medium text-gray-800 mb-4">
                    Loan {index + 1} Details
                  </h5>
                  <div className="space-y-4">
                    <Select
                      label="Loan Type"
                      options={loanTypeOptions}
                      value={loan.loanType}
                      onChange={(e) =>
                        handleLoanUpdate(index, 'loanType', e.target.value)
                      }
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Outstanding Amount"
                        type="number"
                        placeholder="Enter amount"
                        value={loan.outstandingAmount || ''}
                        onChange={(e) =>
                          handleLoanUpdate(
                            index,
                            'outstandingAmount',
                            parseInt(e.target.value) || 0
                          )
                        }
                        required
                      />
                      <Input
                        label="EMI Amount"
                        type="number"
                        placeholder="Enter EMI"
                        value={loan.emi || ''}
                        onChange={(e) =>
                          handleLoanUpdate(
                            index,
                            'emi',
                            parseInt(e.target.value) || 0
                          )
                        }
                        required
                      />
                      <Select
                        label="EMI Frequency"
                        options={tenureOptions}
                        value={loan.tenure || 'monthly'}
                        onChange={(e) =>
                          handleLoanUpdate(index, 'tenure', e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Total EMI Summary */}
              {data.existingLoans.some((loan) => loan.emi > 0) && (
                <div className="flex justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="font-medium text-blue-800">
                    Total Monthly EMI Obligation
                  </span>
                  <span className="font-semibold text-blue-800">
                    {formatCurrency(totalEMI)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* No Existing Loans Message */}
          {hasExistingLoans === 'no' && (
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <svg
                className="w-8 h-8 text-green-500 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-green-700 font-medium">No existing loans</p>
              <p className="text-sm text-green-600">
                This improves your loan eligibility
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
