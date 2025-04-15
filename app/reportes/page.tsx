import { Suspense } from "react"
import { ReportsContent } from "@/components/reports/reports-content"
import { ReportsContentSkeleton } from "@/components/reports/reports-content-skeleton"

export default function ReportsPage() {
  // Verificar si las variables de entorno están disponibles
  

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
      </div>

     

      {
        <Suspense fallback={<ReportsContentSkeleton />}>
          <ReportsContent />
        </Suspense>
      }
    </div>
  )
}
