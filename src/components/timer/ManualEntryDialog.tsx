'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Task } from '@/types'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  tasks: Task[]
  onSaved: () => void
}

export function ManualEntryDialog({ tasks, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [taskId, setTaskId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!taskId || (!hours && !minutes)) return
    setSaving(true)
    const totalSeconds = (parseInt(hours || '0') * 3600) + (parseInt(minutes || '0') * 60)
    const startedAt = new Date(`${date}T09:00:00`)
    const endedAt = new Date(startedAt.getTime() + totalSeconds * 1000)

    const selectedTask = tasks.find(t => t.id === taskId)
    const { error } = await supabase.from('time_entries').insert({
      task_id: taskId,
      user_id: selectedTask?.user_id,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_seconds: totalSeconds,
      notes: notes || null,
      source: 'manual',
    })

    setSaving(false)
    if (error) {
      toast.error('Error al guardar la entrada')
      return
    }
    toast.success('Tiempo registrado correctamente')
    setOpen(false)
    setTaskId('')
    setHours('')
    setMinutes('')
    setNotes('')
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="w-full" />}>
        <PlusCircle className="mr-2 h-4 w-4" /> Registrar tiempo manual
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registro manual de tiempo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>Tarea</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
            >
              <option value="">Selecciona una tarea...</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Horas</Label>
              <Input type="number" min="0" max="23" placeholder="0" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Minutos</Label>
              <Input type="number" min="0" max="59" placeholder="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notas (opcional)</Label>
            <Input placeholder="¿En qué trabajaste?" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving || !taskId}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
