'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Pencil, Trash2, Search, Table2 } from 'lucide-react';
import type { MasterData, MasterDataRecord } from '@/types/ontology';
import { parseFieldNames, tryParseFieldNames } from '@/lib/masterdata/field-parser';
import { createEmptyMasterDataRecord, normalizeMasterDataRecord } from '@/lib/masterdata/record-factory';

// 业务领域分类
const DOMAIN_OPTIONS = [
  { value: '研发管理', label: '研发管理' },
  { value: '采购管理', label: '采购管理' },
  { value: '销售管理', label: '销售管理' },
  { value: '财务管理', label: '财务管理' },
  { value: '生产管理', label: '生产管理' },
  { value: '设备管理', label: '设备管理' },
  { value: '人力资源管理', label: '人力资源管理' },
];

const STATUS_OPTIONS = [
  { value: '00', label: '生效' },
  { value: '99', label: '失效' },
];

const generateId = () => Math.random().toString(36).substring(2, 10);

interface MasterDataManagerProps {
  onBack?: () => void;
}

export function MasterDataManager({ onBack }: MasterDataManagerProps) {
  const {
    masterDataList,
    masterDataRecords,
    setMasterDataList,
    setMasterDataRecords,
    addMasterData,
    updateMasterData,
    deleteMasterData,
    addMasterDataRecord,
    updateMasterDataRecord,
    deleteMasterDataRecord,
    toggleMasterDataRecordStatus,
  } = useOntologyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingData, setEditingData] = useState<Partial<MasterData>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MasterDataRecord | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  // 从Excel初始化主数据
  const handleInitFromExcel = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/masterdata/init');
      const result = await response.json();

      if (result.success && result.data) {
        if (Array.isArray(result.data)) {
          setMasterDataList(result.data);
          setMasterDataRecords(
            result.data.reduce((acc: Record<string, MasterDataRecord[]>, item: MasterData) => {
              acc[item.id] = [];
              return acc;
            }, {})
          );
        } else {
          setMasterDataList(result.data.definitions || []);
          setMasterDataRecords(result.data.records || {});
        }
      }
    } catch (error) {
      console.error('初始化主数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setMasterDataList, setMasterDataRecords]);

  // 初始化时加载主数据
  useEffect(() => {
    if (masterDataList.length === 0) {
      queueMicrotask(() => {
        void handleInitFromExcel();
      });
    }
  }, [handleInitFromExcel, masterDataList.length]);

  // 过滤主数据
  const filteredData = masterDataList.filter(m => {
    const matchesSearch = 
      m.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = domainFilter === 'all' || m.domain === domainFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesDomain && matchesStatus;
  });

  // 按领域分组
  const groupedData = filteredData.reduce((acc, item) => {
    const domain = item.domain || '未分类';
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push(item);
    return acc;
  }, {} as Record<string, MasterData[]>);

  const selectedMasterData = filteredData.find((item) => item.id === selectedDefinitionId) || filteredData[0] || null;
  const selectedFields = selectedMasterData ? tryParseFieldNames(selectedMasterData.fieldNames || '') : [];
  const selectedRecords = selectedMasterData
    ? (masterDataRecords[selectedMasterData.id] || []).map((record) => normalizeMasterDataRecord(record, selectedFields))
    : [];

  useEffect(() => {
    if (filteredData.length === 0) {
      queueMicrotask(() => setSelectedDefinitionId(null));
      return;
    }

    if (!selectedDefinitionId || !filteredData.some((item) => item.id === selectedDefinitionId)) {
      queueMicrotask(() => setSelectedDefinitionId(filteredData[0].id));
    }
  }, [filteredData, selectedDefinitionId]);

  // 打开新增对话框
  const handleAdd = () => {
    setEditingData({
      status: '00',
      coreData: '否',
    });
    setEditingId(null);
    setShowDialog(true);
  };

  // 打开编辑对话框
  const handleEdit = (data: MasterData) => {
    setEditingData({ ...data });
    setEditingId(data.id);
    setShowDialog(true);
  };

  // 保存主数据
  const handleSave = () => {
    if (!editingData.name || !editingData.nameEn) {
      return;
    }

    try {
      parseFieldNames(editingData.fieldNames || '');
    } catch (error) {
      console.error(error);
      return;
    }

    const now = new Date().toISOString();
    
    if (editingId) {
      // 更新
      updateMasterData(editingId, {
        ...editingData as MasterData,
        updatedAt: now,
      });
    } else {
      // 新增
      addMasterData({
        ...editingData as MasterData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      });
    }

    setShowDialog(false);
    setEditingData({});
    setEditingId(null);
  };

  // 切换状态
  const handleToggleStatus = (data: MasterData) => {
    const newStatus = data.status === '00' ? '99' : '00';
    updateMasterData(data.id, {
      ...data,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  // 确认删除
  const handleDelete = () => {
    if (deleteId) {
      deleteMasterData(deleteId);
      setDeleteId(null);
      setShowDeleteDialog(false);
    }
  };

  const handleOpenRecordDialog = () => {
    if (!selectedMasterData) {
      return;
    }

    try {
      const fields = parseFieldNames(selectedMasterData.fieldNames || '');
      setEditingRecord(createEmptyMasterDataRecord(selectedMasterData.id, fields));
      setEditingRecordId(null);
      setRecordError(null);
      setShowRecordDialog(true);
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : '字段清单不合法');
    }
  };

  const handleEditRecord = (record: MasterDataRecord) => {
    setEditingRecord(record);
    setEditingRecordId(record.id);
    setRecordError(null);
    setShowRecordDialog(true);
  };

  const handleSaveRecord = () => {
    if (!selectedMasterData || !editingRecord) {
      return;
    }

    const now = new Date().toISOString();
    const normalizedRecord: MasterDataRecord = {
      ...editingRecord,
      definitionId: selectedMasterData.id,
      updatedAt: now,
      createdAt: editingRecord.createdAt || now,
    };

    if (editingRecordId) {
      updateMasterDataRecord(selectedMasterData.id, editingRecordId, normalizedRecord);
    } else {
      addMasterDataRecord(selectedMasterData.id, normalizedRecord);
    }

    setShowRecordDialog(false);
    setEditingRecord(null);
    setEditingRecordId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
              <h1 className="text-xl font-bold">📚 主数据管理</h1>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              新增主数据
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索主数据..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="业务领域" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部领域</SelectItem>
                {DOMAIN_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="secondary">总计: {masterDataList.length}</Badge>
          <Badge variant="default" className="bg-green-500">生效: {masterDataList.filter(m => m.status === '00').length}</Badge>
          <Badge variant="outline">失效: {masterDataList.filter(m => m.status === '99').length}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="text-center py-8">加载中...</div>
        ) : filteredData.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-muted-foreground">暂无主数据</p>
              <p className="text-sm text-muted-foreground mt-2">点击上方按钮添加主数据</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedData).map(([domain, items]) => (
              <Card key={domain}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{domain}</CardTitle>
                    <Badge variant="outline">{items.length} 条</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">中文名称</TableHead>
                        <TableHead className="w-32">英文名称</TableHead>
                        <TableHead className="w-24">编码</TableHead>
                        <TableHead>字段名</TableHead>
                        <TableHead className="w-20">核心数据</TableHead>
                        <TableHead className="w-20">来源系统</TableHead>
                        <TableHead className="w-16">状态</TableHead>
                        <TableHead className="w-24">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-muted-foreground">{item.nameEn}</TableCell>
                          <TableCell>{item.code}</TableCell>
                          <TableCell className="max-w-xs truncate">{item.fieldNames}</TableCell>
                          <TableCell>
                            <Badge variant={item.coreData === '是' ? 'default' : 'outline'}>
                              {item.coreData || '否'}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.sourceSystem || '-'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={item.status === '00' ? 'default' : 'secondary'}
                              className={item.status === '00' ? 'bg-green-500' : ''}
                            >
                              {item.status === '00' ? '生效' : '失效'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              <Button
                                variant={selectedDefinitionId === item.id ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setSelectedDefinitionId(item.id)}
                                aria-label="查看数据表"
                              >
                                <Table2 className="w-4 h-4 mr-1" />
                                查看数据表
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(item)}
                              >
                                {item.status === '00' ? '禁用' : '启用'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => {
                                  setDeleteId(item.id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}

            {selectedMasterData && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">🧾 {selectedMasterData.name} 动态数据表</CardTitle>
                      <CardDescription>
                        按字段清单动态生成：{selectedMasterData.fieldNames || '未配置字段清单'}
                      </CardDescription>
                    </div>
                    <Button onClick={handleOpenRecordDialog}>新增记录</Button>
                  </div>
                  {recordError && <p className="text-sm text-destructive">{recordError}</p>}
                </CardHeader>
                <CardContent>
                  {selectedFields.length === 0 ? (
                    <div className="text-sm text-muted-foreground">当前字段清单为空或不合法，无法生成动态表。</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {selectedFields.map((field) => (
                            <TableHead key={field.key}>{field.label}</TableHead>
                          ))}
                          <TableHead className="w-20">记录状态</TableHead>
                          <TableHead className="w-32">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRecords.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={selectedFields.length + 2} className="text-center text-muted-foreground">
                              暂无记录，点击“新增记录”开始维护。
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedRecords.map((record) => (
                            <TableRow key={record.id}>
                              {selectedFields.map((field) => (
                                <TableCell key={`${record.id}-${field.key}`}>{record.values?.[field.key] || ''}</TableCell>
                              ))}
                              <TableCell>
                                <Badge variant={record.status === '00' ? 'default' : 'secondary'} className={record.status === '00' ? 'bg-green-500' : ''}>
                                  {record.status === '00' ? '生效' : '失效'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditRecord(record)}>
                                    编辑
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => toggleMasterDataRecordStatus(selectedMasterData.id, record.id)}>
                                    {record.status === '00' ? '禁用' : '启用'}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMasterDataRecord(selectedMasterData.id, record.id)}>
                                    删除
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑主数据' : '新增主数据'}</DialogTitle>
            <DialogDescription>
              主数据是业务领域中具有唯一性、稳定性和共享性的核心业务实体数据
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>业务领域 *</Label>
              <Select
                value={editingData.domain || ''}
                onValueChange={(v) => setEditingData({ ...editingData, domain: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择业务领域" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>中文名称 *</Label>
              <Input
                value={editingData.name || ''}
                onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                placeholder="如：客户主数据"
              />
            </div>
            <div className="space-y-2">
              <Label>英文名称 *</Label>
              <Input
                value={editingData.nameEn || ''}
                onChange={(e) => setEditingData({ ...editingData, nameEn: e.target.value })}
                placeholder="如：CustomerMaster"
              />
            </div>
            <div className="space-y-2">
              <Label>编码</Label>
              <Input
                value={editingData.code || ''}
                onChange={(e) => setEditingData({ ...editingData, code: e.target.value })}
                placeholder="主数据编码"
              />
            </div>
            <div className="space-y-2">
              <Label>核心主数据</Label>
              <Select
                value={editingData.coreData || '否'}
                onValueChange={(v) => setEditingData({ ...editingData, coreData: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="是">是</SelectItem>
                  <SelectItem value="否">否</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>来源系统</Label>
              <Input
                value={editingData.sourceSystem || ''}
                onChange={(e) => setEditingData({ ...editingData, sourceSystem: e.target.value })}
                placeholder="如：SAP、ERP"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>字段名</Label>
              <Input
                value={editingData.fieldNames || ''}
                onChange={(e) => setEditingData({ ...editingData, fieldNames: e.target.value })}
                placeholder="字段名列表，用逗号分隔"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>API URL</Label>
              <Input
                value={editingData.apiUrl || ''}
                onChange={(e) => setEditingData({ ...editingData, apiUrl: e.target.value })}
                placeholder="数据接口地址"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>备注/说明</Label>
              <Textarea
                value={editingData.description || ''}
                onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                placeholder="主数据说明"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dynamic Record Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRecordId ? '编辑记录' : '新增记录'}</DialogTitle>
            <DialogDescription>
              {selectedMasterData ? `维护 ${selectedMasterData.name} 的动态表记录` : '请先选择主数据定义'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {selectedFields.map((field) => (
              <div className="space-y-2" key={field.key}>
                <Label htmlFor={`record-${field.key}`}>{field.label}</Label>
                <Input
                  id={`record-${field.key}`}
                  value={editingRecord?.values?.[field.key] || ''}
                  onChange={(e) =>
                    setEditingRecord((current) =>
                      current
                        ? {
                            ...current,
                            values: {
                              ...current.values,
                              [field.key]: e.target.value,
                            },
                          }
                        : current
                    )
                  }
                  placeholder={`请输入${field.label}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordDialog(false)}>取消</Button>
            <Button onClick={handleSaveRecord}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除此主数据吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
