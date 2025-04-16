
import { Suspense } from "react"
import { MaterialsTable } from "@/components/materials/materials-table"
import { MaterialsTableSkeleton } from "@/components/materials/materials-table-skeleton"
import { AddMaterialButton } from "@/components/materials/add-material-button"
import { unstable_noStore as noStore } from 'next/cache';

export default function MaterialsPage() {
  // Deshabilitar el caché para esta página
  noStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Materiales</h2>
        {<AddMaterialButton />}
      </div>

      <Suspense fallback={<MaterialsTableSkeleton />}>
        <MaterialsTable />
      </Suspense>
    </div>
  )
}
