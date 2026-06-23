'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Task, Category } from '@/types'
import { ManualEntryDialog } from '@/components/timer/ManualEntryDialog'
import { TaskList } from '@/components/tasks/TaskList'
import { CategoryManager } from '@/components/tasks/CategoryManager'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { fmtDuration } from '@/lib/format'
import { startOfDay, endOfDay, format } from 'date-fns'
import { es } from 'date-fns/locale'

const QUOTES = [
  { text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', author: 'Robert Collier' },
  { text: 'No cuentes los días, haz que los días cuenten.', author: 'Muhammad Ali' },
  { text: 'El tiempo que disfrutas perdiendo no es tiempo perdido.', author: 'Bertrand Russell' },
  { text: 'La productividad no es casualidad; es siempre consecuencia de comprometerse con la excelencia.', author: 'Gary Ryan Blair' },
  { text: 'El secreto de salir adelante es comenzar.', author: 'Mark Twain' },
  { text: 'Lo que no se mide, no se puede mejorar.', author: 'Peter Drucker' },
  { text: 'Concentra todo tu pensamiento en el trabajo que tienes entre manos.', author: 'Thomas Edison' },
  { text: 'La disciplina es el puente entre las metas y los logros.', author: 'Jim Rohn' },
  { text: 'Haz lo que puedas, con lo que tienes, donde estás.', author: 'Theodore Roosevelt' },
  { text: 'No esperes el momento perfecto. Toma el momento y hazlo perfecto.', author: 'Zoey Sayward' },
  { text: 'El futuro pertenece a quienes creen en la belleza de sus sueños.', author: 'Eleanor Roosevelt' },
  { text: 'La única manera de hacer un gran trabajo es amar lo que haces.', author: 'Steve Jobs' },
  { text: 'Empieza donde estás, usa lo que tienes, haz lo que puedas.', author: 'Arthur Ashe' },
  { text: 'La perseverancia no es una carrera larga; son muchas carreras cortas una tras otra.', author: 'Walter Elliot' },
  { text: 'Un día de trabajo hoy vale más que un día de trabajo mañana.', author: 'Proverbio' },
  { text: 'Trabaja mientras ellos duermen, aprende mientras ellos se divierten.', author: 'Eric Thomas' },
  { text: 'El tiempo es el recurso más valioso; a diferencia del dinero, no se puede recuperar.', author: 'Gordon Bryan' },
  { text: 'Cada día es una nueva oportunidad de mejorar tu versión de ayer.', author: 'Anónimo' },
  { text: 'Nunca terminarás lo que nunca empezaste.', author: 'Anónimo' },
  { text: 'El modo en que usas tu tiempo determina el tipo de persona en que te conviertes.', author: 'Anónimo' },
]

const SWIPE_THRESHOLD = 60

export default function HomePage() {
  const { user, loading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [panel, setPanel] = useState<'home' | 'dashboard'>('home')
  const touchStartX = useRef(0)

  const today = new Date()
  const quote = QUOTES[today.getDate() % QUOTES.length]
  const todayLabel = format(today, "EEEE, d 'de' MMMM", { locale: es })

  const fetchData = useCallback(async () => {
    if (!user) return
    const start = startOfDay(new Date()).toISOString()
    const end = endOfDay(new Date()).toISOString()

    const [{ data: cats }, { data: tsks }, { data: entries }] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase
        .from('tasks')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('time_entries')
        .select('duration_seconds')
        .eq('user_id', user.id)
        .gte('started_at', start)
        .lte('started_at', end)
        .not('ended_at', 'is', null),
    ])
    setCategories(cats ?? [])
    setTasks(tsks ?? [])
    setTodaySeconds(entries?.reduce((s, e) => s + (e.duration_seconds ?? 0), 0) ?? 0)
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > SWIPE_THRESHOLD && panel === 'home') setPanel('dashboard')
    if (diff < -SWIPE_THRESHOLD && panel === 'dashboard') setPanel('home')
  }

  if (loading || !user) return null

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-muted/30">

      {/* Header */}
      <header className="shrink-0 border-b bg-background px-4 py-3 flex items-center justify-between z-10">
        <div>
          <h1 className="font-bold text-lg leading-tight">TimeTracker</h1>
          <p className="text-xs text-muted-foreground capitalize">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {todaySeconds > 0 && (
            <span className="text-sm font-semibold tabular-nums text-primary">
              {fmtDuration(todaySeconds)} hoy
            </span>
          )}
          <Link href="/settings">
            <Button variant="ghost" size="icon" title="Configuración">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Swipeable panels */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            width: '200%',
            transform: `translateX(${panel === 'dashboard' ? '-50%' : '0%'})`,
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >

          {/* Panel 1 — Tareas */}
          <div className="overflow-y-auto" style={{ width: '50%' }}>
            <div className="mx-auto max-w-2xl px-4 py-4 space-y-4 pb-16">

              {/* Motivational quote */}
              <div className="rounded-xl bg-background border px-4 py-3">
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1.5 text-right">
                  — {quote.author}
                </p>
              </div>

              <TaskList tasks={tasks} categories={categories} userId={user.id} onChanged={fetchData} />
              <ManualEntryDialog tasks={tasks} onSaved={fetchData} />
              <CategoryManager categories={categories} userId={user.id} onChanged={fetchData} />
            </div>
          </div>

          {/* Panel 2 — Dashboard */}
          <div className="overflow-y-auto" style={{ width: '50%' }}>
            <DashboardPanel userId={user.id} />
          </div>

        </div>
      </div>

      {/* Panel indicator */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none">
        <div className={cn(
          'h-1.5 rounded-full transition-all duration-300',
          panel === 'home' ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/40'
        )} />
        <div className={cn(
          'h-1.5 rounded-full transition-all duration-300',
          panel === 'dashboard' ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/40'
        )} />
      </div>
    </div>
  )
}
