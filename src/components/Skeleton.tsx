import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("skeleton", className)} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-16">
      {/* Hero Skeleton */}
      <div className="bg-background border border-secondary rounded-xl p-8 flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="space-y-4 w-full">
           <Skeleton className="h-4 w-32" />
           <Skeleton className="h-8 w-64" />
           <Skeleton className="h-4 w-48" />
        </div>
        <div className="hidden md:flex items-center gap-12">
           <div className="space-y-2">
              <Skeleton className="h-3 w-20 ml-auto" />
              <Skeleton className="h-8 w-24" />
           </div>
           <div className="space-y-2 border-l border-secondary pl-12">
              <Skeleton className="h-3 w-20 ml-auto" />
              <Skeleton className="h-6 w-20" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-background border border-secondary rounded-xl p-6 shadow-sm space-y-5">
                     <div className="flex justify-between">
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-9 w-9 rounded-xl" />
                     </div>
                     <Skeleton className="h-2 w-full rounded-full" />
                  </div>
               ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Skeleton className="h-5 w-32" />
          <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary overflow-hidden">
             {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="space-y-1">
                         <Skeleton className="h-3 w-24" />
                         <Skeleton className="h-2 w-16" />
                      </div>
                   </div>
                   <Skeleton className="h-4 w-10" />
                </div>
             ))}
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-background border border-secondary rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
export function LeaderboardSkeleton() {
  return (
    <div className="space-y-6 pb-16">
      {/* My standing banner skeleton */}
      <div className="bg-background border border-secondary rounded-lg p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-3 w-32 ml-auto" />
          <Skeleton className="h-8 w-24 ml-auto" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Top Matrix Skeleton */}
        <div className="lg:col-span-1 space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-background border border-secondary p-4 rounded-lg flex items-center gap-3">
                <Skeleton className="h-6 w-6" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </div>

        {/* All Operators Table Skeleton */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="bg-background border border-secondary rounded-lg overflow-hidden">
             {[1, 2, 3, 4, 5, 6].map((i) => (
               <div key={i} className="flex items-center justify-between p-4 border-b border-secondary last:border-0">
                 <Skeleton className="h-4 w-8" />
                 <div className="flex items-center gap-2 flex-1 ml-4">
                   <Skeleton className="h-6 w-6 rounded" />
                   <Skeleton className="h-4 w-32" />
                 </div>
                 <Skeleton className="h-4 w-20 ml-4" />
                 <Skeleton className="h-4 w-10 ml-auto" />
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SimpleLeaderboardSkeleton() {
  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-4 w-96 -mt-2" />

      {/* Top 3 Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-background border border-secondary rounded-lg p-4 text-center shadow-sm space-y-3">
            <Skeleton className="h-10 w-10 mx-auto rounded-lg" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* Full Rankings List */}
      <div className="bg-background border border-secondary rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 bg-secondary/10">
          <Skeleton className="h-4 w-40" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-secondary last:border-0">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-secondary/50 pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <div className="bg-background border border-secondary rounded-2xl overflow-hidden shadow-sm">
        <Skeleton className="h-24 w-full" />
        <div className="px-8 pb-8 -mt-12 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-end gap-5">
            <Skeleton className="h-24 w-24 rounded-2xl border-4 border-background" />
            <div className="pb-1 space-y-2">
               <Skeleton className="h-8 w-48" />
               <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-32 rounded-lg mb-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-background border border-secondary rounded-2xl p-8 shadow-sm space-y-6">
            <Skeleton className="h-4 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-4 pt-6 border-t border-secondary">
               <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
