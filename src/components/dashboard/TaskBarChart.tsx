'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TimeEntry } from '@/types'
import { fmtDuration } from '@/lib/format'

type BarItem = { name: string; hours: number; seconds: number; color: string }

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(300)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return width
}

export function TaskBarChart({ entries }: { entries: TimeEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)
  // Y-axis label column: 35% of container width, clamped between 80px and 128px
  const yAxisWidth = Math.min(128, Math.max(80, Math.floor(containerWidth * 0.35)))
  // Truncate label to fit: roughly 1 char per 7px
  const maxChars = Math.floor(yAxisWidth / 7)

  const data = useMemo<BarItem[]>(() => {
    const map = new Map<string, { title: string; color: string; seconds: number }>()

    entries.forEach((e) => {
      if (!e.task) return
      const key = e.task_id
      if (!map.has(key)) {
        map.set(key, {
          title: e.task.title,
          color: e.task.category?.color ?? '#94a3b8',
          seconds: 0,
        })
      }
      map.get(key)!.seconds += e.duration_seconds ?? 0
    })

    return Array.from(map.values())
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 12)
      .map((v) => ({
        name: v.title,
        hours: +(v.seconds / 3600).toFixed(2),
        seconds: v.seconds,
        color: v.color,
      }))
  }, [entries])

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin datos para este período
      </div>
    )
  }

  const chartHeight = Math.max(160, data.length * 40)

  return (
    <div ref={containerRef}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          barSize={18}
        >
          <XAxis
            type="number"
            dataKey="hours"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}h`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={yAxisWidth}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => v.length > maxChars ? v.slice(0, maxChars - 2) + '…' : v}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null
              const item = payload[0].payload as BarItem
              return (
                <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
                  <p className="mb-0.5 font-medium">{item.name}</p>
                  <p className="text-muted-foreground">{fmtDuration(item.seconds)}</p>
                </div>
              )
            }}
          />
          <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
            {data.map((item, i) => (
              <Cell key={i} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
