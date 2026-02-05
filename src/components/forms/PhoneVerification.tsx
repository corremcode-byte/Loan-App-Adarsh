'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardTitle, CardDescription } from '@/components/ui/Card';

interface PhoneVerificationProps {
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  onVerified: () => void;
}

export default function PhoneVerification({
  phoneNumber,
  onPhoneChange,
  onVerified,
}: PhoneVerificationProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSendOTP = async () => {
    if (!validatePhone(phoneNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('otp');
        setMessage(data.message || 'OTP sent successfully');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        onVerified();
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>
        <CardTitle>Verify Your Phone Number</CardTitle>
        <CardDescription>
          {step === 'phone'
            ? 'Enter your mobile number to receive an OTP'
            : 'Enter the OTP sent to your mobile'}
        </CardDescription>
      </div>

      {step === 'phone' ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="w-20">
              <Input value="+91" disabled className="text-center" />
            </div>
            <div className="flex-1">
              <Input
                type="tel"
                placeholder="Enter mobile number"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  onPhoneChange(value);
                  setError('');
                }}
                error={error}
                maxLength={10}
              />
            </div>
          </div>
          <Button
            onClick={handleSendOTP}
            loading={loading}
            fullWidth
            size="lg"
          >
            Send OTP
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center text-sm text-gray-600 mb-4">
            OTP sent to +91 {phoneNumber}
            <button
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError('');
              }}
              className="text-blue-600 hover:underline ml-2"
            >
              Change
            </button>
          </div>
          <Input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setOtp(value);
              setError('');
            }}
            error={error}
            maxLength={6}
            className="text-center text-2xl tracking-widest"
          />
          {message && (
            <p className="text-sm text-green-600 text-center">{message}</p>
          )}
          <Button
            onClick={handleVerifyOTP}
            loading={loading}
            fullWidth
            size="lg"
          >
            Verify OTP
          </Button>
          <button
            onClick={handleSendOTP}
            className="w-full text-sm text-blue-600 hover:underline"
            disabled={loading}
          >
            Resend OTP
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center mt-4">
        For testing, use OTP: <strong>123456</strong>
      </p>
    </Card>
  );
}
