'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Star, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WriteReviewDialogProps {
  orderItemId: string | null
  productName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitted: () => void
}

export function WriteReviewDialog({ orderItemId, productName, open, onOpenChange, onSubmitted }: WriteReviewDialogProps) {
  const [rating, setRating] = React.useState(0)
  const [title, setTitle] = React.useState('')
  const [comment, setComment] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setRating(0)
      setTitle('')
      setComment('')
    }
  }, [open])

  async function handleSubmit() {
    if (!orderItemId) return
    if (rating < 1) {
      toast.error('Please select a rating.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId, rating, title: title.trim() || undefined, comment: comment.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not submit review.')
        return
      }
      toast.success('Thanks for your review!')
      onSubmitted()
      onOpenChange(false)
    } catch {
      toast.error('Could not submit review.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Write a review</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Rating</Label>
            <div className="mt-1.5 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
                  <Star
                    className={cn('h-6 w-6', n <= rating ? 'fill-brand text-brand' : 'text-muted-foreground')}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Title (optional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a few words" className="mt-1.5" />
          </div>
          <div>
            <Label>Comment (optional)</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="mt-1.5" />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
