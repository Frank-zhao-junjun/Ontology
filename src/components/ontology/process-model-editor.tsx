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
import type { Orchestration, ProcessStep } from '@/types/ontology';

interface ProcessModelEditorProps {
  mode?: 'full' | 'entity-detail';
  entityId?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

const STEP_TYPES: { value: ProcessStep['type']; label: string }[] = [
  { value: 'intent_clarification', label: '意图澄清' },
  { value: 'query_generation', label: '查询生成' },
  { value: 'data_retrieval', label: '数据检索' },
  { value: 'validation', label: '验证' },
  { value: 'skill_execution', label: '技能执行' },
  { value: 'insight_generation', label: '洞察生成' },
  { value: 'visualization', label: '可视化' },
  { value: 'presentation', label: '展示' },
  { value: 'decision', label: '决策' },
  { value: 'notification', label: '通知' },
];

export function ProcessModelEditor({ mode = 'full', entityId }: ProcessModelEditorProps) {
  const { project, addOrchestration, updateOrchestration, deleteOrchestration } = useOntologyStore();
  const [selectedOrchestrationId, setSelectedOrchestrationId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [newOrchestrationName, setNewOrchestrationName] = useState('');
  const [editingStep, setEditingStep] = useState<Partial<ProcessStep>>({});

  const orchestrations = project?.processModel?.orchestrations || [];
  const entities = project?.dataModel?.entities || [];
  const selectedEntity = entityId ? entities.find(e => e.id === entityId) : null;

  // Filter orchestrations that reference this entity
  const filteredOrchestrations = mode === 'entity-detail' && entityId
    ? orchestrations.filter(o => 
        o.steps.some(s => s.config?.entity === entityId) ||
        o.completionActions?.some(a => a.skill?.includes(entityId))
      )
    : orchestrations;

  const handleCreateOrchestration = () => {
    if (!newOrchestrationName.trim()) return;
    
    const newOrchestration: Orchestration = {
      id: generateId(),
      name: newOrchestrationName,
      entryPoints: [],
      steps: [],
    };
    addOrchestration(newOrchestration);
    setNewOrchestrationName('');
    setShowCreateDialog(false);
    setSelectedOrchestrationId(newOrchestration.id);
  };

  const handleAddStep = () => {
    if (!selectedOrchestrationId) return;
    
    const newStep: ProcessStep = {
      id: generateId(),
      name: editingStep.name || '新步骤',
      type: editingStep.type || 'data_retrieval',
      description: editingStep.description,
      config: entityId ? { entity: entityId, ...editingStep.config } : editingStep.config,
    };

    const orch = orchestrations.find(o => o.id === selectedOrchestrationId);
    if (orch) {
      updateOrchestration(selectedOrchestrationId, {
        ...orch,
        steps: [...orch.steps, newStep],
      });
    }
    setEditingStep({});
    setShowStepDialog(false);
  };

  const handleDeleteStep = (stepId: string) => {
    if (!selectedOrchestrationId) return;
    const orch = orchestrations.find(o => o.id === selectedOrchestrationId);
    if (orch) {
      updateOrchestration(selectedOrchestrationId, {
        ...orch,
        steps: orch.steps.filter(s => s.id !== stepId),
      });
    }
  };

  const handleDeleteOrchestration = (orchId: string) => {
    deleteOrchestration(orchId);
    if (selectedOrchestrationId === orchId) {
      setSelectedOrchestrationId(null);
    }
  };

  const getStepTypeLabel = (type: ProcessStep['type']) => {
    return STEP_TYPES.find(t => t.value === type)?.label || type;
  };

  // Entity Detail Mode
  if (mode === 'entity-detail' && selectedEntity) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">流程定义</CardTitle>
                <CardDescription>涉及 {selectedEntity.name} 的业务流程</CardDescription>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">+ 新建流程</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>创建流程</DialogTitle>
                    <DialogDescription>定义涉及 {selectedEntity.name} 的业务流程</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>流程名称</Label>
                      <Input
                        value={newOrchestrationName}
                        onChange={(e) => setNewOrchestrationName(e.target.value)}
                        placeholder="如：创建流程"
                      />
                    </div>
                    <Button onClick={handleCreateOrchestration} className="w-full" disabled={!newOrchestrationName.trim()}>
                      创建流程
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrchestrations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-2xl mb-2">🔄</div>
                <p>暂无流程定义</p>
                <p className="text-sm mt-1">点击上方按钮创建流程</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrchestrations.map((orch) => (
                  <div key={orch.id} className="border rounded-lg">
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/30"
                      onClick={() => setSelectedOrchestrationId(selectedOrchestrationId === orch.id ? null : orch.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{orch.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {orch.steps.length} 步骤
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrchestration(orch.id);
                            }}
                          >
                            删除
                          </Button>
                          <span className="text-muted-foreground">
                            {selectedOrchestrationId === orch.id ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedOrchestrationId === orch.id && (
                      <div className="border-t p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">流程步骤</h4>
                          <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setEditingStep({})}>
                                + 添加步骤
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>添加步骤</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>步骤名称</Label>
                                    <Input
                                      value={editingStep.name || ''}
                                      onChange={(e) => setEditingStep({ ...editingStep, name: e.target.value })}
                                      placeholder="如：验证数据"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>步骤类型</Label>
                                    <Select
                                      value={editingStep.type || 'data_retrieval'}
                                      onValueChange={(v) => setEditingStep({ ...editingStep, type: v as ProcessStep['type'] })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STEP_TYPES.map((t) => (
                                          <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>描述</Label>
                                  <Textarea
                                    value={editingStep.description || ''}
                                    onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
                                    placeholder="步骤说明"
                                  />
                                </div>
                                <Button onClick={handleAddStep} className="w-full">添加</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        {orch.steps.length > 0 ? (
                          <div className="space-y-2">
                            {orch.steps.map((step, idx) => (
                              <div key={step.id} className="flex items-center justify-between p-2 rounded border bg-muted/20">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                    {idx + 1}
                                  </div>
                                  <span className="font-medium text-sm">{step.name}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {getStepTypeLabel(step.type)}
                                  </Badge>
                                </div>
                                <button
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteStep(step.id)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">暂无步骤</p>
                        )}
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
      <div className="text-2xl mb-2">🔄</div>
      <p>请从左侧选择实体查看流程模型</p>
    </div>
  );
}
