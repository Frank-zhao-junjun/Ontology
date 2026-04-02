'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Metadata } from '@/types/ontology';

const ATTRIBUTE_TYPES = [
  { value: 'string', label: '字符串 (String)' },
  { value: 'text', label: '长文本 (Text)' },
  { value: 'integer', label: '整数 (Integer)' },
  { value: 'decimal', label: '小数 (Decimal)' },
  { value: 'boolean', label: '布尔 (Boolean)' },
  { value: 'date', label: '日期 (Date)' },
  { value: 'datetime', label: '日期时间 (DateTime)' },
  { value: 'enum', label: '枚举 (Enum)' },
  { value: 'reference', label: '引用 (Reference)' },
];

const generateId = () => Math.random().toString(36).substring(2, 10);

export function MetadataManager() {
  const { metadataList, setMetadataList, addMetadata, updateMetadata, deleteMetadata } = useOntologyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState<Partial<Metadata>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 从Excel初始化元数据
  const handleInitFromExcel = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/metadata/init');
      const result = await response.json();

      if (result.success && result.data) {
        setMetadataList(result.data);
      }
    } catch (error) {
      console.error('初始化元数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setMetadataList]);

  // 初始化时加载元数据
  useEffect(() => {
    // 如果没有数据，或者数据中没有domain字段（旧数据），则重新加载
    if (metadataList.length === 0 || !metadataList[0]?.domain) {
      void handleInitFromExcel();
    }
  }, [handleInitFromExcel, metadataList]);

  // 过滤元数据
  const filteredMetadata = metadataList.filter(m => 
    m.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 打开新增对话框
  const handleAdd = () => {
    setEditingMetadata({
      type: 'string',
    });
    setEditingId(null);
    setShowDialog(true);
  };

  // 打开编辑对话框
  const handleEdit = (metadata: Metadata) => {
    setEditingMetadata({ ...metadata });
    setEditingId(metadata.id);
    setShowDialog(true);
  };

  // 保存元数据
  const handleSave = () => {
    if (!editingMetadata.name || !editingMetadata.nameEn) {
      return;
    }

    if (editingId) {
      // 更新
      updateMetadata(editingId, {
        ...editingMetadata as Metadata,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // 新增
      addMetadata({
        id: generateId(),
        domain: editingMetadata.domain || '',
        name: editingMetadata.name,
        nameEn: editingMetadata.nameEn,
        description: editingMetadata.description || '',
        type: editingMetadata.type || 'string',
        valueRange: editingMetadata.valueRange || '',
        standard: editingMetadata.standard || '',
        source: editingMetadata.source || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setShowDialog(false);
    setEditingMetadata({});
    setEditingId(null);
  };

  // 删除确认
  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteMetadata(deleteId);
      setDeleteId(null);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📚 元数据管理
              <Badge variant="outline">{metadataList.length} 条</Badge>
            </CardTitle>
            <CardDescription>
              管理全局元数据，AI生成属性时优先从元数据匹配
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleInitFromExcel} disabled={isLoading}>
              {isLoading ? '加载中...' : '🔄 从Excel重载'}
            </Button>
            <Button onClick={handleAdd}>
              + 新增元数据
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="p-4 border-b">
        <Input
          placeholder="搜索元数据（名称、英文名、描述）..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          {filteredMetadata.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  正在从Excel加载元数据...
                </div>
              ) : (
                <>
                  <div className="text-3xl mb-2">📭</div>
                  <p>暂无元数据</p>
                  <Button onClick={handleInitFromExcel} className="mt-4" variant="outline">
                    从Excel初始化
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">领域</TableHead>
                  <TableHead className="w-[130px]">中文名称</TableHead>
                  <TableHead className="w-[110px]">英文名称</TableHead>
                  <TableHead className="w-[70px]">类型</TableHead>
                  <TableHead className="flex-1">业务含义</TableHead>
                  <TableHead className="w-[120px]">值范围</TableHead>
                  <TableHead className="w-[90px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMetadata.map((metadata) => (
                  <TableRow key={metadata.id}>
                    <TableCell>
                      <Badge variant="secondary">{metadata.domain || '-'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{metadata.name}</TableCell>
                    <TableCell className="text-muted-foreground">{metadata.nameEn}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{metadata.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={metadata.description}>
                      {metadata.description}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={metadata.valueRange}>
                      {metadata.valueRange}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(metadata)}
                        >
                          编辑
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            setDeleteId(metadata.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>

      {/* 新增/编辑对话框 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑元数据' : '新增元数据'}</DialogTitle>
            <DialogDescription>
              元数据是全局的，不属于任何项目或实体
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>领域</Label>
                <Input
                  value={editingMetadata.domain || ''}
                  onChange={(e) => setEditingMetadata({ ...editingMetadata, domain: e.target.value })}
                  placeholder="如：财务、物料"
                />
              </div>
              <div className="space-y-2">
                <Label>中文名称 *</Label>
                <Input
                  value={editingMetadata.name || ''}
                  onChange={(e) => setEditingMetadata({ ...editingMetadata, name: e.target.value })}
                  placeholder="如：物料编码"
                />
              </div>
              <div className="space-y-2">
                <Label>英文名称 *</Label>
                <Input
                  value={editingMetadata.nameEn || ''}
                  onChange={(e) => setEditingMetadata({ ...editingMetadata, nameEn: e.target.value })}
                  placeholder="如：MATERIAL_ID"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>字段类型</Label>
              <Select
                value={editingMetadata.type || 'string'}
                onValueChange={(value) => setEditingMetadata({ ...editingMetadata, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTRIBUTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>业务含义</Label>
              <Textarea
                value={editingMetadata.description || ''}
                onChange={(e) => setEditingMetadata({ ...editingMetadata, description: e.target.value })}
                placeholder="字段的业务含义说明"
              />
            </div>
            <div className="space-y-2">
              <Label>值范围</Label>
              <Input
                value={editingMetadata.valueRange || ''}
                onChange={(e) => setEditingMetadata({ ...editingMetadata, valueRange: e.target.value })}
                placeholder="如：长度1-100字符"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>参考标准</Label>
                <Input
                  value={editingMetadata.standard || ''}
                  onChange={(e) => setEditingMetadata({ ...editingMetadata, standard: e.target.value })}
                  placeholder="如：GB/T 44063"
                />
              </div>
              <div className="space-y-2">
                <Label>信息源头</Label>
                <Input
                  value={editingMetadata.source || ''}
                  onChange={(e) => setEditingMetadata({ ...editingMetadata, source: e.target.value })}
                  placeholder="如：PLM/ERP"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!editingMetadata.name || !editingMetadata.nameEn}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除此元数据吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
