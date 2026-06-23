'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Task } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sun, Moon, Monitor, RotateCcw, LogOut } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, loading, signOut } = useAuth()
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('tasks')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setArchivedTasks(data ?? [])
        setLoadingTasks(false)
      })
  }, [user])

  const restore = async (task: Task) => {
    await supabase.from('tasks').update({ is_active: true }).eq('id', task.id)
    setArchivedTasks((prev) => prev.filter((t) => t.id !== task.id))
    toast.success('Tarea restaurada')
  }

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3 flex items-center gap-3">
        <Link href="/home">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-lg">Configuración</h1>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">

        {/* Appearance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Apariencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {([
                { value: 'light', label: 'Claro', Icon: Sun },
                { value: 'system', label: 'Sistema', Icon: Monitor },
                { value: 'dark', label: 'Oscuro', Icon: Moon },
              ] as const).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1.5 rounded-lg border py-3 text-sm transition-colors',
                    theme === value
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Archived tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tareas archivadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
            ) : archivedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay tareas archivadas
              </p>
            ) : (
              <ul className="space-y-0.5">
                {archivedTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/50"
                  >
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: task.category?.color ?? '#94a3b8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      {task.category && (
                        <p className="text-xs text-muted-foreground truncate">{task.category.name}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-primary shrink-0"
                      onClick={() => restore(task)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restaurar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Button variant="destructive" className="w-full" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
