'use client';

import { useState, useMemo } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2, Users, ChevronRight, ChevronDown, Plus, Trash2, Edit3,
  Network, AlertTriangle, RefreshCw, History, Shield, ArrowUpRight,
} from 'lucide-react';
import type { Department, Position, PositionResponsibility } from '@/types/ontology';

function DepartmentNode({
  dept,
  positions,
  children,
  selectedDeptId,
  onSelect,
  onDelete,
}: {
  dept: Department;
  positions: Position[];
  children: React.ReactNode;
  selectedDeptId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const deptPositions = positions.filter((p) => p.departmentId === dept.id);

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer hover:bg-muted text-sm ${
          selectedDeptId === dept.id ? 'bg-muted font-medium' : ''
        }`}
        onClick={() => { setExpanded(!expanded); onSelect(dept.id); }}
      >
        {children ? (
          expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
        ) : (
          <span className="w-3" />
        )}
        <Building2 className="h-3 w-3 text-muted-foreground" />
        <span className="flex-1 truncate">{dept.name}</span>
        <Badge variant="secondary" className="text-[10px]">{deptPositions.length}</Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onDelete(dept.id); }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {expanded && children && <div className="ml-3">{children}</div>}
    </div>
  );
}

function AddDepartmentDialog({ parentId }: { parentId?: string }) {
  const addDepartment = useOntologyStore((s) => s.addDepartment);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState<Department['type']>('department');
  const [code, setCode] = useState('');

  const handleAdd = () => {
    if (!name || !nameEn) return;
    addDepartment({
      name, nameEn,
      code: code || undefined,
      type,
      parentId,
      status: 'active',
    });
    setOpen(false);
    setName(''); setNameEn(''); setCode('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-3 w-3" />部门
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>添加部门</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>名称 *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>英文名 *</Label><Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
          <div><Label>编码</Label><Input value={code} onChange={(e) => setCode(e.target.value)} /></div>
          <div>
            <Label>类型</Label>
            <Select value={type} onValueChange={(v) => setType(v as Department['type'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="headquarters">集团总部</SelectItem>
                <SelectItem value="division">事业部</SelectItem>
                <SelectItem value="department">部门</SelectItem>
                <SelectItem value="team">团队</SelectItem>
                <SelectItem value="group">班组</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!name || !nameEn}>添加</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddPositionDialog({ departmentId }: { departmentId: string }) {
  const addPosition = useOntologyStore((s) => s.addPosition);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [level, setLevel] = useState('');

  const handleAdd = () => {
    if (!name || !nameEn) return;
    addPosition({
      name, nameEn,
      departmentId,
      level: level ? Number(level) : undefined,
      roleIds: [],
      responsibilities: [],
      status: 'active',
    });
    setOpen(false);
    setName(''); setNameEn(''); setLevel('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-3 w-3" />岗位
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>添加岗位</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>名称 *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>英文名 *</Label><Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
          <div><Label>层级</Label><Input type="number" value={level} onChange={(e) => setLevel(e.target.value)} /></div>
          <Button onClick={handleAdd} disabled={!name || !nameEn}>添加</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OrganizationEditor() {
  const project = useOntologyStore((s) => s.project);
  const tree = useOntologyStore((s) => s.getDepartmentTree());
  const deleteDepartment = useOntologyStore((s) => s.deleteDepartment);
  const deletePosition = useOntologyStore((s) => s.deletePosition);
  const detectOverlap = useOntologyStore((s) => s.detectResponsibilityOverlap);
  const positions = project?.organizationModel?.positions || [];
  const lastSync = project?.organizationModel?.lastSyncResult;
  const syncConfig = project?.organizationModel?.syncConfig;

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [overlapResult, setOverlapResult] = useState<{ field: string; value1: string; value2: string }[]>([]);

  const selectedDept = useMemo(
    () => tree.flatMap((n) => [n, ...n.children]).find((n) => n.department.id === selectedDeptId),
    [tree, selectedDeptId],
  );

  const deptPositions = useMemo(
    () => positions.filter((p) => p.departmentId === selectedDeptId),
    [positions, selectedDeptId],
  );

  const renderTree = (nodes: typeof tree) => {
    return nodes.map((node) => (
      <DepartmentNode
        key={node.department.id}
        dept={node.department}
        positions={node.positions}
        selectedDeptId={selectedDeptId}
        onSelect={setSelectedDeptId}
        onDelete={deleteDepartment}
      >
        {renderTree(node.children)}
      </DepartmentNode>
    ));
  };

  const handleCheckOverlap = () => {
    if (!selectedDeptId) return;
    const posList = deptPositions;
    if (posList.length < 2) return;
    const results = detectOverlap(posList[0].id, posList[1].id);
    setOverlapResult(results);
  };

  if (!project?.organizationModel) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-2">🏢</div>
          <p>尚未配置组织体系模型</p>
          <p className="text-xs mt-1">添加部门开始构建组织架构</p>
          <AddDepartmentDialog />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left: Department Tree */}
      <Card className="w-64 flex-shrink-0">
        <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1">
            <Building2 className="h-4 w-4" />部门
          </CardTitle>
          <AddDepartmentDialog />
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="p-2">{renderTree(tree)}</div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: Position List + HR Sync */}
      <div className="flex-1 space-y-4">
        {selectedDept ? (
          <Card>
            <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                {selectedDept.department.name} — 岗位 ({deptPositions.length})
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleCheckOverlap}>
                  <AlertTriangle className="h-3 w-3" />重叠检测
                </Button>
                <AddPositionDialog departmentId={selectedDept.department.id} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[250px]">
                {deptPositions.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">该部门暂无岗位</p>
                ) : (
                  <div className="divide-y">
                    {deptPositions.map((pos) => (
                      <div key={pos.id} className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{pos.name}</span>
                          <span className="text-xs text-muted-foreground">({pos.nameEn})</span>
                          {pos.level && <Badge variant="secondary" className="text-[10px]">L{pos.level}</Badge>}
                          {pos.headcount && <Badge variant="outline" className="text-[10px]">编制:{pos.headcount}</Badge>}
                          <Badge variant={pos.status === 'active' ? 'default' : 'secondary'} className="text-[10px] ml-auto">
                            {pos.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deletePosition(pos.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {pos.responsibilities.length > 0 && (
                          <div className="ml-2 space-y-1">
                            {pos.responsibilities.map((resp) => (
                              <div key={resp.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[10px]">{resp.scope}</Badge>
                                <span>{resp.name}</span>
                                <Badge variant="secondary" className="text-[10px]">{resp.decisionAuthority}</Badge>
                                {resp.actions.length > 0 && (
                                  <span className="text-muted-foreground">({resp.actions.length} actions)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {pos.roleIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 ml-2">
                            {pos.roleIds.map((rid) => (
                              <Badge key={rid} variant="secondary" className="text-[10px]">
                                <Shield className="h-3 w-3 mr-0.5" />{rid}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>选择左侧部门查看岗位</p>
            </CardContent>
          </Card>
        )}

        {/* Overlap Results */}
        {overlapResult.length > 0 && (
          <Card className="border-yellow-200">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                职责重叠检测
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {overlapResult.map((r, i) => (
                <Alert key={i} variant="default" className="m-2 py-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                  <AlertDescription className="text-xs">
                    重叠字段: <Badge variant="outline" className="text-[10px]">{r.field}</Badge>
                    — 值: {r.value1} / {r.value2}
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}

        {/* HR Sync Panel */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              HR 同步
              {syncConfig?.enabled && (
                <Badge variant="default" className="text-[10px]">已启用</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 text-xs space-y-2">
            {syncConfig ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">来源:</span> {syncConfig.source}
                </div>
                <div>
                  <span className="text-muted-foreground">频率:</span> {syncConfig.syncInterval}
                </div>
                <div>
                  <span className="text-muted-foreground">策略:</span> {syncConfig.conflictStrategy}
                </div>
                <div>
                  <span className="text-muted-foreground">部门同步:</span>{' '}
                  {syncConfig.syncScope.syncDepartments ? '✅' : '❌'}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">未配置 HR 同步</p>
            )}

            {lastSync && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <div className="flex items-center gap-2">
                  <History className="h-3 w-3" />
                  <span>最近同步: {lastSync.triggeredAt?.slice(0, 16)}</span>
                  <Badge variant={lastSync.status === 'success' ? 'default' : 'destructive'} className="text-[10px]">
                    {lastSync.status}
                  </Badge>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1 text-muted-foreground">
                  <div>部门: +{lastSync.summary.departments.created}/~{lastSync.summary.departments.updated}/-{lastSync.summary.departments.deactivated}</div>
                  <div>岗位: +{lastSync.summary.positions.created}/~{lastSync.summary.positions.updated}/-{lastSync.summary.positions.deactivated}</div>
                </div>
                {lastSync.conflicts && lastSync.conflicts.length > 0 && (
                  <Badge variant="destructive" className="text-[10px] mt-1">
                    {lastSync.conflicts.length} 冲突
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
