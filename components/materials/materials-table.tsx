"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Material } from "./columns"
import { usePathname, useSearchParams } from "next/navigation"

export function MaterialsTable() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchMaterials() {
      try {
       
        const { data, error } = await supabase
          .from("materials")
          .select("*")
          .order("name", { ascending: true })

        if (error) {
          throw error
        }

        setMaterials(data || [])
      } catch (fetchError) {
        setError(fetchError as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMaterials()
  }, [pathname, searchParams])

  if (isLoading) {
    return <div>Cargando materiales...</div>
  }

  if (error) {
    const errorMessage = error.message || String(error)
    const isTooManyRequests = errorMessage.includes("Too Many") || errorMessage.includes("429")

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al cargar los materiales</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>
            {isTooManyRequests
              ? "Se ha alcanzado el límite de solicitudes a Supabase. Por favor, espera un momento e intenta nuevamente."
              : "Ocurrió un error al cargar los datos. Por favor, verifica la conexión a la base de datos."}
          </p>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> Reintentar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="rounded-md border">
      <DataTable columns={columns} data={materials} />
    </div>
  )
}
