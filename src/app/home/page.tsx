'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Task, Category } from '@/types'
import { ManualEntryDialog } from '@/components/timer/ManualEntryDialog'
import { TaskList } from '@/components/tasks/TaskList'
import { CategoryManager } from '@/components/tasks/CategoryManager'
import { Button } from '@/components/ui/button'
import { BarChart2, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading, signOut } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const fetchData = useCallback(async () => {
    if (!user) return
    const [{ data: cats }, { data: tsks }] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase
        .from('tasks')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])
    setCategories(cats ?? [])
    setTasks(tsks ?? [])
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-bold text-lg">TimeTracker</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <BarChart2 className="mr-1 h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={signOut} title="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <TaskList tasks={tasks} categories={categories} userId={user.id} onChanged={fetchData} />
        <ManualEntryDialog tasks={tasks} onSaved={fetchData} />
        <CategoryManager categories={categories} userId={user.id} onChanged={fetchData} />
      </main>
    </div>
  )
}
