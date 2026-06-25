'use client';

import { useEffect, useState, useCallback } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  RefreshCw,
  Settings2,
  History,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Users,
} from 'lucide-react';
import type {
  HRSyncConfig,
  HRSyncSource,
  HRSyncInterval,
  HRConflictStrategy,
  HRSyncResult,
  HRSyncConflict,
  Department,
  Position,
} from '@/types/ontology';

const SOURCE_LABELS: Record<HRSyncSource, string> = {
  feishu: '飞书',
  dingtalk: '钉钉',
  wechat_work: '企业微信',
  sap: 'SAP HCM',
  workday: 'Workday',
  custom_api: '自定义 API',
};

const INTERVAL_LABELS: Record<HRSyncInterval, string> = {
  realtime: '实时（Webhook）',
  hourly: '每小时',
  daily: '每天',
  weekly: '每周',
  manual: '仅手动触发',
};

const STRATEGY_LABELS: Record<HRConflictStrategy, string> = {
  hr_wins: 'HR 优先（覆盖本地）',
  local_wins: '本地优先（保留修改）',
  merge: '合并（填充空字段）',
  manual: '人工审核',
};

const SOURCE_OPTIONS = Object.entries(SOURCE_LABELS) as [HRSyncSource, string][];
const INTERVAL_OPTIONS = Object.entries(INTERVAL_LABELS) as [HRSyncInterval, string][];
const STRATEGY_OPTIONS = Object.entries(STRATEGY_LABELS) as [HRConflictStrategy, string][];

function defaultConfig(): HRSyncConfig {
  return {
    enabled: false,
    source: 'feishu',
    endpoint: '',
    syncInterval: 'manual',
    fieldMapping: {
      department: {
        name: 'department_name',
        nameEn: 'department_name_en',
        code: 'department_code',
        parentId: 'parent_department_code',
        type: 'department_type',
        managerId: 'manager_id',
        status: 'status',
      },
      position: {
        name: 'position_name',
        nameEn: 'position_name_en',
        code: 'position_code',
        departmentCode: 'department_code',
        parentCode: 'parent_position_code',
        level: 'position_level',
        headcount: 'headcount',
        status: 'status',
      },
    },
    conflictStrategy: 'manual',
    syncScope: {
      syncDepartments: true,
      syncPositions: true,
      syncResponsibilities: false,
      includeInactive: false,
    },
  };
}

