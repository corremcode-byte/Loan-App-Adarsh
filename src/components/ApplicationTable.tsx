'use client';

import { useState } from 'react';
import { Application } from '@/types';
import { formatCurrency } from '@/lib/emi';
import { getEligibilityStatusLabel } from '@/lib/eligibility';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FileX2, Building2, Shield, ShieldCheck, ShieldX } from 'lucide-react';

interface ApplicationTableProps {
  applications: Application[];
  onStatusChange: (id: string, status: 'approved' | 'rejected') => void;
  loading?: boolean;
}

type BizVerificationStatus = 'verified_mca' | 'listed_bse' | 'pending' | 'not_found';

function getBizVerificationBadge(status: BizVerificationStatus) {
  const configs = {
    verified_mca: {
      label: 'Verified via MCA',
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: <ShieldCheck className="w-3 h-3" />,
    },
    listed_bse: {
      label: 'Listed on BSE',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <ShieldCheck className="w-3 h-3" />,
    },
    pending: {
      label: 'Verification Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Shield className="w-3 h-3" />,
    },
    not_found: {
      label: 'Not Found',
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: <ShieldX className="w-3 h-3" />,
    },
  };
  const cfg = configs[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function renderBizVerificationCell(app: Application) {
  if (app.occupation !== 'business') {
    return <span className="text-xs text-gray-400 italic">Not Applicable</span>;
  }
  return (
    <div className="space-y-1 min-w-[170px]">
      <div className="flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs font-medium text-gray-800 truncate max-w-[150px]">
          {app.employerName}
        </span>
      </div>
      {/* TODO: Replace with actual GSTIN from business verification API response */}
      <div className="text-xs text-gray-500">
        GSTIN: <span className="text-gray-400">—</span>
      </div>
      {/* TODO: Replace with actual business age from MCA/GSTIN verification API */}
      <div className="text-xs text-gray-500">
        Age: <span className="text-gray-400">—</span>
      </div>
      {/* TODO: Replace 'pending' with actual verification status from MCA/BSE API response */}
      {getBizVerificationBadge('pending')}
    </div>
  );
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
    const badgeStyles: Record<string, string> = {
      approved: 'bg-green-50 text-green-800 border-green-200',
      rejected: 'bg-red-50 text-red-800 border-red-200',
      pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    };
    const dotStyles: Record<string, string> = {
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      pending: 'bg-yellow-500',
    };
    const styleKey = badgeStyles[status] ? status : 'pending';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeStyles[styleKey]}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotStyles[styleKey]}`} />
        {statusInfo.label}
      </span>
    );
  };

  const getSuggestionBadge = (eligibilityStatus: string) => {
    const isLikelyApproved = eligibilityStatus === 'likely_approved';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
          isLikelyApproved
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-orange-50 text-orange-800 border-orange-200'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            isLikelyApproved ? 'bg-emerald-500' : 'bg-orange-500'
          }`}
        />
        {isLikelyApproved ? 'Likely Approved' : 'Needs Review'}
      </span>
    );
  };

  const getScoreCell = (score: number) => {
    const colorClass =
      score >= 70
        ? 'bg-green-50 text-green-700 border-green-200'
        : score >= 50
        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
        : 'bg-red-50 text-red-700 border-red-200';
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold border ${colorClass}`}
      >
        {score}%
      </span>
    );
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
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#223265]"></div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <FileX2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-gray-700 font-semibold text-base mb-1">No applications found</h3>
        <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed">
          No loan applications match the current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#162247] border-b border-[#162247]">
                {[
                  'Applicant',
                  'Loan Amount',
                  'Income',
                  'Phone',
                  'Score',
                  'Suggestion',
                  'Status',
                  'Business Verification',
                  'Date',
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((app) => (
                <tr
                  key={app._id}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  onClick={() => setSelectedApp(app)}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">
                      {`${app.firstName} ${app.lastName}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{app.email}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900 text-sm">
                      {formatCurrency(app.loanAmount)}
                    </div>
                    <div className="text-xs text-gray-500 capitalize mt-0.5">{app.loanType}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatCurrency(app.monthlyIncome)}
                    <span className="text-gray-400 text-xs">/mo</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    +91 {app.phoneNumber}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getScoreCell(app.eligibilityScore)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getSuggestionBadge(app.eligibilityStatus)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(app.status)}
                  </td>
                  <td className="px-4 py-4">{renderBizVerificationCell(app)}</td>
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
                  {`${selectedApp.firstName} ${
                    selectedApp.middleName ? selectedApp.middleName + ' ' : ''
                  }${selectedApp.lastName}`}
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
                <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
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
                    <span className="font-medium capitalize">{selectedApp.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Marital Status:</span>
                    <span className="font-medium capitalize">{selectedApp.maritalStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date of Birth:</span>
                    <span className="font-medium">{formatDate(selectedApp.dateOfBirth)}</span>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Financial Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Occupation:</span>
                    <span className="font-medium capitalize">{selectedApp.occupation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Employer:</span>
                    <span className="font-medium">{selectedApp.employerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly Income:</span>
                    <span className="font-medium">{formatCurrency(selectedApp.monthlyIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Experience:</span>
                    <span className="font-medium">{selectedApp.yearsOfExperience} years</span>
                  </div>
                </div>
              </div>

              {/* Business Verification — business applicants only */}
              {selectedApp.occupation === 'business' && (
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    Business Verification
                  </h4>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Company Name
                      </p>
                      <p className="font-semibold text-gray-900">{selectedApp.employerName}</p>
                    </div>
                    <div className="space-y-1">
                      {/* TODO: Replace with actual GSTIN from business verification API response */}
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        GSTIN
                      </p>
                      <p className="text-gray-400 italic">Awaiting verification</p>
                    </div>
                    <div className="space-y-1">
                      {/* TODO: Replace with actual business age from MCA/GSTIN lookup API */}
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Business Age
                      </p>
                      <p className="text-gray-400 italic">Awaiting verification</p>
                    </div>
                    <div className="space-y-1">
                      {/* TODO: Replace 'pending' with actual status from MCA/BSE verification API */}
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Verification Status
                      </p>
                      {getBizVerificationBadge('pending')}
                    </div>
                  </div>
                </div>
              )}

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
                <div className="grid md:grid-cols-3 gap-4 p-4 bg-[#223265]/5 rounded-xl">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Loan Amount</p>
                    <p className="text-xl font-bold text-[#223265]">
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
                    <span className="font-medium capitalize">{selectedApp.loanType}</span>
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
                  <h4 className="font-medium text-gray-900 mb-3">Collateral Details</h4>
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
                      <p className="font-medium">{selectedApp.collateral.propertyAddress}</p>
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
                        <span className="capitalize">{loan.loanType.replace('-', ' ')}</span>
                        <span>
                          Outstanding: {formatCurrency(loan.outstandingAmount)} | EMI:{' '}
                          {formatCurrency(loan.emi)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eligibility Score */}
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">Eligibility Assessment</h4>
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
                        stroke={selectedApp.eligibilityScore >= 60 ? '#22c55e' : '#eab308'}
                        strokeWidth="8"
                        strokeDasharray={`${selectedApp.eligibilityScore * 2.51} 251`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{selectedApp.eligibilityScore}%</span>
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
