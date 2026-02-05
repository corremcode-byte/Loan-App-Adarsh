import { ApplicationFormData, EligibilityResult } from '@/types';
import { calculateEMI } from './emi';

interface StrategyResult {
  score: number;
  maxScore: number;
  passed: boolean;
  reason: string;
  recommendation?: string;
}

/**
 * Strategy 1: Debt-to-Income Ratio (DTI)
 * Calculate: (Total Monthly EMIs + Proposed EMI) / Monthly Income
 * Accept: DTI < 40%, Review: 40-50%, Reject: > 50%
 */
function calculateDTI(data: ApplicationFormData): StrategyResult {
  const existingEMIs = data.existingLoans.reduce((sum, loan) => sum + loan.emi, 0);
  const proposedEMI = data.expectedEMI || calculateEMI(data.loanAmount, 12, data.preferredTenure / 12).emi;
  const totalEMIs = existingEMIs + proposedEMI;
  const dti = (totalEMIs / data.monthlyIncome) * 100;

  if (dti < 40) {
    return {
      score: 25,
      maxScore: 25,
      passed: true,
      reason: `Excellent DTI ratio of ${dti.toFixed(1)}%. Your debt obligations are well within acceptable limits.`,
    };
  } else if (dti <= 50) {
    return {
      score: 15,
      maxScore: 25,
      passed: true,
      reason: `DTI ratio of ${dti.toFixed(1)}% is moderate. Consider reducing existing debts.`,
      recommendation: 'Consider paying off some existing loans to improve your debt ratio.',
    };
  } else {
    return {
      score: 5,
      maxScore: 25,
      passed: false,
      reason: `High DTI ratio of ${dti.toFixed(1)}%. Total EMIs exceed 50% of your income.`,
      recommendation: 'Reduce loan amount or clear existing debts before applying.',
    };
  }
}

/**
 * Strategy 2: Fixed Obligation to Income Ratio (FOIR)
 * Maximum 50% of income should go towards EMIs
 */
function calculateFOIR(data: ApplicationFormData): StrategyResult {
  const existingEMIs = data.existingLoans.reduce((sum, loan) => sum + loan.emi, 0);
  const proposedEMI = data.expectedEMI || calculateEMI(data.loanAmount, 12, data.preferredTenure / 12).emi;
  const totalObligations = existingEMIs + proposedEMI;
  const foir = (totalObligations / data.monthlyIncome) * 100;

  // Different FOIR limits based on occupation
  let maxFOIR: number;
  switch (data.occupation) {
    case 'salaried':
      maxFOIR = 50;
      break;
    case 'self-employed':
    case 'business':
      maxFOIR = 45;
      break;
    case 'retired':
      maxFOIR = 40;
      break;
    default:
      maxFOIR = 50;
  }

  if (foir <= maxFOIR) {
    return {
      score: 20,
      maxScore: 20,
      passed: true,
      reason: `FOIR of ${foir.toFixed(1)}% is within the acceptable limit of ${maxFOIR}% for ${data.occupation} individuals.`,
    };
  } else {
    return {
      score: 5,
      maxScore: 20,
      passed: false,
      reason: `FOIR of ${foir.toFixed(1)}% exceeds the ${maxFOIR}% limit for ${data.occupation} individuals.`,
      recommendation: 'Consider a smaller loan amount or longer tenure to reduce monthly EMI.',
    };
  }
}

/**
 * Strategy 3: Loan-to-Income Ratio
 * Secured Loans: Max 6x annual income
 * Unsecured Loans: Max 3x annual income
 */
function calculateLTI(data: ApplicationFormData): StrategyResult {
  const annualIncome = data.monthlyIncome * 12;
  const loanToIncomeRatio = data.loanAmount / annualIncome;
  const maxRatio = data.loanType === 'secured' ? 6 : 3;
  const loanTypeLabel = data.loanType === 'secured' ? 'secured' : 'unsecured';

  if (loanToIncomeRatio <= maxRatio * 0.6) {
    return {
      score: 20,
      maxScore: 20,
      passed: true,
      reason: `Loan amount is ${loanToIncomeRatio.toFixed(1)}x your annual income. Well within the ${maxRatio}x limit for ${loanTypeLabel} loans.`,
    };
  } else if (loanToIncomeRatio <= maxRatio) {
    return {
      score: 12,
      maxScore: 20,
      passed: true,
      reason: `Loan amount is ${loanToIncomeRatio.toFixed(1)}x your annual income. Within the ${maxRatio}x limit but on the higher side.`,
      recommendation: 'Consider reducing loan amount for better approval chances.',
    };
  } else {
    return {
      score: 3,
      maxScore: 20,
      passed: false,
      reason: `Loan amount is ${loanToIncomeRatio.toFixed(1)}x your annual income. Exceeds the ${maxRatio}x limit for ${loanTypeLabel} loans.`,
      recommendation: `For ${loanTypeLabel} loans, consider reducing the loan amount to within ${maxRatio}x your annual income.`,
    };
  }
}

/**
 * Strategy 4: Credit Capacity Assessment
 * Based on occupation stability, years of experience, and age
 */
