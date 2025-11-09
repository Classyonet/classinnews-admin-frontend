'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (subject: string, body: string) => void
  recipientName: string
}

export function MessageModal({ isOpen, onClose, onSend, recipientName }: MessageModalProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const handleSend = () => {
    onSend(subject, body)
    setSubject('')
    setBody('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Message to {recipientName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              id="subject"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Textarea
              id="body"
              placeholder="Type your message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSend} disabled={!subject.trim() || !body.trim()}>
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}