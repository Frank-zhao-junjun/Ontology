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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import type { Rule, RuleType, RuleCondition } from '@/types/ontology';

interface RuleModelEditorProps {
  mode?: 'full' | 'entity-detail';
  entityId?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

const RULE_TYPES: { value: RuleType; label: string; description: string }[] = [
  { value: 'field_validation', label: '字段级校验', description: '单字段格式或范围校验' },
  { value: 'cross_field_validation', label: '跨字段校验', description: '同实体多字段逻辑校验' },
  { value: 'cross_entity_validation', label: '跨实体校验', description: '引用实体状态校验' },
  { value: 'aggregation_validation', label: '聚合校验', description: '汇总数据匹配校验' },
  { value: 'temporal_rule', label: '时序规则', description: '时间相关约束规则' },
];

const CONDITION_TYPES: { value: RuleCondition['type']; label: string }[] = [
  { value: 'regex', label: '正则匹配' },
  { value: 'range', label: '范围检查' },
  { value: 'expression', label: '表达式' },
  { value: 'reference_check', label: '引用检查' },
  { value: 'sum_match', label: '汇总匹配' },
  { value: 'deadline', label: '截止时间' },
  { value: 'custom', label: '自定义脚本' },
];

export function RuleModelEditor({ mode = 'full', entityId }: RuleModelEditorProps) {
  const { project, addRule, updateRule, deleteRule } = useOntologyStore();
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<Rule>>({});
  const [editingCondition, setEditingCondition] = useState<Partial<RuleCondition>>({});

  const rules = project?.ruleModel?.rules || [];
  const entities = project?.dataModel?.entities || [];
  
  // Filter rules by entity if in entity-detail mode
  const filteredRules = mode === 'entity-detail' && entityId
    ? rules.filter(r => r.entity === entityId)
    : rules;
  
  const selectedEntity = entityId ? entities.find(e => e.id === entityId) : null;

  const handleAddRule = () => {
    if (!entityId) return;
    
    const newRule: Rule = {
      id: generateId(),
      name: editingRule.name || '新规则',
      type: editingRule.type || 'field_validation',
      entity: entityId,
      field: editingRule.field,
      priority: editingRule.priority || 100,
      condition: {
        type: editingCondition.type || 'regex',
        pattern: editingCondition.pattern,
        min: editingCondition.min,
        max: editingCondition.max,
        exclusiveMin: editingCondition.exclusiveMin,
        exclusiveMax: editingCondition.exclusiveMax,
        expression: editingCondition.expression,
        fields: editingCondition.fields,
        refEntity: editingCondition.refEntity,
        refField: editingCondition.refField,
        refValue: editingCondition.refValue,
        checkEntity: editingCondition.checkEntity,
        checkCondition: editingCondition.checkCondition,
        masterField: editingCondition.masterField,
        detailEntity: editingCondition.detailEntity,
        detailField: editingCondition.detailField,
        detailForeignKey: editingCondition.detailForeignKey,
        deadlineField: editingCondition.deadlineField,
        daysAfter: editingCondition.daysAfter,
        customScript: editingCondition.customScript,
      },
      errorMessage: editingRule.errorMessage || '校验失败',
      severity: editingRule.severity || 'error',
      enabled: editingRule.enabled !== false,
      description: editingRule.description,
      version: editingRule.version || '1.0.0',
      status: editingRule.status || 'draft',
      effectiveFrom: editingRule.effectiveFrom,
      effectiveUntil: editingRule.effectiveUntil,
      grayscale: editingRule.grayscale,
    };
    addRule(newRule);
    setEditingRule({});
    setEditingCondition({});
    setShowRuleDialog(false);
  };

  const handleDeleteRule = (ruleId: string) => {
    deleteRule(ruleId);
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      updateRule(ruleId, { ...rule, enabled });
    }
  };

