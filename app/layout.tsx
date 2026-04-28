import type { Metadata } from "next";
import { Outfit, Montserrat } from "next/font/google";
import "./globals.css";
import { VendorHeader } from "@/components/ui/VendorHeader";
import { VendorFooter } from "@/components/ui/VendorFooter";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vitthal Vendor Frontend",
  description: "Vitthal Vendor Frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <VendorHeader />
        <main className="flex-1">{children}</main>
        <VendorFooter />
      </body>
    </html>
  );
}
