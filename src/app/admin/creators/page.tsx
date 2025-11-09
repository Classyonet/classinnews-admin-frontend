'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { MessageModal } from '@/components/ui/message-modal'
import { usersAPI } from '@/lib/api'
import { toast } from 'sonner'

interface Creator {
  id: string
  username: string
  email: string
  isVerified: boolean
  isActive: boolean
  createdAt: string
}

export default function CreatorsPage() {
  const { token } = useAuth()
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(false)
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
  const [actionLoading, setActionLoading] = useState<string>('')

  useEffect(() => {
    if (token) fetchCreators()
  }, [token])

  async function fetchCreators() {
    if (!token) return
    setLoading(true)
    try {
      const res = await usersAPI.getAll(token, { role: 'creator', limit: 100 })
      const data = res.data?.users || res.data || res
      setCreators(Array.isArray(data) ? data : data.creators || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch creators')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id: string, action: string) {
    setActionLoading(`${action}-${id}`)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creators/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ action })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Action failed')
      }
      
      toast.success(`Successfully ${action}ed creator`)
      fetchCreators()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || `Failed to ${action} creator`)
    } finally {
      setActionLoading('')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this creator?')) {
      return
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creators/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Delete failed')
      }
      
      toast.success('Creator deleted successfully')
      fetchCreators()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete creator')
    }
  }

  async function handleMessageSend(subject: string, body: string) {
    if (!selectedCreator) {
      toast.error('No creator selected')
      return
    }
    
    try {
      console.log('Sending message:', {
        toId: selectedCreator.id,
        subject: subject.trim(),
        body: body.trim()
      })
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
      const response = await fetch(`${apiUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toId: selectedCreator.id,
          subject: subject.trim(),
          body: body.trim(),
          fromRole: 'admin'
        })
      })
      
      const data = await response.json()
      console.log('Message response:', data)
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message')
      }
      
      toast.success('Message sent successfully')
      setMessageModalOpen(false)
      setSelectedCreator(null)
    } catch (err: any) {
      console.error('Message error:', err)
      toast.error(err.message || 'Failed to send message')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Publishers</h1>
          <p className="text-slate-600 mt-1">Manage and moderate publishers</p>
        </div>
      </div>

      <div>
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}
        {!loading && creators.length === 0 && (
          <div className="rounded-2xl bg-white p-12 shadow-lg border border-slate-100 text-center">
            <p className="text-slate-600 font-medium">No creators found</p>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          {creators.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white p-6 shadow-lg border-2 border-purple-100 hover:shadow-2xl hover:border-purple-300 hover:scale-[1.01] transition-all duration-300">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <span className="text-lg font-bold text-white">
                      {c.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{c.username}</span>
                      <span className="text-sm text-slate-500">{c.email}</span>
                      {c.isVerified && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200">
                          Verified
                        </span>
                      )}
                      {!c.isActive && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200">
                          Blocked
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">Joined: {new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!c.isVerified ? (
                    <Button 
                      onClick={() => handleAction(c.id, 'approve')}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                      disabled={actionLoading === `approve-${c.id}`}
                    >
                      {actionLoading === `approve-${c.id}` ? 'Approving...' : 'Approve'}
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant={c.isActive ? "destructive" : "default"}
                        onClick={() => handleAction(c.id, c.isActive ? 'block' : 'unblock')}
                        className={c.isActive ? 
                          "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg shadow-red-500/30" :
                          "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                        }
                        disabled={actionLoading === `block-${c.id}` || actionLoading === `unblock-${c.id}`}
                      >
                        {actionLoading === `block-${c.id}` ? 'Blocking...' :
                         actionLoading === `unblock-${c.id}` ? 'Unblocking...' :
                         c.isActive ? 'Block' : 'Unblock'}
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedCreator(c)
                          setMessageModalOpen(true)
                        }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30"
                        disabled={!c.isActive || !c.isVerified}
                      >
                        Message
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="destructive"
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg shadow-red-500/30"
                    onClick={() => handleDelete(c.id)}
                    disabled={!c.isVerified || actionLoading === `delete-${c.id}`}
                  >
                    {actionLoading === `delete-${c.id}` ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCreator && (
        <MessageModal
          isOpen={messageModalOpen}
          onClose={() => {
            setMessageModalOpen(false)
            setSelectedCreator(null)
          }}
          onSend={handleMessageSend}
          recipientName={selectedCreator.username}
        />
      )}
    </div>
  )
}
