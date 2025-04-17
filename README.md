# Next-Sillones-Dashboard

![Estado](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)

Panel de administración para gestión de sillones, materiales y pedidos. Desarrollado con Next.js y Supabase.

## Características

- 📊 Dashboard con vista general de materiales, modelos y pedidos
- 🛋️ Gestión de modelos de sillones
- 🧵 Inventario de materiales
- �� Control de pedidos con cálculo de costos
  - Precio de productos
  - Costos de envío
  - Cálculo automático de total
- 📊 Generación de reportes

## Tecnologías

- **Frontend**: Next.js 14+, React 19, TailwindCSS 4
- **UI**: Radix UI, shadcn/ui
- **Backend**: Supabase
- **Gráficos**: Recharts
- **Formularios**: React Hook Form, Zod

## Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
# Crea un archivo .env con las variables necesarias de Supabase

# Iniciar servidor de desarrollo
pnpm dev

# Construir para producción
pnpm build

# Iniciar en modo producción
pnpm start
```

## Estructura del Proyecto

```
/app                # Directorio principal de la aplicación Next.js
  /pedidos          # Gestión de pedidos
  /reportes         # Generación de reportes
  /sillones         # Administración de modelos de sillones
  /materiales       # Gestión de materiales
/components         # Componentes reutilizables
/lib                # Utilidades y configuración
/public             # Archivos estáticos
```

## Uso

Accede a la aplicación en tu navegador en `http://localhost:3000`.

El dashboard principal muestra un resumen de los elementos registrados en el sistema y las estadísticas principales.

## Colaboración

1. Haz fork del proyecto
2. Crea una rama para tu característica (`git checkout -b feature/nueva-caracteristica`)
3. Commit de tus cambios (`git commit -m 'Añade nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request
