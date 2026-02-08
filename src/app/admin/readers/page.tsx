'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, MoreVertical, UserCheck, UserX } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Reader {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  _count?: {
    comments: number;
  };
}

export default function ReadersPage() {
  const { token } = useAuth();
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (token) {
      fetchReaders();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchReaders = async () => {
    if (!token) {
      console.log('❌ No token available - user not logged in');
      setLoading(false);
      return;
    }
    
    console.log('✅ Token exists, fetching readers...');
    
    try {
      setLoading(true);
      const response = await usersAPI.getAll(token, {
        search: searchTerm || undefined,
        role: 'reader', // Only fetch readers
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      console.log('📊 Readers API response:', response);
      
      const readersData = response.data?.users || response.data || response;
      console.log('📊 Extracted readers data:', readersData);
      
      setReaders(Array.isArray(readersData) ? readersData : []);
      console.log('✅ Readers state updated');
    } catch (error: any) {
      console.error('❌ Failed to fetch readers:', error);
      setReaders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchReaders();
  };

  const handleStatusToggle = async (readerId: string, isActive: boolean) => {
    if (!token) return
    try {
      await usersAPI.update(token, readerId, { isActive });
      fetchReaders(); // Refresh the list
    } catch (error) {
      console.error('Failed to update reader status:', error);
    }
  };

  const getStatusBadgeColor = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-700';
    if (!isVerified) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusText = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'Inactive';
    if (!isVerified) return 'Unverified';
    return 'Active';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">News Readers</h1>
          <p className="text-gray-500 mt-1">Manage registered news readers and their accounts</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{readers.length} readers</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search readers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Readers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Readers ({readers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reader
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {readers.map((reader) => (
                  <tr key={reader.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {reader.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {reader.username}
                          </div>
                          <div className="text-sm text-gray-500">{reader.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(reader.isActive, reader.isVerified)}`}>
                        {getStatusText(reader.isActive, reader.isVerified)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reader._count?.comments || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(reader.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {reader.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusToggle(reader.id, false)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusToggle(reader.id, true)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {readers.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{token ? 'No readers found' : 'Please log in to view readers'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}