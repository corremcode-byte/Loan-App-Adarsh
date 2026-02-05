'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PhoneVerification from '@/components/forms/PhoneVerification';
import LoanTypeSelector from '@/components/forms/LoanTypeSelector';
import PersonalDetails from '@/components/forms/PersonalDetails';
import AddressDetails from '@/components/forms/AddressDetails';
import DocumentDetails from '@/components/forms/DocumentDetails';
import FinancialDetails from '@/components/forms/FinancialDetails';
import CollateralDetails from '@/components/forms/CollateralDetails';
import LoanDetails from '@/components/forms/LoanDetails';
import EligibilityResult from '@/components/EligibilityResult';
import { ApplicationFormData, Collateral, ExistingLoan, EligibilityResult as EligibilityResultType, FormStep } from '@/types';

const initialFormData: ApplicationFormData = {
  phoneNumber: '',
  isPhoneVerified: false,
  loanType: 'unsecured',
  fullName: '',
  gender: '',
  dateOfBirth: '',
  maritalStatus: '',
  email: '',
  address: {
    street: '',
    city: '',
    state: '',
    pincode: '',
  },
  panNumber: '',
  aadhaarNumber: '',
  occupation: '',
  employerName: '',
  monthlyIncome: 0,
  yearsOfExperience: 0,
  existingLoans: [],
  collateral: undefined,
  loanAmount: 0,
  loanPurpose: '',
  preferredTenure: 12,
  expectedEMI: 0,
};

const steps: { key: FormStep; label: string }[] = [
  { key: 'phone', label: 'Phone' },
  { key: 'loan-type', label: 'Type' },
  { key: 'personal', label: 'Personal' },
  { key: 'address', label: 'Address' },
  { key: 'documents', label: 'Documents' },
  { key: 'financial', label: 'Financial' },
  { key: 'loan-details', label: 'Loan' },
  { key: 'review', label: 'Review' },
];

