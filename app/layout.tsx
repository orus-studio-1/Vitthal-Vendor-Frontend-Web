import type { Metadata } from "next";
import { Outfit, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { VendorFooter } from "@/components/ui/VendorFooter";
import { VendorHeader } from "@/components/ui/VendorHeader";

import { AuthInitializer } from "@/components/auth/AuthInitializer";
const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MTWO Groups Vendor Portal",
  description: "MTWO Groups Vendor Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", outfit.variable, montserrat.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <Toaster position="top-right" richColors />
        <VendorHeader />
        <main className="flex-1">{children}</main>
        <VendorFooter />
        <AuthInitializer />
      </body>
    </html>
  );
}
