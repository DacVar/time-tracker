'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Task, Category } from '@/types'
import { Plus, Pencil, Archive, Play, Square, Clock, History } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TaskDialog } from './TaskDialog'
import { TaskManualEntryDialog } from './TaskManualEntryDialog'
import { TaskEntriesDialog } from './TaskEntriesDialog'
import { useActiveTimer } from '@/hooks/useActiveTimer'

type Props = {
  tasks: Task[]
  categories: Category[]
  userId: string
  onChanged: () => void
}

type Group = { category: Category | null; tasks: Task[] }

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function TaskList({ tasks, categories, userId, onChanged }: Props) {
  const { activeTaskId, elapsed, start, stop } = useActiveTimer(userId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [manualTask, setManualTask] = useState<Task | null>(null)
  const [historyTask, setHistoryTask] = useState<Task | null>(null)

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string | null, Group>()
    categories.forEach((cat) => map.set(cat.id, { category: cat, tasks: [] }))
    map.set(null, { category: null, tasks: [] })
    tasks.forEach((task) => {
      const key = task.category_id ?? null
      if (!map.has(key)) map.set(key, { category: null, tasks: [] })
      map.get(key)!.tasks.push(task)
    })
    return Array.from(map.values())
      .filter((g) => g.tasks.length > 0)
      .sort((a, b) => {
        if (!a.category) return 1
        if (!b.category) return -1
        return a.category.name.localeCompare(b.category.name)
      })
  }, [tasks, categories])

  const openCreate = () => { setEditingTask(null); setDialogOpen(true) }
  const openEdit = (task: Task) => { setEditingTask(task); setDialogOpen(true) }
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) setEditingTask(null)
  }

  const archive = async (task: Task) => {
    // Stop timer if it's running on this task before archiving
    if (activeTaskId === task.id) await stop()
    await supabase.from('tasks').update({ is_active: false }).eq('id', task.id)
    onChanged()
    toast('Tarea archivada', {
      action: {
        label: 'Deshacer',
        onClick: async () => {
          await supabase.from('tasks').update({ is_active: true }).eq('id', task.id)
          onChanged()
          toast.success('Tarea restaurada')
        },
      },
    })
  }

  const handleTimerToggle = async (task: Task) => {
    if (activeTaskId === task.id) {
      await stop()
    } else {
      await start(task.id)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg">Tareas</CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Nueva tarea
          </Button>
        </CardHeader>

        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                Sin tareas activas. ¡Crea la primera!
              </p>
              <Button variant="outline" size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Crear tarea
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map(({ category, tasks: groupTasks }) => (
                <div key={category?.id ?? 'none'}>

                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: category?.color ?? '#94a3b8' }}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {category?.name ?? 'Sin categoría'}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {groupTasks.length}
                    </span>
                  </div>

                  {/* Task rows */}
                  <ul className="space-y-0.5">
                    {groupTasks.map((task) => {
                      const isActive = task.id === activeTaskId
                      const catColor = category?.color ?? '#94a3b8'

                      return (
                        <li
                          key={task.id}
                          className={cn(
                            'group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors',
                            isActive
                              ? 'bg-primary/5 border border-primary/20'
                              : 'hover:bg-muted/50 border border-transparent'
                          )}
                        >
                          {/* Category dot */}
                          <div
                            className={cn(
                              'h-1.5 w-1.5 rounded-full shrink-0 transition-all',
                              isActive && 'h-2 w-2 ring-2 ring-offset-1'
                            )}
                            style={{
                              backgroundColor: catColor,
                              ...(isActive ? { ringColor: catColor } : {}),
                            }}
                          />

                          {/* Task info */}
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              'text-sm leading-snug truncate',
                              isActive ? 'font-semibold' : 'font-medium'
                            )}>
                              {task.title}
                            </p>
                            {task.description && !isActive && (
                              <p className="text-xs text-muted-foreground truncate">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Elapsed display — only for the active task */}
                          {isActive && (
                            <span className="font-mono text-sm font-semibold tabular-nums text-primary shrink-0 min-w-[3.5rem] text-right">
                              {formatElapsed(elapsed)}
                            </span>
                          )}

                          {/* Action buttons — always visible on mobile, hover-only on desktop */}
                          <div className={cn(
                            'flex items-center gap-0.5 shrink-0 transition-opacity',
                            isActive ? 'opacity-100' : 'sm:opacity-0 sm:group-hover:opacity-100'
                          )}>
                            {/* Timer toggle */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                'h-7 w-7 transition-colors',
                                isActive
                                  ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
                                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                              )}
                              title={isActive ? 'Detener timer' : 'Iniciar timer'}
                              onClick={() => handleTimerToggle(task)}
                            >
                              {isActive
                                ? <Square className="h-3.5 w-3.5 fill-current" />
                                : <Play className="h-3.5 w-3.5 fill-current" />
                              }
                            </Button>

                            {/* Manual time entry */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Registrar tiempo manual"
                              onClick={() => setManualTask(task)}
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </Button>

                            {/* History */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Ver registros"
                              onClick={() => setHistoryTask(task)}
                            >
                              <History className="h-3.5 w-3.5" />
                            </Button>

                            {/* Divider */}
                            <div className="w-px h-4 bg-border mx-0.5" />

                            {/* Edit */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Editar tarea"
                              onClick={() => openEdit(task)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            {/* Archive */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
                              title="Archivar tarea"
                              onClick={() => archive(task)}
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        task={editingTask}
        categories={categories}
        userId={userId}
        onSaved={onChanged}
      />

      {manualTask && (
        <TaskManualEntryDialog
          open={!!manualTask}
          onOpenChange={(open) => { if (!open) setManualTask(null) }}
          task={manualTask}
          onSaved={onChanged}
        />
      )}

      {historyTask && (
        <TaskEntriesDialog
          open={!!historyTask}
          onOpenChange={(open) => { if (!open) setHistoryTask(null) }}
          task={historyTask}
          onChanged={onChanged}
        />
      )}
    </>
  )
}
