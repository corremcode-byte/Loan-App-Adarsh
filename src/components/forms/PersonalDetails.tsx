'use client';

import React from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { CardTitle, CardDescription } from '@/components/ui/Card';

interface PersonalDetailsProps {
  data: {
    fullName: string;
    gender: string;
    dateOfBirth: string;
    maritalStatus: string;
    email: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export default function PersonalDetails({
  data,
  onChange,
  errors = {},
}: PersonalDetailsProps) {
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const maritalStatusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
  ];

  // Calculate max date (18 years ago) and min date (70 years ago)
  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .split('T')[0];
  const minDate = new Date(
    today.getFullYear() - 70,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <CardTitle>Personal Details</CardTitle>
        <CardDescription className="mt-2">
          Please provide your personal information
        </CardDescription>
      </div>

      <div className="space-y-6">
        <Input
          label="Full Name (as per PAN)"
          placeholder="Enter your full name"
          value={data.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
          error={errors.fullName}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          error={errors.email}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Gender"
            options={genderOptions}
            value={data.gender}
            onChange={(e) => onChange('gender', e.target.value)}
            error={errors.gender}
            required
          />

          <Input
            label="Date of Birth"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            error={errors.dateOfBirth}
            max={maxDate}
            min={minDate}
            required
          />
        </div>

        <Select
          label="Marital Status"
          options={maritalStatusOptions}
          value={data.maritalStatus}
          onChange={(e) => onChange('maritalStatus', e.target.value)}
          error={errors.maritalStatus}
          required
        />
      </div>
    </div>
  );
}
