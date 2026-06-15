import { Skeleton } from '@/components/ui/skeleton';

function ShimmerOverlay() {
  return <div className="absolute inset-0 animate-shimmer-slow pointer-events-none" />
}

function CardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="rounded-2xl border bg-card overflow-hidden animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: 'both' }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-14 w-14 rounded-2xl relative overflow-hidden">
            <ShimmerOverlay />
          </Skeleton>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-12 rounded relative overflow-hidden">
              <ShimmerOverlay />
            </Skeleton>
            <Skeleton className="h-5 w-14 rounded relative overflow-hidden">
              <ShimmerOverlay />
            </Skeleton>
          </div>
        </div>
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-3/4 relative overflow-hidden">
            <ShimmerOverlay />
          </Skeleton>
          <Skeleton className="h-3.5 w-full relative overflow-hidden">
            <ShimmerOverlay />
          </Skeleton>
          <Skeleton className="h-3.5 w-2/3 relative overflow-hidden">
            <ShimmerOverlay />
          </Skeleton>
        </div>
        <Skeleton className="h-4 w-1/3 relative overflow-hidden">
          <ShimmerOverlay />
        </Skeleton>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-5xl space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20 mx-auto w-fit">
              <Skeleton className="h-4 w-4 rounded-full relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
              <Skeleton className="h-4 w-24 relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
            </div>
            <Skeleton className="mx-auto h-12 w-3/4 max-w-xl relative overflow-hidden">
              <ShimmerOverlay />
            </Skeleton>
            <Skeleton className="mx-auto h-5 w-1/2 max-w-md relative overflow-hidden">
              <ShimmerOverlay />
            </Skeleton>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
