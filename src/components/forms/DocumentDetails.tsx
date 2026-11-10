'use client';

import React from 'react';
import Input from '@/components/ui/Input';
import StepHeader from '@/components/apply/StepHeader';

interface DocumentDetailsProps {
  data: {
    panNumber: string;
    aadhaarNumber: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export default function DocumentDetails({
  data,
  onChange,
  errors = {},
}: DocumentDetailsProps) {
  const formatPAN = (value: string) => {
    // PAN format: AAAAA0000A (5 letters, 4 numbers, 1 letter)
    return value.toUpperCase().slice(0, 10);
  };

  const formatAadhaar = (value: string) => {
    // Aadhaar format: 0000 0000 0000 (12 digits)
    const numbers = value.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < numbers.length; i += 4) {
      parts.push(numbers.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-7 sm:p-9">
        <StepHeader
          title="Document Details"
          description="Please provide your KYC document numbers"
        />

        <div className="space-y-5">
          <Input
            label="PAN Number"
            placeholder="AAAAA0000A"
            value={data.panNumber}
            onChange={(e) => onChange('panNumber', formatPAN(e.target.value))}
            error={errors.panNumber}
            helperText="Permanent Account Number (10 characters)"
            maxLength={10}
            required
          />

          <Input
            label="Aadhaar Number"
            placeholder="0000 0000 0000"
            value={data.aadhaarNumber}
            onChange={(e) =>
              onChange('aadhaarNumber', formatAadhaar(e.target.value))
            }
            error={errors.aadhaarNumber}
            helperText="12-digit Aadhaar number"
            maxLength={14}
            required
          />

          {/* Info box — navy-tinted to match the premium theme */}
          <div className="bg-navy/[0.04] border border-navy/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-navy/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-navy"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Why do we need these documents?
                </p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  PAN and Aadhaar are mandatory for loan processing as per RBI
                  guidelines. Your information is securely stored and used only
                  for verification purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
