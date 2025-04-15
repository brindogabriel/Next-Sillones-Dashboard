"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Order {
  id: string
  customer_name: string
  total_amount: number
  status: string
  created_at: string
}

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentOrders() {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) throw error
        setOrders(data || [])
      } catch (error) {
        console.error("Error fetching recent orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentOrders()
  }, [])

  if (loading) {
    return <div>Cargando pedidos recientes...</div>
  }

  if (orders.length === 0) {
    return <div>No hay pedidos recientes</div>
  }

  return (
    <div className="space-y-8">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {order.customer_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{order.customer_name}</p>
            <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <div className="ml-auto font-medium">${order.total_amount.toFixed(2)}</div>
        </div>
      ))}
    </div>
  )
}
