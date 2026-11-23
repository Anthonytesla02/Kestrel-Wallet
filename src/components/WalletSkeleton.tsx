export function WalletSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading wallet details"
      data-testid="wallet-skeleton"
      className="space-y-4 sm:space-y-6"
    >
      {/* Balance Summary Skeleton */}
      <div className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2.5">
            <div className="h-3.5 w-48 rounded-lg skeleton-shimmer" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-44 rounded-xl skeleton-shimmer" />
              <div className="h-9 w-9 rounded-xl skeleton-shimmer" />
            </div>
            <div className="h-3 w-32 rounded-lg skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-24 rounded-xl skeleton-shimmer" />
            <div className="h-10 w-24 rounded-xl skeleton-shimmer" />
            <div className="h-10 w-32 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Main 2-column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Card Deck Skeleton */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-5 w-28 rounded-lg skeleton-shimmer" />
              <div className="h-3 w-44 rounded-lg skeleton-shimmer" />
            </div>
            <div className="h-10 w-28 rounded-xl skeleton-shimmer" />
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-4 sm:p-6 space-y-5">
            <div className="max-w-md mx-auto aspect-[1.586/1] rounded-2xl skeleton-shimmer" />
            <div className="grid grid-cols-3 gap-2.5">
              <div className="h-14 rounded-2xl skeleton-shimmer" />
              <div className="h-14 rounded-2xl skeleton-shimmer" />
              <div className="h-14 rounded-2xl skeleton-shimmer" />
            </div>
            <div className="h-2 w-full rounded-full skeleton-shimmer" />
            <div className="flex items-center justify-between gap-2">
              <div className="h-10 w-28 rounded-xl skeleton-shimmer" />
              <div className="h-10 w-20 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        </div>

        {/* Right: Activity Skeleton */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 rounded-lg skeleton-shimmer" />
              <div className="h-8 w-16 rounded-lg skeleton-shimmer" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 py-1.5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full skeleton-shimmer shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 rounded-md skeleton-shimmer" />
                      <div className="h-2.5 w-24 rounded-md skeleton-shimmer" />
                    </div>
                  </div>
                  <div className="h-4 w-14 rounded-md skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
