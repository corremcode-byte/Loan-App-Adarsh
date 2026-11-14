import { NextResponse } from 'next/server';
import { calculateEligibility } from '@/lib/eligibility';
import { ApplicationFormData } from '@/types';
import { validateDOB } from '@/lib/dobValidation';

// POST check eligibility
export async function POST(request: Request) {
  try {
    const data: ApplicationFormData = await request.json();

    // loanAmount: type, finite, non-negative, spec maximum ₹100 Crore
    if (typeof data.loanAmount !== 'number' || !Number.isFinite(data.loanAmount) || data.loanAmount < 0) {
      return NextResponse.json({ error: 'Loan amount must be a valid non-negative number' }, { status: 400 });
    }
    const MAX_LOAN_AMOUNT = 1_00_00_00_000;
    if (data.loanAmount > MAX_LOAN_AMOUNT) {
      return NextResponse.json(
        { error: 'Loan amount must not exceed ₹1,00,00,00,000 (100 Crore)' },
        { status: 400 }
      );
    }

    // monthlyIncome: type, finite, positive (division-by-zero guard + spec maximum ₹5 Crore)
    if (typeof data.monthlyIncome !== 'number' || !Number.isFinite(data.monthlyIncome) || data.monthlyIncome <= 0) {
      return NextResponse.json({ error: 'Monthly income must be a valid positive number' }, { status: 400 });
    }
    const MAX_MONTHLY_INCOME = 5_00_00_000;
    if (data.monthlyIncome > MAX_MONTHLY_INCOME) {
      return NextResponse.json(
        { error: 'Monthly income must not exceed ₹5,00,00,000 (5 Crore)' },
        { status: 400 }
      );
    }

    // preferredTenure: required and positive
    if (typeof data.preferredTenure !== 'number' || !Number.isFinite(data.preferredTenure) || data.preferredTenure <= 0) {
      return NextResponse.json({ error: 'Preferred tenure must be a valid positive number' }, { status: 400 });
    }

    // existingLoans[i].outstandingAmount: negative values can game analyzeDebtLoad eligibility score;
    // values above ₹500 crore are rejected as unrealistic.
    const MAX_OUTSTANDING_AMOUNT = 5_00_00_00_000;
    if (Array.isArray(data.existingLoans)) {
      for (const loan of data.existingLoans) {
        if (
          loan === null ||
          typeof loan !== 'object' ||
          typeof loan.outstandingAmount !== 'number' ||
          !Number.isFinite(loan.outstandingAmount) ||
          loan.outstandingAmount < 0
        ) {
          return NextResponse.json({ error: 'Invalid existing loan data' }, { status: 400 });
        }
        if (loan.outstandingAmount > MAX_OUTSTANDING_AMOUNT) {
          return NextResponse.json(
            { error: 'Outstanding loan amount must not exceed ₹5,00,00,00,000 (500 Crore)' },
            { status: 400 }
          );
        }
      }
    } else if (data.existingLoans !== undefined) {
      return NextResponse.json({ error: 'existingLoans must be an array' }, { status: 400 });
    }

    // expectedEMI: negative value is truthy → bypasses recalculation → games DTI/FOIR scores
    if (typeof data.expectedEMI !== 'number' || !Number.isFinite(data.expectedEMI) || data.expectedEMI < 0) {
      data.expectedEMI = 0;
    }

    // Bug 20: server-side DOB validation (calendar-accurate)
    if (data.dateOfBirth) {
      const dobError = validateDOB(data.dateOfBirth);
      if (dobError) {
        return NextResponse.json({ error: dobError }, { status: 400 });
      }
    }

    // employerName: max 50 chars
    const EMPLOYER_NAME_MAX_LENGTH = 50;
    if (typeof data.employerName === 'string' && data.employerName.length > EMPLOYER_NAME_MAX_LENGTH) {
      return NextResponse.json({ error: `Employer name must not exceed ${EMPLOYER_NAME_MAX_LENGTH} characters` }, { status: 400 });
    }

    // Bug 5: enforce type-specific loan minimums
    const minAmount = data.loanType === 'secured' ? 100000 : 50000;
    if (data.loanAmount < minAmount) {
      return NextResponse.json(
        { error: `Minimum loan amount for ${data.loanType} loans is ₹${minAmount.toLocaleString('en-IN')}` },
        { status: 400 }
      );
    }

    // Calculate eligibility
    const result = calculateEligibility(data);

    return NextResponse.json({
      success: true,
      eligibility: result,
    });
  } catch (error) {
    console.error('Error calculating eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to calculate eligibility' },
      { status: 500 }
    );
  }
}
