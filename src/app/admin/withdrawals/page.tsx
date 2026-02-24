'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  TrendingUp,
  AlertCircle,
  User,
  Phone,
  CreditCard
} from 'lucide-react'

interface WithdrawalRequest {
  id: string
  userId: string
  username?: string
  email?: string
  displayName?: string
  displayEmail?: string
  displayPhone?: string
  registeredName?: string
  paymentPhoneNumber?: string
  paymentMethod?: string
  accountNumber?: string
  bankName?: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  requestDate: string
  processedDate?: string
  processedBy?: string
  adminNotes?: string
  paymentDetails?: any
}

interface PaymentDetails {
  id: string
  userId: string
  paymentMethod: string
  registeredName: string
  phoneNumber: string
  accountNumber?: string
  bankName?: string
  isComplete: boolean
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  completed: number
  pendingAmount: number
  completedAmount: number
}

export default function WithdrawalsPage() {
  const { token } = useAuth()
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchStats()
    fetchWithdrawals()
  }, [filterStatus])

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com'}/api/withdrawals/stats/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const url = filterStatus === 'all' 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com'}/api/withdrawals`
        : `${process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com'}/api/withdrawals?status=${filterStatus}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setWithdrawals([])
        setLoadError(data?.message || 'Failed to fetch withdrawal requests')
        return
      }

      const rows = Array.isArray(data?.data?.withdrawals) ? data.data.withdrawals : []
      setWithdrawals(rows)
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
      setWithdrawals([])
      setLoadError('Unable to load withdrawal requests')
    } finally {
      setLoading(false)
    }
  }

  const viewDetails = async (withdrawal: WithdrawalRequest) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com'}/api/withdrawals/${withdrawal.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setSelectedWithdrawal(data.data.withdrawal)
        const apiPayment = data.data.paymentDetails || data.data.withdrawal?.paymentDetails || null
        const fallbackPayment = data.data.withdrawal
          ? {
              id: data.data.withdrawal.id,
              userId: data.data.withdrawal.userId,
              paymentMethod: data.data.withdrawal.paymentMethod || 'mobile_money',
              registeredName: data.data.withdrawal.registeredName || data.data.withdrawal.displayName || '',
              phoneNumber: data.data.withdrawal.paymentPhoneNumber || data.data.withdrawal.displayPhone || '',
              accountNumber: data.data.withdrawal.accountNumber || undefined,
              bankName: data.data.withdrawal.bankName || undefined,
              isComplete: true
            }
          : null
        setPaymentDetails(apiPayment || fallbackPayment)
        setShowDetailsModal(true)
        setNotes('')
      }
    } catch (error) {
      console.error('Error fetching withdrawal details:', error)
    }
  }

  const approveWithdrawal = async () => {
    if (!selectedWithdrawal || !paymentDetails) return

    if (!paymentDetails.isComplete) {
      alert('Publisher payment details are incomplete. Cannot approve withdrawal.')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com'}/api/withdrawals/${selectedWithdrawal.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      })
      
      const data = await response.json()
      if (data.success) {
        alert('✅ Withdrawal approved successfully!')
        setShowDetailsModal(false)
        fetchWithdrawals()
        fetchStats()
      } else {
        alert(`❌ Failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error)
      alert('Failed to approve withdrawal')
    } finally {
      setProcessing(false)
    }
  }

  const rejectWithdrawal = async () => {
    if (!selectedWithdrawal) return
    if (!notes.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com'}/api/withdrawals/${selectedWithdrawal.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      })
      
      const data = await response.json()
      if (data.success) {
        alert('Withdrawal rejected')
        setShowDetailsModal(false)
        fetchWithdrawals()
        fetchStats()
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
    } finally {
      setProcessing(false)
    }
  }

  const completeWithdrawal = async () => {
    if (!selectedWithdrawal) return

    if (!confirm('Mark this withdrawal as completed/paid?')) return

    setProcessing(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com'}/api/withdrawals/${selectedWithdrawal.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: 'Payment completed' })
      })
      
      const data = await response.json()
      if (data.success) {
        alert('✅ Withdrawal marked as completed!')
        setShowDetailsModal(false)
        fetchWithdrawals()
        fetchStats()
      }
    } catch (error) {
      console.error('Error completing withdrawal:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'approved': return 'bg-blue-100 text-blue-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'completed': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Withdrawal Management
        </h1>
        <p className="text-slate-600 mt-1">Manage publisher withdrawal requests</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <TrendingUp className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
            <p className="text-sm text-slate-600">Pending Requests</p>
            <p className="text-xs text-yellow-700 font-semibold mt-1">GHC {stats.pendingAmount.toFixed(2)}</p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
            <p className="text-sm text-slate-600">Approved</p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
            <p className="text-sm text-slate-600">Completed</p>
            <p className="text-xs text-green-700 font-semibold mt-1">GHC {stats.completedAmount.toFixed(2)}</p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
            <p className="text-sm text-slate-600">Rejected</p>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'completed', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              filterStatus === status
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-green-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loadError && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading withdrawals...</p>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No withdrawal requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Publisher</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Payment Identity</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Request Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{withdrawal.displayName || withdrawal.username || 'Unknown Publisher'}</p>
                        <p className="text-xs text-slate-500">{withdrawal.displayEmail || withdrawal.email || `User ID: ${withdrawal.userId}`}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-700 font-medium">
                          Name: {withdrawal.registeredName || '-'}
                        </p>
                        <p className="text-xs text-slate-600">
                          Number: {withdrawal.paymentPhoneNumber || withdrawal.displayPhone || '-'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Method: {(withdrawal.paymentMethod || 'mobile_money').replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-green-600">GHC {withdrawal.amount.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(withdrawal.status)}`}>
                        {getStatusIcon(withdrawal.status)}
                        {withdrawal.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(withdrawal.requestDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewDetails(withdrawal)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-semibold text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-2xl font-bold text-slate-900">Withdrawal Request Details</h2>
              <p className="text-sm text-slate-600 mt-1">Request ID: {selectedWithdrawal.id.substring(0, 8)}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Publisher Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Publisher Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600">Name:</p>
                    <p className="font-semibold">{selectedWithdrawal.displayName || selectedWithdrawal.username || 'Unknown Publisher'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Email:</p>
                    <p className="font-semibold">{selectedWithdrawal.displayEmail || selectedWithdrawal.email || `User ID: ${selectedWithdrawal.userId}`}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Registered Name:</p>
                    <p className="font-semibold">{selectedWithdrawal.registeredName || paymentDetails?.registeredName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Payment Number:</p>
                    <p className="font-semibold">{selectedWithdrawal.paymentPhoneNumber || paymentDetails?.phoneNumber || selectedWithdrawal.displayPhone || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Withdrawal Info */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Withdrawal Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600">Amount:</p>
                    <p className="text-2xl font-bold text-green-600">GHC {selectedWithdrawal.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Status:</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedWithdrawal.status)}`}>
                      {selectedWithdrawal.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-600">Request Date:</p>
                    <p className="font-semibold">{new Date(selectedWithdrawal.requestDate).toLocaleString()}</p>
                  </div>
                  {selectedWithdrawal.processedDate && (
                    <div>
                      <p className="text-slate-600">Processed Date:</p>
                      <p className="font-semibold">{new Date(selectedWithdrawal.processedDate).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className={`rounded-xl p-4 ${paymentDetails?.isComplete ? 'bg-blue-50' : 'bg-red-50'}`}>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                  {paymentDetails?.isComplete ? (
                    <span className="ml-auto text-xs bg-green-500 text-white px-2 py-1 rounded-full">✓ Complete</span>
                  ) : (
                    <span className="ml-auto text-xs bg-red-500 text-white px-2 py-1 rounded-full">✗ Incomplete</span>
                  )}
                </h3>
                {paymentDetails ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-600">Payment Method:</p>
                      <p className="font-semibold">{paymentDetails.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Registered Name:</p>
                      <p className="font-semibold">{paymentDetails.registeredName}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Phone Number:</p>
                      <p className="font-semibold">{paymentDetails.phoneNumber}</p>
                    </div>
                    {paymentDetails.accountNumber && (
                      <div>
                        <p className="text-slate-600">Account Number:</p>
                        <p className="font-semibold">{paymentDetails.accountNumber}</p>
                      </div>
                    )}
                    {paymentDetails.bankName && (
                      <div>
                        <p className="text-slate-600">Bank Name:</p>
                        <p className="font-semibold">{paymentDetails.bankName}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600 font-semibold">⚠️ No payment details found</p>
                )}
              </div>

              {/* Admin Notes */}
              {selectedWithdrawal.status === 'pending' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Admin Notes {selectedWithdrawal.status === 'pending' && '(Required for rejection)'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add notes about this withdrawal..."
                  />
                </div>
              )}

              {selectedWithdrawal.adminNotes && (
                <div className="bg-slate-100 rounded-xl p-4">
                  <p className="text-sm font-bold text-slate-700 mb-1">Admin Notes:</p>
                  <p className="text-sm text-slate-600">{selectedWithdrawal.adminNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedWithdrawal.status === 'pending' && (
                  <>
                    <button
                      onClick={approveWithdrawal}
                      disabled={processing || !paymentDetails?.isComplete}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : paymentDetails?.isComplete ? '✓ Approve for Payment' : '✗ Cannot Approve (Incomplete Details)'}
                    </button>
                    <button
                      onClick={rejectWithdrawal}
                      disabled={processing}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 font-bold disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Reject Request'}
                    </button>
                  </>
                )}
                {selectedWithdrawal.status === 'approved' && (
                  <button
                    onClick={completeWithdrawal}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 font-bold disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : '✓ Mark as Paid/Completed'}
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
