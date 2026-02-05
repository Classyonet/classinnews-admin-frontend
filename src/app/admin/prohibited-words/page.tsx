'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Check, X, AlertTriangle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "`${API_URL}';

interface ProhibitedWord {
  id: string;
  word: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProhibitedWordsPage() {
  const [words, setWords] = useState<ProhibitedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch("`${API_URL}/api/prohibited-words', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setWords(data.words);
      }
    } catch (err) {
      console.error('Error fetching words:', err);
    } finally {
      setLoading(false);
    }
  };

  const addWord = async () => {
    if (!newWord.trim()) {
      setError('Please enter a word');
      return;
    }

    setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch("`${API_URL}/api/prohibited-words', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ word: newWord.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Word added successfully!');
        setNewWord('');
        setShowAddForm(false);
        fetchWords();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to add word');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/prohibited-words/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (res.ok) {
        setSuccess(`Word ${!currentStatus ? 'activated' : 'deactivated'}!`);
        fetchWords();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error toggling word:', err);
    }
  };

  const deleteWord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/prohibited-words/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setSuccess('Word deleted successfully!');
        fetchWords();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting word:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeWords = words.filter(w => w.isActive);
  const inactiveWords = words.filter(w => !w.isActive);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Prohibited Words Management</h1>
        </div>
        <p className="text-gray-600">
          Manage the list of prohibited words for comment filtering. Comments containing these words will be automatically rejected.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Words</p>
              <p className="text-3xl font-bold text-gray-900">{words.length}</p>
            </div>
            <Shield className="w-12 h-12 text-gray-300" />
          </div>
        </div>

        <div className="bg-white border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-green-600">{activeWords.length}</p>
            </div>
            <Check className="w-12 h-12 text-green-300" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Inactive</p>
              <p className="text-3xl font-bold text-gray-400">{inactiveWords.length}</p>
            </div>
            <X className="w-12 h-12 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Add Word Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Prohibited Word
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Prohibited Word</h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addWord()}
              placeholder="Enter word to prohibit..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addWord}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Add Word
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewWord('');
                setError('');
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Words */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Check className="w-6 h-6 text-green-600" />
          Active Words ({activeWords.length})
        </h2>
        
        {activeWords.length === 0 ? (
          <p className="text-gray-500">No active prohibited words</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {activeWords.map((word) => (
              <div
                key={word.id}
                className="bg-red-50 border border-red-200 rounded-lg p-3 flex flex-col gap-2"
              >
                <span className="font-semibold text-gray-900">{word.word}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive(word.id, word.isActive)}
                    className="flex-1 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition-colors"
                    title="Deactivate"
                  >
                    <X className="w-3 h-3 mx-auto" />
                  </button>
                  <button
                    onClick={() => deleteWord(word.id)}
                    className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Words */}
      {inactiveWords.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <X className="w-6 h-6 text-gray-400" />
            Inactive Words ({inactiveWords.length})
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {inactiveWords.map((word) => (
              <div
                key={word.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-2 opacity-60"
              >
                <span className="font-semibold text-gray-700">{word.word}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive(word.id, word.isActive)}
                    className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                    title="Activate"
                  >
                    <Check className="w-3 h-3 mx-auto" />
                  </button>
                  <button
                    onClick={() => deleteWord(word.id)}
                    className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
