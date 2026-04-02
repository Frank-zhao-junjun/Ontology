'use client';

import { useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { StateMachine, State, Transition } from '@/types/ontology';

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

export function BehaviorModelEditor({ mode = 'full', entityId }: BehaviorModelEditorProps) {
  const { project, addStateMachine, updateStateMachine, deleteStateMachine } = useOntologyStore();
  const [selectedSmId, setSelectedSmId] = useState<string | null>(null);
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [editingState, setEditingState] = useState<Partial<State>>({});
  const [editingTransition, setEditingTransition] = useState<Partial<Transition>>({});
  const [newSmName, setNewSmName] = useState('');

  const stateMachines = project?.behaviorModel?.stateMachines || [];
  const entities = project?.dataModel?.entities || [];
  
  // Filter state machines by entity if in entity-detail mode
  const filteredStateMachines = mode === 'entity-detail' && entityId
    ? stateMachines.filter(sm => sm.entity === entityId)
    : stateMachines;
  
  const selectedEntity = entityId ? entities.find(e => e.id === entityId) : null;
  const selectedSm = selectedSmId ? filteredStateMachines.find(sm => sm.id === selectedSmId) : null;

  const handleCreateSm = () => {
    if (!entityId || !newSmName.trim()) return;
    
    const newSm: StateMachine = {
      id: generateId(),
      name: newSmName,
      entity: entityId,
      statusField: 'status',
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
      updateStateMachine(selectedSmId, {
        ...sm,
        states: [...sm.states, newState],
      });
    }
    setEditingState({});
    setShowStateDialog(false);
  };

  const handleAddTransition = () => {
    if (!selectedSmId) return;
    
    const newTransition: Transition = {
      id: generateId(),
      name: editingTransition.name || '新转换',
      from: editingTransition.from || '',
      to: editingTransition.to || '',
      trigger: editingTransition.trigger || 'manual',
      description: editingTransition.description,
    };

    const sm = stateMachines.find(s => s.id === selectedSmId);
    if (sm) {
      updateStateMachine(selectedSmId, {
        ...sm,
        transitions: [...sm.transitions, newTransition],
      });
    }
    setEditingTransition({});
    setShowTransitionDialog(false);
  };

  const handleDeleteState = (stateId: string) => {
    if (!selectedSmId) return;
    const sm = stateMachines.find(s => s.id === selectedSmId);
    if (sm) {
      updateStateMachine(selectedSmId, {
        ...sm,
        states: sm.states.filter(s => s.id !== stateId),
        transitions: sm.transitions.filter(t => 
          t.from !== stateId && t.to !== stateId
        ),
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

  // Entity Detail Mode
  if (mode === 'entity-detail') {
    return (
      <div className="space-y-6">
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
                                  <DialogTitle>添加状态转换</DialogTitle>
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
                                  <Button onClick={handleAddTransition} className="w-full">添加</Button>
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
                                </div>
                                <button
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteTransition(t.id)}
                                >
                                  ×
                                </button>
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
