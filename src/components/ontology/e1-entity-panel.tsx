'use client';

import { useMemo, useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import {
  getEntityRoleLabel,
  isEntityAggregateRoot,
  resolveEntityRole,
} from '@/lib/entity-role';
import { buildE1Entity } from '@/lib/e1-entity/create-entity';
import { DataModelEditor } from './data-model-editor';
import { BehaviorModelEditor } from './behavior-model-editor';
import { RuleModelEditor } from './rule-model-editor';
import { EventModelEditor } from './event-model-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { Entity } from '@/types/ontology';

type E1ModelTab = 'data' | 'behavior' | 'rule' | 'event';

const MODEL_TABS: { id: E1ModelTab; label: string; icon: string }[] = [
  { id: 'data', label: '数据模型', icon: '🗄️' },
  { id: 'behavior', label: '行为模型', icon: '⚡' },
  { id: 'rule', label: '规则模型', icon: '📋' },
  { id: 'event', label: '事件模型', icon: '📨' },
];

const ENTITY_ROLE_OPTIONS = [
  { value: 'aggregate_root', label: '聚合根' },
  { value: 'child_entity', label: '聚合内子实体' },
] as const;

const generateId = () => Math.random().toString(36).substring(2, 10);

export function E1EntityPanel() {
  const project = useOntologyStore((s) => s.project);
  const addEntity = useOntologyStore((s) => s.addEntity);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<E1ModelTab>('data');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [draft, setDraft] = useState<Partial<Entity>>({});

  const entities = useMemo(
    () => project?.dataModel?.entities ?? [],
    [project?.dataModel?.entities],
  );
  const aggregateRoots = useMemo(
    () => entities.filter((entity) => isEntityAggregateRoot(entity)),
    [entities],
  );
  const selectedEntity = selectedEntityId
    ? entities.find((entity) => entity.id === selectedEntityId) ?? null
    : null;
  const editingRole = resolveEntityRole(draft);

  const handleCreateEntity = () => {
    if (!project) return;
    if (!draft.name?.trim()) return;

    try {
      const newEntity = buildE1Entity(project, draft, generateId());
      addEntity(newEntity);
      setDraft({});
      setShowCreateDialog(false);
      setSelectedEntityId(newEntity.id);
      setActiveTab('data');
    } catch (error) {
      alert(error instanceof Error ? error.message : '创建实体失败');
    }
  };

  if (!project) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[420px]" data-testid="e1-entity-panel">
      <div className="w-full lg:w-72 shrink-0 border rounded-lg flex flex-col">
        <div className="p-3 border-b flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm">E1 实体库</h3>
            <p className="text-xs text-muted-foreground">全局数据模型 · 共 {entities.length} 个</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="e1-create-entity">
                + 新建
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建 E1 实体</DialogTitle>
                <DialogDescription>
                  实体归属项目级 E1 库，不再依赖 legacy 业务场景侧栏。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="e1-entity-name">中文名称 *</Label>
                    <Input
                      id="e1-entity-name"
                      value={draft.name ?? ''}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      placeholder="如：物料"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="e1-entity-name-en">英文名称</Label>
                    <Input
                      id="e1-entity-name-en"
                      value={draft.nameEn ?? ''}
                      onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
                      placeholder="Material"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>实体角色</Label>
                  <Select
                    value={editingRole}
                    onValueChange={(value) =>
                      setDraft({
                        ...draft,
                        entityRole: value as Entity['entityRole'],
                        parentAggregateId: value === 'aggregate_root' ? undefined : draft.parentAggregateId,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editingRole === 'child_entity' && (
                  <div className="space-y-2">
                    <Label>所属聚合根 *</Label>
                    <Select
                      value={draft.parentAggregateId ?? ''}
                      onValueChange={(value) => setDraft({ ...draft, parentAggregateId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择聚合根" />
                      </SelectTrigger>
                      <SelectContent>
                        {aggregateRoots.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>描述</Label>
                  <Textarea
                    value={draft.description ?? ''}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreateEntity} data-testid="e1-submit-entity">
                  创建实体
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="flex-1 max-h-80 lg:max-h-none">
          <div className="p-2 space-y-1">
            {entities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">暂无实体，点击新建</p>
            ) : (
              entities.map((entity) => (
                <button
                  key={entity.id}
                  type="button"
                  data-testid={`e1-entity-row-${entity.id}`}
                  className={`w-full text-left p-2 rounded-md border transition-colors ${
                    selectedEntityId === entity.id
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:bg-muted'
                  }`}
                  onClick={() => {
                    setSelectedEntityId(entity.id);
                    setActiveTab('data');
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{entity.name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {getEntityRoleLabel(resolveEntityRole(entity))}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{entity.nameEn}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col min-h-[320px]">
        {selectedEntity ? (
          <>
            <div className="p-3 border-b bg-muted/20">
              <h3 className="font-semibold">{selectedEntity.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedEntity.nameEn}</p>
            </div>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as E1ModelTab)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="border-b px-3">
                <TabsList>
                  {MODEL_TABS.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.icon} {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <TabsContent value="data" className="mt-0">
                  <DataModelEditor mode="entity-detail" entityId={selectedEntity.id} />
                </TabsContent>
                <TabsContent value="behavior" className="mt-0">
                  <BehaviorModelEditor mode="entity-detail" entityId={selectedEntity.id} />
                </TabsContent>
                <TabsContent value="rule" className="mt-0">
                  <RuleModelEditor mode="entity-detail" entityId={selectedEntity.id} />
                </TabsContent>
                <TabsContent value="event" className="mt-0">
                  <EventModelEditor mode="entity-detail" entityId={selectedEntity.id} />
                </TabsContent>
              </div>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-muted-foreground text-sm">
            选择左侧实体，编辑 E1–E4 关联模型（数据 / 行为 / 规则 / 事件）
          </div>
        )}
      </div>
    </div>
  );
}
