import { NextResponse } from 'next/server';

// Mock OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiry: number }>();

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format (10 digits, starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Generate OTP (Mock: always 123456 for testing)
    const otp = '123456';
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Store OTP
    otpStore.set(phoneNumber, { otp, expiry });

    // In production, send OTP via SMS using Twilio or similar service
    console.log(`[Mock OTP] Phone: ${phoneNumber}, OTP: ${otp}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully. For testing, use OTP: 123456',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

// Export OTP store for verification route
export { otpStore };
