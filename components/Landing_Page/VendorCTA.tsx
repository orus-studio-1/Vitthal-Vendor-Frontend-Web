"use client";

export function VendorCTA() {
  return (
    <section className="bg-emerald-700">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <h3 className="font-heading text-xl font-semibold text-white sm:text-2xl">
            Ready to grow your business?
          </h3>
          <p className="mt-2 max-w-lg text-sm text-emerald-100">
            Join thousands of suppliers already selling on MTWO Groups. 
            Registration is free and takes only 10 minutes.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <button
            type="button"
            className="whitespace-nowrap rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
          >
            Start Selling Today
          </button>
          <button
            type="button"
            className="whitespace-nowrap rounded-lg border border-white/40 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Talk to Our Team
          </button>
        </div>
      </div>
    </section>
  );
}
