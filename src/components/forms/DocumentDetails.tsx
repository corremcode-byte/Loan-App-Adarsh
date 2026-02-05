'use client';

import React from 'react';
import Input from '@/components/ui/Input';
import { CardTitle, CardDescription } from '@/components/ui/Card';

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
      <div className="text-center mb-8">
        <CardTitle>Document Details</CardTitle>
        <CardDescription className="mt-2">
          Please provide your KYC document numbers
        </CardDescription>
      </div>

      <div className="space-y-6">
        <div>
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
        </div>

        <div>
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
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Why do we need these documents?
              </p>
              <p className="text-sm text-blue-600 mt-1">
                PAN and Aadhaar are mandatory for loan processing as per RBI
                guidelines. Your information is securely stored and used only
                for verification purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
