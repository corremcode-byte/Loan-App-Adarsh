'use client';

import React from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import StepHeader from '@/components/apply/StepHeader';
import { Address } from '@/types';

interface AddressDetailsProps {
  data: Address;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export default function AddressDetails({
  data,
  onChange,
  errors = {},
}: AddressDetailsProps) {
  const indianStates = [
    { value: 'andhra-pradesh', label: 'Andhra Pradesh' },
    { value: 'arunachal-pradesh', label: 'Arunachal Pradesh' },
    { value: 'assam', label: 'Assam' },
    { value: 'bihar', label: 'Bihar' },
    { value: 'chhattisgarh', label: 'Chhattisgarh' },
    { value: 'goa', label: 'Goa' },
    { value: 'gujarat', label: 'Gujarat' },
    { value: 'haryana', label: 'Haryana' },
    { value: 'himachal-pradesh', label: 'Himachal Pradesh' },
    { value: 'jharkhand', label: 'Jharkhand' },
    { value: 'karnataka', label: 'Karnataka' },
    { value: 'kerala', label: 'Kerala' },
    { value: 'madhya-pradesh', label: 'Madhya Pradesh' },
    { value: 'maharashtra', label: 'Maharashtra' },
    { value: 'manipur', label: 'Manipur' },
    { value: 'meghalaya', label: 'Meghalaya' },
    { value: 'mizoram', label: 'Mizoram' },
    { value: 'nagaland', label: 'Nagaland' },
    { value: 'odisha', label: 'Odisha' },
    { value: 'punjab', label: 'Punjab' },
    { value: 'rajasthan', label: 'Rajasthan' },
    { value: 'sikkim', label: 'Sikkim' },
    { value: 'tamil-nadu', label: 'Tamil Nadu' },
    { value: 'telangana', label: 'Telangana' },
    { value: 'tripura', label: 'Tripura' },
    { value: 'uttar-pradesh', label: 'Uttar Pradesh' },
    { value: 'uttarakhand', label: 'Uttarakhand' },
    { value: 'west-bengal', label: 'West Bengal' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'chandigarh', label: 'Chandigarh' },
    { value: 'puducherry', label: 'Puducherry' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-7 sm:p-9">
        <StepHeader
          title="Address Details"
          description="Please provide your current residential address"
        />

        <div className="space-y-5">
          {/* Full-width street */}
          <Input
            label="Street Address"
            placeholder="House/Flat No., Building Name, Street"
            value={data.street}
            onChange={(e) => onChange('street', e.target.value)}
            error={errors.street}
            required
          />

          {/* City + State side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="City"
              placeholder="Enter your city"
              value={data.city}
              onChange={(e) => onChange('city', e.target.value)}
              error={errors.city}
              required
            />
            <Select
              label="State"
              options={indianStates}
              value={data.state}
              onChange={(e) => onChange('state', e.target.value)}
              error={errors.state}
              required
            />
          </div>

          {/* PIN Code — narrower field, only 6 digits */}
          <div className="max-w-[14rem]">
            <Input
              label="PIN Code"
              placeholder="6-digit PIN code"
              value={data.pincode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                onChange('pincode', value);
              }}
              error={errors.pincode}
              maxLength={6}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}
