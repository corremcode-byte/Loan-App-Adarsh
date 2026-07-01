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
import { recommendLoanSlab, formatSlabAmount, SlabRecommendationResult } from '@/lib/loanSlabRecommendation';

const initialFormData: ApplicationFormData = {
  phoneNumber: '',
  isPhoneVerified: false,
  loanType: 'unsecured',
  firstName: '',
  middleName: '',
  lastName: '',
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
  cibilScore: 0,
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
  const [interestRate, setInterestRate] = useState(12);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResultType | null>(null);
  const [showEligibility, setShowEligibility] = useState(false);
  const [slabRecommendation, setSlabRecommendation] = useState<SlabRecommendationResult | null>(null);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const updateFormData = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

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

  // Scrolls to the first input that has a validation error after React re-renders.
  const scrollToFirstError = () => {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>('.border-red-400');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 50);
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'personal':
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
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
        if (!formData.monthlyIncome ||
            formData.monthlyIncome < (formData.occupation === 'business' ? 833333 : 35000))
          newErrors.monthlyIncome = formData.occupation === 'business'
            ? 'Annual turnover must be at least ₹1,00,00,000 (1 Crore)'
            : 'Monthly salary must be at least ₹35,000';
        if (formData.yearsOfExperience < 3)
          newErrors.yearsOfExperience = 'Minimum 3 years of experience required';
        if (!formData.cibilScore || formData.cibilScore < 700)
          newErrors.cibilScore = 'Minimum required CIBIL score is 700';
        break;

      case 'loan-details':
        if (!formData.loanAmount || formData.loanAmount < 50000)
          newErrors.loanAmount = 'Loan amount must be at least ₹50,000';
        if (!formData.loanPurpose) newErrors.loanPurpose = 'Loan purpose is required';
        if (!formData.preferredTenure) newErrors.preferredTenure = 'Tenure is required';
        if (!interestRate || interestRate < 10.5)
          newErrors.interestRate = 'Minimum expected interest rate is 10.5%';
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
    if (!validateStep()) {
      scrollToFirstError();
      return;
    }

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
        setSlabRecommendation(recommendLoanSlab(formData, data.eligibility.score));
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
              <Button onClick={handleNext} disabled={!formData.loanType} size="lg">
                Continue
              </Button>
            </div>
          </div>
        );

      case 'personal':
        return (
          <PersonalDetails
            data={{
              firstName: formData.firstName,
              middleName: formData.middleName,
              lastName: formData.lastName,
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
                cibilScore: formData.cibilScore,
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
              interestRate,
            }}
            onChange={updateFormData}
            onInterestRateChange={setInterestRate}
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

                {/* Loan slab recommendation — shown when the person doesn't qualify for the full amount */}
                {slabRecommendation && slabRecommendation.recommendedSlab < slabRecommendation.requestedAmount && (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F9BF4C]">
                        <svg className="h-5 w-5 text-[#162247]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-amber-900 mb-1">
                          {slabRecommendation.recommendedSlab === 0
                            ? 'No Offer Available'
                            : 'Alternative Offer Available'}
                        </h4>
                        <p className="text-sm text-amber-800 leading-relaxed mb-4">
                          {slabRecommendation.frontendMessage}
                        </p>

                        {slabRecommendation.recommendedSlab > 0 && (
                          <div className="mb-4 flex flex-wrap items-center gap-3">
                            <div className="rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-center min-w-[100px]">
                              <p className="text-xs font-medium text-amber-600 mb-0.5">We Can Offer</p>
                              <p className="text-lg font-bold text-amber-900">
                                {formatSlabAmount(slabRecommendation.recommendedSlab)}
                              </p>
                            </div>
                            <span className="text-amber-400 font-bold text-lg">vs</span>
                            <div className="rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-center min-w-[100px]">
                              <p className="text-xs font-medium text-amber-600 mb-0.5">You Requested</p>
                              <p className="text-lg font-bold text-amber-900">
                                {formatSlabAmount(slabRecommendation.requestedAmount)}
                              </p>
                            </div>
                            <div className="rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-center">
                              <p className="text-xs font-medium text-amber-600 mb-0.5">Coverage</p>
                              <p className="text-lg font-bold text-amber-900">
                                {slabRecommendation.percentageOfRequested}%
                              </p>
                            </div>
                          </div>
                        )}

                        {slabRecommendation.improvementTips.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
                              How to improve your offer
                            </p>
                            <ul className="space-y-1.5">
                              {slabRecommendation.improvementTips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900">
                                    {i + 1}
                                  </span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center gap-3 mt-6">
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => setShowEligibility(false)} disabled={loading}>
                      Edit Application
                    </Button>
                    <Button onClick={handleSubmit} loading={loading}>
                      Submit Application
                    </Button>
                  </div>
                  {loading && (
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5 text-[#223265]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting your application — please wait, don&apos;t close this page.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <Card>
                <h2 className="text-2xl font-bold text-[#1E293B] text-center mb-6">
                  Review Your Application
                </h2>
                <div className="space-y-6">
                  {/* Personal Info Summary */}
                  <div className="border-b border-slate-100 pb-5">
                    <h3 className="text-sm font-semibold text-[#223265] uppercase tracking-wide mb-3">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400">Name</span>
                        <p className="font-medium text-[#1E293B]">{`${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Phone</span>
                        <p className="font-medium text-[#1E293B]">+91 {formData.phoneNumber}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Email</span>
                        <p className="font-medium text-[#1E293B]">{formData.email}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Gender</span>
                        <p className="font-medium text-[#1E293B] capitalize">{formData.gender}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Info Summary */}
                  <div className="border-b border-slate-100 pb-5">
                    <h3 className="text-sm font-semibold text-[#223265] uppercase tracking-wide mb-3">
                      Financial Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400">Occupation</span>
                        <p className="font-medium text-[#1E293B] capitalize">{formData.occupation}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Monthly Income</span>
                        <p className="font-medium text-[#1E293B]">₹{formData.monthlyIncome.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Experience</span>
                        <p className="font-medium text-[#1E293B]">{formData.yearsOfExperience} years</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Existing Loans</span>
                        <p className="font-medium text-[#1E293B]">{formData.existingLoans.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Loan Info Summary */}
                  <div className="bg-[#223265]/5 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-[#223265] uppercase tracking-wide mb-3">
                      Loan Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400">Type</span>
                        <p className="font-medium text-[#1E293B] capitalize">{formData.loanType}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Amount</span>
                        <p className="font-semibold text-[#223265]">₹{formData.loanAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Tenure</span>
                        <p className="font-medium text-[#1E293B]">{formData.preferredTenure} months</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Expected EMI</span>
                        <p className="font-semibold text-[#223265]">₹{formData.expectedEMI.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <Button onClick={checkEligibility} loading={loading} size="lg">
                    Check Eligibility &amp; Submit
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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-[#223265] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-[#1E293B]">LoanEase</span>
            </Link>
            <Link href="/emi-calculator" className="text-sm text-[#223265] hover:text-[#31437F] font-medium transition-colors">
              EMI Calculator
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        {currentStep !== 'phone' && (
          <div className="mb-10">
            <div className="flex items-center justify-between">
              {steps.slice(1).map((step, index) => {
                const stepIndex = index + 1;
                const isCompleted = stepIndex < currentStepIndex;
                const isCurrent = steps[stepIndex].key === currentStep;
                const canNavigate = isCompleted;

                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => canNavigate && setCurrentStep(step.key)}
                        disabled={!canNavigate}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                          isCompleted
                            ? 'bg-[#223265] text-white hover:bg-[#31437F] cursor-pointer shadow-sm'
                            : isCurrent
                            ? 'bg-[#223265] text-white cursor-default ring-4 ring-[#223265]/15'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        title={canNavigate ? `Go back to ${step.label}` : ''}
                      >
                        {isCompleted ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          stepIndex
                        )}
                      </button>
                      <span
                        onClick={() => canNavigate && setCurrentStep(step.key)}
                        className={`text-xs font-medium ${
                          isCurrent
                            ? 'text-[#223265]'
                            : isCompleted
                            ? 'text-[#223265]/60 cursor-pointer hover:text-[#223265]'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 2 && (
                      <div
                        className={`flex-1 h-[2px] mx-1.5 rounded-full ${
                          isCompleted ? 'bg-[#223265]' : 'bg-slate-200'
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
