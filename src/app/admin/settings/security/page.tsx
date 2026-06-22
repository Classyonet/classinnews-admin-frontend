'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getApiUrl } from '@/lib/api-config';
import { adminApiFetch } from '@/lib/admin-session';
import { Shield, ShieldAlert, Ban, Trash2, ShieldCheck, Activity, Search, ShieldOff, AlertTriangle } from 'lucide-react';

const API_URL = getApiUrl();

interface SecurityLog {
  id: string;
  eventType: string;
  ipAddress: string;
  userAgent: string;
  path: string;
  method: string;
  details: any;
  createdAt: string;
}

interface BlockedIp {
  id: string;
  ipAddress: string;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function SecurityPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'firewall'>('logs');

  // Form state
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, ipsRes] = await Promise.all([
        adminApiFetch(`${API_URL}/api/security/logs?limit=100`, {}, token),
        adminApiFetch(`${API_URL}/api/security/blocked-ips`, {}, token)
      ]);

      if (logsRes.ok) {
        const { data } = await logsRes.json();
        setLogs(data);
      }
      if (ipsRes.ok) {
        const { data } = await ipsRes.json();
        setBlockedIps(data);
      }
    } catch (err) {
      console.error('Failed to fetch security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;

    setBlocking(true);
    try {
      const res = await adminApiFetch(`${API_URL}/api/security/block-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress: newIp.trim(), reason: newReason.trim() || 'Manually blocked by admin' })
      }, token);

      if (res.ok) {
        setNewIp('');
        setNewReason('');
        fetchData();
        alert('IP Address successfully blocked.');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to block IP');
      }
    } catch (err) {
      alert('Network error while blocking IP');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    if (!confirm(`Are you sure you want to unblock ${ip}?`)) return;

    try {
      const res = await adminApiFetch(`${API_URL}/api/security/block-ip/${encodeURIComponent(ip)}`, {
        method: 'DELETE',
      }, token);

      if (res.ok) {
        setBlockedIps(blockedIps.filter(b => b.ipAddress !== ip));
      } else {
        alert('Failed to unblock IP');
      }
    } catch (err) {
      alert('Network error while unblocking IP');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <a href="/admin/settings" className="text-red-600 hover:text-red-800 mb-4 inline-flex items-center gap-1 text-sm font-medium">
            &larr; Back to Settings
          </a>
          <h1 className="text-3xl font-bold text-slate-900 mt-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600" />
            Security Command Center
          </h1>
          <p className="text-slate-600 mt-1">Monitor system logs, manage Web Application Firewall (WAF), and block malicious IPs.</p>
        </div>

        {/* Global Security Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 flex items-start gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">WAF Status</p>
              <p className="text-xl font-bold text-emerald-700">Active</p>
              <p className="text-xs text-slate-400 mt-1">Filtering XSS &amp; SQLi</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-xl text-red-600">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Blocked IPs</p>
              <p className="text-xl font-bold text-red-700">{blockedIps.length}</p>
              <p className="text-xs text-slate-400 mt-1">Actively denied access</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6 flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Security Events (Last 100)</p>
              <p className="text-xl font-bold text-amber-700">{logs.length}</p>
              <p className="text-xs text-slate-400 mt-1">Monitored logs</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Activity &amp; Attack Logs
            </div>
          </button>
          <button
            onClick={() => setActiveTab('firewall')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'firewall' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4" /> IP Firewall &amp; Blocking
            </div>
          </button>
        </div>

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Recent Security Events</h2>
              <button onClick={fetchData} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                Refresh Logs
              </button>
            </div>
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <ShieldCheck className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
                <p>No security events recorded recently. System is secure.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Event Type</th>
                      <th className="px-4 py-3">IP Address</th>
                      <th className="px-4 py-3">Path</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.eventType.includes('MALICIOUS') || log.eventType.includes('ATTEMPT') 
                              ? 'bg-red-100 text-red-700' 
                              : log.eventType.includes('RATE_LIMIT')
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {log.eventType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{log.ipAddress}</td>
                        <td className="px-4 py-3 text-slate-600 truncate max-w-xs" title={log.path}>
                          {log.method} {log.path}
                        </td>
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => alert(JSON.stringify(log.details, null, 2))}
                            className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                          >
                            <Search className="w-3 h-3" /> View Payload
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Firewall Tab */}
        {activeTab === 'firewall' && (
          <div className="space-y-6">
            {/* Add IP Form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" /> Block New IP Address
              </h2>
              <form onSubmit={handleBlockIp} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">IP Address</label>
                  <input
                    type="text"
                    required
                    value={newIp}
                    onChange={e => setNewIp(e.target.value)}
                    placeholder="e.g. 192.168.1.100"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason (Optional)</label>
                  <input
                    type="text"
                    value={newReason}
                    onChange={e => setNewReason(e.target.value)}
                    placeholder="e.g. Spam comments"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={blocking || !newIp}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 h-[42px]"
                >
                  {blocking ? 'Blocking...' : 'Block IP'}
                </button>
              </form>
            </div>

            {/* Blocked IPs List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-800">Currently Blocked IPs</h2>
              </div>
              {blockedIps.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <ShieldOff className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>No IP addresses are currently blocked.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">IP Address</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Blocked On</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {blockedIps.map(ip => (
                        <tr key={ip.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-medium text-red-600">{ip.ipAddress}</td>
                          <td className="px-4 py-3 text-slate-600">{ip.reason || '-'}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(ip.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleUnblockIp(ip.ipAddress)}
                              className="text-slate-400 hover:text-emerald-600 transition-colors p-2 rounded hover:bg-emerald-50"
                              title="Unblock IP"
                            >
                              <ShieldCheck className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
