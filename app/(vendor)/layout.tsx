import { VendorFooter } from "@/components/ui/VendorFooter";
import { VendorHeader } from "@/components/ui/VendorHeader";

export default async function VendorProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex-1">{children}</main>
    </>
  );
}
