'use client';

import { useMemo, useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import {
  buildBusinessChainTree,
  canDeleteBusinessChainNode,
  type BusinessChainNodeKind,
  type BusinessChainTreeNode,
} from '@/lib/business-chain/tree';
import type { ModuleStatus } from '@/types/ontology';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModuleStatusBadge } from '@/components/ontology/module-status-badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

const KIND_LABEL: Record<BusinessChainNodeKind, string> = {
  A: '价值域',
  B: '能力',
  C: '场景',
  EPC: 'EPC',
};

function NodeRow({
  node,
  depth,
  expanded,
  onToggle,
  selectedId,
  onSelect,
  getStatus,
}: {
  node: BusinessChainTreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  selectedId: string | null;
  onSelect: (kind: BusinessChainNodeKind, id: string) => void;
  getStatus: (kind: BusinessChainNodeKind, id: string) => ModuleStatus;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const status = getStatus(node.kind, node.id);

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer text-sm ${
          isSelected ? 'bg-primary/15 border border-primary/40' : 'hover:bg-muted'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        data-testid={`business-chain-node-${node.kind}-${node.id}`}
        onClick={() => onSelect(node.kind, node.id)}
      >
        <button
          type="button"
          className="p-0.5"
          aria-label={isOpen ? '折叠' : '展开'}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="w-3.5 inline-block" />
          )}
        </button>
        <span className="flex-1 truncate">{node.name}</span>
        <ModuleStatusBadge status={status} />
      </div>
      {hasChildren && isOpen && (
        <div>
          {node.children.map((child) => (
            <NodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
              getStatus={getStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function BusinessChainTree() {
  const project = useOntologyStore((s) => s.project);
  const selected = useOntologyStore((s) => s.selectedBusinessChainNode);
  const setSelected = useOntologyStore((s) => s.setSelectedBusinessChainNode);
  const getStatus = useOntologyStore((s) => s.getBusinessChainModuleStatus);
  const addValueDomain = useOntologyStore((s) => s.addValueDomain);
  const addCapability = useOntologyStore((s) => s.addCapability);
  const addScenario = useOntologyStore((s) => s.addScenario);
  const addEpcProcess = useOntologyStore((s) => s.addEpcProcess);
  const deleteValueDomain = useOntologyStore((s) => s.deleteValueDomain);
  const deleteCapability = useOntologyStore((s) => s.deleteCapability);
  const deleteScenario = useOntologyStore((s) => s.deleteScenario);
  const deleteEpcProcess = useOntologyStore((s) => s.deleteEpcProcess);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [dialog, setDialog] = useState<{
    mode: 'create';
    childKind: BusinessChainNodeKind;
    parentId: string;
  } | null>(null);
  const [name, setName] = useState('');

  const slices = useMemo(
    () => ({
      valueDomains: project?.valueDomains,
      capabilities: project?.capabilities,
      scenarios: project?.scenarios,
      epcProcesses: project?.epcProcesses,
    }),
    [project],
  );

  const tree = useMemo(() => buildBusinessChainTree(slices), [slices]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (kind: BusinessChainNodeKind, id: string) => {
    setSelected({ kind, id });
    setExpanded((prev) => new Set(prev).add(id));
  };

  const openCreate = (childKind: BusinessChainNodeKind, parentId: string) => {
    setName('');
    setDialog({ mode: 'create', childKind, parentId });
  };

  const handleCreate = () => {
    if (!dialog || !name.trim()) return;
    const input = { name: name.trim() };
    let createdId: string | undefined;

    if (dialog.childKind === 'A') {
      createdId = addValueDomain(input).id;
    } else if (dialog.childKind === 'B') {
      createdId = addCapability(dialog.parentId, input).id;
    } else if (dialog.childKind === 'C') {
      createdId = addScenario(dialog.parentId, input).id;
    } else {
      createdId = addEpcProcess(dialog.parentId, input).id;
    }

    if (createdId) {
      const kind = dialog.childKind;
      setSelected({ kind, id: createdId });
      setExpanded((prev) => new Set(prev).add(dialog.parentId).add(createdId));
    }
    setDialog(null);
  };

  const handleDeleteSelected = () => {
    if (!selected || !project) return;
    const slicesForDelete = {
      valueDomains: project.valueDomains,
      capabilities: project.capabilities,
      scenarios: project.scenarios,
      epcProcesses: project.epcProcesses,
    };
    if (!canDeleteBusinessChainNode(slicesForDelete, selected.kind, selected.id) && selected.kind !== 'EPC') {
      return;
    }
    try {
      if (selected.kind === 'A') deleteValueDomain(selected.id);
      else if (selected.kind === 'B') deleteCapability(selected.id);
      else if (selected.kind === 'C') deleteScenario(selected.id);
      else deleteEpcProcess(selected.id);
    } catch {
      // store throws when children exist
    }
  };

  const canAddChild =
    !selected ||
    selected.kind === 'A' ||
    selected.kind === 'B' ||
    selected.kind === 'C';

  const childKindForAdd: BusinessChainNodeKind | null = !selected
    ? 'A'
    : selected.kind === 'A'
      ? 'B'
      : selected.kind === 'B'
        ? 'C'
        : selected.kind === 'C'
          ? 'EPC'
          : null;

  const canDeleteSelected =
    selected &&
    project &&
    (selected.kind === 'EPC' ||
      canDeleteBusinessChainNode(
        {
          valueDomains: project.valueDomains,
          capabilities: project.capabilities,
          scenarios: project.scenarios,
          epcProcesses: project.epcProcesses,
        },
        selected.kind,
        selected.id,
      ));

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-3 border-b flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => openCreate('A', '')}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          新建价值域
        </Button>
        {canAddChild && childKindForAdd && childKindForAdd !== 'A' && selected && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openCreate(childKindForAdd, selected.id)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            新建{KIND_LABEL[childKindForAdd]}
          </Button>
        )}
        {canDeleteSelected && (
          <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDeleteSelected}>
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            删除
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 p-2">
        {tree.length === 0 ? (
          <p className="text-sm text-muted-foreground p-2">暂无业务链，请新建价值域 (A)</p>
        ) : (
          tree.map((node) => (
            <NodeRow
              key={node.id}
              node={node}
              depth={0}
              expanded={expanded}
              onToggle={toggle}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
              getStatus={getStatus}
            />
          ))
        )}
      </ScrollArea>

      <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              新建{dialog ? KIND_LABEL[dialog.childKind] : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bc-name">名称</Label>
            <Input
              id="bc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="中文名称"
            />
          </div>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            创建
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
