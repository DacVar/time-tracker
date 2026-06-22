'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Task, TimeEntry } from '@/types'
import { fmtDuration } from '@/lib/format'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pencil, Trash2, Timer, Hand } from 'lucide-react'
import { toast } from 'sonner'
import { TimeEntryEditDialog } from './TimeEntryEditDialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  onChanged: () => void
}

export function TaskEntriesDialog({ open, onOpenChange, task, onChanged }: Props) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('task_id', task.id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
    setEntries(data ?? [])
    setLoading(false)
  }, [task.id])

  useEffect(() => {
    if (open) fetchEntries()
  }, [open, fetchEntries])

  const handleDelete = async (entry: TimeEntry) => {
    const { error } = await supabase.from('time_entries').delete().eq('id', entry.id)
    if (error) { toast.error('Error al eliminar el registro'); return }
    toast.success('Registro eliminado')
    setEntries(prev => prev.filter(e => e.id !== entry.id))
    onChanged()
  }

  const totalSeconds = entries.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registros de tiempo</DialogTitle>
            <p className="text-sm text-muted-foreground truncate">{task.title}</p>
          </DialogHeader>

          {entries.length > 0 && (
            <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
              <span className="text-muted-foreground">
                {entries.length} {entries.length === 1 ? 'registro' : 'registros'}
              </span>
              <span className="font-semibold">{fmtDuration(totalSeconds)} total</span>
            </div>
          )}

          <div className="max-h-[50vh] overflow-y-auto -mx-4 px-4 space-y-0.5">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">Cargando...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">Sin registros para esta tarea</p>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 border border-transparent hover:border-border transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium capitalize">
                        {format(new Date(entry.started_at), 'd MMM yyyy', { locale: es })}
                      </span>
                      {entry.source === 'timer'
                        ? <Timer className="h-3 w-3 text-muted-foreground shrink-0" />
                        : <Hand className="h-3 w-3 text-muted-foreground shrink-0" />
                      }
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.notes}</p>
                    )}
                  </div>

                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {fmtDuration(entry.duration_seconds ?? 0)}
                  </span>

                  <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Editar registro"
                      onClick={() => setEditingEntry(entry)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Eliminar registro"
                      onClick={() => handleDelete(entry)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editingEntry && (
        <TimeEntryEditDialog
          open={!!editingEntry}
          onOpenChange={(open) => { if (!open) setEditingEntry(null) }}
          entry={editingEntry}
          taskTitle={task.title}
          onSaved={() => {
            fetchEntries()
            onChanged()
            setEditingEntry(null)
          }}
        />
      )}
    </>
  )
}
