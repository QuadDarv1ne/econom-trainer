'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ModuleSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <Skeleton className="h-20 w-full" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ModuleSkeleton key={i} />
      ))}
    </div>
  )
}
