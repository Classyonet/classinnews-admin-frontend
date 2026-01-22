'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [apiUrl, setApiUrl] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'not set');
  }, []);

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@classynews.com',
          password: 'admin123'
        })
      });

      const data = await response.json();
      setTestResult({
        status: response.status,
        ok: response.ok,
        data: data
      });
    } catch (error: any) {
      setTestResult({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      
      <div className="space-y-4">
        <div>
          <strong>API URL:</strong> {apiUrl}
        </div>

        <button
          onClick={testLogin}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>

        {testResult && (
          <div className="p-4 bg-gray-100 rounded">
            <strong>Test Result:</strong>
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
