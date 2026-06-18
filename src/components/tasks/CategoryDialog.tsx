'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899',
  '#ef4444', '#f97316', '#f59e0b',
  '#10b981', '#14b8a6', '#3b82f6',
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSaved: () => void
}

export function CategoryDialog({ open, onOpenChange, userId, onSaved }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setColor(PRESET_COLORS[0])
    }
  }, [open])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('categories')
      .insert({ user_id: userId, name: name.trim(), color })
    setSaving(false)
    if (error) { toast.error('Error al crear la categoría'); return }
    toast.success('Categoría creada')
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva categoría</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nombre *</Label>
            <Input
              id="cat-name"
              placeholder="Ej: Trabajo, Personal, Estudio..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-9 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-8 w-8 rounded-full transition-all hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `3px solid ${c}` : '3px solid transparent',
                    outlineOffset: '2px',
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <div
                className="h-5 w-5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-muted-foreground">Vista previa de la categoría</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              style={{ backgroundColor: color }}
              className="text-white hover:opacity-90"
            >
              {saving ? 'Guardando...' : 'Crear categoría'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
