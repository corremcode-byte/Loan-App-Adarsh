'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SiteHeader from '@/components/layout/SiteHeader';
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
import { validateFormStep } from '@/lib/formValidation';
import { validateGSTIN } from '@/lib/gstinValidation';

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
  hasExistingLoans: 'no',
  existingLoans: [],
  collateral: undefined,
  loanAmount: 0,
  loanPurpose: '',
  preferredTenure: 0,
  interestRate: 12,
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

// ── Draft persistence — Bug #27 ──────────────────────────────────────────────
// Not persisted: isPhoneVerified (auth state), panNumber/aadhaarNumber
// (government identity documents), expectedEMI (derived/calculated).

const DRAFT_STORAGE_KEY = 'loanease_apply_draft';
const DRAFT_VERSION = 'v1';
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function saveDraft(formData: ApplicationFormData): void {
  if (!formData.phoneNumber) return;
  try {
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        _version: DRAFT_VERSION,
        _savedAt: Date.now(),
        phoneNumber:       formData.phoneNumber,
        loanType:          formData.loanType,
        firstName:         formData.firstName,
        middleName:        formData.middleName,
        lastName:          formData.lastName,
        gender:            formData.gender,
        dateOfBirth:       formData.dateOfBirth,
        maritalStatus:     formData.maritalStatus,
        email:             formData.email,
        address:           { ...formData.address },
        occupation:        formData.occupation,
        employerName:      formData.employerName,
        monthlyIncome:     formData.monthlyIncome,
        yearsOfExperience: formData.yearsOfExperience,
        hasExistingLoans:  formData.hasExistingLoans,
        existingLoans:     formData.existingLoans.map((l) => ({ ...l })),
        collateral:        formData.collateral ? { ...formData.collateral } : undefined,
        loanAmount:        formData.loanAmount,
        loanPurpose:       formData.loanPurpose,
        preferredTenure:   formData.preferredTenure,
        interestRate:      formData.interestRate,
        cibilScore:        formData.cibilScore,
      })
    );
  } catch {
    // quota exceeded or storage unavailable — degrade silently
  }
}

function loadDraft(): Partial<ApplicationFormData> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const d = parsed as Record<string, unknown>;

    if (d._version !== DRAFT_VERSION) {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }
    if (typeof d._savedAt !== 'number' || Date.now() - d._savedAt > DRAFT_MAX_AGE_MS) {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }

    // Per-field validators — invalid values fall back to initialFormData defaults
    const str = (key: string, def = ''): string => {
      const v = d[key];
      return typeof v === 'string' ? v : def;
    };
    const safeNum = (key: string, def = 0): number => {
      const v = d[key];
      return typeof v === 'number' && isFinite(v) && v >= 0 ? v : def;
    };
    const oneOf = <T extends string>(key: string, allowed: readonly T[], def: T): T => {
      const v = d[key];
      return (allowed as readonly string[]).includes(v as string) ? (v as T) : def;
    };

    // Validate nested address object
    const rawAddr = d.address;
    let address = { ...initialFormData.address };
    if (rawAddr && typeof rawAddr === 'object' && !Array.isArray(rawAddr)) {
      const a = rawAddr as Record<string, unknown>;
      address = {
        street:  typeof a.street  === 'string' ? a.street  : '',
        city:    typeof a.city    === 'string' ? a.city    : '',
        state:   typeof a.state   === 'string' ? a.state   : '',
        pincode: typeof a.pincode === 'string' ? a.pincode : '',
      };
    }

    // Validate existingLoans array
    const TENURE_VALUES = ['monthly', 'quarterly', 'half-yearly', 'yearly'] as const;
    const existingLoans: ExistingLoan[] = Array.isArray(d.existingLoans)
      ? d.existingLoans
          .filter(
            (item): item is Record<string, unknown> =>
              item !== null && typeof item === 'object' && !Array.isArray(item)
          )
          .map((item) => ({
            loanType: typeof item.loanType === 'string' ? item.loanType : '',
            outstandingAmount:
              typeof item.outstandingAmount === 'number' &&
              isFinite(item.outstandingAmount) &&
              item.outstandingAmount >= 0
                ? item.outstandingAmount
                : 0,
            emi:
              typeof item.emi === 'number' && isFinite(item.emi) && item.emi >= 0
                ? item.emi
                : 0,
            tenure: (TENURE_VALUES as readonly string[]).includes(item.tenure as string)
              ? (item.tenure as ExistingLoan['tenure'])
              : 'monthly',
          }))
      : [];

    // Validate optional collateral object
    const rawCol = d.collateral;
    let collateral: Collateral | undefined;
    if (rawCol && typeof rawCol === 'object' && !Array.isArray(rawCol)) {
      const c = rawCol as Record<string, unknown>;
      const PROP_TYPES = ['residential', 'commercial', 'land', 'vehicle', 'gold', 'other'] as const;
      const OWN_VALUES  = ['self-owned', 'co-owned', 'parental'] as const;
      collateral = {
        propertyType: (PROP_TYPES as readonly string[]).includes(c.propertyType as string)
          ? (c.propertyType as Collateral['propertyType'])
          : 'residential',
        estimatedValue:
          typeof c.estimatedValue === 'number' &&
          isFinite(c.estimatedValue) &&
          c.estimatedValue >= 0
            ? c.estimatedValue
            : 0,
        ownershipStatus: (OWN_VALUES as readonly string[]).includes(c.ownershipStatus as string)
          ? (c.ownershipStatus as Collateral['ownershipStatus'])
          : 'self-owned',
        propertyAddress: typeof c.propertyAddress === 'string' ? c.propertyAddress : '',
      };
    }

    return {
      phoneNumber:       str('phoneNumber'),
      loanType:          oneOf('loanType',  ['secured', 'unsecured', ''] as const, '' as ApplicationFormData['loanType']),
      firstName:         str('firstName'),
      middleName:        str('middleName'),
      lastName:          str('lastName'),
      gender:            oneOf('gender', ['male', 'female', 'other', ''] as const, '' as ApplicationFormData['gender']),
      dateOfBirth:       str('dateOfBirth'),
      maritalStatus:     oneOf('maritalStatus', ['single', 'married', 'divorced', 'widowed', ''] as const, '' as ApplicationFormData['maritalStatus']),
      email:             str('email'),
      address,
      occupation:        oneOf('occupation', ['salaried', 'self-employed', 'business', 'retired', ''] as const, '' as ApplicationFormData['occupation']),
      employerName:      str('employerName'),
      monthlyIncome:     safeNum('monthlyIncome'),
      yearsOfExperience: safeNum('yearsOfExperience'),
      hasExistingLoans:  oneOf('hasExistingLoans', ['yes', 'no', ''] as const, 'no' as ApplicationFormData['hasExistingLoans']),
      existingLoans,
      collateral,
      loanAmount:        safeNum('loanAmount'),
      loanPurpose:       str('loanPurpose'),
      preferredTenure:   safeNum('preferredTenure'),
      interestRate:      safeNum('interestRate', 12),
      cibilScore:        safeNum('cibilScore'),
    };
  } catch {
    try { sessionStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* noop */ }
    return null;
  }
}

function clearDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch { /* noop */ }
}

export default function ApplyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>('phone');
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResultType | null>(null);
  const [showEligibility, setShowEligibility] = useState(false);
  const [slabRecommendation, setSlabRecommendation] = useState<SlabRecommendationResult | null>(null);

  // Lifted from FinancialDetails — needed in validateStep for submission-path GSTIN validation.
  const [gstinNumber, setGstinNumber] = useState('');

  const handleGstinChange = useCallback((value: string) => {
    setGstinNumber(value);
    setErrors((prev) => ({ ...prev, gstin: '' }));
  }, []);

  // Prevents the save effect from recreating the draft after a successful submission
  const submittedRef = useRef(false);

  // Restore draft on mount. sessionStorage is not available during SSR, so this
  // runs only on the client after hydration.
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setFormData({
      ...initialFormData,
      ...draft,
      // Excluded fields: always enforce defaults regardless of storage content
      isPhoneVerified: false,
      panNumber: initialFormData.panNumber,
      aadhaarNumber: initialFormData.aadhaarNumber,
      expectedEMI: initialFormData.expectedEMI,
    } as ApplicationFormData);
  }, []); // runs once on mount

  // Persist allowed fields on every formData change, unless already submitted
  useEffect(() => {
    if (submittedRef.current) return;
    saveDraft(formData);
  }, [formData]);

  // Warn before leaving a started, incomplete application
  useEffect(() => {
    if (!formData.phoneNumber) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [formData.phoneNumber]);

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
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 50);
  };

  const validateStep = (): boolean => {
    const newErrors = validateFormStep(currentStep, formData);
    if (currentStep === 'financial' && formData.occupation === 'business' && gstinNumber.trim()) {
      const gstinValidationError = validateGSTIN(gstinNumber);
      if (gstinValidationError) newErrors.gstin = gstinValidationError;
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
    const nextIndex = currentStepIndex + 1;

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
        submittedRef.current = true;
        clearDraft();
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
              hasExistingLoans={formData.hasExistingLoans}
              onHasExistingLoansChange={(value) => updateFormData('hasExistingLoans', value)}
              onChange={updateFormData}
              errors={errors}
              gstinNumber={gstinNumber}
              onGstinChange={handleGstinChange}
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
              interestRate: formData.interestRate,
            }}
            onChange={updateFormData}
            onInterestRateChange={(rate) => updateFormData('interestRate', rate)}
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

                        {/* Binding constraint explanation (Bug 12) */}
                        {(() => {
                          const { bindingConstraint, foirReason, ltiReason, turnoverReason, collateralReason, cibilReason, scoreReason } = slabRecommendation.reasoning;
                          const constraintReasonMap: Record<string, string | null> = {
                            FOIR: foirReason,
                            LTI: ltiReason,
                            Turnover: turnoverReason,
                            Collateral: collateralReason,
                            CIBIL: cibilReason,
                            Score: scoreReason,
                          };
                          const constraintReason = constraintReasonMap[bindingConstraint];
                          if (!constraintReason) return null;
                          return (
                            <div className="mb-4 p-3 bg-amber-100 rounded-lg border border-amber-200">
                              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
                                Why this amount? — {bindingConstraint} limit applied
                              </p>
                              <p className="text-xs text-amber-800">{constraintReason}</p>
                            </div>
                          );
                        })()}

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
                      <div className="min-w-0">
                        <span className="text-slate-400">Occupation</span>
                        <p className="font-medium text-[#1E293B] capitalize">{formData.occupation}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400">Monthly Income</span>
                        <p className="font-medium text-[#1E293B] break-all">₹{formData.monthlyIncome.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400">Experience</span>
                        <p className="font-medium text-[#1E293B]">{formData.yearsOfExperience} years</p>
                      </div>
                      <div className="min-w-0">
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
                      <div className="min-w-0">
                        <span className="text-slate-400">Type</span>
                        <p className="font-medium text-[#1E293B] capitalize">{formData.loanType}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400">Amount</span>
                        <p className="font-semibold text-[#223265] break-all">₹{formData.loanAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400">Purpose</span>
                        <p className="font-medium text-[#1E293B] capitalize">{formData.loanPurpose.replace(/-/g, ' ')}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400">Tenure</span>
                        <p className="font-medium text-[#1E293B]">{formData.preferredTenure} months</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400">Interest Rate</span>
                        <p className="font-medium text-[#1E293B]">{formData.interestRate}% p.a.</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400">Expected EMI</span>
                        <p className="font-semibold text-[#223265] break-all">₹{formData.expectedEMI.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Collateral Summary (secured loans only) */}
                  {formData.loanType === 'secured' && formData.collateral && (
                    <div className="rounded-xl p-5 border border-slate-200">
                      <h3 className="text-sm font-semibold text-[#223265] uppercase tracking-wide mb-3">
                        Collateral Details
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="min-w-0">
                          <span className="text-slate-400">Property Type</span>
                          <p className="font-medium text-[#1E293B] capitalize">{formData.collateral.propertyType}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-400">Estimated Value</span>
                          <p className="font-medium text-[#1E293B] break-all">₹{formData.collateral.estimatedValue.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-400">Ownership</span>
                          <p className="font-medium text-[#1E293B] capitalize">{formData.collateral.ownershipStatus.replace(/-/g, ' ')}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-400">Coverage vs Loan</span>
                          <p className={`font-medium ${formData.collateral.estimatedValue >= formData.loanAmount ? 'text-green-700' : 'text-red-600'}`}>
                            {formData.collateral.estimatedValue >= formData.loanAmount ? 'Sufficient' : 'Insufficient'} ({Math.round((formData.collateral.estimatedValue / formData.loanAmount) * 100)}%)
                          </p>
                        </div>
                        {formData.collateral.propertyAddress && (
                          <div className="col-span-2 min-w-0">
                            <span className="text-slate-400">Property Address</span>
                            <p className="font-medium text-[#1E293B] break-words">{formData.collateral.propertyAddress}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
    <div className="min-h-screen bg-surface">
      <SiteHeader variant="apply" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        {currentStep !== 'phone' && (
          <div className="mb-10">
            {/* Desktop stepper — full step indicators */}
            <div className="hidden md:flex items-center justify-between">
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
                            ? 'bg-navy text-white hover:bg-navy-hover cursor-pointer shadow-sm'
                            : isCurrent
                            ? 'bg-navy text-white cursor-default ring-2 ring-offset-2 ring-navy/60'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
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
                            ? 'text-navy font-semibold'
                            : isCompleted
                            ? 'text-navy/60 cursor-pointer hover:text-navy'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 2 && (
                      <div
                        className={`flex-1 h-[2px] mx-1.5 rounded-full ${
                          isCompleted ? 'bg-navy' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Mobile stepper — compact "Step X of Y" + progress bar */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-semibold text-foreground">
                  Step {currentStepIndex} of {steps.length - 1}
                </span>
                <span className="text-sm font-medium text-navy">
                  {steps[currentStepIndex]?.label}
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy rounded-full transition-all duration-300"
                  style={{
                    width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="animate-fadeIn">{renderStepContent()}</div>

        {/* Navigation Buttons */}
        {!['phone', 'loan-type', 'review'].includes(currentStep) && (
          <div className="mt-8 max-w-2xl mx-auto border-t border-slate-100 pt-6 flex justify-between">
            <Button variant="outline" size="lg" onClick={handleBack}>
              Back
            </Button>
            <Button size="lg" onClick={handleNext}>Continue</Button>
          </div>
        )}
      </main>
    </div>
  );
}
