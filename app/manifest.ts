import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sillones Fábrica Dashboard",
    short_name: "Sillones Dashboard",
    description: "Dashboard para gestión de fábrica de sillones",
    start_url: "/",
    display: "standalone",
    background_color: "#1c1917",
    theme_color: "#a96e44",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
