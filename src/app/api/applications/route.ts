import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Application from '@/models/Application';
import { calculateEligibility } from '@/lib/eligibility';
import { calculateEMI } from '@/lib/emi';

// GET all applications (for admin dashboard)
export async function GET() {
  try {
    await dbConnect();

    const applications = await Application.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// POST new application
export async function POST(request: Request) {
  try {
    await dbConnect();

    const data = await request.json();

    // Calculate EMI if not provided
    if (!data.expectedEMI && data.loanAmount && data.preferredTenure) {
      const emiResult = calculateEMI(
        data.loanAmount,
        12, // Default 12% interest rate
        data.preferredTenure / 12,
        'monthly'
      );
      data.expectedEMI = emiResult.emi;
    }

    // Calculate eligibility
    const eligibilityResult = calculateEligibility(data);
    data.eligibilityScore = eligibilityResult.score;
    data.eligibilityStatus = eligibilityResult.status;

    // Create application
    const application = await Application.create(data);

    return NextResponse.json({
      success: true,
      application,
      eligibility: eligibilityResult,
    });
  } catch (error) {
    console.error('Error creating application:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create application', details: errorMessage },
      { status: 500 }
    );
  }
}
