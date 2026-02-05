'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { EligibilityResult as EligibilityResultType } from '@/types';

interface EligibilityResultProps {
  result: EligibilityResultType;
}

export default function EligibilityResult({ result }: EligibilityResultProps) {
  const isApproved = result.status === 'likely_approved';

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
            isApproved ? 'bg-green-100' : 'bg-yellow-100'
          }`}
        >
          {isApproved ? (
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-10 h-10 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>

        <h2
          className={`text-2xl font-bold mt-4 ${
            isApproved ? 'text-green-600' : 'text-yellow-600'
          }`}
        >
          {isApproved ? 'Likely to be Approved!' : 'May Require Review'}
        </h2>

        <p className="text-gray-500 mt-2">
          Based on our assessment, your eligibility score is:
        </p>

        {/* Score Circle */}
        <div className="relative w-32 h-32 mx-auto mt-4">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isApproved ? '#22c55e' : '#eab308'}
              strokeWidth="8"
              strokeDasharray={`${result.score * 2.83} 283`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">
              {result.score}%
            </span>
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Our Analysis
        </h3>
        <ul className="space-y-3">
          {result.reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-600 text-sm">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recommendations
          </h3>
          <ul className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-600 text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          <strong>Disclaimer:</strong> This is an indicative assessment based on
          the information provided. Final approval is subject to verification of
          documents, credit score check, and other eligibility criteria. Our
          team will contact you for the final decision.
        </p>
      </div>
    </Card>
  );
}
