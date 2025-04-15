import { Suspense } from "react"
import { SofaModelsTable } from "@/components/sofas/sofa-models-table"
import { SofaModelsTableSkeleton } from "@/components/sofas/sofa-models-table-skeleton"
import { AddSofaModelButton } from "@/components/sofas/add-sofa-model-button"

function SofaModelsTableWrapper() {
  return (
    <Suspense fallback={<SofaModelsTableSkeleton />}>
      <SofaModelsTable />
    </Suspense>
  )
}

export default function SofaModelsPage() {
  // Verificar si las variables de entorno están disponibles
 

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Modelos de Sillones</h2>
        { <AddSofaModelButton />}
      </div>

      
        <SofaModelsTableWrapper />
      
    </div>
  )
}
