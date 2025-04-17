import { NextResponse } from "next/server";
import { checkOrdersTableStructure, testExpiredOrdersUpdate } from "@/lib/debug-database";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // Verificar conexión básica a la base de datos
  let dbStatus;
  try {
    const { data, error } = await supabase.from('orders').select('count', { count: 'exact', head: true });
    dbStatus = { 
      connected: !error, 
      errorMessage: error ? error.message : null,
      count: data 
    };
  } catch (error) {
    dbStatus = { 
      connected: false, 
      errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      error
    };
  }

  // Verificar estructura de la tabla
  const tableStructure = await checkOrdersTableStructure();
  
  // Simular verificación de pedidos vencidos
  const expiredOrdersTest = await testExpiredOrdersUpdate();
  
  // Verificar estado del servidor
  const serverInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiVersion: '1.0.0',
  };
  
  return NextResponse.json({
    status: 'success',
    serverInfo,
    dbStatus,
    tableStructure,
    expiredOrdersTest
  });
} 