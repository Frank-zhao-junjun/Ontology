'use client';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
export default function ToolError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold">出了点问题</h1>
      <p className="text-muted-foreground text-center max-w-md">建模工作台遇到了一个意外错误。请重试或返回首页。</p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default"><RefreshCw className="mr-2 h-4 w-4" />重试</Button>
        <Button asChild variant="outline"><Link href="/"><Home className="mr-2 h-4 w-4" />返回首页</Link></Button>
      </div>
    </div>
  );
}
