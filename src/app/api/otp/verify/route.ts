import { NextResponse } from 'next/server';

// Mock OTP storage
const otpStore = new Map<string, { otp: string; expiry: number }>();

export async function POST(request: Request) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // For testing, always accept 123456 as valid OTP
    if (otp === '123456') {
      return NextResponse.json({
        success: true,
        message: 'Phone number verified successfully',
      });
    }

    // Check stored OTP
    const storedOTP = otpStore.get(phoneNumber);

    if (!storedOTP) {
      return NextResponse.json(
        { error: 'OTP expired or not found. Please request a new OTP.' },
        { status: 400 }
      );
    }

    if (Date.now() > storedOTP.expiry) {
      otpStore.delete(phoneNumber);
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    if (storedOTP.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    // OTP verified successfully
    otpStore.delete(phoneNumber);

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully',
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
