'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { EpcProcess, EpcStep, MetaElement, MetaDimension } from '@/types/ontology';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ElementSelector } from '@/components/ontology/element-selector';
import { META_DIMENSION_LABELS, resolveElementLabel } from '@/lib/element-selector';

export interface EpcStepsEditorProps {
  epc: EpcProcess;
  metaElements: MetaElement[];
  onSave: (epc: EpcProcess) => void;
  generateId: () => string;
  readOnly?: boolean;
}

function cloneSteps(steps: EpcStep[]): EpcStep[] {
  return steps.map((step) => ({
    ...step,
    elementRef: step.elementRef ? { ...step.elementRef } : undefined,
  }));
}

function getDimensionLabel(dim?: MetaDimension): string {
  if (!dim) return '';
  return META_DIMENSION_LABELS[dim] ?? dim;
}

export function EpcStepsEditor({
  epc,
  metaElements,
  onSave,
  generateId,
  readOnly = false,
}: EpcStepsEditorProps) {
  const [steps, setSteps] = useState<EpcStep[]>(() => cloneSteps(epc.steps));

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { id: generateId(), name: `步骤 ${prev.length + 1}` },
    ]);
  };

  const updateStep = (stepId: string, patch: Partial<EpcStep>) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
    );
  };

  const removeStep = (stepId: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== stepId));
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === stepId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  };

  const handleSave = () => {
    onSave({ ...epc, steps });
  };

  return (
    <div className="space-y-3" data-testid="epc-steps-editor">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          EPC 步骤
          <span className="ml-2 text-xs text-muted-foreground">
            ({steps.length} 个步骤)
          </span>
        </h3>
        {!readOnly && (
          <Button type="button" size="sm" variant="outline" onClick={addStep}>
            <Plus className="h-4 w-4 mr-1" />
            添加步骤
          </Button>
        )}
      </div>

      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
          暂无步骤{!readOnly && '，点击「添加步骤」开始编辑'}。
        </p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px] text-center">序号</TableHead>
                <TableHead className="w-[40px] text-center">{readOnly ? '' : ''}</TableHead>
                <TableHead className="min-w-[160px]">步骤名称</TableHead>
                <TableHead className="w-[100px]">要素维度</TableHead>
                <TableHead className="min-w-[140px]">挂接要素</TableHead>
                {!readOnly && <TableHead className="w-[80px] text-center">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((step, index) => {
                const elementLabel = step.elementRef
                  ? resolveElementLabel(step.elementRef.elementId, metaElements)
                  : '';
                const dimLabel = step.elementRef
                  ? getDimensionLabel(step.elementRef.dimension)
                  : '';

                return (
                  <TableRow
                    key={step.id}
                    data-testid={`epc-step-${step.id}`}
                    className="group"
                  >
                    <TableCell className="text-center text-xs text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-center">
                      {!readOnly && (
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                            disabled={index === 0}
                            onClick={() => moveStep(step.id, 'up')}
                            aria-label="上移"
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M5 2L1 7H9L5 2Z" fill="currentColor" />
                            </svg>
                          </button>
                          <GripVertical className="h-3 w-3 text-muted-foreground/30" />
                          <button
                            type="button"
                            className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                            disabled={index === steps.length - 1}
                            onClick={() => moveStep(step.id, 'down')}
                            aria-label="下移"
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M5 8L1 3H9L5 8Z" fill="currentColor" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span className="text-sm">{step.name}</span>
                      ) : (
                        <Input
                          value={step.name}
                          onChange={(e) => updateStep(step.id, { name: e.target.value })}
                          className="h-8"
                          aria-label="步骤名称"
                          placeholder="步骤名称"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {dimLabel ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                          {dimLabel}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span className="text-sm">
                          {elementLabel || <span className="text-muted-foreground/40">未挂接</span>}
                        </span>
                      ) : (
                        <ElementSelector
                          metaElements={metaElements}
                          value={step.elementRef}
                          generateId={generateId}
                          onChange={(ref) => updateStep(step.id, { elementRef: ref })}
                        />
                      )}
                    </TableCell>
                    {!readOnly && (
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label="删除步骤"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!readOnly && (
        <Button type="button" onClick={handleSave}>
          保存 EPC
        </Button>
      )}
    </div>
  );
}
