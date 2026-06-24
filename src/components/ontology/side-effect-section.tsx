'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import type { SideEffect } from '@/types/ontology';

interface SideEffectSectionProps {
  sideEffects: SideEffect[];
  onChange: (sideEffects: SideEffect[]) => void;
}

export function SideEffectSection({ sideEffects, onChange }: SideEffectSectionProps) {
  const [editing, setEditing] = useState<SideEffect | null>(null);
  
  const handleSave = () => {
    if (!editing) return;
    if (editing.id && sideEffects.some(se => se.id === editing.id)) {
      onChange(sideEffects.map(se => se.id === editing.id ? editing : se));
    } else {
      onChange([...sideEffects, editing]);
    }
    setEditing(null);
  };
  
  const handleAdd = () => {
    setEditing({
      id: crypto.randomUUID(),
      type: 'notification',
      description: '',
      async: true,
    });
  };
  
  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">副作用 (Side Effects)</Label>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="h-3 w-3 mr-1" /> 添加
        </Button>
      </div>
      
      {sideEffects.map(se => (
        <Card key={se.id} className="p-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{se.type}</Badge>
              <span className="text-sm">{se.description || '(无描述)'}</span>
              {se.async && <Badge variant="outline" className="text-xs">异步</Badge>}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing({...se})}>编辑</Button>
              <Button size="sm" variant="ghost" onClick={() => onChange(sideEffects.filter(s => s.id !== se.id))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      
      {sideEffects.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-2">
          暂无副作用。点击&ldquo;添加&rdquo;定义非阻塞操作（通知、同步、日志等）
        </div>
      )}
      
      {/* Inline edit form */}
      {editing && (
        <Card className="p-4 space-y-3 border-blue-200 bg-blue-50/50">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">类型</Label>
              <Select value={editing.type} onValueChange={(v) => setEditing({...editing, type: v as SideEffect['type']})}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">通知</SelectItem>
                  <SelectItem value="sync">同步</SelectItem>
                  <SelectItem value="log">日志</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">描述</Label>
              <Input value={editing.description || ''} onChange={(e) => setEditing({...editing, description: e.target.value})} className="h-8" placeholder="副作用描述" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={editing.async} onChange={(e) => setEditing({...editing, async: e.target.checked})} />
              异步执行
            </label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>保存</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(null)}>取消</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
