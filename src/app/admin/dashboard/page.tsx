'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ApplicationTable from '@/components/ApplicationTable';
import { Application } from '@/types';
import { formatCurrency } from '@/lib/emi';

interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'likely_approved' | 'likely_rejected'>('all');

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      setAdminUser(JSON.parse(storedUser));
      setAuthChecked(true);
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    if (authChecked && adminUser) {
      fetchApplications();
    }
  }, [authChecked, adminUser]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      if (Array.isArray(data)) {
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchApplications();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const filteredApplications = applications.filter((app) => {
    // Status filter
    if (filter !== 'all' && app.status !== filter) return false;

    // Date filter
    if (dateFrom) {
      const appDate = new Date(app.createdAt);
      const fromDate = new Date(dateFrom);
      if (appDate < fromDate) return false;
    }
    if (dateTo) {
      const appDate = new Date(app.createdAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (appDate > toDate) return false;
    }

    // Eligibility score filter
    const score = app.eligibilityScore || 0;
    if (scoreFilter === 'high' && score < 70) return false;
    if (scoreFilter === 'medium' && (score < 40 || score >= 70)) return false;
    if (scoreFilter === 'low' && score >= 40) return false;

    // Suggestion filter
    if (suggestionFilter !== 'all' && app.eligibilityStatus !== suggestionFilter) return false;

    return true;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
    totalAmount: applications
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + a.loanAmount, 0),
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">LoanEase</span>
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600 font-medium">Admin Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{adminUser.name}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card padding="sm" className="text-center">
            <p className="text-sm text-gray-500">Total Applications</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </Card>
          <Card padding="sm" className="text-center md:col-span-1 col-span-2">
            <p className="text-sm text-gray-500">Approved Amount</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(stats.totalAmount)}
            </p>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-2 text-xs opacity-75">
                (
                {f === 'all'
                  ? stats.total
                  : f === 'pending'
                  ? stats.pending
                  : f === 'approved'
                  ? stats.approved
                  : stats.rejected}
                )
              </span>
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <Card padding="sm" className="mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Date Range Filter */}
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Eligibility Score Filter */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Eligibility Score</label>
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Scores</option>
                <option value="high">High (70%+)</option>
                <option value="medium">Medium (40-69%)</option>
                <option value="low">Low (&lt;40%)</option>
              </select>
            </div>

            {/* Suggestion Filter */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Suggestion</label>
              <select
                value={suggestionFilter}
                onChange={(e) => setSuggestionFilter(e.target.value as 'all' | 'likely_approved' | 'likely_rejected')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Suggestions</option>
                <option value="likely_approved">Likely Approved</option>
                <option value="likely_rejected">Needs Review</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setScoreFilter('all');
                setSuggestionFilter('all');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>

            {/* Results Count */}
            <div className="ml-auto text-sm text-gray-500">
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          </div>
        </Card>

        {/* Applications Table */}
        <Card padding="none">
          <ApplicationTable
            applications={filteredApplications}
            onStatusChange={handleStatusChange}
            loading={loading}
          />
        </Card>
      </main>
    </div>
  );
}
