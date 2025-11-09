'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

interface TrendingTopic {
  id: string
  title: string
  description: string
  icon?: string
  color?: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export default function TrendingTopicsAdminPage() {
  const { token } = useAuth()
  const [topics, setTopics] = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TrendingTopic | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    icon: '📝',
    color: '#3B82F6',
    isActive: true,
    order: 0,
  })

  useEffect(() => {
    if (token) {
      fetchTopics()
    }
  }, [token])

  async function fetchTopics() {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3002/api/trending-topics', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch topics')
      const data = await res.json()
      setTopics(data.data || [])
    } catch (err) {
      console.error('Failed to fetch topics:', err)
      setTopics([])
      toast.error('Failed to fetch trending topics')
    } finally {
      setLoading(false)
    }
  }

  function openModal(topic?: TrendingTopic) {
    setEditing(topic || null)
    setForm(topic ? {
      title: topic.title,
      description: topic.description,
      icon: topic.icon || '📝',
      color: topic.color || '#3B82F6',
      isActive: topic.isActive,
      order: topic.order || 0,
    } : {
      title: '',
      description: '',
      icon: '📝',
      color: '#3B82F6',
      isActive: true,
      order: topics.length,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setEditing(null)
    setModalOpen(false)
    setForm({
      title: '',
      description: '',
      icon: '📝',
      color: '#3B82F6',
      isActive: true,
      order: 0,
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      toast.error('No authentication token found')
      return
    }
    try {
      const url = editing
        ? `http://localhost:3002/api/trending-topics/${editing.id}`
        : 'http://localhost:3002/api/trending-topics'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to save topic')
      }
      toast.success(editing ? 'Topic updated!' : 'Topic created!')
      closeModal()
      fetchTopics()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save trending topic')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this trending topic?')) return
    if (!token) return
    try {
      const res = await fetch(`http://localhost:3002/api/trending-topics/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete topic')
      toast.success('Topic deleted successfully')
      fetchTopics()
    } catch (err) {
      toast.error('Failed to delete topic')
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    if (!token) return
    try {
      const res = await fetch(`http://localhost:3002/api/trending-topics/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast.success('Topic status updated')
      fetchTopics()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  async function swapOrder(a: TrendingTopic, b: TrendingTopic) {
    if (!token) return
    try {
      await fetch('http://localhost:3002/api/trending-topics/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ idA: a.id, orderA: b.order, idB: b.id, orderB: a.order })
      })
      fetchTopics()
    } catch (err) {
      toast.error('Failed to reorder')
    }
  }

  function moveUp(topic: TrendingTopic) {
    const idx = topics.findIndex(t => t.id === topic.id)
    if (idx > 0) swapOrder(topic, topics[idx - 1])
  }

  function moveDown(topic: TrendingTopic) {
    const idx = topics.findIndex(t => t.id === topic.id)
    if (idx < topics.length - 1) swapOrder(topic, topics[idx + 1])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Trending Topics</h1>
                    <p className="text-slate-600 mt-1">Manage trending topics shown to publishers</p>
        </div>
        <Button onClick={() => openModal()} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 gap-2">
          <Plus className="w-4 h-4" />
          Add Topic
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : topics.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 shadow-lg border border-slate-100 text-center">
          <p className="text-slate-600 font-medium mb-4">No trending topics yet</p>
          <Button onClick={() => openModal()} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30">
            Create Your First Topic
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, idx) => (
            <div
              key={topic.id}
              className={`rounded-2xl border-2 p-6 flex flex-col gap-3 transition-all duration-300 hover:shadow-xl ${
                topic.isActive 
                  ? 'bg-white border-purple-100 hover:border-purple-300' 
                  : 'bg-slate-50 border-slate-300 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 shadow-md"
                  style={{ backgroundColor: `${topic.color || '#3B82F6'}20` }}
                >
                  {topic.icon || '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-slate-900 mb-1">{topic.title}</h3>
                  <p className="text-xs text-slate-500 font-semibold">Order: {topic.order}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 line-clamp-3 flex-1">{topic.description}</p>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveUp(topic)}
                  disabled={idx === 0}
                  title="Move Up"
                  className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveDown(topic)}
                  disabled={idx === topics.length - 1}
                  title="Move Down"
                  className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openModal(topic)}
                  title="Edit"
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(topic.id)}
                  title="Delete"
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-md shadow-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={topic.isActive ? 'default' : 'outline'}
                  onClick={() => handleToggleActive(topic.id, topic.isActive)}
                  className={topic.isActive ? 
                    'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/30' :
                    'hover:bg-slate-100'
                  }
                >
                  {topic.isActive ? 'Active' : 'Inactive'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-5 border border-purple-100">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {editing ? 'Edit Topic' : 'Add Topic'}
              </h2>
              <Button variant="ghost" size="sm" onClick={closeModal} className="hover:bg-purple-50 rounded-xl">
                ✕
              </Button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., AI and Technology"
                  required
                  className="rounded-xl border-slate-300 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the topic..."
                  rows={4}
                  required
                  className="rounded-xl border-slate-300 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Icon (Emoji)</label>
                  <Input
                    value={form.icon}
                    maxLength={2}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="📝"
                    className="rounded-xl border-slate-300 text-center text-2xl focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Color</label>
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="h-10 cursor-pointer rounded-xl border-slate-300"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-5 h-5 rounded accent-purple-600"
                />
                <label className="text-sm font-semibold text-slate-700">Active</label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Order</label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="rounded-xl border-slate-300 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1 rounded-xl border-2 hover:bg-slate-100">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30">
                  {editing ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}