export default function ApplyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>('phone');
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResultType | null>(null);
  const [showEligibility, setShowEligibility] = useState(false);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const updateAddressField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const updateCollateralField = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      collateral: {
        ...(prev.collateral || {
          propertyType: 'residential',
          estimatedValue: 0,
          ownershipStatus: 'self-owned',
          propertyAddress: '',
        }),
        [field]: value,
      } as Collateral,
    }));
  };

  const handleEMIChange = useCallback((emi: number) => {
    setFormData((prev) => ({
      ...prev,
      expectedEMI: emi,
    }));
  }, []);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'personal':
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
          newErrors.email = 'Invalid email format';
        if (!formData.gender) newErrors.gender = 'Please select gender';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.maritalStatus) newErrors.maritalStatus = 'Please select marital status';
        break;

      case 'address':
        if (!formData.address.street.trim()) newErrors.street = 'Street address is required';
        if (!formData.address.city.trim()) newErrors.city = 'City is required';
        if (!formData.address.state) newErrors.state = 'State is required';
        if (!formData.address.pincode || formData.address.pincode.length !== 6)
          newErrors.pincode = 'Valid 6-digit PIN code is required';
        break;

      case 'documents':
        if (!formData.panNumber || formData.panNumber.length !== 10)
          newErrors.panNumber = 'Valid 10-character PAN is required';
        const aadhaar = formData.aadhaarNumber.replace(/\s/g, '');
        if (!aadhaar || aadhaar.length !== 12)
          newErrors.aadhaarNumber = 'Valid 12-digit Aadhaar is required';
        break;

      case 'financial':
        if (!formData.occupation) newErrors.occupation = 'Occupation is required';
        if (!formData.employerName.trim()) newErrors.employerName = 'Employer name is required';
        if (!formData.monthlyIncome || formData.monthlyIncome < 10000)
          newErrors.monthlyIncome = 'Monthly income must be at least ₹10,000';
        if (formData.yearsOfExperience < 0) newErrors.yearsOfExperience = 'Invalid experience';
        break;

      case 'loan-details':
        if (!formData.loanAmount || formData.loanAmount < 50000)
          newErrors.loanAmount = 'Loan amount must be at least ₹50,000';
        if (!formData.loanPurpose) newErrors.loanPurpose = 'Loan purpose is required';
        if (!formData.preferredTenure) newErrors.preferredTenure = 'Tenure is required';
        break;
    }

    // Validate collateral for secured loans
    if (currentStep === 'financial' && formData.loanType === 'secured') {
      if (!formData.collateral?.propertyType) newErrors.propertyType = 'Property type is required';
      if (!formData.collateral?.estimatedValue || formData.collateral.estimatedValue < 100000)
        newErrors.estimatedValue = 'Valid estimated value is required';
      if (!formData.collateral?.ownershipStatus) newErrors.ownershipStatus = 'Ownership status is required';
      if (!formData.collateral?.propertyAddress?.trim())
        newErrors.propertyAddress = 'Property address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    const stepKeys = steps.map((s) => s.key);
    let nextIndex = currentStepIndex + 1;

    // Skip collateral step for unsecured loans (it's embedded in financial step)
    while (nextIndex < stepKeys.length) {
      setCurrentStep(stepKeys[nextIndex]);
      break;
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const checkEligibility = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.eligibility) {
        setEligibilityResult(data.eligibility);
        setShowEligibility(true);
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          aadhaarNumber: formData.aadhaarNumber.replace(/\s/g, ''),
        }),
      });
      const data = await response.json();
      if (data.success) {
        router.push('/thank-you');
      } else {
        alert('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'phone':
        return (
          <PhoneVerification
            phoneNumber={formData.phoneNumber}
            onPhoneChange={(phone) => updateFormData('phoneNumber', phone)}
            onVerified={() => {
              updateFormData('isPhoneVerified', true);
              setCurrentStep('loan-type');
            }}
          />
        );

      case 'loan-type':
        return (
          <div>
            <LoanTypeSelector
              selectedType={formData.loanType as 'secured' | 'unsecured' | ''}
              onSelect={(type) => updateFormData('loanType', type)}
            />
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleNext}
                disabled={!formData.loanType}
                size="lg"
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 'personal':
        return (
          <PersonalDetails
            data={{
              fullName: formData.fullName,
              gender: formData.gender as 'male' | 'female' | 'other' | '',
              dateOfBirth: formData.dateOfBirth,
              maritalStatus: formData.maritalStatus as 'single' | 'married' | 'divorced' | 'widowed' | '',
              email: formData.email,
            }}
            onChange={updateFormData}
            errors={errors}
          />
        );

      case 'address':
        return (
          <AddressDetails
            data={formData.address}
            onChange={updateAddressField}
            errors={errors}
          />
        );

      case 'documents':
        return (
          <DocumentDetails
            data={{
              panNumber: formData.panNumber,
              aadhaarNumber: formData.aadhaarNumber,
            }}
            onChange={updateFormData}
            errors={errors}
          />
        );

      case 'financial':
        return (
          <div className="space-y-8">
            <FinancialDetails
              data={{
                occupation: formData.occupation as 'salaried' | 'self-employed' | 'business' | 'retired' | '',
                employerName: formData.employerName,
                monthlyIncome: formData.monthlyIncome,
                yearsOfExperience: formData.yearsOfExperience,
                existingLoans: formData.existingLoans as ExistingLoan[],
              }}
              onChange={updateFormData}
              errors={errors}
            />
            {formData.loanType === 'secured' && (
              <div className="border-t pt-8">
                <CollateralDetails
                  data={
                    formData.collateral || {
                      propertyType: 'residential',
                      estimatedValue: 0,
                      ownershipStatus: 'self-owned',
                      propertyAddress: '',
                    }
                  }
                  onChange={updateCollateralField}
                  errors={errors}
                />
              </div>
            )}
          </div>
        );

      case 'loan-details':
        return (
          <LoanDetails
            data={{
              loanAmount: formData.loanAmount,
              loanPurpose: formData.loanPurpose,
              preferredTenure: formData.preferredTenure,
            }}
            onChange={updateFormData}
            onEMIChange={handleEMIChange}
            errors={errors}
            loanType={formData.loanType as 'secured' | 'unsecured'}
          />
        );

      case 'review':
        return (
          <div className="max-w-2xl mx-auto">
            {showEligibility && eligibilityResult ? (
              <div className="mb-8">
                <EligibilityResult result={eligibilityResult} />
                <div className="flex gap-4 justify-center mt-6">
                  <Button variant="outline" onClick={() => setShowEligibility(false)}>
                    Edit Application
                  </Button>
                  <Button onClick={handleSubmit} loading={loading}>
                    Submit Application
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
                  Review Your Application
                </h2>
                <div className="space-y-6">
                  {/* Personal Info Summary */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>{' '}
                        <span className="font-medium">{formData.fullName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>{' '}
                        <span className="font-medium">+91 {formData.phoneNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>{' '}
                        <span className="font-medium">{formData.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Gender:</span>{' '}
                        <span className="font-medium capitalize">{formData.gender}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Info Summary */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Financial Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Occupation:</span>{' '}
                        <span className="font-medium capitalize">{formData.occupation}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Monthly Income:</span>{' '}
                        <span className="font-medium">₹{formData.monthlyIncome.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Experience:</span>{' '}
                        <span className="font-medium">{formData.yearsOfExperience} years</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Existing Loans:</span>{' '}
                        <span className="font-medium">{formData.existingLoans.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Loan Info Summary */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-3">Loan Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600">Type:</span>{' '}
                        <span className="font-medium capitalize">{formData.loanType}</span>
                      </div>
                      <div>
                        <span className="text-blue-600">Amount:</span>{' '}
                        <span className="font-medium">₹{formData.loanAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-blue-600">Tenure:</span>{' '}
                        <span className="font-medium">{formData.preferredTenure} months</span>
                      </div>
                      <div>
                        <span className="text-blue-600">Expected EMI:</span>{' '}
                        <span className="font-medium">₹{formData.expectedEMI.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <Button onClick={checkEligibility} loading={loading} size="lg">
                    Check Eligibility & Submit
                  </Button>
                </div>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">LoanEase</span>
            </Link>
            <Link href="/emi-calculator" className="text-blue-600 hover:underline text-sm">
              EMI Calculator
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        {currentStep !== 'phone' && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.slice(1).map((step, index) => {
                const stepIndex = index + 1;
                const isCompleted = stepIndex < currentStepIndex;
                const isCurrent = steps[stepIndex].key === currentStep;
                const canNavigate = isCompleted; // Can click on completed steps to go back

                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => canNavigate && setCurrentStep(step.key)}
                        disabled={!canNavigate}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          isCompleted
                            ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                            : isCurrent
                            ? 'bg-blue-600 text-white cursor-default'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                        title={canNavigate ? `Go back to ${step.label}` : ''}
                      >
                        {isCompleted ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          stepIndex
                        )}
                      </button>
                      <span
                        onClick={() => canNavigate && setCurrentStep(step.key)}
                        className={`text-xs mt-1 ${
                          isCurrent
                            ? 'text-blue-600 font-medium'
                            : isCompleted
                            ? 'text-green-600 cursor-pointer hover:underline'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 2 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="animate-fadeIn">{renderStepContent()}</div>

        {/* Navigation Buttons */}
        {!['phone', 'loan-type', 'review'].includes(currentStep) && (
          <div className="flex justify-between mt-8 max-w-2xl mx-auto">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleNext}>Continue</Button>
          </div>
        )}
      </main>
    </div>
  );
}
