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
import { Separator } from '@/components/ui/separator';
import type { BusinessMetric } from '@/types/ontology';

const generateId = () => Math.random().toString(36).substring(2, 10);

const MEASUREMENT_TYPES: { value: BusinessMetric['measurementType']; label: string }[] = [
  { value: 'automatic', label: '自动' },
  { value: 'manual', label: '手动' },
];

export function MetricsEditor() {
  const { project, addMetric, updateMetric, deleteMetric } = useOntologyStore();
  const behaviorActions = project?.behaviorModel?.actions ?? [];
  const dataSources = project?.dataSourcesModel?.sources ?? [];
  const [showDialog, setShowDialog] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Partial<BusinessMetric>>({});

  const metrics = project?.metricsModel?.metrics || [];

  const handleAddMetric = () => {
    const newMetric: BusinessMetric = {
      id: editingMetric.id || generateId(),
      name: editingMetric.name || '新指标',
      nameEn: editingMetric.nameEn || 'NewMetric',
      formula: editingMetric.formula || '',
      unit: editingMetric.unit || '',
      boundActionId: editingMetric.boundActionId || '',
      measurementType: editingMetric.measurementType || 'manual',
      description: editingMetric.description,
      targetValue: editingMetric.targetValue,
      dataSourceRef: editingMetric.dataSourceRef,
    };
    addMetric(newMetric);
    setEditingMetric({});
    setShowDialog(false);
  };

  const handleSaveEdit = () => {
    if (!editingMetric.id) return;
    updateMetric(editingMetric.id, {
      name: editingMetric.name,
      nameEn: editingMetric.nameEn,
      formula: editingMetric.formula,
      unit: editingMetric.unit,
      boundActionId: editingMetric.boundActionId,
      measurementType: editingMetric.measurementType,
      description: editingMetric.description,
      targetValue: editingMetric.targetValue,
      dataSourceRef: editingMetric.dataSourceRef,
    });
    setEditingMetric({});
    setShowDialog(false);
  };

  const handleOpenAddDialog = () => {
    setEditingMetric({});
    setShowDialog(true);
  };

  const handleOpenEditDialog = (metric: BusinessMetric) => {
    setEditingMetric(metric);
    setShowDialog(true);
  };

  const handleDeleteMetric = (metricId: string) => {
    deleteMetric(metricId);
  };

  const isEditing = !!editingMetric.id;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">业务指标</CardTitle>
              <CardDescription>定义业务度量和KPI指标公式</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={handleOpenAddDialog}>
                  + 添加指标
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditing ? '编辑指标' : '添加指标'}</DialogTitle>
                  <DialogDescription>
                    {isEditing ? '修改业务指标定义' : '定义一个新的业务指标'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>中文名称 *</Label>
                      <Input
                        value={editingMetric.name || ''}
                        onChange={(e) => setEditingMetric({ ...editingMetric, name: e.target.value })}
                        placeholder="如：合同签订完成率"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>英文名称 *</Label>
                      <Input
                        value={editingMetric.nameEn || ''}
                        onChange={(e) => setEditingMetric({ ...editingMetric, nameEn: e.target.value })}
                        placeholder="如：ContractSigningRate"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>计算公式 *</Label>
                    <Textarea
                      value={editingMetric.formula || ''}
                      onChange={(e) => setEditingMetric({ ...editingMetric, formula: e.target.value })}
                      placeholder="如：completed / total * 100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>单位</Label>
                      <Input
                        value={editingMetric.unit || ''}
                        onChange={(e) => setEditingMetric({ ...editingMetric, unit: e.target.value })}
                        placeholder="如：%、件、小时"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>测量方式</Label>
                      <Select
                        value={editingMetric.measurementType || 'manual'}
                        onValueChange={(v) =>
                          setEditingMetric({
                            ...editingMetric,
                            measurementType: v as BusinessMetric['measurementType'],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEASUREMENT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>目标值</Label>
                      <Input
                        type="number"
                        value={editingMetric.targetValue ?? ''}
                        onChange={(e) =>
                          setEditingMetric({
                            ...editingMetric,
                            targetValue: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="如：100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>绑定动作</Label>
                      <Select
                        value={editingMetric.boundActionId || '_none'}
                        onValueChange={(v) => setEditingMetric({ ...editingMetric, boundActionId: v === '_none' ? undefined : v })}
                      >
                        <SelectTrigger><SelectValue placeholder="选择绑定动作" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">不绑定</SelectItem>
                          {behaviorActions.map((a) => (
                            <SelectItem key={a.id} value={a.id || ''}>{a.name || a.id}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>数据源引用</Label>
                    <Select
                      value={editingMetric.dataSourceRef || '_none'}
                      onValueChange={(v) => setEditingMetric({ ...editingMetric, dataSourceRef: v === '_none' ? undefined : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="选择数据源" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">不绑定</SelectItem>
                        {dataSources.map((ds) => (
                          <SelectItem key={ds.id} value={ds.id}>{ds.name} ({ds.id})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>描述</Label>
                    <Textarea
                      value={editingMetric.description || ''}
                      onChange={(e) => setEditingMetric({ ...editingMetric, description: e.target.value })}
                      placeholder="指标用途说明"
                    />
                  </div>

                  <Button onClick={isEditing ? handleSaveEdit : handleAddMetric} className="w-full">
                    {isEditing ? '保存修改' : '添加指标'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <div className="text-2xl mb-2">📊</div>
              <p>暂无业务指标</p>
              <p className="text-sm mt-1">点击上方按钮添加指标</p>
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                      <div className="font-medium">{metric.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{metric.nameEn}</span>
                        <Badge variant="outline" className="text-xs">
                          {metric.measurementType === 'automatic' ? '自动' : '手动'}
                        </Badge>
                        {metric.unit && (
                          <Badge variant="secondary" className="text-xs">
                            {metric.unit}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {metric.formula && (
                          <span className="font-mono bg-muted px-1 py-0.5 rounded">
                            {metric.formula}
                          </span>
                        )}
                        {metric.targetValue !== undefined && (
                          <span className="ml-2">目标: {metric.targetValue}{metric.unit}</span>
                        )}
                      </div>
                      {metric.boundActionId && (
                        <div className="text-xs text-muted-foreground mt-1">
                          绑定动作: <code className="text-xs">{metric.boundActionId}</code>
                        </div>
                      )}
                      {metric.dataSourceRef && (
                        <div className="text-xs text-muted-foreground mt-1">
                          数据源: <code className="text-xs">{metric.dataSourceRef}</code>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditDialog(metric)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteMetric(metric.id)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
