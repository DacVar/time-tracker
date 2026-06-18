'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Task, Category } from '@/types'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  categories: Category[]
  userId: string
  onSaved: () => void
}

export function TaskDialog({ open, onOpenChange, task, categories, userId, onSaved }: Props) {
  const isEditing = !!task
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '')
      setDescription(task?.description ?? '')
      setCategoryId(task?.category_id ?? '')
    }
  }, [open, task])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
    }

    const { error } = isEditing
      ? await supabase.from('tasks').update(payload).eq('id', task.id)
      : await supabase.from('tasks').insert({ ...payload, user_id: userId })

    setSaving(false)
    if (error) { toast.error('Error al guardar la tarea'); return }

    toast.success(isEditing ? 'Tarea actualizada' : 'Tarea creada')
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Nombre *</Label>
            <Input
              id="task-title"
              placeholder="¿En qué vas a trabajar?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Descripción</Label>
            <textarea
              id="task-desc"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Detalles opcionales..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-cat">Categoría</Label>
            <select
              id="task-cat"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear tarea'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
