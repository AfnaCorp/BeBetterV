import type { Metadata } from "next";
import "./globals.css";
import { AppDataProvider } from "@/components/app-data-provider";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "BeBetter - Coach sportif agentic",
  description: "Tracke tes séances, comprends ta progression et laisse l'IA adapter ton entraînement."
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
          <AppDataProvider>{children}</AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
