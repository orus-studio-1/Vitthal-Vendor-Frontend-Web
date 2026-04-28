import {
  VendorHero,
  VendorBenefits,
  HowItWorks,
  CommissionStructure,
  VendorTestimonials,
  VendorFAQ,
  VendorCTA,
} from "@/components/Landing_Page";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <main>
        <VendorHero />
        <VendorBenefits />
        <HowItWorks />
        <CommissionStructure />
        <VendorTestimonials />
        <VendorFAQ />
        <VendorCTA />
      </main>
    </div>
  );
}