  const getRuleTypeLabel = (type: RuleType) => {
    return RULE_TYPES.find(t => t.value === type)?.label || type;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  // Entity Detail Mode
  if (mode === 'entity-detail' && selectedEntity) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">规则定义</CardTitle>
                <CardDescription>为 {selectedEntity.name} 定义校验规则</CardDescription>
              </div>
              <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { setEditingRule({}); setEditingCondition({}); }}>
                    + 添加规则
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>添加规则</DialogTitle>
                    <DialogDescription>为 {selectedEntity.name} 定义校验规则</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>规则名称</Label>
                        <Input
                          value={editingRule.name || ''}
                          onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                          placeholder="如：合同编号格式"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>规则类型</Label>
                        <Select
                          value={editingRule.type || 'field_validation'}
                          onValueChange={(v) => setEditingRule({ ...editingRule, type: v as RuleType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RULE_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    <div className="space-y-2">
                      <Label>优先级</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editingRule.priority || 100}
                        onChange={(e) => setEditingRule({ ...editingRule, priority: Number(e.target.value) || 100 })}
                      />
                    </div>
                    </div>

                    <div className="space-y-2">
                      <Label>绑定字段</Label>
                      <Select
                        value={editingRule.field || ''}
                        onValueChange={(v) => setEditingRule({ ...editingRule, field: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择字段" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedEntity.attributes.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>条件类型</Label>
                      <Select
                        value={editingCondition.type || 'regex'}
                        onValueChange={(v) => setEditingCondition({ ...editingCondition, type: v as RuleCondition['type'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {editingCondition.type === 'regex' && (
                      <div className="space-y-2">
                        <Label>正则表达式</Label>
                        <Input
                          value={editingCondition.pattern || ''}
                          onChange={(e) => setEditingCondition({ ...editingCondition, pattern: e.target.value })}
                          placeholder="如：^HT-[0-9]{4}-[0-9]{6}$"
                        />
                      </div>
                    )}

                    {editingCondition.type === 'range' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>最小值</Label>
                          <Input
                            type="number"
                            value={editingCondition.min || ''}
                            onChange={(e) => setEditingCondition({ ...editingCondition, min: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>最大值</Label>
                          <Input
                            type="number"
                            value={editingCondition.max || ''}
                            onChange={(e) => setEditingCondition({ ...editingCondition, max: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                    )}

                    {editingCondition.type === 'expression' && (
                      <div className="space-y-2">
                        <Label>表达式</Label>
                        <Input
                          value={editingCondition.expression || ''}
                          onChange={(e) => setEditingCondition({ ...editingCondition, expression: e.target.value })}
                          placeholder="如：end_date > start_date"
                        />
                      </div>
                    )}

                    {editingRule.type === 'cross_field_validation' && (
                      <div className="space-y-2">
                        <Label>参与字段（逗号分隔）</Label>
                        <Input
                          value={(editingCondition.fields || []).join(', ')}
                          onChange={(e) => {
                            const fields = e.target.value
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean);
                            setEditingCondition({ ...editingCondition, fields });
                          }}
                          placeholder="如：attr-contract-no, attr-amount"
                        />
                      </div>
                    )}

                    {editingRule.type === 'cross_entity_validation' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>检查实体</Label>
                          <Select
                            value={editingCondition.checkEntity || ''}
                            onValueChange={(value) => setEditingCondition({ ...editingCondition, checkEntity: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择检查实体" />
                            </SelectTrigger>
                            <SelectContent>
                              {entities.map((entity) => (
                                <SelectItem key={entity.id} value={entity.id}>
                                  {entity.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>检查条件</Label>
                          <Input
                            value={editingCondition.checkCondition || ''}
                            onChange={(e) => setEditingCondition({ ...editingCondition, checkCondition: e.target.value })}
                            placeholder="如：vendor.status == 'active'"
                          />
                        </div>
                      </div>
                    )}

                    {editingCondition.type === 'reference_check' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>引用实体</Label>
                            <Select
                              value={editingCondition.refEntity || ''}
                              onValueChange={(v) => setEditingCondition({ ...editingCondition, refEntity: v })}
                            >
                              <SelectTrigger><SelectValue placeholder="选择实体" /></SelectTrigger>
                              <SelectContent>
                                {entities.map((entity) => (
                                  <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>引用字段</Label>
                            <Input
                              value={editingCondition.refField || ''}
                              onChange={(e) => setEditingCondition({ ...editingCondition, refField: e.target.value })}
                              placeholder="如：status"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>引用值</Label>
                            <Input
                              value={editingCondition.refValue || ''}
                              onChange={(e) => setEditingCondition({ ...editingCondition, refValue: e.target.value })}
                              placeholder="如：active"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {editingCondition.type === 'sum_match' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>主表汇总字段</Label>
                            <Input
                              value={editingCondition.masterField || ''}
                              onChange={(e) => setEditingCondition({ ...editingCondition, masterField: e.target.value })}
                              placeholder="如：totalAmount"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>明细实体</Label>
                            <Select
                              value={editingCondition.detailEntity || ''}
                              onValueChange={(v) => setEditingCondition({ ...editingCondition, detailEntity: v })}
                            >
                              <SelectTrigger><SelectValue placeholder="选择明细实体" /></SelectTrigger>
                              <SelectContent>
                                {entities.map((entity) => (
                                  <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>明细字段</Label>
                            <Input
                              value={editingCondition.detailField || ''}
                              onChange={(e) => setEditingCondition({ ...editingCondition, detailField: e.target.value })}
                              placeholder="如：amount"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>明细外键</Label>
                            <Input
                              value={editingCondition.detailForeignKey || ''}
                              onChange={(e) => setEditingCondition({ ...editingCondition, detailForeignKey: e.target.value })}
                              placeholder="如：orderId"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {editingCondition.type === 'deadline' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>截止时间字段</Label>
                            <Select
                              value={editingCondition.deadlineField || ''}
                              onValueChange={(v) => setEditingCondition({ ...editingCondition, deadlineField: v })}
                            >
                              <SelectTrigger><SelectValue placeholder="选择日期字段" /></SelectTrigger>
                              <SelectContent>
                                {selectedEntity.attributes
                                  .filter(a => a.dataType === 'date' || a.dataType === 'datetime')
                                  .map((a) => (
                                    <SelectItem key={a.id} value={a.nameEn || a.name}>{a.name}</SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>宽限天数</Label>
                            <Input
                              type="number"
                              value={editingCondition.daysAfter ?? ''}
                              onChange={(e) => setEditingCondition({ ...editingCondition, daysAfter: e.target.value ? Number(e.target.value) : undefined })}
                              placeholder="如：3"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {editingCondition.type === 'custom' && (
                      <div className="space-y-2">
                        <Label>自定义脚本</Label>
                        <Textarea
                          value={editingCondition.customScript || ''}
                          onChange={(e) => setEditingCondition({ ...editingCondition, customScript: e.target.value })}
                          placeholder="输入自定义校验脚本"
                          className="font-mono text-sm"
                        />
                      </div>
                    )}

                    {editingCondition.type === 'range' && (
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingCondition.exclusiveMin || false}
                            onChange={(e) => setEditingCondition({ ...editingCondition, exclusiveMin: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label className="text-sm">不含最小值</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingCondition.exclusiveMax || false}
                            onChange={(e) => setEditingCondition({ ...editingCondition, exclusiveMax: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label className="text-sm">不含最大值</Label>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>错误消息</Label>
                      <Textarea
                        value={editingRule.errorMessage || ''}
                        onChange={(e) => setEditingRule({ ...editingRule, errorMessage: e.target.value })}
                        placeholder="校验失败时显示的错误信息"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>严重程度</Label>
                      <Select
                        value={editingRule.severity || 'error'}
                        onValueChange={(v) => setEditingRule({ ...editingRule, severity: v as Rule['severity'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error">错误</SelectItem>
                          <SelectItem value="warning">警告</SelectItem>
                          <SelectItem value="info">提示</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>描述</Label>
                      <Textarea
                        value={editingRule.description || ''}
                        onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                        placeholder="规则用途说明"
                      />
                    </div>

                    <Separator />

                    <Accordion type="single" collapsible>
                      <AccordionItem value="version-lifecycle">
                        <AccordionTrigger className="text-sm font-medium">
                          版本与生命周期
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>版本号</Label>
                                <Input
                                  value={editingRule.version || '1.0.0'}
                                  onChange={(e) => setEditingRule({ ...editingRule, version: e.target.value })}
                                  placeholder="1.0.0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>状态</Label>
                                <Select
                                  value={editingRule.status || 'draft'}
                                  onValueChange={(v) => setEditingRule({ ...editingRule, status: v as Rule['status'] })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">草稿</SelectItem>
                                    <SelectItem value="active">生效中</SelectItem>
                                    <SelectItem value="deprecated">已废弃</SelectItem>
                                    <SelectItem value="archived">已归档</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>生效日期</Label>
                                <Input
                                  type="date"
                                  value={editingRule.effectiveFrom || ''}
                                  onChange={(e) => setEditingRule({ ...editingRule, effectiveFrom: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>失效日期</Label>
                                <Input
                                  type="date"
                                  value={editingRule.effectiveUntil || ''}
                                  onChange={(e) => setEditingRule({ ...editingRule, effectiveUntil: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="grayscale-enabled"
                                  checked={editingRule.grayscale?.enabled || false}
                                  onCheckedChange={(checked) =>
                                    setEditingRule({
                                      ...editingRule,
                                      grayscale: {
                                        ...(editingRule.grayscale || { enabled: false, percentage: 0 }),
                                        enabled: !!checked,
                                      },
                                    })
                                  }
                                />
                                <Label htmlFor="grayscale-enabled" className="cursor-pointer">
                                  启用灰度发布
                                </Label>
                              </div>
                              {editingRule.grayscale?.enabled && (
                                <div className="space-y-4 pl-6">
                                  <div className="space-y-2">
                                    <Label>灰度比例 (%)</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={editingRule.grayscale.percentage || 0}
                                      onChange={(e) =>
                                        setEditingRule({
                                          ...editingRule,
                                          grayscale: {
                                            ...editingRule.grayscale!,
                                            percentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                                          },
                                        })
                                      }
                                      placeholder="0-100"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>目标业务场景ID（逗号分隔）</Label>
                                    <Input
                                      value={(editingRule.grayscale.targetScenarioIds || []).join(', ')}
                                      onChange={(e) => {
                                        const ids = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                        setEditingRule({
                                          ...editingRule,
                                          grayscale: {
                                            ...editingRule.grayscale!,
                                            targetScenarioIds: ids.length > 0 ? ids : undefined,
                                          },
                                        });
                                      }}
                                      placeholder="如：scenario-1, scenario-2"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <Button onClick={handleAddRule} className="w-full">
                      添加规则
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRules.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-2xl mb-2">📋</div>
                <p>暂无规则定义</p>
                <p className="text-sm mt-1">点击上方按钮添加规则</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRules.map((rule) => {
                  const field = selectedEntity.attributes.find(a => a.id === rule.field);
                  
                  return (
                    <div
                      key={rule.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${!rule.enabled ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={rule.enabled !== false}
                          onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                          className="rounded"
                        />
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">{getRuleTypeLabel(rule.type)}</Badge>
                            {field && <span>• {field.name}</span>}
                            <Badge variant={getSeverityColor(rule.severity || 'error') as "destructive" | "secondary" | "outline"}>
                              {rule.severity === 'error' ? '错误' : rule.severity === 'warning' ? '警告' : '提示'}
                            </Badge>
                            <Badge variant="outline">P{rule.priority || 100}</Badge>
                          </div>
                          {rule.errorMessage && (
                            <div className="text-xs text-muted-foreground mt-1">
                              错误: {rule.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        删除
                      </Button>
                    </div>
                  );
                })}
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
      <div className="text-2xl mb-2">📋</div>
      <p>请从左侧选择实体查看规则模型</p>
    </div>
  );
}
