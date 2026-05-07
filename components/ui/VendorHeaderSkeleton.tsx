export function VendorHeaderSkeleton() {
  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
      {/* Top bar */}
      <div className="border-b border-zinc-100 bg-emerald-50/50">
        <div className="mx-auto flex h-9 w-full max-w-7xl items-center justify-between px-4 text-xs text-zinc-600 sm:px-6 lg:px-8">
          <div className="animate-pulse h-4 w-24 bg-zinc-200 rounded"></div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="animate-pulse h-4 w-32 bg-zinc-200 rounded"></div>
            <span className="text-zinc-300">|</span>
            <div className="animate-pulse h-4 w-24 bg-zinc-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo skeleton */}
        <div className="flex items-center gap-2">
          <div className="animate-pulse h-8 w-8 bg-zinc-200 rounded-full"></div>
          <div className="animate-pulse h-5 w-32 bg-zinc-200 rounded"></div>
        </div>

        {/* Desktop nav skeleton */}
        <div className="hidden md:flex items-center gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse h-5 w-20 bg-zinc-200 rounded"
            ></div>
          ))}
        </div>

        {/* Right side skeleton */}
        <div className="hidden md:flex items-center gap-3">
          <div className="animate-pulse h-8 w-8 bg-zinc-200 rounded-lg"></div>
          <div className="animate-pulse h-8 w-8 bg-zinc-200 rounded-lg"></div>
          <div className="animate-pulse h-8 w-32 bg-zinc-200 rounded-lg"></div>
        </div>

        {/* Mobile menu skeleton */}
        <div className="md:hidden animate-pulse h-6 w-6 bg-zinc-200 rounded"></div>
      </div>
    </header>
  );
}
