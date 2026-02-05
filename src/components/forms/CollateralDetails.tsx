'use client';

import React from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { CardTitle, CardDescription } from '@/components/ui/Card';
import { Collateral } from '@/types';

interface CollateralDetailsProps {
  data: Collateral;
  onChange: (field: string, value: string | number) => void;
  errors?: Record<string, string>;
}

export default function CollateralDetails({
  data,
  onChange,
  errors = {},
}: CollateralDetailsProps) {
  const propertyTypeOptions = [
    { value: 'residential', label: 'Residential Property' },
    { value: 'commercial', label: 'Commercial Property' },
    { value: 'land', label: 'Land/Plot' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'gold', label: 'Gold/Jewelry' },
    { value: 'other', label: 'Other' },
  ];

  const ownershipOptions = [
    { value: 'self-owned', label: 'Self Owned' },
    { value: 'co-owned', label: 'Co-owned' },
    { value: 'parental', label: 'Parental Property' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <CardTitle>Collateral Details</CardTitle>
        <CardDescription className="mt-2">
          Please provide details about the collateral for your secured loan
        </CardDescription>
      </div>

      <div className="space-y-6">
        <Select
          label="Property/Collateral Type"
          options={propertyTypeOptions}
          value={data.propertyType}
          onChange={(e) => onChange('propertyType', e.target.value)}
          error={errors.propertyType}
          required
        />

        <Input
          label="Estimated Value"
          type="number"
          placeholder="Enter estimated value in INR"
          value={data.estimatedValue || ''}
          onChange={(e) =>
            onChange('estimatedValue', parseInt(e.target.value) || 0)
          }
          error={errors.estimatedValue}
          helperText="Current market value of the collateral"
          required
        />

        <Select
          label="Ownership Status"
          options={ownershipOptions}
          value={data.ownershipStatus}
          onChange={(e) => onChange('ownershipStatus', e.target.value)}
          error={errors.ownershipStatus}
          required
        />

        <Input
          label="Property/Collateral Address"
          placeholder="Enter the address of the collateral"
          value={data.propertyAddress}
          onChange={(e) => onChange('propertyAddress', e.target.value)}
          error={errors.propertyAddress}
          helperText="Full address where the collateral is located"
          required
        />

        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Important Note
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                The collateral will be subject to valuation by our team. The
                final loan amount may vary based on the actual valuation.
                Property documents will be required for verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
