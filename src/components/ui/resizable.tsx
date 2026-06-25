'use client';

import { GripVerticalIcon } from 'lucide-react';
import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
} from 'react-resizable-panels';

import { cn } from '@/lib/utils';

function ResizablePanelGroup({
  className,
  orientation = 'horizontal',
  ...props
}: GroupProps) {
  return (
    <Group
      data-slot="resizable-panel-group"
      data-panel-group-direction={orientation}
      orientation={orientation}
      className={cn(
        'flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
        className,
      )}
      {...props}
    />
  );
}

function ResizablePanel({ ...props }: PanelProps) {
  return <Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: SeparatorProps & {
  withHandle?: boolean;
}) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        'bg-border focus-visible:ring-ring relative flex w-2 items-center justify-center hover:bg-primary/20 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-2 data-[panel-group-direction=vertical]:w-full cursor-col-resize data-[panel-group-direction=vertical]:cursor-row-resize',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-10 w-4 items-center justify-center rounded-xs border shadow-sm cursor-col-resize">
          <GripVerticalIcon className="size-3.5" />
        </div>
      )}
    </Separator>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
