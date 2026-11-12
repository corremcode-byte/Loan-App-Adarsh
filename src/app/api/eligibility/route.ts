import { NextResponse } from 'next/server';
import { calculateEligibility } from '@/lib/eligibility';
import { ApplicationFormData } from '@/types';
import { validateDOB } from '@/lib/dobValidation';

// POST check eligibility
export async function POST(request: Request) {
  try {
    const data: ApplicationFormData = await request.json();

    // Validate required fields
    if (!data.loanAmount || !data.monthlyIncome || !data.preferredTenure) {
      return NextResponse.json(
        { error: 'Loan amount, monthly income, and tenure are required' },
        { status: 400 }
      );
    }

    // Bug 20: server-side DOB validation (calendar-accurate)
    if (data.dateOfBirth) {
      const dobError = validateDOB(data.dateOfBirth);
      if (dobError) {
        return NextResponse.json({ error: dobError }, { status: 400 });
      }
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
