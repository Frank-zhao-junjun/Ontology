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
import { Pencil, Trash2 } from 'lucide-react';
import { getAggregateRootEntities, normalizeEntityRoleFields, resolveEntityRole } from '@/lib/entity-role';
import type { Entity, Attribute, Relation, Metadata } from '@/types/ontology';

interface DataModelEditorProps {
  mode?: 'full' | 'entity-detail' | 'button-only';
  entityId?: string;
}

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

const RELATION_TYPES = [
  { value: 'one_to_one', label: '一对一 (1:1)' },
  { value: 'one_to_many', label: '一对多 (1:N)' },
  { value: 'many_to_many', label: '多对多 (N:M)' },
];

const generateId = () => Math.random().toString(36).substring(2, 10);

export function DataModelEditor({ mode = 'full', entityId }: DataModelEditorProps) {
  const { project, addEntity, updateEntity, deleteEntity, metadataList } = useOntologyStore();
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [showAttributeDialog, setShowAttributeDialog] = useState(false);
  const [showRelationDialog, setShowRelationDialog] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Partial<Entity>>({});
  const [editingAttribute, setEditingAttribute] = useState<Partial<Attribute>>({});
  const [editingAttributeId, setEditingAttributeId] = useState<string | null>(null); // null = 新建, 有值 = 编辑
  const [editingRelation, setEditingRelation] = useState<Partial<Relation>>({});

  const entities = project?.dataModel?.entities || [];
  const projects = project?.dataModel?.projects || [];
  const selectedEntity = entityId ? entities.find(e => e.id === entityId) : null;
  const aggregateRootEntities = getAggregateRootEntities(entities);
  const editingEntityRole = resolveEntityRole(editingEntity);
  
  // 根据元数据类型映射到属性类型
  const mapMetadataTypeToAttributeType = (metadataType: string): Attribute['type'] => {
    const typeMap: Record<string, Attribute['type']> = {
      '字符串': 'string',
      '文本': 'text',
      '整数': 'integer',
      '小数': 'decimal',
      '布尔': 'boolean',
      '日期': 'date',
      '日期时间': 'datetime',
      '枚举': 'enum',
      'string': 'string',
      'text': 'text',
      'integer': 'integer',
      'decimal': 'decimal',
      'boolean': 'boolean',
      'date': 'date',
      'datetime': 'datetime',
      'enum': 'enum',
    };
    return typeMap[metadataType] || 'string';
  };
  
  // 选择元数据时自动填充属性信息
  const handleMetadataSelect = (metadataId: string) => {
    const metadata = metadataList.find(m => m.id === metadataId);
    if (metadata) {
      setEditingAttribute({
        ...editingAttribute,
        metadataId: metadata.id,
        metadataName: metadata.name,
        name: editingAttribute.name || metadata.name,
        nameEn: editingAttribute.nameEn || metadata.nameEn,
        type: editingAttribute.type || mapMetadataTypeToAttributeType(metadata.type),
        description: editingAttribute.description || metadata.description,
      });
    }
  };
  
  // 打开编辑属性对话框
  const openEditAttributeDialog = (attr: Attribute) => {
    setEditingAttributeId(attr.id);
    setEditingAttribute({ ...attr });
    setShowAttributeDialog(true);
  };
  
  // 保存属性（新建或更新）
  const handleSaveAttribute = () => {
    if (!entityId || !selectedEntity) return;
    
    const attrData: Attribute = {
      id: editingAttributeId || generateId(),
      name: editingAttribute.name || '新属性',
      nameEn: editingAttribute.nameEn,
      type: editingAttribute.type || 'string',
      required: editingAttribute.required || false,
      unique: editingAttribute.unique || false,
      description: editingAttribute.description,
      length: editingAttribute.length,
      precision: editingAttribute.precision,
      scale: editingAttribute.scale,
      refEntity: editingAttribute.type === 'reference' ? editingAttribute.refEntity : undefined,
      metadataId: editingAttribute.metadataId,
      metadataName: editingAttribute.metadataName,
    };
    
    let newAttributes: Attribute[];
    if (editingAttributeId) {
      // 更新现有属性
      newAttributes = selectedEntity.attributes.map(a => 
        a.id === editingAttributeId ? attrData : a
      );
    } else {
      // 添加新属性
      newAttributes = [...selectedEntity.attributes, attrData];
    }
    
    updateEntity(entityId, {
      ...selectedEntity,
      attributes: newAttributes,
    });
    
    setEditingAttribute({});
    setEditingAttributeId(null);
    setShowAttributeDialog(false);
  };

  // Button Only Mode - Just show add entity button
  if (mode === 'button-only') {
    return (
      <>
        <Dialog open={showEntityDialog} onOpenChange={setShowEntityDialog}>
          <DialogTrigger asChild>
            <Button className="w-full" onClick={() => setEditingEntity({ entityRole: 'child_entity' })}>+ 新建实体</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建实体</DialogTitle>
              <DialogDescription>定义一个新的业务实体</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>中文名称</Label>
                  <Input
                    value={editingEntity.name || ''}
                    onChange={(e) => setEditingEntity({ ...editingEntity, name: e.target.value })}
                    placeholder="如：合同"
                  />
                </div>
                <div className="space-y-2">
                  <Label>英文名称</Label>
                  <Input
                    value={editingEntity.nameEn || ''}
                    onChange={(e) => setEditingEntity({ ...editingEntity, nameEn: e.target.value })}
                    placeholder="如：Contract"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>所属项目 *</Label>
                <Select
                  value={editingEntity.projectId || ''}
                  onValueChange={(value) => setEditingEntity({ ...editingEntity, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 ? (
                      <SelectItem value="_empty" disabled>请先创建项目</SelectItem>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>实体角色</Label>
                <Select
                  value={editingEntityRole}
                  onValueChange={(value) => setEditingEntity({
                    ...editingEntity,
                    entityRole: value as Entity['entityRole'],
                    parentAggregateId: value === 'aggregate_root' ? undefined : editingEntity.parentAggregateId,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择实体角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aggregate_root">聚合根</SelectItem>
                    <SelectItem value="child_entity">聚合内子实体</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingEntityRole === 'child_entity' && (
                <div className="space-y-2">
                  <Label>所属聚合根 *</Label>
                  <Select
                    value={editingEntity.parentAggregateId || '_none'}
                    onValueChange={(value) => setEditingEntity({
                      ...editingEntity,
                      parentAggregateId: value === '_none' ? undefined : value,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择所属聚合根" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">请选择聚合根</SelectItem>
                      {aggregateRootEntities
                        .filter((entity) => !editingEntity.projectId || entity.projectId === editingEntity.projectId)
                        .map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name} ({entity.nameEn})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>描述</Label>
                <Textarea
                  value={editingEntity.description || ''}
                  onChange={(e) => setEditingEntity({ ...editingEntity, description: e.target.value })}
                  placeholder="实体用途说明"
                />
              </div>
              <Button onClick={() => {
                if (!editingEntity.projectId && projects.length > 0) {
                  setEditingEntity({ ...editingEntity, projectId: projects[0].id, entityRole: editingEntityRole });
                  return;
                }
                if (!editingEntity.projectId) {
                  return;
                }
                if (editingEntityRole === 'child_entity' && !editingEntity.parentAggregateId) {
                  return;
                }
                const newEntity: Entity = normalizeEntityRoleFields({
                  id: generateId(),
                  name: editingEntity.name || '新实体',
                  nameEn: editingEntity.nameEn || 'NewEntity',
                  description: editingEntity.description,
                  projectId: editingEntity.projectId,
                  entityRole: editingEntityRole,
                  parentAggregateId: editingEntityRole === 'child_entity' ? editingEntity.parentAggregateId : undefined,
                  attributes: [],
                  relations: [],
                });
                addEntity(newEntity);
                setEditingEntity({});
                setShowEntityDialog(false);
              }} className="w-full">
                创建实体
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Entity Detail Mode - Show selected entity's attributes and relations
  if (mode === 'entity-detail' && selectedEntity) {
    return (
      <div className="space-y-6">
        {/* Attributes Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">属性定义</CardTitle>
                <CardDescription>定义实体的数据字段</CardDescription>
              </div>
              <Dialog open={showAttributeDialog} onOpenChange={(open) => {
                setShowAttributeDialog(open);
                if (!open) {
                  setEditingAttribute({});
                  setEditingAttributeId(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setEditingAttribute({});
                    setEditingAttributeId(null);
                  }}>+ 添加属性</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingAttributeId ? '编辑属性' : '添加属性'}</DialogTitle>
                    <DialogDescription>{editingAttributeId ? '修改属性信息' : '为实体添加一个属性'}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {/* 元数据选择 */}
                    <div className="space-y-2">
                      <Label>关联元数据（可选）</Label>
                      <Select
                        value={editingAttribute.metadataId || '_none'}
                        onValueChange={(value) => {
                          if (value === '_none') {
                            setEditingAttribute({ 
                              ...editingAttribute, 
                              metadataId: undefined, 
                              metadataName: undefined 
                            });
                          } else {
                            handleMetadataSelect(value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择元数据自动填充属性信息" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">不关联元数据</SelectItem>
                          {metadataList.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} ({m.nameEn}) - {m.domain}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {editingAttribute.metadataId && (
                        <p className="text-xs text-muted-foreground">
                          已关联元数据，将自动填充名称、类型和描述
                        </p>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>中文名称</Label>
                        <Input
                          value={editingAttribute.name || ''}
                          onChange={(e) => setEditingAttribute({ ...editingAttribute, name: e.target.value })}
                          placeholder="如：合同编号"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>英文名称</Label>
                        <Input
                          value={editingAttribute.nameEn || ''}
                          onChange={(e) => setEditingAttribute({ ...editingAttribute, nameEn: e.target.value })}
                          placeholder="如：contractNo"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>数据类型</Label>
                      <Select
                        value={editingAttribute.type || 'string'}
                        onValueChange={(v) => setEditingAttribute({ ...editingAttribute, type: v as Attribute['type'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ATTRIBUTE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {editingAttribute.type === 'string' && (
                      <div className="space-y-2">
                        <Label>最大长度</Label>
                        <Input
                          type="number"
                          value={editingAttribute.length || ''}
                          onChange={(e) => setEditingAttribute({ ...editingAttribute, length: parseInt(e.target.value) })}
                          placeholder="如：50"
                        />
                      </div>
                    )}
                    {editingAttribute.type === 'decimal' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>精度</Label>
                          <Input
                            type="number"
                            value={editingAttribute.precision || ''}
                            onChange={(e) => setEditingAttribute({ ...editingAttribute, precision: parseInt(e.target.value) })}
                            placeholder="如：18"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>小数位</Label>
                          <Input
                            type="number"
                            value={editingAttribute.scale || ''}
                            onChange={(e) => setEditingAttribute({ ...editingAttribute, scale: parseInt(e.target.value) })}
                            placeholder="如：2"
                          />
                        </div>
                      </div>
                    )}
                    {editingAttribute.type === 'reference' && (
                      <div className="space-y-2">
                        <Label>引用实体</Label>
                        <Select
                          value={editingAttribute.refEntity || '_none'}
                          onValueChange={(v) => setEditingAttribute({ 
                            ...editingAttribute, 
                            refEntity: v === '_none' ? undefined : v 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择要引用的实体" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">选择要引用的实体</SelectItem>
                            {entities.filter(e => e.id !== entityId).map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {e.name} ({e.nameEn})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="required"
                          checked={editingAttribute.required || false}
                          onChange={(e) => setEditingAttribute({ ...editingAttribute, required: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="required" className="text-sm font-normal">必填</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="unique"
                          checked={editingAttribute.unique || false}
                          onChange={(e) => setEditingAttribute({ ...editingAttribute, unique: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="unique" className="text-sm font-normal">唯一</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>描述</Label>
                      <Textarea
                        value={editingAttribute.description || ''}
                        onChange={(e) => setEditingAttribute({ ...editingAttribute, description: e.target.value })}
                        placeholder="属性用途说明"
                      />
                    </div>
                    <Button onClick={handleSaveAttribute} className="w-full">
                      {editingAttributeId ? '保存修改' : '添加属性'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {selectedEntity.attributes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-2xl mb-2">📝</div>
                <p>暂无属性定义</p>
                <p className="text-sm mt-1">点击上方按钮添加属性</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedEntity.attributes.map((attr) => (
                  <div
                    key={attr.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="min-w-[120px]">
                        <span className="font-medium">{attr.name}</span>
                        {attr.nameEn && (
                          <span className="text-muted-foreground ml-2 text-sm">
                            ({attr.nameEn})
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {ATTRIBUTE_TYPES.find(t => t.value === attr.type)?.label || attr.type}
                        </Badge>
                        {attr.required && <Badge variant="destructive" className="text-xs">必填</Badge>}
                        {attr.unique && <Badge variant="secondary" className="text-xs">唯一</Badge>}
                        {attr.refEntity && (
                          <Badge variant="outline" className="text-xs">
                            → {entities.find(e => e.id === attr.refEntity)?.name}
                          </Badge>
                        )}
                        {attr.metadataName && (
                          <Badge variant="default" className="text-xs bg-blue-500">
                            元数据: {attr.metadataName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => openEditAttributeDialog(attr)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          updateEntity(entityId!, {
                            ...selectedEntity,
                            attributes: selectedEntity.attributes.filter(a => a.id !== attr.id),
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relations Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">关系定义</CardTitle>
                <CardDescription>定义与其他实体的关联关系</CardDescription>
              </div>
              <Dialog open={showRelationDialog} onOpenChange={setShowRelationDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingRelation({})}>+ 添加关系</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加关系</DialogTitle>
                    <DialogDescription>定义与其他实体的关系</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>关系名称</Label>
                      <Input
                        value={editingRelation.name || ''}
                        onChange={(e) => setEditingRelation({ ...editingRelation, name: e.target.value })}
                        placeholder="如：关联发票"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>关系类型</Label>
                      <Select
                        value={editingRelation.type || 'one_to_many'}
                        onValueChange={(v) => setEditingRelation({ ...editingRelation, type: v as Relation['type'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATION_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>目标实体</Label>
                      <Select
                        value={editingRelation.targetEntity || ''}
                        onValueChange={(v) => setEditingRelation({ ...editingRelation, targetEntity: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择目标实体" />
                        </SelectTrigger>
                        <SelectContent>
                          {entities.filter(e => e.id !== entityId).map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name} ({e.nameEn})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>级联操作</Label>
                      <Select
                        value={editingRelation.cascade || 'none'}
                        onValueChange={(v) => setEditingRelation({ ...editingRelation, cascade: v as Relation['cascade'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">无级联</SelectItem>
                          <SelectItem value="delete">级联删除</SelectItem>
                          <SelectItem value="all">全部级联</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>描述</Label>
                      <Textarea
                        value={editingRelation.description || ''}
                        onChange={(e) => setEditingRelation({ ...editingRelation, description: e.target.value })}
                        placeholder="关系说明"
                      />
                    </div>
                    <Button onClick={() => {
                      if (!entityId) return;
                      const newRelation: Relation = {
                        id: generateId(),
                        name: editingRelation.name || '新关系',
                        type: editingRelation.type || 'one_to_many',
                        targetEntity: editingRelation.targetEntity || '',
                        cascade: editingRelation.cascade || 'none',
                        description: editingRelation.description,
                      };
                      updateEntity(entityId, {
                        ...selectedEntity,
                        relations: [...selectedEntity.relations, newRelation],
                      });
                      setEditingRelation({});
                      setShowRelationDialog(false);
                    }} className="w-full">
                      添加关系
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {selectedEntity.relations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-2xl mb-2">🔗</div>
                <p>暂无关系定义</p>
                <p className="text-sm mt-1">点击上方按钮添加关系</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedEntity.relations.map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium min-w-[100px]">{rel.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {RELATION_TYPES.find(t => t.value === rel.type)?.label}
                      </Badge>
                      <span className="text-muted-foreground">
                        → {entities.find(e => e.id === rel.targetEntity)?.name || rel.targetEntity}
                      </span>
                      {rel.cascade !== 'none' && (
                        <Badge variant="secondary" className="text-xs">
                          级联: {rel.cascade}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        updateEntity(entityId!, {
                          ...selectedEntity,
                          relations: selectedEntity.relations.filter(r => r.id !== rel.id),
                        });
                      }}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full mode - Original implementation
  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Entity List */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">实体列表</CardTitle>
              <Dialog open={showEntityDialog} onOpenChange={setShowEntityDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingEntity({ entityRole: 'child_entity' })}>+ 新建</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>创建实体</DialogTitle>
                    <DialogDescription>定义一个新的业务实体</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>中文名称</Label>
                        <Input
                          value={editingEntity.name || ''}
                          onChange={(e) => setEditingEntity({ ...editingEntity, name: e.target.value })}
                          placeholder="如：合同"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>英文名称</Label>
                        <Input
                          value={editingEntity.nameEn || ''}
                          onChange={(e) => setEditingEntity({ ...editingEntity, nameEn: e.target.value })}
                          placeholder="如：Contract"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>所属项目 *</Label>
                      <Select
                        value={editingEntity.projectId || ''}
                        onValueChange={(value) => setEditingEntity({ ...editingEntity, projectId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择项目" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.length === 0 ? (
                            <SelectItem value="_empty" disabled>请先创建项目</SelectItem>
                          ) : (
                            projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>实体角色</Label>
                      <Select
                        value={editingEntityRole}
                        onValueChange={(value) => setEditingEntity({
                          ...editingEntity,
                          entityRole: value as Entity['entityRole'],
                          parentAggregateId: value === 'aggregate_root' ? undefined : editingEntity.parentAggregateId,
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择实体角色" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aggregate_root">聚合根</SelectItem>
                          <SelectItem value="child_entity">聚合内子实体</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editingEntityRole === 'child_entity' && (
                      <div className="space-y-2">
                        <Label>所属聚合根 *</Label>
                        <Select
                          value={editingEntity.parentAggregateId || '_none'}
                          onValueChange={(value) => setEditingEntity({
                            ...editingEntity,
                            parentAggregateId: value === '_none' ? undefined : value,
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择所属聚合根" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">请选择聚合根</SelectItem>
                            {aggregateRootEntities
                              .filter((entity) => !editingEntity.projectId || entity.projectId === editingEntity.projectId)
                              .map((entity) => (
                                <SelectItem key={entity.id} value={entity.id}>
                                  {entity.name} ({entity.nameEn})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>描述</Label>
                      <Textarea
                        value={editingEntity.description || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, description: e.target.value })}
                        placeholder="实体用途说明"
                      />
                    </div>
                    <Button onClick={() => {
                      if (!editingEntity.projectId && projects.length > 0) {
                        setEditingEntity({ ...editingEntity, projectId: projects[0].id, entityRole: editingEntityRole });
                        return;
                      }
                      if (!editingEntity.projectId) {
                        return;
                      }
                      if (editingEntityRole === 'child_entity' && !editingEntity.parentAggregateId) {
                        return;
                      }
                      const newEntity: Entity = normalizeEntityRoleFields({
                        id: generateId(),
                        name: editingEntity.name || '新实体',
                        nameEn: editingEntity.nameEn || 'NewEntity',
                        description: editingEntity.description,
                        projectId: editingEntity.projectId,
                        entityRole: editingEntityRole,
                        parentAggregateId: editingEntityRole === 'child_entity' ? editingEntity.parentAggregateId : undefined,
                        attributes: [],
                        relations: [],
                      });
                      addEntity(newEntity);
                      setEditingEntity({});
                      setShowEntityDialog(false);
                    }} className="w-full">
                      创建实体
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {entities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                暂无实体，点击上方按钮创建
              </div>
            ) : (
              entities.map((entity) => (
                <div
                  key={entity.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    entityId === entity.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{entity.name}</div>
                      <div className="text-xs text-muted-foreground">{entity.nameEn}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {entity.attributes.length} 属性
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEntity(entity.id);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entity Details */}
      <div className="col-span-9">
        {selectedEntity ? (
          <div className="space-y-4">
            {/* Entity Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedEntity.name}</CardTitle>
                    <CardDescription>{selectedEntity.nameEn}</CardDescription>
                  </div>
                  {selectedEntity.description && (
                    <div className="text-sm text-muted-foreground max-w-md text-right">
                      {selectedEntity.description}
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
            {/* Rest of full mode... */}
          </div>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <div className="text-4xl mb-4">🗄️</div>
              <p>请从左侧选择一个实体进行编辑</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
