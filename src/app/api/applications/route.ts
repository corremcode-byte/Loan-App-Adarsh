import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Application from '@/models/Application';
import { calculateEligibility } from '@/lib/eligibility';
import { calculateEMI } from '@/lib/emi';
import { validateDOB } from '@/lib/dobValidation';
import { requireAdminRole } from '@/lib/apiAuth';

// GET all applications (for admin dashboard)
export async function GET() {
  const auth = await requireAdminRole();
  if (auth.error) return auth.error;

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

    // Bug 20: server-side DOB validation (calendar-accurate)
    if (data.dateOfBirth) {
      const dobError = validateDOB(data.dateOfBirth);
      if (dobError) {
        return NextResponse.json({ error: dobError }, { status: 400 });
      }
    }

    // UAT fix: email format validation
    const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (data.email && !EMAIL_PATTERN.test(data.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

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

    // Bug 5: enforce type-specific loan minimums (fix: removed falsy-bypass for loanAmount === 0)
    const minAmount = data.loanType === 'secured' ? 100000 : 50000;
    if (data.loanAmount < minAmount) {
      return NextResponse.json(
        { error: `Minimum loan amount for ${data.loanType} loans is ₹${minAmount.toLocaleString('en-IN')}` },
        { status: 400 }
      );
    }

    // Calculate EMI if not provided — use submitted interestRate, fall back to 12%
    if (!data.expectedEMI && data.loanAmount && data.preferredTenure) {
      const emiResult = calculateEMI(
        data.loanAmount,
        data.interestRate || 12,
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
