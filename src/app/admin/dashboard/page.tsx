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

  // Team Members state
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newMember, setNewMember] = useState({
    username: '',
    password: '',
    name: '',
    role: 'manager',
  });
  const [memberError, setMemberError] = useState('');

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

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/admin/members');
      const data = await response.json();
      if (Array.isArray(data)) {
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');

    if (!newMember.username || !newMember.password || !newMember.name) {
      setMemberError('All fields are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });

      const data = await response.json();

      if (response.ok) {
        setNewMember({ username: '', password: '', name: '', role: 'manager' });
        fetchTeamMembers();
        alert('Team member added successfully!');
      } else {
        setMemberError(data.error || 'Failed to add team member');
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      setMemberError('An error occurred. Please try again.');
    }
  };

  const handleDeleteMember = async (id: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/members/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        fetchTeamMembers();
        alert('Team member removed successfully');
      } else {
        alert(data.error || 'Failed to remove team member');
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const openTeamModal = () => {
    fetchTeamMembers();
    setShowTeamModal(true);
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
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
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
                <span className="text-lg sm:text-xl font-bold text-gray-900">LoanEase</span>
              </Link>
              <span className="hidden sm:inline text-gray-400">|</span>
              <span className="hidden sm:inline text-gray-600 font-medium text-sm">Admin Dashboard</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-600 hidden md:inline">
                Welcome, <span className="font-medium">{adminUser.name}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={openTeamModal}
                className="text-xs sm:text-sm"
              >
                Team
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-xs sm:text-sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card padding="sm" className="text-center">
            <p className="text-xs sm:text-sm text-gray-500">Total Applications</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xs sm:text-sm text-gray-500">Pending</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xs sm:text-sm text-gray-500">Approved</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.approved}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xs sm:text-sm text-gray-500">Rejected</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.rejected}</p>
          </Card>
          <Card padding="sm" className="text-center md:col-span-1 col-span-2">
            <p className="text-xs sm:text-sm text-gray-500">Approved Amount</p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-blue-600 break-words">
              {formatCurrency(stats.totalAmount)}
            </p>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1 sm:ml-2 text-xs opacity-75">
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
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial">
                <label className="block text-xs text-gray-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 sm:flex-initial">
                <label className="block text-xs text-gray-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Eligibility Score Filter */}
            <div className="flex-1 sm:flex-initial min-w-[150px]">
              <label className="block text-xs text-gray-500 mb-1">Eligibility Score</label>
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Scores</option>
                <option value="high">High (70%+)</option>
                <option value="medium">Medium (40-69%)</option>
                <option value="low">Low (&lt;40%)</option>
              </select>
            </div>

            {/* Suggestion Filter */}
            <div className="flex-1 sm:flex-initial min-w-[150px]">
              <label className="block text-xs text-gray-500 mb-1">Suggestion</label>
              <select
                value={suggestionFilter}
                onChange={(e) => setSuggestionFilter(e.target.value as 'all' | 'likely_approved' | 'likely_rejected')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Suggestions</option>
                <option value="likely_approved">Likely Approved</option>
                <option value="likely_rejected">Needs Review</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end flex-1 sm:flex-initial">
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setScoreFilter('all');
                  setSuggestionFilter('all');
                }}
                className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>

            {/* Results Count */}
            <div className="w-full sm:w-auto sm:ml-auto text-xs sm:text-sm text-gray-500 text-center sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 mt-2 sm:mt-0">
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

      {/* Team Members Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Team Members</h2>
              <button
                onClick={() => setShowTeamModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Add New Member Form */}
              <Card className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Team Member</h3>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Full Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username/Email
                      </label>
                      <input
                        type="email"
                        value={newMember.username}
                        onChange={(e) => setNewMember({ ...newMember, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={newMember.password}
                        onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Minimum 6 characters"
                        minLength={6}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={newMember.role}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  {memberError && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      {memberError}
                    </div>
                  )}

                  <Button type="submit">Add Team Member</Button>
                </form>
              </Card>

              {/* Team Members List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Team Members</h3>
                <div className="space-y-3">
                  {teamMembers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No team members found</p>
                  ) : (
                    teamMembers.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-lg">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              member.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                          <button
                            onClick={() => handleDeleteMember(member._id, member.name)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove member"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
