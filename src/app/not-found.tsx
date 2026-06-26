import { Button } from '@/components/ui/button';
import { Home, SearchX } from 'lucide-react';
import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <SearchX className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">页面未找到</h1>
      <p className="text-muted-foreground text-center max-w-md">您访问的页面不存在或已被移除。</p>
      <Button asChild variant="default"><Link href="/"><Home className="mr-2 h-4 w-4" />返回首页</Link></Button>
    </div>
  );
}
