'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Category } from '@/types'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CategoryDialog } from './CategoryDialog'

type Props = {
  categories: Category[]
  userId: string
  onChanged: () => void
}

export function CategoryManager({ categories, userId, onChanged }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleDelete = async (cat: Category) => {
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (error) { toast.error('Error al eliminar la categoría'); return }
    onChanged()
    toast(`Categoría "${cat.name}" eliminada`)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg">Categorías</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nueva
          </Button>
        </CardHeader>

        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin categorías. Crea una para organizar tus tareas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  <span>{cat.name}</span>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="opacity-50 hover:opacity-100 transition-opacity ml-0.5"
                    title={`Eliminar ${cat.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={userId}
        onSaved={onChanged}
      />
    </>
  )
}
