'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TimeEntry } from '@/types'
import { fmtDuration } from '@/lib/format'

type Slice = { name: string; seconds: number; color: string; pct: number }

export function CategoryPieChart({ entries }: { entries: TimeEntry[] }) {
  const data = useMemo<Slice[]>(() => {
    const map = new Map<string, Omit<Slice, 'pct'>>()

    entries.forEach((e) => {
      const cat = e.task?.category
      const key = cat?.id ?? '__none__'
      if (!map.has(key)) {
        map.set(key, {
          name: cat?.name ?? 'Sin categoría',
          color: cat?.color ?? '#94a3b8',
          seconds: 0,
        })
      }
      map.get(key)!.seconds += e.duration_seconds ?? 0
    })

    const total = Array.from(map.values()).reduce((s, v) => s + v.seconds, 0)

    return Array.from(map.values())
      .filter((v) => v.seconds > 0)
      .sort((a, b) => b.seconds - a.seconds)
      .map((v) => ({ ...v, pct: total > 0 ? Math.round((v.seconds / total) * 100) : 0 }))
  }, [entries])

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin datos para este período
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Donut */}
      <div className="h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="seconds"
              nameKey="name"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={2}
              startAngle={90}
              endAngle={450}
              strokeWidth={0}
            >
              {data.map((item, i) => (
                <Cell key={i} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null
                const item = payload[0].payload as Slice
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
                    <div className="mb-0.5 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {fmtDuration(item.seconds)} · {item.pct}%
                    </p>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend */}
      <div className="w-full min-w-0 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-1 truncate text-sm">{item.name}</span>
            <span className="tabular-nums text-xs text-muted-foreground">{item.pct}%</span>
            <span className="w-16 shrink-0 text-right text-sm font-medium tabular-nums">
              {fmtDuration(item.seconds)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
