'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { usersAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function AdministratorsPage(){
  const { token } = useAuth()
  const [admins, setAdmins] = useState<any[]>([])

  useEffect(() => { if(token) fetchAdmins() }, [token])

  async function fetchAdmins(){
    if (!token) return
    try{
      const res = await usersAPI.getAll(token, { role: 'admin', limit: 100 })
      const data = res.data?.users || res.data || res
      setAdmins(Array.isArray(data) ? data : data.users || [])
    }catch(err){ console.error(err) }
  }

  async function changeRole(id: string, role: string){
    if (!token) return
    try{
      await usersAPI.update(token, id, { role })
      fetchAdmins()
    }catch(err){ console.error(err) }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Administrators</h1>
      <div className="space-y-3">
        {admins.map(a => (
          <div key={a.id} className="p-3 border rounded flex justify-between">
            <div>
              <div className="font-medium">{a.username} <span className="text-sm text-gray-500">{a.email}</span></div>
              <div className="text-sm text-gray-500">Role: {a.role}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => changeRole(a.id, 'moderator')}>Make Moderator</Button>
              <Button onClick={() => changeRole(a.id, 'admin')}>Make Admin</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
