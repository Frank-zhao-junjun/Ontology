import { Skeleton } from '@/components/ui/skeleton';
export default function ToolLoading() {
  return (
    <div className="flex h-screen gap-4 p-4">
      <div className="w-64 space-y-3">
        <Skeleton className="h-8 w-full" /><Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-6 w-3/4" />
      </div>
      <div className="flex-1 space-y-4">
        <Skeleton className="h-10 w-1/3" /><Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-2 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      </div>
    </div>
  );
}
