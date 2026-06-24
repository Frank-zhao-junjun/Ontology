'use client';

import { useEffect, useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { GovernanceAgentPolicy, GovernanceFieldPermission, GovernanceRole, GovernanceRolePermission } from '@/types/ontology';

const PERMISSION_OPS = ['READ', 'WRITE', 'EXECUTE', 'DELETE'] as const;

export function GovernanceEditor() {
  const {
    project,
    ensureGovernanceModel,
    addGovernanceRole,
    updateGovernanceRole,
    deleteGovernanceRole,
    addFieldPermission,
    deleteFieldPermission,
    addAgentPolicy,
    updateAgentPolicy,
    deleteAgentPolicy,
  } = useOntologyStore();

  useEffect(() => {
    ensureGovernanceModel();
  }, [ensureGovernanceModel]);

  const governance = project?.governanceModel;
  const objectTypes = project?.dataModel?.entities ?? [];
  const actions = project?.behaviorModel?.actions ?? [];

  const [roleId, setRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [editingRolePerms, setEditingRolePerms] = useState<string | null>(null);
  const [permObjectTypeId, setPermObjectTypeId] = useState('');
  const [permOps, setPermOps] = useState<Set<string>>(new Set());
  const [permDenyActionIds, setPermDenyActionIds] = useState('');

  const [fpObjectTypeId, setFpObjectTypeId] = useState('');
  const [fpProperty, setFpProperty] = useState('');
  const [fpSelectedRoles, setFpSelectedRoles] = useState<Set<string>>(new Set());

  const [policyId, setPolicyId] = useState('');
  const [policyRoleId, setPolicyRoleId] = useState('');
  const [policyManifestVersion, setPolicyManifestVersion] = useState('');
  const [policyMcpTools, setPolicyMcpTools] = useState('');
  const [policyAggregateRootIds, setPolicyAggregateRootIds] = useState('');

  const handleAddRole = () => {
    if (!roleId.trim() || !roleName.trim()) return;
    const role: GovernanceRole = {
      id: roleId.trim(),
      name: roleName.trim(),
      permissions: [],
    };
    addGovernanceRole(role);
    setRoleId('');
    setRoleName('');
  };

  const handleTogglePermOp = (op: string) => {
    setPermOps((prev) => {
      const next = new Set(prev);
      if (next.has(op)) next.delete(op);
      else next.add(op);
      return next;
    });
  };

  const handleAddRolePermission = () => {
    if (!editingRolePerms || !permObjectTypeId || permOps.size === 0) return;
    const role = governance?.roles.find((r) => r.id === editingRolePerms);
    if (!role) return;
    const newPerm: GovernanceRolePermission = {
      objectTypeId: permObjectTypeId,
      ops: Array.from(permOps) as Array<'READ' | 'WRITE' | 'EXECUTE' | 'DELETE'>,
      denyActionIds: permDenyActionIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    updateGovernanceRole(role.id, { ...role, permissions: [...role.permissions, newPerm] });
    setPermObjectTypeId('');
    setPermOps(new Set());
    setPermDenyActionIds('');
  };

  const handleRemoveRolePermission = (roleIdx: number, permIdx: number) => {
    const role = governance?.roles[roleIdx];
    if (!role) return;
    const updatedPerms = role.permissions.filter((_, i) => i !== permIdx);
    updateGovernanceRole(role.id, { ...role, permissions: updatedPerms });
  };

  const handleToggleFpRole = (roleId: string) => {
    setFpSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleAddFieldPermission = () => {
    if (!fpObjectTypeId || !fpProperty.trim()) return;
    const permission: GovernanceFieldPermission = {
      objectTypeId: fpObjectTypeId,
      propertyNameEn: fpProperty.trim(),
      allowedRoleIds: Array.from(fpSelectedRoles),
    };
    addFieldPermission(permission);
    setFpProperty('');
    setFpSelectedRoles(new Set());
  };

  const handleAddAgentPolicy = () => {
    if (!policyId.trim() || !policyRoleId) return;
    const aggregateRoots = objectTypes.filter((e) => e.entityRole === 'aggregate_root' || e.isAggregateRoot);
    const policy: GovernanceAgentPolicy = {
      id: policyId.trim(),
      roleId: policyRoleId,
      defaultDeny: true,
      manifestVersion: policyManifestVersion.trim() || undefined,
      allowedMcpTools: policyMcpTools
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      allowedAggregateRootIds: policyAggregateRootIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      allowedActionIds: actions
        .map((a) => a.id)
        .filter((actionId): actionId is string => Boolean(actionId))
        .slice(0, 5),
    };
    addAgentPolicy(policy);
    setPolicyId('');
    setPolicyRoleId('');
    setPolicyManifestVersion('');
    setPolicyMcpTools('');
    setPolicyAggregateRootIds('');
  };

  if (!governance) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Alert>
        <AlertDescription>
          治理层对应 Manifest <code className="text-xs">spec.governance</code>。导出前由校验器检查结构；Agent
          策略不包含明文密钥。
        </AlertDescription>
      </Alert>

      {/* 角色管理 */}
      <Card>
        <CardHeader>
          <CardTitle>角色 (roles)</CardTitle>
          <CardDescription>平台权限角色，可关联对象类型操作</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>角色 ID</Label>
              <Input value={roleId} onChange={(e) => setRoleId(e.target.value)} placeholder="role-planner" />
            </div>
            <div className="space-y-2">
              <Label>名称</Label>
              <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="生产计划员" />
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddRole}>
            添加角色
          </Button>
          <ul className="space-y-3">
            {governance.roles.map((role, roleIdx) => (
              <li key={role.id} className="rounded-md border px-3 py-2 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span>
                    <span className="font-mono">{role.id}</span> — {role.name}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRolePerms(editingRolePerms === role.id ? null : role.id)}
                    >
                      {editingRolePerms === role.id ? '收起权限' : '编辑权限'}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => deleteGovernanceRole(role.id)}>
                      删除
                    </Button>
                  </div>
                </div>
                {/* 权限列表 */}
                {role.permissions.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {role.permissions.map((perm, permIdx) => (
                      <div key={permIdx} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-muted-foreground">{perm.objectTypeId}</span>
                        <span className="text-blue-600">[{perm.ops.join(', ')}]</span>
                        {perm.denyActionIds && perm.denyActionIds.length > 0 && (
                          <span className="text-red-500">deny: [{perm.denyActionIds.join(', ')}]</span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 text-xs text-red-500"
                          onClick={() => handleRemoveRolePermission(roleIdx, permIdx)}
                        >
                          移除
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {/* 权限编辑器 */}
                {editingRolePerms === role.id && (
                  <div className="ml-4 border rounded-md p-3 space-y-2 bg-muted/30">
                    <div className="space-y-2">
                      <Label>对象类型</Label>
                      <Select value={permObjectTypeId} onValueChange={setPermObjectTypeId}>
                        <SelectTrigger><SelectValue placeholder="选择实体" /></SelectTrigger>
                        <SelectContent>
                          {objectTypes.map((e) => (
                            <SelectItem key={e.id} value={e.id}>{e.name} ({e.id})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>操作权限</Label>
                      <div className="flex gap-3">
                        {PERMISSION_OPS.map((op) => (
                          <label key={op} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={permOps.has(op)}
                              onChange={() => handleTogglePermOp(op)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs">{op}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>禁止动作 ID（逗号分隔）</Label>
                      <Input
                        value={permDenyActionIds}
                        onChange={(e) => setPermDenyActionIds(e.target.value)}
                        placeholder="action-xxx,action-yyy"
                      />
                    </div>
                    <Button type="button" size="sm" onClick={handleAddRolePermission} disabled={!permObjectTypeId || permOps.size === 0}>
                      添加权限条目
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 字段权限 */}
      <Card>
        <CardHeader>
          <CardTitle>字段权限 (fieldPermissions)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>对象类型</Label>
              <Select value={fpObjectTypeId} onValueChange={setFpObjectTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择实体" />
                </SelectTrigger>
                <SelectContent>
                  {objectTypes.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>属性 nameEn</Label>
              <Input value={fpProperty} onChange={(e) => setFpProperty(e.target.value)} placeholder="cost_price" />
            </div>
            <div className="space-y-2">
              <Label>允许角色</Label>
              {governance.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2 border rounded-md p-2 min-h-[38px]">
                  {governance.roles.map((r) => (
                    <label key={r.id} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={fpSelectedRoles.has(r.id)}
                        onChange={() => handleToggleFpRole(r.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-xs">{r.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">请先创建角色</p>
              )}
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddFieldPermission}>
            添加字段权限
          </Button>
          <ul className="space-y-2">
            {governance.fieldPermissions.map((fp, index) => (
              <li key={`${fp.objectTypeId}-${fp.propertyNameEn}-${index}`} className="flex justify-between rounded-md border px-3 py-2 text-sm">
                <span className="font-mono">
                  {fp.objectTypeId}.{fp.propertyNameEn} ← [{fp.allowedRoleIds.join(', ')}]
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => deleteFieldPermission(index)}>
                  删除
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Agent 策略 */}
      <Card>
        <CardHeader>
          <CardTitle>Agent 策略 (agentPolicies)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>策略 ID</Label>
              <Input
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                placeholder="sandbox-prod-planner"
              />
            </div>
            <div className="space-y-2">
              <Label>绑定角色</Label>
              <Select value={policyRoleId} onValueChange={setPolicyRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {governance.roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Manifest 版本</Label>
              <Input
                value={policyManifestVersion}
                onChange={(e) => setPolicyManifestVersion(e.target.value)}
                placeholder="1.0.0"
              />
            </div>
            <div className="space-y-2">
              <Label>允许 MCP 工具（逗号分隔）</Label>
              <Input
                value={policyMcpTools}
                onChange={(e) => setPolicyMcpTools(e.target.value)}
                placeholder="query_data,create_order"
              />
            </div>
            <div className="space-y-2">
              <Label>允许聚合根 ID（逗号分隔）</Label>
              <Input
                value={policyAggregateRootIds}
                onChange={(e) => setPolicyAggregateRootIds(e.target.value)}
                placeholder="material,production_order"
              />
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddAgentPolicy} disabled={governance.roles.length === 0}>
            添加 Agent 策略（草稿）
          </Button>
          <ul className="space-y-2">
            {governance.agentPolicies.map((p) => (
              <li key={p.id} className="flex justify-between rounded-md border px-3 py-2 text-sm">
                <span className="font-mono">
                  {p.id} → role {p.roleId}
                  {p.manifestVersion && <span className="text-muted-foreground ml-2">v{p.manifestVersion}</span>}
                  {p.allowedMcpTools && p.allowedMcpTools.length > 0 && (
                    <span className="text-blue-600 ml-2">mcp:[{p.allowedMcpTools.join(', ')}]</span>
                  )}
                  {p.allowedAggregateRootIds && p.allowedAggregateRootIds.length > 0 && (
                    <span className="text-green-600 ml-2">roots:[{p.allowedAggregateRootIds.join(', ')}]</span>
                  )}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => deleteAgentPolicy(p.id)}>
                  删除
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
