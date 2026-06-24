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
import type { StateMachine, State, Transition, Action, FunctionDefinition, TransactionBoundary, BehaviorIndicator, BehaviorConstraint, IndicatorType } from '@/types/ontology';
import { SideEffectSection } from './side-effect-section';

interface BehaviorModelEditorProps {
  mode?: 'full' | 'entity-detail';
  entityId?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

const STATE_COLORS = [
  { value: '#3B82F6', label: '蓝色' },
  { value: '#10B981', label: '绿色' },
  { value: '#F59E0B', label: '黄色' },
  { value: '#EF4444', label: '红色' },
  { value: '#8B5CF6', label: '紫色' },
  { value: '#6B7280', label: '灰色' },
];

function parseLineList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatLineList(values?: string[]): string {
  return (values || []).join('\n');
}

export function BehaviorModelEditor({ mode = 'full', entityId }: BehaviorModelEditorProps) {
  const { project, addStateMachine, updateStateMachine, deleteStateMachine, addAction, updateAction, deleteAction, addFunction, updateFunction, deleteFunction, addTransactionBoundary, updateTransactionBoundary, deleteTransactionBoundary, addBehaviorIndicator, updateBehaviorIndicator, deleteBehaviorIndicator, addBehaviorConstraint, updateBehaviorConstraint, deleteBehaviorConstraint } = useOntologyStore();
  const [selectedSmId, setSelectedSmId] = useState<string | null>(null);
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showFunctionDialog, setShowFunctionDialog] = useState(false);
  const [editingAction, setEditingAction] = useState<Partial<Action>>({ parameters: [], preConditions: [], postEffects: [] });
  const [editingFunction, setEditingFunction] = useState<Partial<FunctionDefinition>>({ parameters: [] });
  const [showTbDialog, setShowTbDialog] = useState(false);
  const [showIndicatorDialog, setShowIndicatorDialog] = useState(false);
  const [showConstraintDialog, setShowConstraintDialog] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Partial<BehaviorIndicator> | null>(null);
  const [editingConstraint, setEditingConstraint] = useState<Partial<BehaviorConstraint> | null>(null);
  const [editingTb, setEditingTb] = useState<Partial<TransactionBoundary>>({ actionIds: [], aggregateRootIds: [] });

  const [editingState, setEditingState] = useState<Partial<State>>({});
  const [editingTransition, setEditingTransition] = useState<Partial<Transition>>({});
  const [newSmName, setNewSmName] = useState('');
  const [newSmStatusField, setNewSmStatusField] = useState('status');

  const stateMachines = project?.behaviorModel?.stateMachines || [];
  const entities = project?.dataModel?.entities || [];
  const domainEvents = project?.eventModel?.events || [];
  const actions = project?.behaviorModel?.actions || [];
  const functions = project?.behaviorModel?.functions || [];
  
  // Filter state machines by entity if in entity-detail mode
  const filteredStateMachines = mode === 'entity-detail' && entityId
    ? stateMachines.filter(sm => sm.entity === entityId)
    : stateMachines;
    
  const filteredActions = mode === 'entity-detail' && entityId
    ? actions.filter(a => a.targetEntityId === entityId)
    : actions;
    
  // functions are normally global, but we can display all
  const filteredFunctions = functions;
  
  const selectedEntity = entityId ? entities.find(e => e.id === entityId) : null;
  const selectedSm = selectedSmId ? filteredStateMachines.find(sm => sm.id === selectedSmId) : null;

  const handleCreateSm = () => {
    if (!entityId || !newSmName.trim()) return;
    
    const newSm: StateMachine = {
      id: generateId(),
      name: newSmName,
      entity: entityId,
      statusField: newSmStatusField || 'status',
      states: [],
      transitions: [],
    };
    addStateMachine(newSm);
    setNewSmName('');
    setShowCreateDialog(false);
    setSelectedSmId(newSm.id);
  };

