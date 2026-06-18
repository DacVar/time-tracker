export type Category = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export type Task = {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description: string | null
  is_active: boolean
  created_at: string
  category?: Category
}

export type TimeEntry = {
  id: string
  user_id: string
  task_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  notes: string | null
  source: 'timer' | 'manual'
  task?: Task
}
