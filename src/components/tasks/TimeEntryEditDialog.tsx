'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { TimeEntry } from '@/types'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: TimeEntry
  taskTitle: string
  onSaved: () => void
}

function formatDuration(h: number, m: number): string {
  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}min`)
  return parts.join(' ')
}

export function TimeEntryEditDialog({ open, onOpenChange, entry, taskTitle, onSaved }: Props) {
  const [date, setDate] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const startedAt = new Date(entry.started_at)
      setDate(startedAt.toISOString().slice(0, 10))
      const dur = entry.duration_seconds ?? 0
      setHours(String(Math.floor(dur / 3600)))
      setMinutes(String(Math.floor((dur % 3600) / 60)))
      setNotes(entry.notes ?? '')
    }
  }, [open, entry])

  const h = Math.max(0, parseInt(hours || '0', 10))
  const m = Math.max(0, parseInt(minutes || '0', 10))
  const totalSeconds = h * 3600 + m * 60
  const canSave = totalSeconds > 0 && !!date

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)

    const startedAt = new Date(`${date}T09:00:00`)
    const endedAt = new Date(startedAt.getTime() + totalSeconds * 1000)

    const { error } = await supabase
      .from('time_entries')
      .update({
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: totalSeconds,
        notes: notes.trim() || null,
      })
      .eq('id', entry.id)

    setSaving(false)
    if (error) { toast.error('Error al actualizar el registro'); return }

    toast.success('Registro actualizado')
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar registro</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{taskTitle}</p>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="ee-date">Fecha</Label>
            <Input
              id="ee-date"
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Duración</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="23"
                  placeholder="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="pr-12"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                  h
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="pr-12"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                  min
                </span>
              </div>
            </div>
            {totalSeconds > 0 && (
              <p className="text-xs text-muted-foreground">
                Total: <span className="font-medium text-foreground">{formatDuration(h, m)}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ee-notes">
              Notas{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="ee-notes"
              placeholder="¿En qué trabajaste?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !canSave}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
