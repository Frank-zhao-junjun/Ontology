'use client';

import { useEffect, useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import type { GovernanceAgentPolicy, GovernanceFieldPermission, GovernanceRole, DataMaskingPolicy, ComplianceRule } from '@/types/ontology';

const generateId = () => Math.random().toString(36).substring(2, 11);

export function GovernanceEditor() {
  const {
    project,
    ensureGovernanceModel,
    addGovernanceRole,
    deleteGovernanceRole,
    addFieldPermission,
    deleteFieldPermission,
    addAgentPolicy,
    deleteAgentPolicy,
    addDataMaskingPolicy,
    updateDataMaskingPolicy,
    deleteDataMaskingPolicy,
    addComplianceRule,
    updateComplianceRule,
    deleteComplianceRule,
  } = useOntologyStore();

  useEffect(() => {
    ensureGovernanceModel();
  }, [ensureGovernanceModel]);

  const governance = project?.governanceModel;
  const objectTypes = project?.dataModel?.entities ?? [];
  const actions = project?.behaviorModel?.actions ?? [];

  const [roleId, setRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [fpObjectTypeId, setFpObjectTypeId] = useState('');
  const [fpProperty, setFpProperty] = useState('');
  const [fpRoles, setFpRoles] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [policyRoleId, setPolicyRoleId] = useState('');

  // G03: DataMaskingPolicy states
  const [editingDmp, setEditingDmp] = useState<Partial<DataMaskingPolicy>>({});
  const [showDmpDialog, setShowDmpDialog] = useState(false);

  // G05: ComplianceRule states
  const [editingCr, setEditingCr] = useState<Partial<ComplianceRule>>({});
  const [showCrDialog, setShowCrDialog] = useState(false);

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

  const handleAddFieldPermission = () => {
    if (!fpObjectTypeId || !fpProperty.trim()) return;
    const permission: GovernanceFieldPermission = {
      objectTypeId: fpObjectTypeId,
      propertyNameEn: fpProperty.trim(),
      allowedRoleIds: fpRoles
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    addFieldPermission(permission);
    setFpProperty('');
    setFpRoles('');
  };

  const handleAddAgentPolicy = () => {
    if (!policyId.trim() || !policyRoleId) return;
    const policy: GovernanceAgentPolicy = {
      id: policyId.trim(),
      roleId: policyRoleId,
      defaultDeny: true,
      allowedActionIds: actions
        .map((a) => a.id)
        .filter((actionId): actionId is string => Boolean(actionId))
        .slice(0, 5),
    };
    addAgentPolicy(policy);
    setPolicyId('');
    setPolicyRoleId('');
  };

  const handleSaveDmp = () => {
    if (!editingDmp.name || !editingDmp.strategy || !editingDmp.fieldPaths?.length) return;
    const policy: DataMaskingPolicy = {
      id: editingDmp.id || generateId(),
      name: editingDmp.name,
      nameEn: editingDmp.nameEn,
      strategy: editingDmp.strategy as DataMaskingPolicy['strategy'],
      fieldPaths: editingDmp.fieldPaths,
      allowedRoleIds: editingDmp.allowedRoleIds || [],
      description: editingDmp.description,
    };
    if (editingDmp.id) {
      updateDataMaskingPolicy(editingDmp.id, policy);
    } else {
      addDataMaskingPolicy(policy);
    }
    setEditingDmp({});
    setShowDmpDialog(false);
  };

  const handleSaveCr = () => {
    if (!editingCr.name || !editingCr.standard || !editingCr.ruleRef) return;
    const rule: ComplianceRule = {
      id: editingCr.id || generateId(),
      name: editingCr.name,
      nameEn: editingCr.nameEn,
      standard: editingCr.standard as ComplianceRule['standard'],
      ruleRef: editingCr.ruleRef,
      affectedObjectTypeIds: editingCr.affectedObjectTypeIds || [],
      enforcement: editingCr.enforcement as ComplianceRule['enforcement'] || 'mandatory',
      description: editingCr.description,
    };
    if (editingCr.id) {
      updateComplianceRule(editingCr.id, rule);
    } else {
      addComplianceRule(rule);
    }
    setEditingCr({});
    setShowCrDialog(false);
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
          <ul className="space-y-2">
            {governance.roles.map((role) => (
              <li key={role.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>
                  <span className="font-mono">{role.id}</span> — {role.name}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => deleteGovernanceRole(role.id)}>
                  删除
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

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
              <Label>允许角色 ID（逗号分隔）</Label>
              <Input value={fpRoles} onChange={(e) => setFpRoles(e.target.value)} placeholder="role-planner,role-admin" />
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
          <Button type="button" size="sm" onClick={handleAddAgentPolicy} disabled={governance.roles.length === 0}>
            添加 Agent 策略（草稿）
          </Button>
          <ul className="space-y-2">
            {governance.agentPolicies.map((p) => (
              <li key={p.id} className="flex justify-between rounded-md border px-3 py-2 text-sm">
                <span className="font-mono">
                  {p.id} → role {p.roleId}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => deleteAgentPolicy(p.id)}>
                  删除
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* G03: 数据脱敏策略 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>数据脱敏策略 (dataMaskingPolicies)</CardTitle>
              <CardDescription>G03 — 定义敏感字段的脱敏方式和可访问角色</CardDescription>
            </div>
            <Dialog open={showDmpDialog} onOpenChange={setShowDmpDialog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setEditingDmp({ strategy: 'mask', fieldPaths: [], allowedRoleIds: [] })}>
                  + 添加脱敏策略
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDmp.id ? '编辑' : '新建'}脱敏策略</DialogTitle>
                  <DialogDescription>配置敏感字段的脱敏规则</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>策略名称</Label>
                      <Input value={editingDmp.name || ''} onChange={(e) => setEditingDmp({ ...editingDmp, name: e.target.value })} placeholder="手机号脱敏" />
                    </div>
                    <div className="space-y-2">
                      <Label>英文名称</Label>
                      <Input value={editingDmp.nameEn || ''} onChange={(e) => setEditingDmp({ ...editingDmp, nameEn: e.target.value })} placeholder="phone-masking" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>脱敏方式</Label>
                    <Select value={editingDmp.strategy || 'mask'} onValueChange={(v) => setEditingDmp({ ...editingDmp, strategy: v as DataMaskingPolicy['strategy'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mask">掩码（mask）— 部分遮蔽</SelectItem>
                        <SelectItem value="hash">哈希（hash）— 不可逆</SelectItem>
                        <SelectItem value="redact">删除（redact）— 完全遮蔽</SelectItem>
                        <SelectItem value="tokenize">令牌化（tokenize）— 可逆替换</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>字段路径（逗号分隔，如 user.phone,order.idCard）</Label>
                    <Input
                      value={(editingDmp.fieldPaths || []).join(', ')}
                      onChange={(e) => setEditingDmp({ ...editingDmp, fieldPaths: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                      placeholder="user.phone, customer.mobile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>可查看明文的角色 ID（逗号分隔）</Label>
                    <Input
                      value={(editingDmp.allowedRoleIds || []).join(', ')}
                      onChange={(e) => setEditingDmp({ ...editingDmp, allowedRoleIds: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                      placeholder="role-admin, role-compliance"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>描述</Label>
                    <Textarea value={editingDmp.description || ''} onChange={(e) => setEditingDmp({ ...editingDmp, description: e.target.value })} placeholder="脱敏策略说明" />
                  </div>
                  <Button onClick={handleSaveDmp} className="w-full">{editingDmp.id ? '更新策略' : '添加策略'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {(governance.dataMaskingPolicies || []).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">暂无脱敏策略</p>
          ) : (
            <div className="space-y-2">
              {(governance.dataMaskingPolicies || []).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <Badge variant="outline">{p.strategy}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{p.fieldPaths.join(', ')}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingDmp(p); setShowDmpDialog(true); }}>编辑</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteDataMaskingPolicy(p.id)}>删除</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* G05: 合规规则 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>合规规则 (complianceRules)</CardTitle>
              <CardDescription>G05 — 绑定国际/行业合规标准条款</CardDescription>
            </div>
            <Dialog open={showCrDialog} onOpenChange={setShowCrDialog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setEditingCr({ standard: 'GDPR', enforcement: 'mandatory', affectedObjectTypeIds: [] })}>
                  + 添加合规规则
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCr.id ? '编辑' : '新建'}合规规则</DialogTitle>
                  <DialogDescription>关联合规标准条款到业务对象</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>规则名称</Label>
                      <Input value={editingCr.name || ''} onChange={(e) => setEditingCr({ ...editingCr, name: e.target.value })} placeholder="数据删除权" />
                    </div>
                    <div className="space-y-2">
                      <Label>英文名称</Label>
                      <Input value={editingCr.nameEn || ''} onChange={(e) => setEditingCr({ ...editingCr, nameEn: e.target.value })} placeholder="right-to-erasure" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>合规标准</Label>
                      <Select value={editingCr.standard || 'GDPR'} onValueChange={(v) => setEditingCr({ ...editingCr, standard: v as ComplianceRule['standard'] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GDPR">GDPR</SelectItem>
                          <SelectItem value="HIPAA">HIPAA</SelectItem>
                          <SelectItem value="ISO27001">ISO 27001</SelectItem>
                          <SelectItem value="PCI-DSS">PCI-DSS</SelectItem>
                          <SelectItem value="GB/T35273">GB/T35273（个保法）</SelectItem>
                          <SelectItem value="custom">自定义</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>执行级别</Label>
                      <Select value={editingCr.enforcement || 'mandatory'} onValueChange={(v) => setEditingCr({ ...editingCr, enforcement: v as ComplianceRule['enforcement'] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mandatory">强制（mandatory）</SelectItem>
                          <SelectItem value="advisory">建议（advisory）</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>条款编号</Label>
                    <Input value={editingCr.ruleRef || ''} onChange={(e) => setEditingCr({ ...editingCr, ruleRef: e.target.value })} placeholder="GDPR Art.17" />
                  </div>
                  <div className="space-y-2">
                    <Label>适用对象类型 ID（逗号分隔）</Label>
                    <Input
                      value={(editingCr.affectedObjectTypeIds || []).join(', ')}
                      onChange={(e) => setEditingCr({ ...editingCr, affectedObjectTypeIds: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                      placeholder="user, order"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>描述</Label>
                    <Textarea value={editingCr.description || ''} onChange={(e) => setEditingCr({ ...editingCr, description: e.target.value })} placeholder="合规规则说明" />
                  </div>
                  <Button onClick={handleSaveCr} className="w-full">{editingCr.id ? '更新规则' : '添加规则'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {(governance.complianceRules || []).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">暂无合规规则</p>
          ) : (
            <div className="space-y-2">
              {(governance.complianceRules || []).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.name}</span>
                      <Badge variant="outline">{r.standard}</Badge>
                      <Badge variant={r.enforcement === 'mandatory' ? 'destructive' : 'secondary'}>
                        {r.enforcement === 'mandatory' ? '强制' : '建议'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{r.ruleRef} | 适用: {r.affectedObjectTypeIds.join(', ')}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingCr(r); setShowCrDialog(true); }}>编辑</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteComplianceRule(r.id)}>删除</Button>
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
