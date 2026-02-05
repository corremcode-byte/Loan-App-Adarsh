'use client';

import React, { useState } from 'react';
import { Application } from '@/types';
import { formatCurrency } from '@/lib/emi';
import { getEligibilityStatusLabel } from '@/lib/eligibility';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface ApplicationTableProps {
  applications: Application[];
  onStatusChange: (id: string, status: 'approved' | 'rejected') => void;
  loading?: boolean;
}

export default function ApplicationTable({
  applications,
  onStatusChange,
  loading = false,
}: ApplicationTableProps) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleStatusChange = async (status: 'approved' | 'rejected') => {
    if (!selectedApp) return;
    setActionLoading(true);
    await onStatusChange(selectedApp._id, status);
    setActionLoading(false);
    setSelectedApp(null);
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = getEligibilityStatusLabel(status);
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          status === 'approved'
            ? 'bg-green-100 text-green-800'
            : status === 'rejected'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const getSuggestionBadge = (eligibilityStatus: string) => {
    const isLikelyApproved = eligibilityStatus === 'likely_approved';
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          isLikelyApproved
            ? 'bg-green-100 text-green-800'
            : 'bg-orange-100 text-orange-800'
        }`}
      >
        {isLikelyApproved ? 'Likely Approved' : 'Needs Review'}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-500">No applications found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Applicant
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Loan Amount
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Salary
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Phone
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Eligibility Score
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Suggestion
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.map((app) => (
              <tr
                key={app._id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedApp(app)}
              >
                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">
                      {app.fullName}
                    </div>
                    <div className="text-sm text-gray-500">{app.email}</div>
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {formatCurrency(app.loanAmount)}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {app.loanType}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                  {formatCurrency(app.monthlyIncome)}/mo
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                  +91 {app.phoneNumber}
                </td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  <span className={`font-bold ${getScoreColor(app.eligibilityScore)}`}>
                    {app.eligibilityScore}%
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  {getSuggestionBadge(app.eligibilityStatus)}
                </td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  {getStatusBadge(app.status)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(app.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Application Detail Modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Application Details"
        size="full"
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedApp.fullName}
                </h3>
                <p className="text-sm text-gray-500">
                  Applied on {formatDate(selectedApp.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getSuggestionBadge(selectedApp.eligibilityStatus)}
                {getStatusBadge(selectedApp.status)}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Personal Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium">+91 {selectedApp.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium">{selectedApp.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gender:</span>
                    <span className="font-medium capitalize">
                      {selectedApp.gender}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Marital Status:</span>
                    <span className="font-medium capitalize">
                      {selectedApp.maritalStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date of Birth:</span>
                    <span className="font-medium">
                      {formatDate(selectedApp.dateOfBirth)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Financial Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Occupation:</span>
                    <span className="font-medium capitalize">
                      {selectedApp.occupation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Employer:</span>
                    <span className="font-medium">{selectedApp.employerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly Income:</span>
                    <span className="font-medium">
                      {formatCurrency(selectedApp.monthlyIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Experience:</span>
                    <span className="font-medium">
                      {selectedApp.yearsOfExperience} years
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Documents</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">PAN:</span>
                    <span className="font-medium">{selectedApp.panNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Aadhaar:</span>
                    <span className="font-medium">{selectedApp.aadhaarNumber}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Address</h4>
                <p className="text-sm text-gray-700">
                  {selectedApp.address.street}, {selectedApp.address.city},{' '}
                  {selectedApp.address.state} - {selectedApp.address.pincode}
                </p>
              </div>

              {/* Loan Information */}
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">Loan Details</h4>
                <div className="grid md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Loan Amount</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(selectedApp.loanAmount)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Tenure</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedApp.preferredTenure} months
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Expected EMI</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedApp.expectedEMI)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <span className="text-gray-500">
                    Type:{' '}
                    <span className="font-medium capitalize">
                      {selectedApp.loanType}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    Purpose:{' '}
                    <span className="font-medium capitalize">
                      {selectedApp.loanPurpose.replace('-', ' ')}
                    </span>
                  </span>
                </div>
              </div>

              {/* Collateral (if secured) */}
              {selectedApp.loanType === 'secured' && selectedApp.collateral && (
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Collateral Details
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Property Type</p>
                      <p className="font-medium capitalize">
                        {selectedApp.collateral.propertyType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estimated Value</p>
                      <p className="font-medium">
                        {formatCurrency(selectedApp.collateral.estimatedValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ownership</p>
                      <p className="font-medium capitalize">
                        {selectedApp.collateral.ownershipStatus.replace('-', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">
                        {selectedApp.collateral.propertyAddress}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Loans */}
              {selectedApp.existingLoans.length > 0 && (
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Existing Loans ({selectedApp.existingLoans.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedApp.existingLoans.map((loan, index) => (
                      <div
                        key={index}
                        className="flex justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="capitalize">
                          {loan.loanType.replace('-', ' ')}
                        </span>
                        <span>
                          Outstanding: {formatCurrency(loan.outstandingAmount)} |
                          EMI: {formatCurrency(loan.emi)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eligibility Score */}
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">
                  Eligibility Assessment
                </h4>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={
                          selectedApp.eligibilityScore >= 60
                            ? '#22c55e'
                            : '#eab308'
                        }
                        strokeWidth="8"
                        strokeDasharray={`${selectedApp.eligibilityScore * 2.51} 251`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">
                        {selectedApp.eligibilityScore}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {getEligibilityStatusLabel(selectedApp.eligibilityStatus).label}
                    </p>
                    <p className="text-sm text-gray-500">
                      Based on automated eligibility assessment
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedApp.status === 'pending' && (
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  variant="success"
                  onClick={() => handleStatusChange('approved')}
                  loading={actionLoading}
                  className="flex-1"
                >
                  Approve Application
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleStatusChange('rejected')}
                  loading={actionLoading}
                  className="flex-1"
                >
                  Reject Application
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