export function HRSyncManager() {
  const project = useOntologyStore((s) => s.project);

  const [config, setConfig] = useState<HRSyncConfig>(defaultConfig());
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [history, setHistory] = useState<HRSyncResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [conflicts, setConflicts] = useState<HRSyncConflict[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const departments: Department[] = project?.organizationModel?.departments ?? [];
  const positions: Position[] = project?.organizationModel?.positions ?? [];

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/hr-sync/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else if (res.status === 404) {
        // Not configured yet, use defaults
      }
    } catch {
      // Network error, keep current config
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/hr-sync/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadHistory();
  }, [loadConfig, loadHistory]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/hr-sync/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast.success('同步配置已保存');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || '保存配置失败');
      }
    } catch {
      toast.error('网络错误，保存配置失败');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTriggerSync = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/hr-sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, departments, positions }),
      });
      if (res.ok) {
        const result: HRSyncResult = await res.json();
        toast.success(`同步完成：部门 ${result.summary.departments.total} 个，岗位 ${result.summary.positions.total} 个`);
        // Push to history
        setHistory((prev) => [result, ...prev]);
        // Collect conflicts
        if (result.conflicts && result.conflicts.length > 0) {
          setConflicts((prev) => [...prev, ...result.conflicts!]);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || '触发同步失败');
      }
    } catch {
      toast.error('网络错误，触发同步失败');
    } finally {
      setTriggering(false);
    }
  };

  const handleResolveConflict = async (conflict: HRSyncConflict, resolution: 'hr_wins' | 'local_wins' | 'merged') => {
    setResolvingId(conflict.externalId + conflict.field);
    try {
      const res = await fetch('/api/hr-sync/resolve-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflict, resolution }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || '冲突已解决');
        setConflicts((prev) => prev.filter((c) => !(c.externalId === conflict.externalId && c.field === conflict.field)));
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || '解决冲突失败');
      }
    } catch {
      toast.error('网络错误，解决冲突失败');
    } finally {
      setResolvingId(null);
    }
  };

  const updateField = <K extends keyof HRSyncConfig>(key: K, value: HRSyncConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateFieldMapping = (
    target: 'department' | 'position',
    field: string,
    value: string,
  ) => {
    setConfig((prev) => ({
      ...prev,
      fieldMapping: {
        ...prev.fieldMapping,
        [target]: {
          ...prev.fieldMapping[target],
          [field]: value,
        },
      },
    }));
  };

  const updateSyncScope = (field: keyof HRSyncConfig['syncScope'], value: boolean) => {
    setConfig((prev) => ({
      ...prev,
      syncScope: {
        ...prev.syncScope,
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            HR 系统同步
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            从 HR 系统同步部门与岗位数据到本体模型
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { loadConfig(); loadHistory(); }}
            disabled={loadingConfig || loadingHistory}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingConfig || loadingHistory ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button
            size="sm"
            onClick={handleTriggerSync}
            disabled={triggering}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${triggering ? 'animate-spin' : ''}`} />
            立即同步
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">本地部门</p>
              <p className="text-lg font-semibold tabular-nums">{departments.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">本地岗位</p>
              <p className="text-lg font-semibold tabular-nums">{positions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">同步次数</p>
              <p className="text-lg font-semibold tabular-nums">{history.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">待处理冲突</p>
              <p className="text-lg font-semibold tabular-nums text-destructive">{conflicts.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="w-4 h-4" />
                同步配置
              </CardTitle>
              <CardDescription className="mt-1">配置 HR 系统来源、字段映射和冲突策略</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sync-enabled" className="text-sm text-muted-foreground">启用自动同步</Label>
              <Switch
                id="sync-enabled"
                checked={config.enabled}
                onCheckedChange={(v) => updateField('enabled', v)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Source & interval */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">HR 系统来源</Label>
              <Select
                value={config.source}
                onValueChange={(v) => updateField('source', v as HRSyncSource)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">同步频率</Label>
              <Select
                value={config.syncInterval}
                onValueChange={(v) => updateField('syncInterval', v as HRSyncInterval)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">冲突策略</Label>
              <Select
                value={config.conflictStrategy}
                onValueChange={(v) => updateField('conflictStrategy', v as HRConflictStrategy)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGY_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Endpoint */}
          <div className="space-y-1.5">
            <Label className="text-xs">API 端点（可选）</Label>
            <Input
              className="h-9"
              placeholder="https://open.feishu.cn/open-apis/contact/v3/departments"
              value={config.endpoint || ''}
              onChange={(e) => updateField('endpoint', e.target.value)}
            />
          </div>

          {/* Sync scope */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">同步范围</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sync-dept"
                  checked={config.syncScope.syncDepartments}
                  onCheckedChange={(v) => updateSyncScope('syncDepartments', !!v)}
                />
                <Label htmlFor="sync-dept" className="text-sm cursor-pointer">同步部门</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sync-pos"
                  checked={config.syncScope.syncPositions}
                  onCheckedChange={(v) => updateSyncScope('syncPositions', !!v)}
                />
                <Label htmlFor="sync-pos" className="text-sm cursor-pointer">同步岗位</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sync-resp"
                  checked={config.syncScope.syncResponsibilities}
                  onCheckedChange={(v) => updateSyncScope('syncResponsibilities', !!v)}
                />
                <Label htmlFor="sync-resp" className="text-sm cursor-pointer">同步职责</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sync-inactive"
                  checked={config.syncScope.includeInactive}
                  onCheckedChange={(v) => updateSyncScope('includeInactive', !!v)}
                />
                <Label htmlFor="sync-inactive" className="text-sm cursor-pointer">包含已停用</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Field mapping */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">字段映射 — 部门</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                ['name', '部门名称'],
                ['nameEn', '英文名称'],
                ['code', '部门编码'],
                ['parentId', '上级部门'],
                ['type', '部门类型'],
                ['managerId', '负责人'],
                ['status', '状态'],
              ] as const).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <Input
                    className="h-8 text-xs"
                    value={config.fieldMapping.department[field] || ''}
                    onChange={(e) => updateFieldMapping('department', field, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium">字段映射 — 岗位</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                ['name', '岗位名称'],
                ['nameEn', '英文名称'],
                ['code', '岗位编码'],
                ['departmentCode', '所属部门编码'],
                ['parentCode', '上级岗位'],
                ['level', '岗位层级'],
                ['headcount', '编制人数'],
                ['status', '状态'],
              ] as const).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <Input
                    className="h-8 text-xs"
                    value={config.fieldMapping.position[field] || ''}
                    onChange={(e) => updateFieldMapping('position', field, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={handleSaveConfig} disabled={savingConfig}>
              {savingConfig ? '保存中...' : '保存配置'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="w-4 h-4 text-destructive" />
              冲突待处理
              <Badge variant="destructive" className="ml-1">{conflicts.length}</Badge>
            </CardTitle>
            <CardDescription>以下数据在本地和 HR 系统中存在差异，请选择处理方式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {conflicts.map((conflict, idx) => (
              <div key={idx} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {conflict.type === 'department' ? '部门' : '岗位'}
                    </Badge>
                    <span className="text-sm font-medium">{conflict.field}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>HR ID: {conflict.externalId}</span>
                    <span>·</span>
                    <span>本地 ID: {conflict.localId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">HR 值</span>
                    <p className="font-medium truncate">{conflict.hrValue}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">本地值</span>
                    <p className="font-medium truncate">{conflict.localValue}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolvingId === conflict.externalId + conflict.field}
                    onClick={() => handleResolveConflict(conflict, 'hr_wins')}
                  >
                    采用 HR 值
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolvingId === conflict.externalId + conflict.field}
                    onClick={() => handleResolveConflict(conflict, 'local_wins')}
                  >
                    保留本地值
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolvingId === conflict.externalId + conflict.field}
                    onClick={() => handleResolveConflict(conflict, 'merged')}
                  >
                    合并
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sync History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="w-4 h-4" />
                同步历史
              </CardTitle>
              <CardDescription className="mt-1">最近 {history.length} 条同步记录</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={loadHistory} disabled={loadingHistory}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loadingHistory ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              暂无同步记录，点击「立即同步」开始
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record) => (
                <div key={record.syncId} className="border rounded-md p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {record.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      {record.status === 'partial' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                      {record.status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                      <span className="text-sm font-medium">{SOURCE_LABELS[record.source] || record.source}</span>
                      <Badge variant="outline" className="text-xs">
                        {record.status === 'success' ? '成功' : record.status === 'partial' ? '部分成功' : '失败'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(record.triggeredAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      部门: <span className="font-medium text-foreground">{record.summary.departments.total}</span>
                      <span className="text-green-600 ml-1">+{record.summary.departments.created}</span>
                      {record.summary.departments.updated > 0 && (
                        <span className="text-amber-600 ml-1">~{record.summary.departments.updated}</span>
                      )}
                    </span>
                    <span>
                      岗位: <span className="font-medium text-foreground">{record.summary.positions.total}</span>
                      <span className="text-green-600 ml-1">+{record.summary.positions.created}</span>
                      {record.summary.positions.updated > 0 && (
                        <span className="text-amber-600 ml-1">~{record.summary.positions.updated}</span>
                      )}
                    </span>
                    {record.conflicts && record.conflicts.length > 0 && (
                      <span className="text-destructive">冲突 {record.conflicts.length}</span>
                    )}
                    {record.errors && record.errors.length > 0 && (
                      <span className="text-destructive">错误 {record.errors.length}</span>
                    )}
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
