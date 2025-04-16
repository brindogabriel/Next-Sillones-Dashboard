import { supabase } from "@/lib/supabase"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { unstable_noStore as noStore } from 'next/cache'

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
      <div className="rounded-md border">
        <DataTable
          columns={columns}
          data={materials || []}
        />
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
