import { NextResponse } from 'next/server';
import { calculateEligibility } from '@/lib/eligibility';
import { ApplicationFormData } from '@/types';

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
