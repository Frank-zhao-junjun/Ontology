'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { EpcProcess, EpcStep, MetaElement } from '@/types/ontology';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ElementSelector } from '@/components/ontology/element-selector';

export interface EpcStepsEditorProps {
  epc: EpcProcess;
  metaElements: MetaElement[];
  onSave: (epc: EpcProcess) => void;
  generateId: () => string;
}

function cloneSteps(steps: EpcStep[]): EpcStep[] {
  return steps.map((step) => ({
    ...step,
    elementRef: step.elementRef ? { ...step.elementRef } : undefined,
  }));
}

export function EpcStepsEditor({
  epc,
  metaElements,
  onSave,
  generateId,
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

  const handleSave = () => {
    onSave({ ...epc, steps });
  };

  return (
    <div className="space-y-4" data-testid="epc-steps-editor">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">EPC 步骤</h3>
        <Button type="button" size="sm" variant="outline" onClick={addStep}>
          <Plus className="h-4 w-4 mr-1" />
          添加步骤
        </Button>
      </div>

      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无步骤，点击「添加步骤」开始编辑。</p>
      ) : (
        <ul className="space-y-4">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="rounded-lg border p-4 space-y-3"
              data-testid={`epc-step-${step.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">步骤 {index + 1}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="删除步骤"
                  onClick={() => removeStep(step.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`step-name-${step.id}`}>步骤名称</Label>
                <Input
                  id={`step-name-${step.id}`}
                  value={step.name}
                  onChange={(e) => updateStep(step.id, { name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>挂接要素</Label>
                <ElementSelector
                  metaElements={metaElements}
                  value={step.elementRef}
                  generateId={generateId}
                  onChange={(ref) => updateStep(step.id, { elementRef: ref })}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" onClick={handleSave}>
        保存 EPC
      </Button>
    </div>
  );
}
