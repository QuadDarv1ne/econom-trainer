'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function ShimmerOverlay() {
  return <div className="absolute inset-0 animate-shimmer pointer-events-none" />
}

export function ModuleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-8 w-8 rounded-xl relative overflow-hidden">
          <ShimmerOverlay />
        </Skeleton>
        <Skeleton className="h-6 w-56 relative overflow-hidden">
          <ShimmerOverlay />
        </Skeleton>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
              <div className="space-y-3">
                <Skeleton className="h-6 w-48 relative overflow-hidden">
                  <ShimmerOverlay />
                </Skeleton>
                <Skeleton className="h-4 w-72 relative overflow-hidden">
                  <ShimmerOverlay />
                </Skeleton>
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
              <Skeleton className="h-8 w-24 rounded-lg relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-36 relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
              <Skeleton className="h-11 w-full rounded-lg relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
              <Skeleton className="h-11 w-full rounded-lg relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
              <Skeleton className="h-11 w-3/4 rounded-lg relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
              <Skeleton className="h-11 w-full rounded-lg relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-36 relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl relative overflow-hidden">
                    <ShimmerOverlay />
                  </Skeleton>
                ))}
              </div>
            </div>
          </div>
          <Skeleton className="h-72 w-full rounded-2xl relative overflow-hidden">
            <ShimmerOverlay />
          </Skeleton>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-32 rounded-xl relative overflow-hidden">
              <ShimmerOverlay />
            </Skeleton>
            <Skeleton className="h-11 w-32 rounded-xl relative overflow-hidden">
              <ShimmerOverlay />
            </Skeleton>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border bg-card p-0 overflow-hidden"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <Skeleton className="h-14 w-14 rounded-2xl relative overflow-hidden">
                <ShimmerOverlay />
              </Skeleton>
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded relative overflow-hidden">
                  <ShimmerOverlay />
                </Skeleton>
                <Skeleton className="h-5 w-16 rounded relative overflow-hidden">
                  <ShimmerOverlay />
                </Skeleton>
              </div>
            </div>
            <div className="space-y-2.5 mt-3">
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
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-4 w-1/3 relative overflow-hidden">
              <ShimmerOverlay />
            </Skeleton>
          </CardContent>
        </div>
      ))}
    </div>
  )
}
