'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { EpcStepElementRef, MetaDimension, MetaElement } from '@/types/ontology';
import {
  META_DIMENSION_LABELS,
  META_DIMENSION_ORDER,
  buildExistingElementRef,
  createInlineElementRef,
  filterMetaElements,
  groupMetaElementsByDimension,
  resolveElementLabel,
} from '@/lib/element-selector';

export interface ElementSelectorProps {
  metaElements: MetaElement[];
  value?: EpcStepElementRef;
  onChange: (ref: EpcStepElementRef | undefined) => void;
  generateId: () => string;
}

export function ElementSelector({
  metaElements,
  value,
  onChange,
  generateId,
}: ElementSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [inlineOpen, setInlineOpen] = useState(false);
  const [inlineDimension, setInlineDimension] = useState<MetaDimension>('E1');
  const [inlineName, setInlineName] = useState('');

  const filtered = useMemo(
    () => filterMetaElements(metaElements, search),
    [metaElements, search],
  );
  const grouped = useMemo(
    () => groupMetaElementsByDimension(filtered),
    [filtered],
  );

  const displayLabel = value?.elementId
    ? resolveElementLabel(value.elementId, metaElements)
    : null;

  const handleSelectExisting = (element: MetaElement) => {
    onChange(buildExistingElementRef(element));
    setOpen(false);
    setSearch('');
  };

  const handleInlineCreate = () => {
    const name = inlineName.trim();
    if (!name) return;
    onChange(createInlineElementRef(inlineDimension, { name }, generateId));
    setInlineOpen(false);
    setInlineName('');
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            data-testid="element-selector-trigger"
          >
            {displayLabel ? (
              <span className="truncate">{displayLabel}</span>
            ) : (
              <span className="text-muted-foreground truncate">选择八维要素…</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="搜索要素名称…"
              value={search}
              onValueChange={setSearch}
              data-testid="element-selector-search"
            />
            <CommandList>
              <CommandEmpty>未找到匹配要素</CommandEmpty>
              {META_DIMENSION_ORDER.map((dimension) => {
                const items = grouped[dimension];
                if (items.length === 0) return null;
                return (
                  <CommandGroup key={dimension} heading={META_DIMENSION_LABELS[dimension]}>
                    {items.map((el) => (
                      <CommandItem
                        key={el.id}
                        value={el.id}
                        onSelect={() => handleSelectExisting(el)}
                        data-testid={`element-option-${el.id}`}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value?.elementId === el.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="truncate">{el.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setInlineOpen(true);
                  }}
                  data-testid="element-selector-inline-new"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  内联新建要素…
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={inlineOpen} onOpenChange={setInlineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>内联新建要素</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>维度</Label>
              <div className="flex flex-wrap gap-2">
                {META_DIMENSION_ORDER.map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={inlineDimension === d ? 'default' : 'outline'}
                    onClick={() => setInlineDimension(d)}
                    data-testid={`inline-dimension-${d}`}
                  >
                    {META_DIMENSION_LABELS[d]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inline-element-name">要素名称</Label>
              <Input
                id="inline-element-name"
                value={inlineName}
                onChange={(e) => setInlineName(e.target.value)}
                placeholder="输入要素名称"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setInlineOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={handleInlineCreate} disabled={!inlineName.trim()}>
              确认新建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
