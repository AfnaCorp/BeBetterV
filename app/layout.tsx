import type { Metadata } from "next";
import "./globals.css";
import { AppDataProvider } from "@/components/app-data-provider";

export const metadata: Metadata = {
  title: "AthleteOS - Coach sportif agentic",
  description: "Tracke tes séances, comprends ta progression et laisse l'IA adapter ton entraînement."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased">
        <AppDataProvider>{children}</AppDataProvider>
      </body>
    </html>
  );
}
