"use client";

import { useEffect, useState, CSSProperties } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { supabase } from "@/lib/supabase";

interface SalesData {
  month: string;
  total: number;
}

export function SalesChart() {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSalesData() {
      try {
        const { data: orders, error } = await supabase
          .from("orders")
          .select("created_at, total_amount")
          .eq("status", "completed");

        if (error) throw error;

        // Group by month
        const salesByMonth: Record<string, number> = {};

        const months = [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];

        // Initialize all months with 0
        months.forEach((month, index) => {
          salesByMonth[month] = 0;
        });

        // Sum sales by month
        orders?.forEach((order) => {
          const date = new Date(order.created_at);
          const month = months[date.getMonth()];
          salesByMonth[month] += order.total_amount;
        });

        // Convert to array for chart
        const chartData = Object.entries(salesByMonth).map(
          ([month, total]) => ({
            month,
            total,
          })
        );

        setData(chartData);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSalesData();
  }, []);

  const customTooltipStyle: CSSProperties = {
    backgroundColor: "#ffffff", // Fondo blanco
    color: "#000000", // Texto negro
    border: "1px solid #cccccc", // Borde gris claro
    borderRadius: "4px",
    padding: "8px",
    fontSize: "12px",
  };

  if (loading) {
    return <div>Cargando datos de ventas...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={customTooltipStyle} // Aplica el estilo personalizado
          formatter={(value: number) => [
            new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "ARS",
            }).format(value),
            "Total",
          ]}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
