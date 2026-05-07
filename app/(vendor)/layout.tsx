import { VendorFooter } from "@/components/ui/VendorFooter";
import { VendorHeader } from "@/components/ui/VendorHeader";
import { VendorSessionHydrator } from "@/components/auth/VendorSessionHydrator";
import { fetchVendorIdStatusServer } from "@/lib/server/vendor-status";

function GuardMessage({ title, message }: { title: string; message: string }) {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        <p className="mt-3 text-zinc-600">{message}</p>
      </div>
    </section>
  );
}

export default async function VendorProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = await fetchVendorIdStatusServer();

  let content: React.ReactNode = children;

  if (!status) {
    content = (
      <GuardMessage
        title="Unauthorized"
        message="You need to be logged in to access vendor features."
      />
    );
  } else if (status.role !== "vendor") {
    content = (
      <GuardMessage
        title="Unauthorized"
        message="Only vendor accounts can access this section."
      />
    );
  } else if (status.approval_status !== "approved") {
      if (status.approval_status === "agreement_sent") {
        content = (
          <GuardMessage
            title="Action Required"
            message="Please sign the agreement to continue."
          />
        );
      } else if (status.approval_status === "rejected") {
        content = (
          <GuardMessage
            title="Account Rejected"
            message="Your vendor application has been rejected. Contact support for details."
          />
        );
      } else {
        content = (
          <GuardMessage
            title="Account Under Review"
            message="Your account is under review. We will notify you after admin approval."
          />
        );
      }
  }

  return (
    <>
      <VendorSessionHydrator
        session={{
          id: status?.id ?? "",
          role: status?.role ?? "",
          approvalStatus: (status?.approval_status ?? null) as "pending" | "agreement_sent" | "approved" | "rejected" | null,
        }}
      />
      <main className="flex-1">{content}</main>
    </>
  );
}