  const handleAddState = () => {
    if (!selectedSmId) return;
    
    const newState: State = {
      id: generateId(),
      name: editingState.name || '新状态',
      description: editingState.description,
      isInitial: editingState.isInitial || false,
      isFinal: editingState.isFinal || false,
      color: editingState.color || '#3B82F6',
    };

    const sm = stateMachines.find(s => s.id === selectedSmId);
    if (sm) {
      try {
        updateStateMachine(selectedSmId, {
          ...sm,
          states: [...sm.states, newState],
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : '保存状态失败');
        return;
      }
    }
    setEditingState({});
    setShowStateDialog(false);
  };

  const handleAddTransition = () => {
    if (!selectedSmId) return;

    const from = Array.isArray(editingTransition.from)
      ? editingTransition.from.map((stateId) => stateId.trim()).filter(Boolean)
      : editingTransition.from?.trim();
    const to = editingTransition.to?.trim() || '';
    const trigger = editingTransition.trigger || 'manual';
    const preConditions = (editingTransition.preConditions || []).map((condition) => condition.trim()).filter(Boolean);
    const postActions = (editingTransition.postActions || []).map((action) => action.trim()).filter(Boolean);
    const triggerConfig = {
      eventId: editingTransition.triggerConfig?.eventId?.trim() || undefined,
      cron: editingTransition.triggerConfig?.cron?.trim() || undefined,
      timezone: editingTransition.triggerConfig?.timezone?.trim() || undefined,
      publishEventId: editingTransition.triggerConfig?.publishEventId?.trim() || undefined,
    };
    const hasTriggerConfig = Boolean(
      triggerConfig.eventId
      || triggerConfig.cron
      || triggerConfig.timezone
      || triggerConfig.publishEventId,
    );

    const hasFromSelection = Array.isArray(from) ? from.length > 0 : Boolean(from);
    if (!hasFromSelection || !to) {
      alert('转换必须选择起始状态和目标状态');
      return;
    }

    if ((trigger === 'automatic' || trigger === 'scheduled') && preConditions.length === 0) {
      alert('自动或定时转换必须定义触发条件');
      return;
    }
    
    const newTransition: Transition = {
      id: editingTransition.id || generateId(),
      name: editingTransition.name || '新转换',
      from: from || '',
      to,
      trigger,
      uiAction: editingTransition.uiAction?.trim() || undefined,
      triggerConfig: hasTriggerConfig ? triggerConfig : undefined,
      preConditions,
      postActions,
      description: editingTransition.description,
    };

    const sm = stateMachines.find(s => s.id === selectedSmId);
    if (sm) {
      const nextTransitions = editingTransition.id
        ? sm.transitions.map((transition) => transition.id === editingTransition.id ? newTransition : transition)
        : [...sm.transitions, newTransition];

      try {
        updateStateMachine(selectedSmId, {
          ...sm,
          transitions: nextTransitions,
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : '保存转换失败');
        return;
      }
    }
    setEditingTransition({});
    setShowTransitionDialog(false);
  };

  const handleDeleteState = (stateId: string) => {
    if (!selectedSmId) return;
    const sm = stateMachines.find(s => s.id === selectedSmId);
    if (sm) {
      const hasReferencedTransitions = sm.transitions.some((transition) => {
        const fromStateIds = Array.isArray(transition.from) ? transition.from : [transition.from];
        return fromStateIds.includes(stateId) || transition.to === stateId;
      });

      if (hasReferencedTransitions) {
        alert('状态已被转换规则引用，不能删除');
        return;
      }

      updateStateMachine(selectedSmId, {
        ...sm,
        states: sm.states.filter(s => s.id !== stateId),
      });
    }
  };

  const handleDeleteTransition = (transitionId: string) => {
    if (!selectedSmId) return;
    const sm = stateMachines.find(s => s.id === selectedSmId);
    if (sm) {
      updateStateMachine(selectedSmId, {
        ...sm,
        transitions: sm.transitions.filter(t => t.id !== transitionId),
      });
    }
  };

  const getStateById = (stateId: string) => {
    return selectedSm?.states.find(s => s.id === stateId);
  };

  const getEventById = (eventId?: string) => {
    if (!eventId) {
      return null;
    }

    return domainEvents.find((event) => event.id === eventId) || null;
  };

  // Actions handling
  const handleSaveAction = () => {
    if (!entityId || !editingAction.name) return;
    if (editingAction.id) {
      updateAction(editingAction.id, { ...editingAction, targetEntityId: entityId } as Action);
    } else {
      addAction({
        ...(editingAction as Action),
        id: generateId(),
        targetEntityId: entityId,
        actionType: editingAction.actionType || 'custom',
      });
    }
    setEditingAction({ parameters: [], preConditions: [], postEffects: [] });
    setShowActionDialog(false);
  };

  // Functions handling  
  const handleSaveFunction = () => {
    if (!editingFunction.name) return;
    if (editingFunction.id) {
      updateFunction(editingFunction.id, editingFunction as FunctionDefinition);
    } else {
      addFunction({
        ...(editingFunction as FunctionDefinition),
        id: generateId(),
        parameters: editingFunction.parameters || [],
      });
    }
    setEditingFunction({ parameters: [] });
    setShowFunctionDialog(false);
  };

  // TransactionBoundary handling
  const handleSaveTb = () => {
    if (!editingTb.name || !editingTb.nameEn) return;
    const tbData: TransactionBoundary = {
      id: editingTb.id || generateId(),
      name: editingTb.name,
      nameEn: editingTb.nameEn,
      description: editingTb.description,
      actionIds: editingTb.actionIds || [],
      aggregateRootIds: editingTb.aggregateRootIds || [],
      isolation: editingTb.isolation || 'read_committed',
      compensationActionId: editingTb.compensationActionId,
    };
    if (editingTb.id) {
      updateTransactionBoundary(editingTb.id, tbData);
    } else {
      addTransactionBoundary(tbData);
    }
    setEditingTb({ actionIds: [], aggregateRootIds: [] });
    setShowTbDialog(false);
  };

  // Entity Detail Mode
  if (mode === 'entity-detail') {
    return (
      <div className="space-y-6">
        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="actions">Actions 业务动作</TabsTrigger>
            <TabsTrigger value="functions">Functions 接口集成</TabsTrigger>
            <TabsTrigger value="statemachine">Lifecycle 状态机</TabsTrigger>
          </TabsList>
          
          <TabsContent value="statemachine" className="mt-4">
        {/* State Machine List for this entity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">状态机定义</CardTitle>
                <CardDescription>
                  为 {selectedEntity?.name || '实体'} 定义生命周期状态机
                </CardDescription>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">+ 新建状态机</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>创建状态机</DialogTitle>
                    <DialogDescription>为 {selectedEntity?.name} 创建状态机</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>状态机名称</Label>
                      <Input
                        value={newSmName}
                        onChange={(e) => setNewSmName(e.target.value)}
                        placeholder="如：生命周期"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>状态字段名</Label>
                      <Select
                        value={newSmStatusField}
                        onValueChange={setNewSmStatusField}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status">status (默认)</SelectItem>
                          {selectedEntity?.attributes
                            .filter(a => a.dataType === 'enum' || a.dataType === 'string')
                            .map(a => (
                              <SelectItem key={a.id} value={a.nameEn || a.name}>{a.name} ({a.nameEn || a.name})</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateSm} className="w-full" disabled={!newSmName.trim()}>
                      创建状态机
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStateMachines.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-2xl mb-2">⚡</div>
                <p>暂无状态机</p>
                <p className="text-sm mt-1">点击上方按钮创建状态机</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStateMachines.map((sm) => (
                  <div key={sm.id} className="border rounded-lg">
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/30"
                      onClick={() => setSelectedSmId(selectedSmId === sm.id ? null : sm.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{sm.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {sm.states.length} 状态 • {sm.transitions.length} 转换
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStateMachine(sm.id);
                              if (selectedSmId === sm.id) setSelectedSmId(null);
                            }}
                          >
                            删除
                          </Button>
                          <span className="text-muted-foreground">
                            {selectedSmId === sm.id ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedSmId === sm.id && (
                      <div className="border-t p-4 space-y-4">
                        {/* States */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">状态定义</h4>
                            <Dialog open={showStateDialog} onOpenChange={setShowStateDialog}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setEditingState({})}>
                                  + 添加状态
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>添加状态</DialogTitle>
                                  <DialogDescription>为当前状态机新增一个生命周期状态。</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div className="space-y-2">
                                    <Label>状态名称</Label>
                                    <Input
                                      value={editingState.name || ''}
                                      onChange={(e) => setEditingState({ ...editingState, name: e.target.value })}
                                      placeholder="如：草稿"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>描述</Label>
                                    <Input
                                      value={editingState.description || ''}
                                      onChange={(e) => setEditingState({ ...editingState, description: e.target.value })}
                                      placeholder="状态的含义说明"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>颜色</Label>
                                    <div className="flex gap-2">
                                      {STATE_COLORS.map((c) => (
                                        <button
                                          key={c.value}
                                          className={`w-8 h-8 rounded-full border-2 ${
                                            editingState.color === c.value ? 'border-foreground' : 'border-transparent'
                                          }`}
                                          style={{ backgroundColor: c.value }}
                                          onClick={() => setEditingState({ ...editingState, color: c.value })}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={editingState.isInitial || false}
                                        onChange={(e) => setEditingState({ ...editingState, isInitial: e.target.checked })}
                                      />
                                      初始状态
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={editingState.isFinal || false}
                                        onChange={(e) => setEditingState({ ...editingState, isFinal: e.target.checked })}
                                      />
                                      终止状态
                                    </label>
                                  </div>
                                  <Button onClick={handleAddState} className="w-full">添加</Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sm.states.map((state) => (
                              <div
                                key={state.id}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                                style={{ 
                                  borderColor: state.color,
                                  backgroundColor: `${state.color}15`
                                }}
                              >
                                <span className="text-sm">{state.name}</span>
                                {state.isInitial && <Badge variant="default" className="text-[10px] px-1">起</Badge>}
                                {state.isFinal && <Badge variant="secondary" className="text-[10px] px-1">终</Badge>}
                                <button
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteState(state.id)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {sm.states.length === 0 && (
                              <span className="text-sm text-muted-foreground">暂无状态</span>
                            )}
                          </div>
                        </div>

                        {/* Transitions */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">状态转换</h4>
                            <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setEditingTransition({})}>
                                  + 添加转换
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{editingTransition.id ? '编辑状态转换' : '添加状态转换'}</DialogTitle>
                                  <DialogDescription>定义当前状态机中两个状态之间的转换规则。</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div className="space-y-2">
                                    <Label>转换名称</Label>
                                    <Input
                                      value={editingTransition.name || ''}
                                      onChange={(e) => setEditingTransition({ ...editingTransition, name: e.target.value })}
                                      placeholder="如：提交审批"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>起始状态</Label>
                                      <Select
                                        value={editingTransition.from as string || ''}
                                        onValueChange={(v) => setEditingTransition({ ...editingTransition, from: v })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="选择" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {sm.states.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>目标状态</Label>
                                      <Select
                                        value={editingTransition.to || ''}
                                        onValueChange={(v) => setEditingTransition({ ...editingTransition, to: v })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="选择" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {sm.states.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>触发方式</Label>
                                    <Select
                                      value={editingTransition.trigger || 'manual'}
                                      onValueChange={(v) => setEditingTransition({ ...editingTransition, trigger: v as Transition['trigger'] })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="manual">手动触发</SelectItem>
                                        <SelectItem value="automatic">自动触发</SelectItem>
                                        <SelectItem value="scheduled">定时触发</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {editingTransition.trigger === 'manual' && (
                                    <div className="space-y-2">
                                      <Label htmlFor="transition-ui-action">手动动作标识</Label>
                                      <Input
                                        id="transition-ui-action"
                                        value={editingTransition.uiAction || ''}
                                        onChange={(e) => setEditingTransition({ ...editingTransition, uiAction: e.target.value })}
                                        placeholder="如：submit-approval"
                                      />
                                    </div>
                                  )}
                                  {editingTransition.trigger === 'automatic' && (
                                    <div className="space-y-2">
                                      <Label id="transition-event-label">触发事件</Label>
                                      <Select
                                        value={editingTransition.triggerConfig?.eventId || ''}
                                        onValueChange={(value) => setEditingTransition({
                                          ...editingTransition,
                                          triggerConfig: {
                                            ...editingTransition.triggerConfig,
                                            eventId: value,
                                          },
                                        })}
                                      >
                                        <SelectTrigger aria-labelledby="transition-event-label">
                                          <SelectValue placeholder="选择触发事件" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {domainEvents.map((event) => (
                                            <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  {editingTransition.trigger === 'scheduled' && (
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="transition-trigger-cron">Cron 表达式</Label>
                                        <Input
                                          id="transition-trigger-cron"
                                          aria-label="Cron 表达式"
                                          value={editingTransition.triggerConfig?.cron || ''}
                                          onChange={(e) => setEditingTransition({
                                            ...editingTransition,
                                            triggerConfig: {
                                              ...editingTransition.triggerConfig,
                                              cron: e.target.value,
                                            },
                                          })}
                                          placeholder="如：0 0 * * *"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="transition-trigger-timezone">时区</Label>
                                        <Input
                                          id="transition-trigger-timezone"
                                          value={editingTransition.triggerConfig?.timezone || ''}
                                          onChange={(e) => setEditingTransition({
                                            ...editingTransition,
                                            triggerConfig: {
                                              ...editingTransition.triggerConfig,
                                              timezone: e.target.value,
                                            },
                                          })}
                                          placeholder="如：Asia/Shanghai"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    <Label id="transition-publish-event-label">发布事件</Label>
                                    <Select
                                      value={editingTransition.triggerConfig?.publishEventId || ''}
                                      onValueChange={(value) => setEditingTransition({
                                        ...editingTransition,
                                        triggerConfig: {
                                          ...editingTransition.triggerConfig,
                                          publishEventId: value,
                                        },
                                      })}
                                    >
                                      <SelectTrigger aria-labelledby="transition-publish-event-label" aria-label="发布事件">
                                        <SelectValue placeholder="选择发布事件（可选）" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {domainEvents.map((event) => (
                                          <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>描述</Label>
                                    <Textarea
                                      value={editingTransition.description || ''}
                                      onChange={(e) => setEditingTransition({ ...editingTransition, description: e.target.value })}
                                      placeholder="转换的业务含义说明"
                                      rows={2}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>条件表达式</Label>
                                    <Textarea
                                      value={formatLineList(editingTransition.preConditions)}
                                      onChange={(e) => setEditingTransition({
                                        ...editingTransition,
                                        preConditions: parseLineList(e.target.value),
                                      })}
                                      placeholder="如：archiveReady == true"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>后置动作</Label>
                                    <Textarea
                                      value={formatLineList(editingTransition.postActions)}
                                      onChange={(e) => setEditingTransition({
                                        ...editingTransition,
                                        postActions: parseLineList(e.target.value),
                                      })}
                                      placeholder="一行一个动作，如：emit:ContractApproved"
                                    />
                                  </div>
                                  <Button onClick={handleAddTransition} className="w-full">{editingTransition.id ? '保存' : '添加'}</Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <div className="space-y-1">
                            {sm.transitions.map((t) => (
                              <div key={t.id} className="flex items-center justify-between p-2 rounded border bg-muted/20 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{t.name}</span>
                                  <span className="text-muted-foreground">:</span>
                                  <span>{getStateById(t.from as string)?.name || t.from}</span>
                                  <span>→</span>
                                  <span>{getStateById(t.to)?.name || t.to}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {t.trigger === 'manual' ? '手动' : t.trigger === 'automatic' ? '自动' : '定时'}
                                  </Badge>
                                  {t.preConditions && t.preConditions.length > 0 && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      条件 {t.preConditions.length}
                                    </Badge>
                                  )}
                                  {t.postActions && t.postActions.length > 0 && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      动作 {t.postActions.length}
                                    </Badge>
                                  )}
                                  {t.triggerConfig?.publishEventId && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      发布 {getEventById(t.triggerConfig.publishEventId)?.name || t.triggerConfig.publishEventId}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    aria-label={`编辑转换 ${t.name}`}
                                    onClick={() => {
                                      setEditingTransition(t);
                                      setShowTransitionDialog(true);
                                    }}
                                  >
                                    编辑
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                    aria-label={`删除转换 ${t.name}`}
                                    onClick={() => handleDeleteTransition(t.id)}
                                  >
                                    删除
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {sm.transitions.length === 0 && (
                              <span className="text-sm text-muted-foreground">暂无转换</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Boundaries Section */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">事务边界 (Transaction Boundaries)</CardTitle>
                <CardDescription>
                  定义事务边界，确保数据一致性
                </CardDescription>
              </div>
              <Dialog open={showTbDialog} onOpenChange={setShowTbDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingTb({ actionIds: [], aggregateRootIds: [] })}>
                    + 添加事务边界
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTb.id ? '编辑' : '新建'}事务边界</DialogTitle>
                    <DialogDescription>定义事务边界，确保数据一致性</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>名称</Label>
                        <Input
                          value={editingTb.name || ''}
                          onChange={(e) => setEditingTb({ ...editingTb, name: e.target.value })}
                          placeholder="例如: 订单创建事务"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>标识 (英文)</Label>
                        <Input
                          value={editingTb.nameEn || ''}
                          onChange={(e) => setEditingTb({ ...editingTb, nameEn: e.target.value })}
                          placeholder="例如: orderCreation"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>描述</Label>
                      <Textarea
                        value={editingTb.description || ''}
                        onChange={(e) => setEditingTb({ ...editingTb, description: e.target.value })}
                        placeholder="事务边界的详细说明..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>隔离级别</Label>
                      <Select
                        value={editingTb.isolation || 'read_committed'}
                        onValueChange={(v) => setEditingTb({ ...editingTb, isolation: v as TransactionBoundary['isolation'] })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read_committed">读已提交</SelectItem>
                          <SelectItem value="repeatable_read">可重复读</SelectItem>
                          <SelectItem value="serializable">串行化</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>动作 ID 列表</Label>
                      <Textarea
                        value={formatLineList(editingTb.actionIds)}
                        onChange={(e) => setEditingTb({ ...editingTb, actionIds: parseLineList(e.target.value) })}
                        placeholder="一行一个动作 ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>聚合根 ID 列表</Label>
                      <Textarea
                        value={formatLineList(editingTb.aggregateRootIds)}
                        onChange={(e) => setEditingTb({ ...editingTb, aggregateRootIds: parseLineList(e.target.value) })}
                        placeholder="一行一个聚合根 ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>补偿动作 ID</Label>
                      <Input
                        value={editingTb.compensationActionId || ''}
                        onChange={(e) => setEditingTb({ ...editingTb, compensationActionId: e.target.value })}
                        placeholder="补偿动作的 ID"
                      />
                    </div>

                    <Button onClick={handleSaveTb} className="w-full">
                      {editingTb.id ? '保存' : '添加'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {((project?.behaviorModel?.transactionBoundaries) || []).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-2xl mb-2">⚡</div>
                <p>暂无事务边界</p>
                <p className="text-sm mt-1">定义事务边界以确保数据一致性</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(project?.behaviorModel?.transactionBoundaries || []).map((tb) => (
                  <div key={tb.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{tb.name}</span>
                        <span className="text-sm text-muted-foreground font-mono">{tb.nameEn}</span>
                        <Badge variant="outline" className="bg-primary/5 text-primary">
                          {tb.isolation === 'read_committed' ? '读已提交' : tb.isolation === 'repeatable_read' ? '可重复读' : '串行化'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {tb.actionIds?.length || 0} 动作
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {tb.aggregateRootIds?.length || 0} 聚合根
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{tb.description || '无描述'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingTb(tb); setShowTbDialog(true); }}>
                        编辑
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => tb.id && deleteTransactionBoundary(tb.id)}>
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="actions" className="mt-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">业务动作 (Actions)</CardTitle>
                <CardDescription>
                  为 {selectedEntity?.name || '实体'} 定义强类型的业务动作
                </CardDescription>
              </div>
              <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingAction({ parameters: [], preConditions: [], postEffects: [] })}>
                    + 新建动作
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{editingAction.id ? '编辑' : '新建'}动作</DialogTitle>
                    <DialogDescription>定义 {selectedEntity?.name} 能够执行的动作</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4 h-96 overflow-y-auto pr-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>动作名称</Label>
                        <Input
                          value={editingAction.name || ''}
                          onChange={(e) => setEditingAction({ ...editingAction, name: e.target.value })}
                          placeholder="例如: 创建订单"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>标识 (英文)</Label>
                        <Input
                          value={editingAction.nameEn || ''}
                          onChange={(e) => setEditingAction({ ...editingAction, nameEn: e.target.value })}
                          placeholder="例如: createOrder"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>动作类型</Label>
                        <Select
                          value={editingAction.actionType || 'custom'}
                          onValueChange={(v) => setEditingAction({ ...editingAction, actionType: v as Action['actionType'] })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="create">创建 (Create)</SelectItem>
                            <SelectItem value="update">更新 (Update)</SelectItem>
                            <SelectItem value="delete">删除 (Delete)</SelectItem>
                            <SelectItem value="link">链接 (Link)</SelectItem>
                            <SelectItem value="unlink">断开 (Unlink)</SelectItem>
                            <SelectItem value="validate">校验 (Validate)</SelectItem>
                            <SelectItem value="notify">通知 (Notify)</SelectItem>
                            <SelectItem value="execute">执行 (Execute)</SelectItem>
                            <SelectItem value="webhook">Webhook</SelectItem>
                            <SelectItem value="custom">触发自定义 (Custom)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>执行类型</Label>
                        <Select
                          value={editingAction.executionType || 'sync'}
                          onValueChange={(v) => setEditingAction({ ...editingAction, executionType: v as Action['executionType'] })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sync">同步 (Sync)</SelectItem>
                            <SelectItem value="async">异步 (Async)</SelectItem>
                            <SelectItem value="approval">需审批 (Approval)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>描述</Label>
                      <Input
                        value={editingAction.description || ''}
                        onChange={(e) => setEditingAction({ ...editingAction, description: e.target.value })}
                        placeholder="业务动作的详细说明..."
                      />
                    </div>
                    
                    <SideEffectSection 
                      sideEffects={editingAction.sideEffects ?? []} 
                      onChange={(se) => setEditingAction({...editingAction, sideEffects: se})} 
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button variant="outline" onClick={() => setShowActionDialog(false)}>取消</Button>
                    <Button onClick={handleSaveAction}>保存动作</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {filteredActions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-2xl mb-2">⚡</div>
                <p>暂无业务动作</p>
                <p className="text-sm mt-1">控制此实体的业务能力</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{action.name}</span>
                        <span className="text-sm text-muted-foreground font-mono">{action.nameEn}</span>
                        <Badge variant="outline" className="bg-primary/5 text-primary">
                          {action.actionType}
                        </Badge>
                        {action.executionType && action.executionType !== 'sync' && (
                          <Badge variant="secondary" className="text-xs">
                            {action.executionType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{action.description || '无描述'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingAction(action); setShowActionDialog(true); }}>
                        编辑
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => action.id && deleteAction(action.id)}>
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="functions" className="mt-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">函数/接口 (Functions)</CardTitle>
                <CardDescription>
                  对接外部 API，执行复杂逻辑。这些 Function 可以在 Action 中被触发。
                </CardDescription>
              </div>
              <Dialog open={showFunctionDialog} onOpenChange={setShowFunctionDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingFunction({ parameters: [] })}>
                    + 注册接口
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingFunction.id ? '编辑' : '注册'}外部接口</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                     <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>函数名称</Label>
                        <Input
                          value={editingFunction.name || ''}
                          onChange={(e) => setEditingFunction({ ...editingFunction, name: e.target.value })}
                          placeholder="例如: 风险校验检查"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>标识 (英文)</Label>
                        <Input
                          value={editingFunction.nameEn || ''}
                          onChange={(e) => setEditingFunction({ ...editingFunction, nameEn: e.target.value })}
                          placeholder="例如: checkRisk"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>API 端点</Label>
                      <div className="flex gap-2">
                        <Select
                          value={editingFunction.httpMethod || 'POST'}
                          onValueChange={(v) => setEditingFunction({ ...editingFunction, httpMethod: v as FunctionDefinition['httpMethod'] })}
                        >
                          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          className="flex-1"
                          value={editingFunction.apiEndpoint || ''}
                          onChange={(e) => setEditingFunction({ ...editingFunction, apiEndpoint: e.target.value })}
                          placeholder="https://api.example.com/v1/risk"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>描述</Label>
                      <Input
                        value={editingFunction.description || ''}
                        onChange={(e) => setEditingFunction({ ...editingFunction, description: e.target.value })}
                        placeholder="函数用途说明"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>返回类型</Label>
                      <Input
                        value={editingFunction.returnType || ''}
                        onChange={(e) => setEditingFunction({ ...editingFunction, returnType: e.target.value })}
                        placeholder="如：RiskAssessmentResult"
                      />
                    </div>

                    <Button onClick={handleSaveFunction} className="w-full">
                      保存函数定义
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {filteredFunctions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-2xl mb-2">⚡</div>
                <p>暂无关联函数</p>
                <p className="text-sm mt-1">连接外部系统/微服务</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFunctions.map((func) => (
                  <div key={func.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{func.name}</span>
                        <span className="text-sm text-foreground font-mono">{func.nameEn}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                         <Badge variant="outline" className={func.httpMethod === 'GET' ? 'text-green-500' : 'text-blue-500'}>
                             {func.httpMethod || 'GET'}
                         </Badge>
                         <span className="text-xs text-muted-foreground line-clamp-1 break-all">
                             {func.apiEndpoint || '未配置端点'}
                         </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingFunction(func); setShowFunctionDialog(true); }}>
                        编辑
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => func.id && deleteFunction(func.id)}>
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
                <TabsContent value="indicators">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>指标定义</CardTitle>
                  <CardDescription>定义行为相关的业务指标/KPI，用于度量和评估</CardDescription>
                </div>
                <Button size="sm" onClick={() => { setEditingIndicator(null); setShowIndicatorDialog(true); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  新增指标
                </Button>
              </CardHeader>
              <CardContent>
                {(!project?.behaviorModel?.indicators || project.behaviorModel.indicators.length === 0) ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">暂未定义业务指标，点击上方按钮新增</div>
                ) : (
                  <div className="space-y-3">
                    {project.behaviorModel.indicators.map((ind) => (
                      <div key={ind.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{ind.name}</div>
                          <div className="text-sm text-muted-foreground">{ind.description}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">{ind.type}</Badge>
                            {ind.targetEntity && <Badge variant="outline">{ind.targetEntity}.{ind.targetAttribute}</Badge>}
                            {ind.targetValue !== undefined && <Badge variant="outline">目标: {ind.targetValue}</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingIndicator(ind);
                            setShowIndicatorDialog(true);
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBehaviorIndicator(ind.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Indicator Dialog */}
            <Dialog open={showIndicatorDialog} onOpenChange={setShowIndicatorDialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingIndicator?.id ? '编辑指标' : '新增指标'}</DialogTitle>
                  <DialogDescription>定义业务度量指标，用于评估行为结果</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label>指标名称</Label>
                    <Input value={editingIndicator?.name || ''} onChange={(e) => setEditingIndicator({...(editingIndicator || {}), name: e.target.value})} placeholder="例如：客户满意度评分" />
                  </div>
                  <div>
                    <Label>英文名称</Label>
                    <Input value={editingIndicator?.nameEn || ''} onChange={(e) => setEditingIndicator({...(editingIndicator || {}), nameEn: e.target.value})} placeholder="例如：customerSatisfactionScore" />
                  </div>
                  <div>
                    <Label>指标类型</Label>
                    <Select value={editingIndicator?.type || 'rate'} onValueChange={(v) => setEditingIndicator({...(editingIndicator || {}), type: v as IndicatorType})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">计数 (Count)</SelectItem>
                        <SelectItem value="rate">比率 (Rate)</SelectItem>
                        <SelectItem value="average">平均值 (Average)</SelectItem>
                        <SelectItem value="ratio">占比 (Ratio)</SelectItem>
                        <SelectItem value="duration">时长 (Duration)</SelectItem>
                        <SelectItem value="custom">自定义 (Custom)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>目标实体</Label>
                      <Select value={editingIndicator?.targetEntity || '_none'} onValueChange={(v) => setEditingIndicator({...(editingIndicator || {}), targetEntity: v === '_none' ? '' : v})}>
                        <SelectTrigger><SelectValue placeholder="选择实体" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">无</SelectItem>
                          {entities.map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.name} ({e.nameEn})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>目标属性</Label>
                      <Input value={editingIndicator?.targetAttribute || ''} onChange={(e) => setEditingIndicator({...(editingIndicator || {}), targetAttribute: e.target.value})} placeholder="属性名" />
                    </div>
                  </div>
                  <div>
                    <Label>计算公式</Label>
                    <Input value={editingIndicator?.formula || ''} onChange={(e) => setEditingIndicator({...(editingIndicator || {}), formula: e.target.value})} placeholder="例如：sum(order.amount) / count(order)" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>目标值</Label>
                      <Input type="number" value={editingIndicator?.targetValue ?? ''} onChange={(e) => setEditingIndicator({...(editingIndicator || {}), targetValue: Number(e.target.value)})} />
                    </div>
                    <div>
                      <Label>可接受范围</Label>
                      <Input value={editingIndicator?.acceptableRange ? `${editingIndicator.acceptableRange.min || ''}-${editingIndicator.acceptableRange.max || ''}` : ''} onChange={(e) => {
                        const [min, max] = e.target.value.split('-');
                        setEditingIndicator({...(editingIndicator || {}), acceptableRange: { min: min ? Number(min) : undefined, max: max ? Number(max) : undefined }});
                      }} placeholder="例如：80-100" />
                    </div>
                  </div>
                  <div>
                    <Label>权重</Label>
                    <Input type="number" value={editingIndicator?.weight ?? 1} onChange={(e) => setEditingIndicator({...(editingIndicator || {}), weight: Number(e.target.value)})} placeholder="1" />
                  </div>
                  <div>
                    <Label>单位</Label>
                    <Input value={editingIndicator?.unit || ''} onChange={(e) => setEditingIndicator({...(editingIndicator || {}), unit: e.target.value})} placeholder="例如：%、次、天" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>预警阈值</Label>
                      <Input type="number" value={editingIndicator?.warningThreshold ?? ''} onChange={(e) => setEditingIndicator({...(editingIndicator || {}), warningThreshold: e.target.value ? Number(e.target.value) : undefined})} placeholder="低于此值预警" />
                    </div>
                    <div>
                      <Label>严重阈值</Label>
                      <Input type="number" value={editingIndicator?.criticalThreshold ?? ''} onChange={(e) => setEditingIndicator({...(editingIndicator || {}), criticalThreshold: e.target.value ? Number(e.target.value) : undefined})} placeholder="低于此值严重" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={editingIndicator?.isKPI ?? true} onChange={(e) => setEditingIndicator({...(editingIndicator || {}), isKPI: e.target.checked})} className="rounded border-gray-300" />
                    <Label>KPI 指标</Label>
                  </div>
                  <div>
                    <Label>指标描述</Label>
                    <Textarea value={editingIndicator?.description || ''} onChange={(e) => setEditingIndicator({...(editingIndicator || {}), description: e.target.value})} placeholder="描述指标的业务含义" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowIndicatorDialog(false)}>取消</Button>
                  <Button onClick={() => {
                    const data = editingIndicator || {};
                    if (!data.id) {
                      addBehaviorIndicator({ ...data, id: Math.random().toString(36).substring(2, 15) } as BehaviorIndicator);
                    } else {
                      updateBehaviorIndicator(data.id, data as BehaviorIndicator);
                    }
                    setShowIndicatorDialog(false);
                  }}>保存</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="constraints">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>行为约束</CardTitle>
                  <CardDescription>定义行为执行的约束条件，包括权限、资源、合规等</CardDescription>
                </div>
                <Button size="sm" onClick={() => { setEditingConstraint(null); setShowConstraintDialog(true); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  新增约束
                </Button>
              </CardHeader>
              <CardContent>
                {(!project?.behaviorModel?.constraints || project.behaviorModel.constraints.length === 0) ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">暂未定义行为约束，点击上方按钮新增</div>
                ) : (
                  <div className="space-y-3">
                    {project.behaviorModel.constraints.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-sm text-muted-foreground">{c.description}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={c.severity === 'blocking' ? 'destructive' : 'secondary'}>{c.severity === 'blocking' ? '阻塞' : '警告'}</Badge>
                            <Badge variant="outline">{c.constraintType || 'preCondition'}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingConstraint(c);
                            setShowConstraintDialog(true);
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBehaviorConstraint(c.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Constraint Dialog */}
            <Dialog open={showConstraintDialog} onOpenChange={setShowConstraintDialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingConstraint?.id ? '编辑约束' : '新增约束'}</DialogTitle>
                  <DialogDescription>定义行为执行的约束条件</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label>约束名称</Label>
                    <Input value={editingConstraint?.name || ''} onChange={(e) => setEditingConstraint({...(editingConstraint || {}), name: e.target.value})} placeholder="例如：仅限管理员操作" />
                  </div>
                  <div>
                    <Label>约束类型</Label>
                    <Select value={editingConstraint?.constraintType || 'preCondition'} onValueChange={(v) => setEditingConstraint({...(editingConstraint || {}), constraintType: v as 'preCondition' | 'postCondition' | 'role' | 'resource' | 'timing'})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preCondition">前置条件 (Pre-condition)</SelectItem>
                        <SelectItem value="postCondition">后置条件 (Post-condition)</SelectItem>
                        <SelectItem value="role">基于角色 (Role-based)</SelectItem>
                        <SelectItem value="resource">基于资源 (Resource-based)</SelectItem>
                        <SelectItem value="timing">时效约束 (Timing)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>严重程度</Label>
                    <Select value={editingConstraint?.severity || 'warning'} onValueChange={(v) => setEditingConstraint({...(editingConstraint || {}), severity: v as 'warning' | 'blocking'})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blocking">阻塞 (Blocking)</SelectItem>
                        <SelectItem value="warning">警告 (Warning)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>条件表达式</Label>
                    <Textarea value={editingConstraint?.condition || ''} onChange={(e) => setEditingConstraint({...(editingConstraint || {}), condition: e.target.value})} placeholder="例如：user.role === 'admin'" />
                  </div>
                  <div>
                    <Label>角色</Label>
                    <Input value={editingConstraint?.role || ''} onChange={(e) => setEditingConstraint({...(editingConstraint || {}), role: e.target.value})} placeholder="例如：admin, operator, viewer" />
                  </div>
                  <div>
                    <Label>约束描述</Label>
                    <Textarea value={editingConstraint?.description || ''} onChange={(e) => setEditingConstraint({...(editingConstraint || {}), description: e.target.value})} placeholder="描述约束的业务含义" />
                  </div>
                  <div>
                    <Label>约束范围 (scope)</Label>
                    <Select value={editingConstraint?.scope || 'pre_action'} onValueChange={(v) => setEditingConstraint({...(editingConstraint || {}), scope: v as 'pre_action' | 'post_action' | 'transition' | 'role_based' | 'resource_based'})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pre_action">前置动作</SelectItem>
                        <SelectItem value="post_action">后置动作</SelectItem>
                        <SelectItem value="transition">转换约束</SelectItem>
                        <SelectItem value="role_based">角色约束</SelectItem>
                        <SelectItem value="resource_based">资源约束</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>目标动作</Label>
                    <Input value={editingConstraint?.targetAction || ''} onChange={(e) => setEditingConstraint({...(editingConstraint || {}), targetAction: e.target.value})} placeholder="绑定的 Action ID" />
                  </div>
                  <div>
                    <Label>错误消息</Label>
                    <Input value={editingConstraint?.errorMessage || ''} onChange={(e) => setEditingConstraint({...(editingConstraint || {}), errorMessage: e.target.value})} placeholder="约束违反时的提示消息" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={editingConstraint?.async || false} onChange={(e) => setEditingConstraint({...(editingConstraint || {}), async: e.target.checked})} className="rounded border-gray-300" />
                    <Label>异步执行</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowConstraintDialog(false)}>取消</Button>
                  <Button onClick={() => {
                    const data = editingConstraint || {};
                    if (!data.id) {
                      addBehaviorConstraint({ ...data, id: Math.random().toString(36).substring(2, 15) } as BehaviorConstraint);
                    } else {
                      updateBehaviorConstraint(data.id, data as BehaviorConstraint);
                    }
                    setShowConstraintDialog(false);
                  }}>保存</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

</Tabs>
      </div>
    );
  }

  // Full mode
  return (
    <div className="text-center py-12 text-muted-foreground">
      <div className="text-2xl mb-2">⚡</div>
      <p>请从左侧选择实体查看行为模型</p>
    </div>
  );
}
