'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { TimeEntry } from '@/types'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { TaskBarChart } from '@/components/dashboard/TaskBarChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  addDays, subDays,
  addWeeks, subWeeks,
  addMonths, subMonths,
  isToday, isBefore,
  format,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { fmtDuration } from '@/lib/format'

type PeriodType = 'day' | 'week' | 'month'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getRange(type: PeriodType, anchor: Date): { start: Date; end: Date } {
  switch (type) {
    case 'day':
      return { start: startOfDay(anchor), end: endOfDay(anchor) }
    case 'week':
      return {
        start: startOfWeek(anchor, { weekStartsOn: 1 }),
        end: endOfWeek(anchor, { weekStartsOn: 1 }),
      }
    case 'month':
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
  }
}

function getLabel(type: PeriodType, anchor: Date): string {
  switch (type) {
    case 'day': {
      if (isToday(anchor)) return 'Hoy'
      const s = format(anchor, "EEEE, d 'de' MMMM", { locale: es })
      return s.charAt(0).toUpperCase() + s.slice(1)
    }
    case 'week': {
      const s = startOfWeek(anchor, { weekStartsOn: 1 })
      const e = endOfWeek(anchor, { weekStartsOn: 1 })
      const sameYear = s.getFullYear() === new Date().getFullYear()
      const fmt = sameYear ? 'd MMM' : "d MMM yyyy"
      return `${format(s, fmt, { locale: es })} – ${format(e, fmt, { locale: es })}`
    }
    case 'month': {
      const s = format(anchor, 'MMMM yyyy', { locale: es })
      return s.charAt(0).toUpperCase() + s.slice(1)
    }
  }
}

// "Next" is disabled when the current period already contains today or is in the future.
function isAtPresent(type: PeriodType, anchor: Date): boolean {
  const { end } = getRange(type, anchor)
  return !isBefore(end, startOfDay(new Date()))
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [periodType, setPeriodType] = useState<PeriodType>('week')
  const [anchor, setAnchor] = useState<Date>(() => new Date())
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [fetching, setFetching] = useState(false)

  const { start, end } = useMemo(() => getRange(periodType, anchor), [periodType, anchor])
  const label = useMemo(() => getLabel(periodType, anchor), [periodType, anchor])
  const atPresent = useMemo(() => isAtPresent(periodType, anchor), [periodType, anchor])

  // Fetch entries for the exact period range.
  // `cancelled` prevents a stale slow response from overwriting a newer one.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    setFetching(true)

    supabase
      .from('time_entries')
      .select('*, task:tasks(id, title, category_id, category:categories(id, name, color))')
      .eq('user_id', user.id)
      .gte('started_at', start.toISOString())
      .lte('started_at', end.toISOString())
      .not('ended_at', 'is', null)
      .order('started_at')
      .then(({ data }) => {
        if (!cancelled) {
          setEntries(data ?? [])
          setFetching(false)
        }
      })

    return () => { cancelled = true }
  }, [user, start, end])

  const goPrev = () => {
    if (periodType === 'day') setAnchor((a) => subDays(a, 1))
    else if (periodType === 'week') setAnchor((a) => subWeeks(a, 1))
    else setAnchor((a) => subMonths(a, 1))
  }

  const goNext = () => {
    if (atPresent) return
    if (periodType === 'day') setAnchor((a) => addDays(a, 1))
    else if (periodType === 'week') setAnchor((a) => addWeeks(a, 1))
    else setAnchor((a) => addMonths(a, 1))
  }

  const changePeriodType = (t: PeriodType) => {
    setPeriodType(t)
    setAnchor(new Date()) // jump to present when switching granularity
  }

  const totalSeconds = useMemo(
    () => entries.reduce((s, e) => s + (e.duration_seconds ?? 0), 0),
    [entries]
  )

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3 flex items-center gap-3">
        <Link href="/home">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-lg">Dashboard</h1>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">

        {/* ── Period controls ── */}
        <div className="space-y-3">

          {/* Granularity selector */}
          <div className="flex w-fit rounded-lg border bg-background p-0.5 gap-0.5">
            {(['day', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => changePeriodType(t)}
                className={cn(
                  'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                  periodType === t
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {t === 'day' ? 'Día' : t === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>

          {/* Navigation row */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-medium flex-1 min-w-0 truncate">{label}</span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={goNext}
              disabled={atPresent}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Jump to present — hidden on narrow screens (← → arrows are enough) */}
            {!atPresent && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex h-8 text-xs text-muted-foreground"
                onClick={() => setAnchor(new Date())}
              >
                Ir al presente
              </Button>
            )}

            {/* Total */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span
                className={cn(
                  'text-lg font-bold tabular-nums transition-opacity duration-150',
                  fetching && 'opacity-30'
                )}
              >
                {fmtDuration(totalSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Charts ── */}
        <div
          className={cn(
            'grid grid-cols-1 gap-5 md:grid-cols-2 transition-opacity duration-200',
            fetching && 'opacity-40 pointer-events-none'
          )}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Por categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryPieChart entries={entries} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Por tarea
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskBarChart entries={entries} />
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  )
}
