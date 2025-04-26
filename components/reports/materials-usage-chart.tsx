"use client";

import { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";

interface MaterialUsage {
  name: string;
  value: number;
}

interface SofaMaterial {
  quantity: number;
  materials: { name: string } | { name: string }[] | null;
}

const COLORS = [
  "#8B4513",
  "#A0522D",
  "#CD853F",
  "#D2691E",
  "#DEB887",
  "#F5DEB3",
  "#D2B48C",
  "#BC8F8F",
];

export function MaterialsUsageChart() {
  const [data, setData] = useState<MaterialUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterialsData() {
      try {
        const { data: sofaMaterials, error } = (await supabase.from(
          "sofa_materials"
        ).select(`
            quantity,
            materials (
              name
            )
          `)) as unknown as { data: SofaMaterial[]; error: any };

        if (error) throw error;

        // Group by material
        const materialUsage: Record<string, number> = {};

        // Sum usage by material
        sofaMaterials?.forEach((item) => {
          // Verificar si materials es un arreglo y acceder al primer elemento si es así
          const materialName = Array.isArray(item.materials)
            ? item.materials[0]?.name
            : item.materials?.name;

          if (materialName) {
            materialUsage[materialName] =
              (materialUsage[materialName] || 0) + item.quantity;
          }
        });

        // Convert to array for chart
        const chartData = Object.entries(materialUsage)
          .map(([name, value]) => ({
            name,
            value,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8); // Top 8 materials

        setData(chartData);
      } catch (error) {
        console.error("Error fetching materials data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMaterialsData();
  }, []);

  if (loading) {
    return <div>Cargando datos de materiales...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value.toFixed(2)} unidades`,
            name, // Esto mostrará el nombre del material
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
