'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type ActiveEntry = { id: string; taskId: string; startedAt: string }

export function useActiveTimer(userId: string | undefined) {
  const [activeEntry, setActiveEntry] = useState<ActiveEntry | null>(null)
  const [elapsed, setElapsed] = useState(0)

  // Ref so start/stop callbacks never go stale between renders.
  const entryRef = useRef<ActiveEntry | null>(null)
  useEffect(() => { entryRef.current = activeEntry }, [activeEntry])

  // On mount: restore any timer that was running before a page reload.
  useEffect(() => {
    if (!userId) return
    supabase
      .from('time_entries')
      .select('id, task_id, started_at')
      .eq('user_id', userId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setActiveEntry({ id: data.id, taskId: data.task_id, startedAt: data.started_at })
        }
      })
  }, [userId])

  // Recompute elapsed every second from the fixed startedAt timestamp.
  // This is intentionally NOT an accumulator so a page reload always shows
  // the correct time: elapsed = now - startedAt.
  useEffect(() => {
    if (!activeEntry) { setElapsed(0); return }

    const tick = () =>
      setElapsed(Math.floor((Date.now() - new Date(activeEntry.startedAt).getTime()) / 1000))

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [activeEntry])

  // Writes ended_at + duration_seconds to the DB for a given entry.
  const finalize = useCallback(async (entry: ActiveEntry) => {
    const durationSeconds = Math.floor(
      (Date.now() - new Date(entry.startedAt).getTime()) / 1000
    )
    await supabase
      .from('time_entries')
      .update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds })
      .eq('id', entry.id)
  }, [])

  // Start a timer for taskId. Stops the previous one first if any.
  const start = useCallback(async (taskId: string) => {
    const current = entryRef.current
    if (current) await finalize(current)

    const { data, error } = await supabase
      .from('time_entries')
      .insert({ task_id: taskId, user_id: userId, source: 'timer' })
      .select('id, task_id, started_at')
      .single()

    if (!error && data) {
      setActiveEntry({ id: data.id, taskId: data.task_id, startedAt: data.started_at })
    }
  }, [finalize])

  // Stop the current timer.
  const stop = useCallback(async () => {
    const current = entryRef.current
    if (!current) return
    await finalize(current)
    setActiveEntry(null)
  }, [finalize])

  return {
    activeTaskId: activeEntry?.taskId ?? null,
    elapsed,
    start,
    stop,
  }
}
