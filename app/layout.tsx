import type { Metadata } from "next";
import { Outfit, Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { VendorFooter } from "@/components/ui/VendorFooter";
import { VendorHeader } from "@/components/ui/VendorHeader";

import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { consoleGuardScript, isProduction } from "@/lib/consoleGuard";
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
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col">
        {isProduction ? (
          <Script
            id="console-guard"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: consoleGuardScript }}
          />
        ) : null}
        <Toaster position="top-right" richColors />
        <VendorHeader />
        <main className="flex-1">{children}</main>
        <VendorFooter />
        <AuthInitializer />
      </body>
    </html>
  );
}