function assessCreditCapacity(data: ApplicationFormData): StrategyResult {
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  // Years of experience check
  const minExperience = data.occupation === 'salaried' ? 1 : 2;
  if (data.yearsOfExperience >= minExperience * 3) {
    score += 7;
    reasons.push(`Strong work experience of ${data.yearsOfExperience} years.`);
  } else if (data.yearsOfExperience >= minExperience) {
    score += 4;
    reasons.push(`Adequate work experience of ${data.yearsOfExperience} years.`);
  } else {
    score += 1;
    reasons.push(`Limited work experience of ${data.yearsOfExperience} years.`);
    recommendations.push(`Minimum ${minExperience} years of experience recommended for ${data.occupation} individuals.`);
  }

  // Age check (calculate from DOB)
  const dob = new Date(data.dateOfBirth);
  const today = new Date();
  const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  if (age >= 25 && age <= 55) {
    score += 5;
    reasons.push(`Age ${age} is within the optimal range.`);
  } else if (age >= 21 && age < 25) {
    score += 3;
    reasons.push(`Age ${age} is acceptable but on the younger side.`);
  } else if (age > 55 && age <= 65) {
    score += 3;
    reasons.push(`Age ${age} may limit tenure options.`);
    recommendations.push('Consider shorter loan tenure based on retirement age.');
  } else {
    score += 1;
    reasons.push(`Age ${age} is outside the preferred range.`);
  }

  // Occupation stability
  if (data.occupation === 'salaried') {
    score += 3;
    reasons.push('Salaried employment provides stable income.');
  } else if (data.occupation === 'business' || data.occupation === 'self-employed') {
    score += 2;
    reasons.push('Self-employment/Business requires additional income verification.');
  } else {
    score += 1;
    reasons.push('Retired status may require pension proof.');
  }

  return {
    score,
    maxScore: 15,
    passed: score >= 8,
    reason: reasons.join(' '),
    recommendation: recommendations.length > 0 ? recommendations.join(' ') : undefined,
  };
}

/**
 * Strategy 5: Existing Debt Load Analysis
 * Number of existing loans, total outstanding debt vs income
 */
function analyzeDebtLoad(data: ApplicationFormData): StrategyResult {
  const numberOfLoans = data.existingLoans.length;
  const totalOutstanding = data.existingLoans.reduce((sum, loan) => sum + loan.outstandingAmount, 0);
  const annualIncome = data.monthlyIncome * 12;
  const outstandingToIncomeRatio = totalOutstanding / annualIncome;

  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  // Number of loans check
  if (numberOfLoans === 0) {
    score += 10;
    reasons.push('No existing loans. Clean credit profile.');
  } else if (numberOfLoans <= 2) {
    score += 7;
    reasons.push(`${numberOfLoans} existing loan(s) is manageable.`);
  } else if (numberOfLoans <= 3) {
    score += 4;
    reasons.push(`${numberOfLoans} existing loans. Multiple debt obligations noted.`);
    recommendations.push('Consider consolidating existing loans.');
  } else {
    score += 1;
    reasons.push(`${numberOfLoans} existing loans is a red flag. Too many debt obligations.`);
    recommendations.push('Clear some existing loans before applying for new credit.');
  }

  // Outstanding debt ratio
  if (outstandingToIncomeRatio <= 0.5) {
    score += 10;
    reasons.push('Outstanding debt is well within manageable limits.');
  } else if (outstandingToIncomeRatio <= 1) {
    score += 6;
    reasons.push('Outstanding debt is moderate relative to income.');
  } else if (outstandingToIncomeRatio <= 2) {
    score += 3;
    reasons.push('Outstanding debt is on the higher side.');
    recommendations.push('Focus on reducing outstanding debt.');
  } else {
    score += 0;
    reasons.push('Outstanding debt significantly exceeds annual income.');
    recommendations.push('High existing debt load may affect loan approval.');
  }

  return {
    score,
    maxScore: 20,
    passed: score >= 10,
    reason: reasons.join(' '),
    recommendation: recommendations.length > 0 ? recommendations.join(' ') : undefined,
  };
}

/**
 * Calculate overall eligibility based on all 5 strategies
 */
export function calculateEligibility(data: ApplicationFormData): EligibilityResult {
  const strategies = [
    calculateDTI(data),
    calculateFOIR(data),
    calculateLTI(data),
    assessCreditCapacity(data),
    analyzeDebtLoad(data),
  ];

  const totalScore = strategies.reduce((sum, s) => sum + s.score, 0);
  const maxScore = strategies.reduce((sum, s) => sum + s.maxScore, 0);
  const percentageScore = Math.round((totalScore / maxScore) * 100);

  const reasons = strategies.map((s) => s.reason);
  const recommendations = strategies
    .filter((s) => s.recommendation)
    .map((s) => s.recommendation as string);

  // Determine status based on score
  let status: 'likely_approved' | 'likely_rejected';
  if (percentageScore >= 60) {
    status = 'likely_approved';
  } else {
    status = 'likely_rejected';
  }

  // Add additional recommendations for secured loans with collateral
  if (data.loanType === 'secured' && data.collateral) {
    if (data.collateral.estimatedValue >= data.loanAmount * 1.5) {
      reasons.push('Strong collateral coverage improves approval chances.');
    } else if (data.collateral.estimatedValue >= data.loanAmount) {
      reasons.push('Adequate collateral coverage for the loan amount.');
    } else {
      reasons.push('Collateral value is less than loan amount.');
      recommendations.push('Consider providing additional collateral or reducing loan amount.');
    }
  }

  return {
    score: percentageScore,
    status,
    reasons,
    recommendations,
  };
}

/**
 * Get eligibility status label and color
 */
export function getEligibilityStatusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case 'likely_approved':
      return { label: 'Likely to be Approved', color: 'text-green-600' };
    case 'likely_rejected':
      return { label: 'May Need Review', color: 'text-yellow-600' };
    case 'approved':
      return { label: 'Approved', color: 'text-green-600' };
    case 'rejected':
      return { label: 'Rejected', color: 'text-red-600' };
    case 'pending':
    default:
      return { label: 'Pending Review', color: 'text-blue-600' };
  }
}
