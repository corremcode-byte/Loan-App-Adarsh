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
    cibilScore: number;
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

  // Local display state for business annual turnover.
  // The parent stores the monthly equivalent (annualTurnover / 12) in monthlyIncome.
  const [annualTurnover, setAnnualTurnover] = React.useState<number>(() => {
    return data.occupation === 'business' && data.monthlyIncome > 0
      ? data.monthlyIncome * 12
      : 0;
  });

  // GSTIN verification — local UI state only, no API integration yet.
  const [gstinNumber, setGstinNumber] = React.useState('');
  const [gstinVerified, setGstinVerified] = React.useState(false);
  const [gstinVerifying, setGstinVerifying] = React.useState(false);

  // Track previous occupation so we can reset income + GSTIN on occupation change.
  const prevOccupationRef = React.useRef(data.occupation);

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

  // Reset income and GSTIN state whenever the user switches occupation type.
  useEffect(() => {
    if (data.occupation !== prevOccupationRef.current) {
      prevOccupationRef.current = data.occupation;
      setAnnualTurnover(0);
      onChange('monthlyIncome', 0);
      setGstinNumber('');
      setGstinVerified(false);
      setGstinVerifying(false);
    }
  }, [data.occupation, onChange]);

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
        onChange('existingLoans', currentLoans.slice(0, loanCount));
      }
    }
  }, [loanCount, hasExistingLoans]);

  const handleLoanUpdate = (
    index: number,
    field: keyof ExistingLoan,
    value: string | number
  ) => {
    const updatedLoans = [...data.existingLoans];
    updatedLoans[index] = { ...updatedLoans[index], [field]: value };
    onChange('existingLoans', updatedLoans);
  };

  // TODO: Replace this simulation with a real GSTIN verification API call.
  // Expected integration point:
  //   POST /api/verify-gstin  { gstin: gstinNumber }
  //   Response: { verified: boolean, businessName: string, businessAge: number, registrationDate: string }
  // On success: setGstinVerified(true) and store the API response fields.
  // On failure: display the API error message inline.
  const handleVerifyGstin = () => {
    if (!gstinNumber.trim()) return;
    setGstinVerifying(true);
    setGstinVerified(false);
    setTimeout(() => {
      setGstinVerifying(false);
      setGstinVerified(true);
    }, 1200);
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

        {/* ── GSTIN Verification — Business applicants only ── */}
        {data.occupation === 'business' && (
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <h4 className="text-base font-medium text-gray-900 mb-3">
              GSTIN Verification
            </h4>

            {/* GSTIN input + Verify button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  label="GSTIN Number"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={gstinNumber}
                  onChange={(e) => {
                    setGstinNumber(e.target.value.toUpperCase());
                    // Reset verification if the user edits the GSTIN after verifying
                    if (gstinVerified) setGstinVerified(false);
                  }}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleVerifyGstin}
                  disabled={!gstinNumber.trim() || gstinVerifying}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {gstinVerifying ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify GSTIN'
                  )}
                </button>
              </div>
            </div>

            {/* Verification result — shown after successful simulation */}
            {gstinVerified && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-green-700">
                    Business Verified
                  </span>
                </div>
                {/* TODO: Replace the placeholder value below with businessAge from the API response */}
                <p className="text-sm text-green-600 ml-7">
                  Business Age:{' '}
                  <span className="font-medium">4 Years</span>
                </p>
              </div>
            )}

            {/* Business age requirement — informational notice, always visible for business owners */}
            <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <svg
                className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-blue-700">
                Business must be at least 3 years old to be eligible for loan approval.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── Income field — label and value handling change based on occupation ── */}
          {data.occupation === 'business' ? (
            <Input
              label="Annual Turnover"
              type="number"
              placeholder="Enter annual turnover"
              value={annualTurnover || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setAnnualTurnover(val);
                // Store the monthly equivalent so eligibility calculations work correctly
                onChange('monthlyIncome', Math.round(val / 12));
              }}
              error={errors.monthlyIncome}
              helperText="Annual business turnover in INR (minimum ₹1,00,00,000)"
              required
            />
          ) : (
            <Input
              label={data.occupation === 'salaried' ? 'Monthly Salary' : 'Monthly Income'}
              type="number"
              placeholder={
                data.occupation === 'salaried'
                  ? 'Enter monthly salary'
                  : 'Enter monthly income'
              }
              value={data.monthlyIncome || ''}
              onChange={(e) =>
                onChange('monthlyIncome', parseInt(e.target.value) || 0)
              }
              error={errors.monthlyIncome}
              helperText={
                data.occupation === 'salaried'
                  ? 'Net monthly salary in INR (minimum ₹35,000)'
                  : 'Net monthly income in INR (minimum ₹35,000)'
              }
              required
            />
          )}

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
                ? 'Years in business (minimum 3)'
                : 'Total work experience (minimum 3 years)'
            }
            min={0}
            required
          />
        </div>

        {/* ── Existing Loans Section ── */}
        <div className="border-t pt-6">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Existing Loans
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              Do you have any existing loans or EMIs?
            </p>

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
                      {/* Outstanding Loan Amount — with information tooltip */}
                      <div>
                        <label
                          htmlFor={`outstanding-amount-${index}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Outstanding Loan Amount
                          <span className="text-red-500 ml-1">*</span>
                          {/* Info icon + tooltip */}
                          <span className="relative inline-block ml-1.5 align-middle group">
                            <svg
                              className="w-4 h-4 text-gray-400 cursor-help"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 text-center shadow-lg">
                              Outstanding Loan Amount is the remaining amount that is still left to be repaid on your existing loan.
                              {/* Downward arrow */}
                              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                            </span>
                          </span>
                        </label>
                        <Input
                          id={`outstanding-amount-${index}`}
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
                      </div>

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

        {/* ── CIBIL Score Section ── */}
        <div className="border-t pt-6">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              CIBIL Score
            </h4>
            <p className="text-sm text-gray-500">
              Enter your credit score. A score of 700 or above is required to proceed.
            </p>
          </div>

          <Input
            label="CIBIL Score"
            type="number"
            placeholder="Enter your CIBIL score (300–900)"
            value={data.cibilScore || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              onChange('cibilScore', val > 900 ? 900 : val);
            }}
            error={errors.cibilScore}
            helperText="Your credit score from CIBIL, ranges from 300 to 900"
            min={300}
            max={900}
            required
          />

          {/* Success — score meets the threshold */}
          {data.cibilScore >= 700 && (
            <div className="mt-3 flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0"
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
              <p className="text-sm font-medium text-green-700">
                Your CIBIL score meets the minimum requirement. You may continue.
              </p>
            </div>
          )}

          {/* Warning — score entered but below threshold.
              Hidden once the parent sets errors.cibilScore (red Input error takes over). */}
          {data.cibilScore > 0 && data.cibilScore < 700 && !errors.cibilScore && (
            <div className="mt-3 flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
              <svg
                className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm text-yellow-700">
                Minimum required CIBIL score is 700. Your current score of{' '}
                <span className="font-semibold">{data.cibilScore}</span> does not meet
                this requirement.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
