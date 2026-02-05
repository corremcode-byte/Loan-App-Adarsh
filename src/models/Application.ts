import mongoose, { Schema, Document } from 'mongoose';

export interface IExistingLoan {
  loanType: string;
  outstandingAmount: number;
  emi: number;
}

export interface ICollateral {
  propertyType: 'residential' | 'commercial' | 'land' | 'vehicle' | 'gold' | 'other';
  estimatedValue: number;
  ownershipStatus: 'self-owned' | 'co-owned' | 'parental';
  propertyAddress: string;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IApplication extends Document {
  phoneNumber: string;
  isPhoneVerified: boolean;
  loanType: 'secured' | 'unsecured';

  // Personal Details
  fullName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: Date;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  email: string;

  // Address
  address: IAddress;

  // Documents
  panNumber: string;
  aadhaarNumber: string;

  // Financial Details
  occupation: 'salaried' | 'self-employed' | 'business' | 'retired';
  employerName: string;
  monthlyIncome: number;
  yearsOfExperience: number;

  // Loan History
  existingLoans: IExistingLoan[];

  // Collateral Details (for secured loans)
  collateral?: ICollateral;

  // Loan Request
  loanAmount: number;
  loanPurpose: string;
  preferredTenure: number;

  // Calculated Fields
  expectedEMI: number;
  eligibilityScore: number;
  eligibilityStatus: 'pending' | 'likely_approved' | 'likely_rejected';

  // Admin Fields
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string;

  createdAt: Date;
  updatedAt: Date;
}

const ExistingLoanSchema = new Schema<IExistingLoan>({
  loanType: { type: String, required: true },
  outstandingAmount: { type: Number, required: true },
  emi: { type: Number, required: true },
});

const CollateralSchema = new Schema<ICollateral>({
  propertyType: {
    type: String,
    enum: ['residential', 'commercial', 'land', 'vehicle', 'gold', 'other'],
    required: true,
  },
  estimatedValue: { type: Number, required: true },
  ownershipStatus: {
    type: String,
    enum: ['self-owned', 'co-owned', 'parental'],
    required: true,
  },
  propertyAddress: { type: String, required: true },
});

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
});

const ApplicationSchema = new Schema<IApplication>(
  {
    phoneNumber: { type: String, required: true },
    isPhoneVerified: { type: Boolean, default: false },
    loanType: {
      type: String,
      enum: ['secured', 'unsecured'],
      required: true,
    },

    // Personal Details
    fullName: { type: String, required: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    dateOfBirth: { type: Date, required: true },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed'],
      required: true,
    },
    email: { type: String, required: true },

    // Address
    address: { type: AddressSchema, required: true },

    // Documents
    panNumber: { type: String, required: true },
    aadhaarNumber: { type: String, required: true },

    // Financial Details
    occupation: {
      type: String,
      enum: ['salaried', 'self-employed', 'business', 'retired'],
      required: true,
    },
    employerName: { type: String, required: true },
    monthlyIncome: { type: Number, required: true },
    yearsOfExperience: { type: Number, required: true },

    // Loan History
    existingLoans: { type: [ExistingLoanSchema], default: [] },

    // Collateral Details
    collateral: { type: CollateralSchema },

    // Loan Request
    loanAmount: { type: Number, required: true },
    loanPurpose: { type: String, required: true },
    preferredTenure: { type: Number, required: true },

    // Calculated Fields
    expectedEMI: { type: Number, default: 0 },
    eligibilityScore: { type: Number, default: 0 },
    eligibilityStatus: {
      type: String,
      enum: ['pending', 'likely_approved', 'likely_rejected'],
      default: 'pending',
    },

    // Admin Fields
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNotes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Application ||
  mongoose.model<IApplication>('Application', ApplicationSchema);
