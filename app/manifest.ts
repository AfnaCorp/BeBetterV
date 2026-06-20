import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BeBetter — Coach sportif agentic",
    short_name: "BeBetter",
    description: "Tracke tes séances, comprends ta progression et laisse l'IA adapter ton entraînement.",
    start_url: "/journal",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef0f6",
    theme_color: "#7c5cff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
