'use client';

import { useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isEntityAggregateRoot } from '@/lib/entity-role';
import type { EventDefinition, Subscription } from '@/types/ontology';

interface EventModelEditorProps {
  mode?: 'full' | 'entity-detail';
  entityId?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

const EVENT_TRIGGERS: { value: EventDefinition['trigger']; label: string }[] = [
  { value: 'create', label: '创建时' },
  { value: 'update', label: '更新时' },
  { value: 'delete', label: '删除时' },
  { value: 'state_change', label: '状态变更时' },
  { value: 'custom', label: '自定义' },
];

const SUBSCRIPTION_ACTIONS: { value: Subscription['action']; label: string }[] = [
  { value: 'skill', label: '调用技能' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'notification', label: '发送通知' },
  { value: 'script', label: '执行脚本' },
];

export function EventModelEditor({ mode = 'full', entityId }: EventModelEditorProps) {
  const { project, addEventDefinition, deleteEventDefinition, addSubscription, deleteSubscription } = useOntologyStore();
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<EventDefinition>>({});
  const [editingSubscription, setEditingSubscription] = useState<Partial<Subscription>>({});
  const [activeTab, setActiveTab] = useState<'events' | 'subscriptions'>('events');

  const events = project?.eventModel?.events || [];
  const subscriptions = project?.eventModel?.subscriptions || [];
  const entities = project?.dataModel?.entities || [];
  const stateMachines = project?.behaviorModel?.stateMachines || [];
  const selectedEntity = entityId ? entities.find(e => e.id === entityId) : null;

  // Filter events by entity
  const filteredEvents = mode === 'entity-detail' && entityId
    ? events.filter(e => e.entity === entityId)
    : events;
  
  // Filter subscriptions for these events
  const filteredEventIds = filteredEvents.map(e => e.id);
  const filteredSubscriptions = mode === 'entity-detail'
    ? subscriptions.filter(s => filteredEventIds.includes(s.eventId))
    : subscriptions;

  const handleAddEvent = () => {
    if (!entityId) return;
    
    // E1: 验证只有聚合根实体才能定义事件
    const entity = project?.dataModel?.entities.find(e => e.id === entityId);
    if (!isEntityAggregateRoot(entity)) {
      alert('只有 `entityRole = aggregate_root` 的实体才能定义领域事件。请先在数据模型中将其设置为聚合根。');
      return;
    }
    
    const newEvent: EventDefinition = {
      id: generateId(),
      name: editingEvent.name || '新事件',
      nameEn: editingEvent.nameEn,
      entity: entityId,
      trigger: editingEvent.trigger || 'create',
      condition: editingEvent.condition,
      payload: editingEvent.payload || [],
      description: editingEvent.description,
      entityRole: 'aggregate_root',
      entityIsAggregateRoot: true,  // 兼容旧结构
    };
    addEventDefinition(newEvent);
    setEditingEvent({});
    setShowEventDialog(false);
  };

  const handleAddSubscription = () => {
    const newSubscription: Subscription = {
      id: generateId(),
      name: editingSubscription.name || '新订阅',
      eventId: editingSubscription.eventId || '',
      handler: editingSubscription.handler || 'sync',
      action: editingSubscription.action || 'notification',
      actionRef: editingSubscription.actionRef || '',
      retryPolicy: editingSubscription.retryPolicy,
      description: editingSubscription.description,
    };
    addSubscription(newSubscription);
    setEditingSubscription({});
    setShowSubscriptionDialog(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEventDefinition(eventId);
    subscriptions.filter(s => s.eventId === eventId).forEach(s => {
      deleteSubscription(s.id);
    });
  };

  const handleDeleteSubscription = (subId: string) => {
    deleteSubscription(subId);
  };

  const getTriggerLabel = (trigger: EventDefinition['trigger']) => {
    return EVENT_TRIGGERS.find(t => t.value === trigger)?.label || trigger;
  };

  const getActionLabel = (action: Subscription['action']) => {
    return SUBSCRIPTION_ACTIONS.find(a => a.value === action)?.label || action;
  };

  // Entity Detail Mode
  if (mode === 'entity-detail' && selectedEntity) {
    const entityStateMachines = stateMachines.filter(sm => sm.entity === entityId);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">事件与订阅</CardTitle>
                <CardDescription>{selectedEntity.name} 的事件定义和订阅管理</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="mb-4">
                <TabsTrigger value="events" className="gap-2">
                  📨 事件 ({filteredEvents.length})
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="gap-2">
                  🔔 订阅 ({filteredSubscriptions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="events">
                <div className="flex justify-end mb-4">
                  <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => setEditingEvent({})}>+ 添加事件</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加事件</DialogTitle>
                        <DialogDescription>为 {selectedEntity.name} 定义事件</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>事件名称</Label>
                            <Input
                              value={editingEvent.name || ''}
                              onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                              placeholder="如：创建完成"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>英文名称</Label>
                            <Input
                              value={editingEvent.nameEn || ''}
                              onChange={(e) => setEditingEvent({ ...editingEvent, nameEn: e.target.value })}
                              placeholder="如：Created"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>触发时机</Label>
                          <Select
                            value={editingEvent.trigger || 'create'}
                            onValueChange={(v) => setEditingEvent({ ...editingEvent, trigger: v as EventDefinition['trigger'] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EVENT_TRIGGERS.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {editingEvent.trigger === 'state_change' && entityStateMachines.length > 0 && (
                          <div className="space-y-2">
                            <Label>状态条件</Label>
                            <Input
                              value={editingEvent.condition || ''}
                              onChange={(e) => setEditingEvent({ ...editingEvent, condition: e.target.value })}
                              placeholder="如：status:approved"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>事件载荷 (字段，逗号分隔)</Label>
                          <Input
                            value={editingEvent.payload?.map(p => p.field).join(', ') || ''}
                            onChange={(e) => setEditingEvent({ 
                              ...editingEvent, 
                              payload: e.target.value.split(',').map(s => ({ field: s.trim() })).filter(p => p.field)
                            })}
                            placeholder="如：id, name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>描述</Label>
                          <Textarea
                            value={editingEvent.description || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                            placeholder="事件说明"
                          />
                        </div>
                        <Button onClick={handleAddEvent} className="w-full">添加事件</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <div className="text-2xl mb-2">📨</div>
                    <p>暂无事件定义</p>
                    <p className="text-sm mt-1">点击上方按钮添加事件</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredEvents.map((event) => {
                      const relatedSubs = subscriptions.filter(s => s.eventId === event.id);
                      
                      return (
                        <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{event.name}</span>
                              {event.nameEn && (
                                <span className="text-sm text-muted-foreground">({event.nameEn})</span>
                              )}
                              <Badge variant="outline">{getTriggerLabel(event.trigger)}</Badge>
                              {relatedSubs.length > 0 && (
                                <Badge variant="secondary">{relatedSubs.length} 订阅</Badge>
                              )}
                            </div>
                            {event.condition && (
                              <div className="text-xs text-muted-foreground mt-1">
                                条件: {event.condition}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            删除
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="subscriptions">
                <div className="flex justify-end mb-4">
                  <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => setEditingSubscription({})}>+ 添加订阅</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加订阅</DialogTitle>
                        <DialogDescription>订阅 {selectedEntity.name} 的事件</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>订阅名称</Label>
                          <Input
                            value={editingSubscription.name || ''}
                            onChange={(e) => setEditingSubscription({ ...editingSubscription, name: e.target.value })}
                            placeholder="如：发送通知"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>订阅事件</Label>
                          <Select
                            value={editingSubscription.eventId || ''}
                            onValueChange={(v) => setEditingSubscription({ ...editingSubscription, eventId: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择事件" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredEvents.map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                  {e.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>处理方式</Label>
                            <Select
                              value={editingSubscription.handler || 'sync'}
                              onValueChange={(v) => setEditingSubscription({ ...editingSubscription, handler: v as Subscription['handler'] })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sync">同步</SelectItem>
                                <SelectItem value="async">异步</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>动作类型</Label>
                            <Select
                              value={editingSubscription.action || 'notification'}
                              onValueChange={(v) => setEditingSubscription({ ...editingSubscription, action: v as Subscription['action'] })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SUBSCRIPTION_ACTIONS.map((a) => (
                                  <SelectItem key={a.value} value={a.value}>
                                    {a.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>动作引用</Label>
                          <Input
                            value={editingSubscription.actionRef || ''}
                            onChange={(e) => setEditingSubscription({ ...editingSubscription, actionRef: e.target.value })}
                            placeholder="技能名/Webhook URL/模板名"
                          />
                        </div>
                        <Button onClick={handleAddSubscription} className="w-full">添加订阅</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {filteredSubscriptions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <div className="text-2xl mb-2">🔔</div>
                    <p>暂无订阅</p>
                    <p className="text-sm mt-1">先添加事件，再创建订阅</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSubscriptions.map((sub) => {
                      const event = events.find(e => e.id === sub.eventId);
                      
                      return (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{sub.name}</span>
                              <Badge variant="outline">
                                {sub.handler === 'sync' ? '同步' : '异步'}
                              </Badge>
                              <Badge variant="outline">
                                {getActionLabel(sub.action)}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              订阅: {event?.name || '未知事件'}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeleteSubscription(sub.id)}
                          >
                            删除
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full mode
  return (
    <div className="text-center py-12 text-muted-foreground">
      <div className="text-2xl mb-2">📨</div>
      <p>请从左侧选择实体查看事件模型</p>
    </div>
  );
}
