
import VendorStatusWrapper from '@/components/vendor-status/VendorStatusWrapper';

export default async function VendorProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VendorStatusWrapper>
      <main className="flex-1">{children}</main>
    </VendorStatusWrapper>
  );
}
