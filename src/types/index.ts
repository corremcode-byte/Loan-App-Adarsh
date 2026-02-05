export interface ExistingLoan {
  loanType: string;
  outstandingAmount: number;
  emi: number;
  tenure: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
}

export interface Collateral {
  propertyType: 'residential' | 'commercial' | 'land' | 'vehicle' | 'gold' | 'other';
  estimatedValue: number;
  ownershipStatus: 'self-owned' | 'co-owned' | 'parental';
  propertyAddress: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ApplicationFormData {
  phoneNumber: string;
  isPhoneVerified: boolean;
  loanType: 'secured' | 'unsecured' | '';

  // Personal Details
  fullName: string;
  gender: 'male' | 'female' | 'other' | '';
  dateOfBirth: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | '';
  email: string;

  // Address
  address: Address;

  // Documents
  panNumber: string;
  aadhaarNumber: string;

  // Financial Details
  occupation: 'salaried' | 'self-employed' | 'business' | 'retired' | '';
  employerName: string;
  monthlyIncome: number;
  yearsOfExperience: number;

  // Loan History
  existingLoans: ExistingLoan[];

  // Collateral Details (for secured loans)
  collateral?: Collateral;

  // Loan Request
  loanAmount: number;
  loanPurpose: string;
  preferredTenure: number;

  // Calculated Fields
  expectedEMI: number;
}

export interface Application extends ApplicationFormData {
  _id: string;
  eligibilityScore: number;
  eligibilityStatus: 'pending' | 'likely_approved' | 'likely_rejected';
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface EligibilityResult {
  score: number;
  status: 'likely_approved' | 'likely_rejected';
  reasons: string[];
  recommendations: string[];
}

export interface EMICalculation {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  frequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
}

export type FormStep =
  | 'phone'
  | 'loan-type'
  | 'personal'
  | 'address'
  | 'documents'
  | 'financial'
  | 'loan-details'
  | 'review';
