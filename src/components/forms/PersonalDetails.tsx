'use client';

import React from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import StepHeader from '@/components/apply/StepHeader';

interface PersonalDetailsProps {
  data: {
    firstName: string;
    middleName: string;
    lastName: string;
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
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-7 sm:p-9">
        <StepHeader
          title="Personal Details"
          description="Please provide your personal information"
        />

        <div className="space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="First Name"
              placeholder="First name"
              value={data.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              error={errors.firstName}
              required
            />
            <Input
              label="Middle Name"
              placeholder="Optional"
              value={data.middleName}
              onChange={(e) => onChange('middleName', e.target.value)}
              error={errors.middleName}
            />
            <Input
              label="Last Name"
              placeholder="Last name"
              value={data.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              error={errors.lastName}
            />
          </div>

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            error={errors.email}
            required
          />

          {/* Identity & Status section */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
              Identity &amp; Status
            </p>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
        </div>
      </div>
    </div>
  );
}
