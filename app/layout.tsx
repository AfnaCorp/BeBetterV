import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppDataProvider } from "@/components/app-data-provider";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "BeBetter - Coach sportif agentic",
  description: "Tracke tes séances, comprends ta progression et laisse l'IA adapter ton entraînement.",
  applicationName: "BeBetter",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BeBetter"
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#7c5cff",
  // L'app installée occupe tout l'écran (gère les encoches / safe-area).
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AuthProvider>
          <AppDataProvider>
            <ToastProvider>{children}</ToastProvider>
          </AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
