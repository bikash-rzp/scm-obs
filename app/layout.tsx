import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navigation } from "../components/navigation";
import React from 'react';
import { cn } from "@/lib/utils";
import ProcessingIndicator from '../components/processing-indicator';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SCM Device Observability",
  description: "Supply Chain Management Device Observability Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", "font-sans")}>
        <div className="flex min-h-screen">
          <Navigation />
          <main className="flex-1 p-6 overflow-auto pl-20">
        {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
