'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full text-center">
        <div className="py-6">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Application Submitted!</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your loan application has been received. Our team will review it and get back to you shortly.
          </p>

          {/* Next Steps */}
          <div className="bg-[#223265]/5 rounded-xl p-6 mb-8 text-left border border-[#223265]/8">
            <h3 className="font-semibold text-[#223265] mb-4 text-sm uppercase tracking-wide">What happens next?</h3>
            <ul className="space-y-4">
              {[
                {
                  title: 'Application Review',
                  desc: 'Our team will review your application within 24–48 hours.',
                },
                {
                  title: 'Document Verification',
                  desc: 'We may contact you for additional documents if required.',
                },
                {
                  title: 'Final Decision',
                  desc: 'You will receive a call from our team regarding the loan approval.',
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-[#223265] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1E293B] text-sm">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="text-xs text-slate-400 mb-8">
            <p>For queries, reach us at</p>
            <p className="font-medium text-slate-600 mt-0.5">support@loanease.com</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">Back to Home</Button>
            </Link>
            <Link href="/emi-calculator">
              <Button className="w-full sm:w-auto">EMI Calculator</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
