"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, Layers, Menu, Package, Settings, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

const routes = [
  {
    name: "Dashboard",
    path: "/",
    icon: Home,
  },
  {
    name: "Materiales",
    path: "/materiales",
    icon: Package,
  },
  {
    name: "Modelos de Sillones",
    path: "/sillones",
    icon: Layers,
  },
  {
    name: "Pedidos",
    path: "/pedidos",
    icon: ShoppingCart,
  },
  {
    name: "Reportes",
    path: "/reportes",
    icon: BarChart3,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const NavItems = () => (
    <>
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary">Sillones Fábrica</h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link key={route.path} href={route.path} onClick={() => setOpen(false)}>
              <div
                className={cn(
                  "flex w-full items-center py-2 px-3 rounded-md text-sm font-medium",
                  pathname === route.path
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <route.icon className="mr-2 h-4 w-4" />
                {route.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed left-4 top-4 z-40 md:hidden mt-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <NavItems />
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <div className="hidden border-r bg-card md:block md:w-[240px] lg:w-[300px]">
        <div className="flex h-full flex-col">
          <NavItems />
        </div>
      </div>
    </>
  )
}
