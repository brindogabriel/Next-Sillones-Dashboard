import { supabase } from "@/lib/supabase"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { unstable_noStore as noStore } from 'next/cache'
import { Input } from "@/components/ui/input"

export async function MaterialsTable() {
  // Deshabilitar el caché para este componente
  noStore()

  try {
    const { data: materials, error } = await supabase
      .from("materials")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      throw error
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filtrar materiales..."
            className="max-w-sm"
            id="filter-materials"
          />
        </div>
        <div className="rounded-md border">
          <DataTable
            columns={columns}
            data={materials || []}
            filterColumn="name"
            filterId="filter-materials"
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error fetching materials:", error)
    return (
      <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-md">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Error al cargar los materiales
        </h3>
        <p className="text-red-700 dark:text-red-300">
          No se pudieron cargar los datos. Por favor, verifica la conexión a la
          base de datos.
        </p>
      </div>
    )
  }
}
