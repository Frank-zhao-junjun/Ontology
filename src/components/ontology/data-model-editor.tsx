'use client';

import { useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Pencil, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAggregateRootEntities, normalizeEntityRoleFields, resolveEntityRole } from '@/lib/entity-role';
import type { Entity, Attribute, Relation, ComputedProperty, SourceMapping, EventDefinition } from '@/types/ontology';

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

const DIRECT_ATTRIBUTE_TYPES = ATTRIBUTE_TYPES.filter((type) => type.value !== 'reference');

const RELATION_TYPES = [
  { value: 'one_to_one', label: '一对一 (1:1)' },
  { value: 'one_to_many', label: '一对多 (1:N)' },
  { value: 'many_to_many', label: '多对多 (N:M)' },
];

const generateId = () => Math.random().toString(36).substring(2, 10);

function parseMasterDataFields(fieldNames?: string): string[] {
  if (!fieldNames) {
    return [];
  }

  return fieldNames
    .split(/[，,、\n]/)
    .map((field) => field.trim())
    .filter(Boolean);
}

export function DataModelEditor({ mode = 'full', entityId }: DataModelEditorProps) {
  const { project, addEntity, updateEntity, deleteEntity, metadataList, masterDataList } = useOntologyStore();
  const eventDefinitions = (project?.eventModel?.events || []) as EventDefinition[];
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [showAttributeDialog, setShowAttributeDialog] = useState(false);
  const [showRelationDialog, setShowRelationDialog] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Partial<Entity>>({});
  const [editingAttribute, setEditingAttribute] = useState<Partial<Attribute>>({});
  const [editingAttributeId, setEditingAttributeId] = useState<string | null>(null); // null = 新建, 有值 = 编辑
  const [editingRelation, setEditingRelation] = useState<Partial<Relation>>({});
  const [editingRelationId, setEditingRelationId] = useState<string | null>(null);
  const [metadataPopoverOpen, setMetadataPopoverOpen] = useState(false);
  const [showComputedDialog, setShowComputedDialog] = useState(false);
  const [editingComputedProp, setEditingComputedProp] = useState<ComputedProperty | null>(null);
  const [showSourceMappingDialog, setShowSourceMappingDialog] = useState(false);
  const [editingSourceMapping, setEditingSourceMapping] = useState<SourceMapping | null>(null);

  const entities = project?.dataModel?.entities || [];
  const projects = project?.dataModel?.projects || [];
  const businessScenarios = project?.dataModel?.businessScenarios || [];
  const selectedEntity = entityId ? entities.find(e => e.id === entityId) : null;
  const aggregateRootEntities = getAggregateRootEntities(entities);
  const editingEntityRole = resolveEntityRole(editingEntity);
  const editingDataType = editingAttribute.dataType || 'string';
  const attributeMode: 'primitive' | 'entityRef' | 'masterDataRef' = editingDataType === 'reference'
    ? (editingAttribute.isMasterDataRef ? 'masterDataRef' : 'entityRef')
    : 'primitive';
  const metadataLocked = Boolean(editingAttribute.metadataTemplateId);
  const selectedMasterData = editingAttribute.masterDataType
    ? masterDataList.find((item) => item.id === editingAttribute.masterDataType)
    : undefined;
  const selectableMasterDataFields = parseMasterDataFields(selectedMasterData?.fieldNames);
  
  // 根据元数据类型映射到属性类型
  const mapMetadataTypeToAttributeType = (metadataType: string): Attribute['dataType'] => {
    const typeMap: Record<string, Attribute['dataType']> = {
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
      const dataType = mapMetadataTypeToAttributeType(metadata.type);
      setEditingAttribute({
        ...editingAttribute,
        metadataTemplateId: metadata.id,
        metadataTemplateName: metadata.name,
        name: editingAttribute.name || metadata.name,
        nameEn: editingAttribute.nameEn || metadata.nameEn,
        dataType,
        referenceKind: dataType === 'reference' ? editingAttribute.referenceKind || 'entity' : undefined,
        referencedEntityId: dataType === 'reference' ? editingAttribute.referencedEntityId : undefined,
        isMasterDataRef: dataType === 'reference' ? Boolean(editingAttribute.isMasterDataRef) : false,
        masterDataType: dataType === 'reference' && editingAttribute.isMasterDataRef ? editingAttribute.masterDataType : undefined,
        masterDataField: dataType === 'reference' && editingAttribute.isMasterDataRef ? editingAttribute.masterDataField : undefined,
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

    const dataType = editingAttribute.dataType || 'string';
    const referenceKind = dataType === 'reference'
      ? (editingAttribute.isMasterDataRef ? 'masterData' : (editingAttribute.referenceKind || 'entity'))
      : undefined;
    const isMasterDataRef = dataType === 'reference' && referenceKind === 'masterData';

    if (isMasterDataRef && !editingAttribute.masterDataType) {
      alert('关联主数据时必须选择主数据类型');
      return;
    }

    if (dataType === 'reference' && !isMasterDataRef && !editingAttribute.referencedEntityId) {
      alert('引用实体时必须选择目标实体');
      return;
    }
    
    const attrData: Attribute = {
      id: editingAttributeId || generateId(),
      name: editingAttribute.name || '新属性',
      nameEn: editingAttribute.nameEn,
      businessMeaning: editingAttribute.businessMeaning,
      dataType,
      required: editingAttribute.required || false,
      unique: editingAttribute.unique || false,
      description: editingAttribute.description,
      length: editingAttribute.length,
      precision: editingAttribute.precision,
      scale: editingAttribute.scale,
      enumRef: dataType === 'enum' ? editingAttribute.enumRef : undefined,
      referenceKind,
      referencedEntityId: dataType === 'reference' && referenceKind === 'entity' ? editingAttribute.referencedEntityId : undefined,
      referenceDisplayField: dataType === 'reference' && referenceKind === 'entity' ? editingAttribute.referenceDisplayField : undefined,
      isMasterDataRef,
      masterDataType: isMasterDataRef ? editingAttribute.masterDataType : undefined,
      masterDataField: isMasterDataRef ? editingAttribute.masterDataField : undefined,
      autoFill: editingAttribute.autoFill,
      default: editingAttribute.default,
      metadataTemplateId: editingAttribute.metadataTemplateId,
      metadataTemplateName: editingAttribute.metadataTemplateName,
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
                <Label>所属业务场景 *</Label>
                <Select
                  value={editingEntity.businessScenarioId || ''}
                  onValueChange={(value) => setEditingEntity({ ...editingEntity, businessScenarioId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择业务场景" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessScenarios.length === 0 ? (
                      <SelectItem value="_empty" disabled>请先创建业务场景</SelectItem>
                    ) : (
                      businessScenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.name}
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
              <div className="space-y-2">
                <Label className="text-blue-700">业务含义 (Business Meaning) ⭐</Label>
                <Textarea
                  value={editingEntity.businessMeaning || ''}
                  onChange={(e) => setEditingEntity({ ...editingEntity, businessMeaning: e.target.value })}
                  placeholder="供AI理解该实体的精确业务定义，例如：产生购买行为并需要系统跟进的个人或企业实例"
                  className="bg-blue-50 border-blue-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-700">同义词表 (Aliases) ⭐</Label>
                <Input
                  value={editingEntity.aliases?.join(', ') || ''}
                  onChange={(e) => {
                    const strs = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setEditingEntity({ ...editingEntity, aliases: strs.length ? strs : undefined });
                  }}
                  placeholder="多个同义词用逗号隔开，如：消费者, 散客、买家"
                  className="bg-blue-50 border-blue-200"
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
                if (!editingEntity.businessScenarioId) {
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
                  businessMeaning: editingEntity.businessMeaning,
                  aliases: editingEntity.aliases,
                  projectId: editingEntity.projectId,
                  businessScenarioId: editingEntity.businessScenarioId,
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
                    <div className="space-y-2 flex flex-col">
                      <Label>关联元数据（可选）</Label>
                      <Popover open={metadataPopoverOpen} onOpenChange={setMetadataPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={metadataPopoverOpen}
                            className="w-full justify-between font-normal"
                          >
                            {editingAttribute.metadataTemplateId ? (
                              <span className="truncate">
                                {(() => {
                                  const m = metadataList.find(meta => meta.id === editingAttribute.metadataTemplateId);
                                  return m ? `${m.name} (${m.nameEn}) - ${m.domain}` : '选择元数据自动填充属性信息...';
                                })()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground truncate">选择元数据自动填充属性信息...</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[450px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="搜索元数据名称或编码..." />
                            <CommandList>
                              <CommandEmpty>未找到匹配的元数据。</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="_none"
                                  onSelect={() => {
                                    setEditingAttribute({ 
                                      ...editingAttribute, 
                                      metadataTemplateId: undefined, 
                                      metadataTemplateName: undefined 
                                    });
                                    setMetadataPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      !editingAttribute.metadataTemplateId ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  不关联元数据
                                </CommandItem>
                                {metadataList.map((m) => (
                                  <CommandItem
                                    key={m.id}
                                    value={`${m.name} ${m.nameEn} ${m.domain}`}
                                    onSelect={() => {
                                      handleMetadataSelect(m.id);
                                      setMetadataPopoverOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        editingAttribute.metadataTemplateId === m.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col truncate">
                                      <span className="font-medium truncate">{m.name} ({m.nameEn})</span>
                                      <span className="text-xs text-muted-foreground truncate">领域: {m.domain} · 类型: {m.type}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {editingAttribute.metadataTemplateId && (
                        <p className="text-xs text-muted-foreground pt-1">
                          已关联元数据模板，数据类型将按模板锁定。
                        </p>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="attribute-name">中文名称</Label>
                        <Input
                          id="attribute-name"
                          value={editingAttribute.name || ''}
                          onChange={(e) => setEditingAttribute({ ...editingAttribute, name: e.target.value })}
                          placeholder="如：合同编号"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="attribute-name-en">英文名称</Label>
                        <Input
                          id="attribute-name-en"
                          value={editingAttribute.nameEn || ''}
                          onChange={(e) => setEditingAttribute({ ...editingAttribute, nameEn: e.target.value })}
                          placeholder="如：contractNo"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-blue-700">业务含义 (Business Meaning) ⭐</Label>
                      <Textarea
                        value={editingAttribute.businessMeaning || ''}
                        onChange={(e) => setEditingAttribute({ ...editingAttribute, businessMeaning: e.target.value })}
                        placeholder="供AI理解该属性的具体定义，明确度量规则"
                        className="min-h-[60px] bg-blue-50 border-blue-200"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>属性维护方式</Label>
                      <RadioGroup
                        value={attributeMode}
                        disabled={metadataLocked}
                        onValueChange={(value) => {
                          if (value === 'primitive') {
                            setEditingAttribute({
                              ...editingAttribute,
                              dataType: editingAttribute.dataType === 'reference' ? 'string' : (editingAttribute.dataType || 'string'),
                              referenceKind: undefined,
                              referencedEntityId: undefined,
                              isMasterDataRef: false,
                              masterDataType: undefined,
                              masterDataField: undefined,
                            });
                            return;
                          }

                          if (value === 'entityRef') {
                            setEditingAttribute({
                              ...editingAttribute,
                              dataType: 'reference',
                              referenceKind: 'entity',
                              referencedEntityId: editingAttribute.referencedEntityId,
                              isMasterDataRef: false,
                              masterDataType: undefined,
                              masterDataField: undefined,
                            });
                            return;
                          }

                          setEditingAttribute({
                            ...editingAttribute,
                            dataType: 'reference',
                            referenceKind: 'masterData',
                            referencedEntityId: undefined,
                            isMasterDataRef: true,
                            masterDataType: editingAttribute.masterDataType,
                            masterDataField: editingAttribute.masterDataField,
                          });
                        }}
                        className="gap-2"
                      >
                        <div className="rounded-lg border p-3">
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value="primitive" id="attribute-mode-primitive" />
                            <div className="space-y-1">
                              <Label htmlFor="attribute-mode-primitive">直接维护字段</Label>
                              <p className="text-xs text-muted-foreground">手工维护字符、数字、日期等基础数据字段。</p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value="entityRef" id="attribute-mode-entity-ref" />
                            <div className="space-y-1">
                              <Label htmlFor="attribute-mode-entity-ref">维护实体引用</Label>
                              <p className="text-xs text-muted-foreground">当前属性直接指向另一个业务实体。</p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value="masterDataRef" id="attribute-mode-masterdata-ref" />
                            <div className="space-y-1">
                              <Label htmlFor="attribute-mode-masterdata-ref">维护主数据引用</Label>
                              <p className="text-xs text-muted-foreground">当前属性关联主数据类型，可进一步指定字段。</p>
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                      {metadataLocked && (
                        <p className="text-xs text-muted-foreground">
                          模板绑定后，属性维护方式会随模板一起锁定。
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attribute-type">数据类型</Label>
                      {attributeMode === 'primitive' ? (
                        <>
                          <Select
                            value={editingDataType}
                            disabled={metadataLocked}
                            onValueChange={(v) => setEditingAttribute({
                              ...editingAttribute,
                              dataType: v as Attribute['dataType'],
                              referenceKind: undefined,
                              referencedEntityId: undefined,
                              isMasterDataRef: false,
                              masterDataType: undefined,
                              masterDataField: undefined,
                            })}
                          >
                            <SelectTrigger id="attribute-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DIRECT_ATTRIBUTE_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {metadataLocked && (
                            <p className="text-xs text-muted-foreground">
                              模板绑定后，数据类型不可手工修改。
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                          {attributeMode === 'entityRef'
                            ? '当前属性将保存为实体引用。'
                            : '当前属性将保存为主数据引用。'}
                        </div>
                      )}
                    </div>
                    {editingDataType === 'string' && (
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
                    {editingDataType === 'decimal' && (
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
                    {editingDataType === 'enum' && (
                      <div className="space-y-2">
                        <Label>枚举引用 (行为模型状态定义)</Label>
                        <Select
                          value={editingAttribute.enumRef || '_none'}
                          onValueChange={(v) => setEditingAttribute({ ...editingAttribute, enumRef: v === '_none' ? undefined : v })}
                        >
                          <SelectTrigger><SelectValue placeholder="选择状态定义（可选）" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">不关联状态定义</SelectItem>
                            {project?.behaviorModel?.stateMachines?.flatMap(sm =>
                              sm.states.map(s => (
                                <SelectItem key={`${sm.id}:${s.id}`} value={`${sm.id}:${s.id}`}>
                                  {sm.name} / {s.name}
                                </SelectItem>
                              ))
                            ) || []}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          关联行为模型的状态定义，枚举值将自动从状态列表生成。
                        </p>
                      </div>
                    )}
                    {editingDataType === 'reference' && (
                      <>
                        {!editingAttribute.isMasterDataRef ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="attribute-ref-entity">引用实体</Label>
                            <Select
                              value={editingAttribute.referencedEntityId || '_none'}
                              onValueChange={(v) => setEditingAttribute({ 
                                ...editingAttribute,
                                referenceKind: 'entity',
                                isMasterDataRef: false,
                                referencedEntityId: v === '_none' ? undefined : v,
                                masterDataType: undefined,
                                masterDataField: undefined,
                              })}
                            >
                              <SelectTrigger id="attribute-ref-entity">
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
                          {editingAttribute.referencedEntityId && (
                            <div className="space-y-2">
                              <Label>引用显示字段</Label>
                              <Select
                                value={editingAttribute.referenceDisplayField || '_none'}
                                onValueChange={(v) => setEditingAttribute({ ...editingAttribute, referenceDisplayField: v === '_none' ? undefined : v })}
                              >
                                <SelectTrigger><SelectValue placeholder="选择显示字段" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">默认显示字段</SelectItem>
                                  {entities.find(e => e.id === editingAttribute.referencedEntityId)?.attributes.map(a => (
                                    <SelectItem key={a.id} value={a.nameEn || a.name}>{a.name} ({a.nameEn || a.name})</SelectItem>
                                  )) || []}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </> 
                        ) : (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="attribute-master-data-type">主数据类型</Label>
                              <Select
                                value={editingAttribute.masterDataType || '_none'}
                                onValueChange={(value) => setEditingAttribute({
                                  ...editingAttribute,
                                  referenceKind: 'masterData',
                                  isMasterDataRef: true,
                                  masterDataType: value === '_none' ? undefined : value,
                                  masterDataField: undefined,
                                  referencedEntityId: undefined,
                                })}
                              >
                                <SelectTrigger id="attribute-master-data-type">
                                  <SelectValue placeholder="选择主数据类型" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">选择主数据类型</SelectItem>
                                  {masterDataList.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="attribute-master-data-field">主数据字段（可选）</Label>
                              <Select
                                value={editingAttribute.masterDataField || '_none'}
                                onValueChange={(value) => setEditingAttribute({
                                  ...editingAttribute,
                                  masterDataField: value === '_none' ? undefined : value,
                                })}
                                disabled={!editingAttribute.masterDataType}
                              >
                                <SelectTrigger id="attribute-master-data-field">
                                  <SelectValue placeholder={editingAttribute.masterDataType ? '选择主数据字段' : '请先选择主数据类型'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">不指定字段</SelectItem>
                                  {selectableMasterDataFields.map((field) => (
                                    <SelectItem key={field} value={field}>
                                      {field}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    <div className="flex items-center gap-4 flex-wrap">
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

                    {/* 自动填充 */}
                    <div className="space-y-2">
                      <Label>自动填充策略</Label>
                      <Select
                        value={editingAttribute.autoFill || ''}
                        onValueChange={(v) => setEditingAttribute({ ...editingAttribute, autoFill: v === 'none' ? undefined : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="不自动填充" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">不自动填充</SelectItem>
                          <SelectItem value="uuid">UUID</SelectItem>
                          <SelectItem value="current_user">当前用户</SelectItem>
                          <SelectItem value="current_time">当前时间</SelectItem>
                          <SelectItem value="current_date">当前日期</SelectItem>
                          <SelectItem value="sequence">序列号</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">数据创建时系统自动填充该字段</p>
                    </div>

                    {/* 默认值 */}
                    <div className="space-y-2">
                      <Label>默认值</Label>
                      <Input
                        value={editingAttribute.default || ''}
                        onChange={(e) => setEditingAttribute({ ...editingAttribute, default: e.target.value })}
                        placeholder="如：0、true、当前日期"
                      />
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
                          {ATTRIBUTE_TYPES.find(t => t.value === attr.dataType)?.label || attr.dataType}
                        </Badge>
                        {attr.required && <Badge variant="destructive" className="text-xs">必填</Badge>}
                        {attr.unique && <Badge variant="secondary" className="text-xs">唯一</Badge>}
                        {attr.referencedEntityId && (!attr.referenceKind || attr.referenceKind === 'entity') && (
                          <Badge variant="outline" className="text-xs">
                            → {entities.find(e => e.id === attr.referencedEntityId)?.name}
                          </Badge>
                        )}
                        {attr.masterDataType && (
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
                            主数据: {masterDataList.find((item) => item.id === attr.masterDataType)?.name || attr.masterDataType}
                            {attr.masterDataField ? ` / ${attr.masterDataField}` : ''}
                          </Badge>
                        )}
                        {attr.metadataTemplateName && (
                          <Badge variant="default" className="text-xs bg-blue-500">
                            元数据: {attr.metadataTemplateName}
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
                  <Button size="sm" onClick={() => {
                    setEditingRelation({});
                    setEditingRelationId(null);
                  }}>+ 添加关系</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingRelationId ? '编辑关系' : '添加关系'}</DialogTitle>
                    <DialogDescription>{editingRelationId ? '修改已有关系定义' : '定义与其他实体的关系'}</DialogDescription>
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
                    {editingRelation.type === 'many_to_many' && (
                      <div className="space-y-2">
                        <Label>中间实体</Label>
                        <Input
                          value={editingRelation.viaEntity || ''}
                          onChange={(e) => setEditingRelation({ ...editingRelation, viaEntity: e.target.value })}
                          placeholder="如：contract_order_link"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-blue-700">关系方向性 (Directionality) ⭐</Label>
                      <Select
                        value={editingRelation.directionality || 'directed'}
                        onValueChange={(v) => setEditingRelation({ ...editingRelation, directionality: v as Relation['directionality'] })}
                      >
                        <SelectTrigger className="bg-blue-50 border-blue-200">
                          <SelectValue placeholder="选择关系方向" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="directed">单向 (Directed)</SelectItem>
                          <SelectItem value="undirected">双向 (Undirected)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 mt-4 mb-2">
                      <input
                        type="checkbox"
                        id="isRecursive"
                        checked={editingRelation.isRecursive || false}
                        onChange={(e) => setEditingRelation({ ...editingRelation, isRecursive: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isRecursive" className="text-sm font-normal text-blue-700">自引用关系 (Self-Referencing) ⭐</Label>
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
                          {entities.filter(e => e.id !== entityId || editingRelation.isRecursive).map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name} ({e.nameEn})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>外键字段 (可选)</Label>
                      <Input
                        value={editingRelation.foreignKey || ''}
                        onChange={(e) => setEditingRelation({ ...editingRelation, foreignKey: e.target.value || undefined })}
                        placeholder="如：contract_id"
                      />
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
                      const targetEntity = editingRelation.isRecursive ? entityId : editingRelation.targetEntity;
                      if (!targetEntity) {
                        alert('关系必须选择目标实体');
                        return;
                      }
                      if (editingRelation.type === 'many_to_many' && !editingRelation.viaEntity?.trim()) {
                        alert('多对多关系必须填写中间实体');
                        return;
                      }
                      const relationData: Relation = {
                        id: editingRelationId || generateId(),
                        name: editingRelation.name || '新关系',
                        type: editingRelation.type || 'one_to_many',
                        targetEntity,
                        foreignKey: editingRelation.foreignKey || undefined,
                        cascade: editingRelation.cascade || 'none',
                        description: editingRelation.description,
                        directionality: editingRelation.directionality || 'directed',
                        isRecursive: editingRelation.isRecursive || false,
                        viaEntity: editingRelation.type === 'many_to_many' ? editingRelation.viaEntity?.trim() : undefined,
                        attributes: editingRelation.attributes || [], // 默认空属性表
                      };
                      const nextRelations = editingRelationId
                        ? selectedEntity.relations.map((relation) => relation.id === editingRelationId ? relationData : relation)
                        : [...selectedEntity.relations, relationData];
                      updateEntity(entityId, {
                        ...selectedEntity,
                        relations: nextRelations,
                      });
                      setEditingRelation({});
                      setEditingRelationId(null);
                      setShowRelationDialog(false);
                    }} className="w-full">
                      {editingRelationId ? '保存关系' : '添加关系'}
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
                      {rel.directionality === 'undirected' && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">双向</Badge>
                      )}
                      {rel.isRecursive && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">自引用</Badge>
                      )}
                      <span className="text-muted-foreground">
                        → {entities.find(e => e.id === rel.targetEntity)?.name || rel.targetEntity}
                      </span>
                      {rel.cascade !== 'none' && (
                        <Badge variant="secondary" className="text-xs">
                          级联: {rel.cascade}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRelation(rel);
                          setEditingRelationId(rel.id);
                          setShowRelationDialog(true);
                        }}
                      >
                        编辑
                      </Button>
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
                      <Label>所属业务场景 *</Label>
                      <Select
                        value={editingEntity.businessScenarioId || ''}
                        onValueChange={(value) => setEditingEntity({ ...editingEntity, businessScenarioId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择业务场景" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessScenarios.length === 0 ? (
                            <SelectItem value="_empty" disabled>请先创建业务场景</SelectItem>
                          ) : (
                            businessScenarios.map((scenario) => (
                              <SelectItem key={scenario.id} value={scenario.id}>
                                {scenario.name}
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
                    <div className="space-y-2">
                      <Label className="text-blue-700">业务含义 (Business Meaning) ⭐</Label>
                      <Textarea
                        value={editingEntity.businessMeaning || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, businessMeaning: e.target.value })}
                        placeholder="供AI理解该实体的精确业务定义"
                        className="bg-blue-50 border-blue-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-blue-700">同义词表 (Aliases) ⭐</Label>
                      <Input
                        value={editingEntity.aliases?.join(', ') || ''}
                        onChange={(e) => {
                          const strs = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          setEditingEntity({ ...editingEntity, aliases: strs.length ? strs : undefined });
                        }}
                        placeholder="多个同义词用逗号隔开"
                        className="bg-blue-50 border-blue-200"
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
                      if (!editingEntity.businessScenarioId) {
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
                        businessMeaning: editingEntity.businessMeaning,
                        aliases: editingEntity.aliases,
                        projectId: editingEntity.projectId,
                        businessScenarioId: editingEntity.businessScenarioId,
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
            
            {/* 派生属性 (Computed Properties) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">派生属性</CardTitle>
                    <CardDescription>通过公式、聚合或 AI 推导的属性</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingComputedProp({ id: '', name: '', nameEn: '', computationType: 'formula', expression: '' });
                    setShowComputedDialog(true);
                  }}>
                    + 添加派生属性
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(!selectedEntity.computedProperties || selectedEntity.computedProperties.length === 0) ? (
                  <p className="text-sm text-muted-foreground">暂无派生属性</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEntity.computedProperties.map((cp) => (
                      <div key={cp.id} className="flex items-start justify-between rounded-lg border p-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{cp.name}</span>
                            <span className="text-xs text-muted-foreground">({cp.nameEn})</span>
                            <Badge variant="secondary" className="text-xs">
                              {cp.computationType === 'formula' ? '公式' : cp.computationType === 'aggregation' ? '聚合' : cp.computationType === 'lookup' ? '查找' : 'AI 推理'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{cp.expression}</p>
                          {cp.businessMeaning && <p className="text-xs text-muted-foreground">{cp.businessMeaning}</p>}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => { setEditingComputedProp(cp); setShowComputedDialog(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={() => {
                              updateEntity(selectedEntity.id, {
                                ...selectedEntity,
                                computedProperties: (selectedEntity.computedProperties || []).filter(c => c.id !== cp.id),
                              });
                            }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 源系统映射 (Source Mappings) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">源系统映射</CardTitle>
                    <CardDescription>属性到外部系统字段的映射关系</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingSourceMapping({ id: '', entityId: selectedEntity.id, attributeId: '', sourceSystem: '', sourceFieldPath: '' });
                    setShowSourceMappingDialog(true);
                  }}>
                    + 添加映射
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(!selectedEntity.sourceMappings || selectedEntity.sourceMappings.length === 0) ? (
                  <p className="text-sm text-muted-foreground">暂无源系统映射</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEntity.sourceMappings.map((sm) => {
                      const attrName = selectedEntity.attributes.find(a => a.id === sm.attributeId)?.name || sm.attributeId;
                      return (
                        <div key={sm.id} className="flex items-start justify-between rounded-lg border p-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-mono">{sm.sourceSystem}</Badge>
                              <span className="text-sm font-mono text-foreground">{sm.sourceFieldPath}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              映射到属性: <span className="font-medium">{attrName}</span>
                              {sm.transformRule && <span> · 转换规则: {sm.transformRule}</span>}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => { setEditingSourceMapping(sm); setShowSourceMappingDialog(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                              onClick={() => {
                                updateEntity(selectedEntity.id, {
                                  ...selectedEntity,
                                  sourceMappings: (selectedEntity.sourceMappings || []).filter(s => s.id !== sm.id),
                                });
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ComputedProperty 编辑弹窗 */}
            <Dialog open={showComputedDialog} onOpenChange={(open) => {
              setShowComputedDialog(open);
              if (!open) setEditingComputedProp(null);
            }}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingComputedProp?.id ? '编辑派生属性' : '添加派生属性'}</DialogTitle>
                  <DialogDescription>定义通过计算或推导得到的属性</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>名称</Label>
                      <Input value={editingComputedProp?.name || ''} onChange={(e) => setEditingComputedProp({ ...editingComputedProp!, name: e.target.value })} placeholder="如：订单总金额" />
                    </div>
                    <div className="space-y-2">
                      <Label>英文名</Label>
                      <Input value={editingComputedProp?.nameEn || ''} onChange={(e) => setEditingComputedProp({ ...editingComputedProp!, nameEn: e.target.value })} placeholder="如：orderTotal" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>计算方式</Label>
                    <Select value={editingComputedProp?.computationType || 'formula'} onValueChange={(v) => setEditingComputedProp({ ...editingComputedProp!, computationType: v as ComputedProperty['computationType'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formula">公式计算 (Formula)</SelectItem>
                        <SelectItem value="aggregation">聚合计算 (Aggregation)</SelectItem>
                        <SelectItem value="lookup">跨对象查找 (Lookup)</SelectItem>
                        <SelectItem value="ai-inference">AI 推理 (AI Inference)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>表达式</Label>
                    <Textarea value={editingComputedProp?.expression || ''} onChange={(e) => setEditingComputedProp({ ...editingComputedProp!, expression: e.target.value })} placeholder="如：quantity * unitPrice" className="min-h-[60px] font-mono text-sm" />
                  </div>
                  {editingComputedProp?.computationType === 'aggregation' && (
                    <div className="space-y-2">
                      <Label>聚合函数</Label>
                      <Select value={editingComputedProp?.aggregationFunction || 'sum'} onValueChange={(v) => setEditingComputedProp({ ...editingComputedProp!, aggregationFunction: v as ComputedProperty['aggregationFunction'] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sum">求和 (Sum)</SelectItem>
                          <SelectItem value="count">计数 (Count)</SelectItem>
                          <SelectItem value="avg">平均值 (Avg)</SelectItem>
                          <SelectItem value="min">最小值 (Min)</SelectItem>
                          <SelectItem value="max">最大值 (Max)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {editingComputedProp?.computationType === 'lookup' && (
                    <div className="space-y-2">
                      <Label>目标实体</Label>
                      <Select value={editingComputedProp?.targetEntity || ''} onValueChange={(v) => setEditingComputedProp({ ...editingComputedProp!, targetEntity: v })}>
                        <SelectTrigger><SelectValue placeholder="选择目标实体" /></SelectTrigger>
                        <SelectContent>
                          {entities.filter(e => e.id !== selectedEntity?.id).map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.name} ({e.nameEn})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>描述</Label>
                    <Textarea value={editingComputedProp?.description || ''} onChange={(e) => setEditingComputedProp({ ...editingComputedProp!, description: e.target.value })} className="min-h-[50px]" placeholder="派生属性的用途说明" />
                  </div>
                  <div className="space-y-2">
                    <Label>业务含义</Label>
                    <Textarea value={editingComputedProp?.businessMeaning || ''} onChange={(e) => setEditingComputedProp({ ...editingComputedProp!, businessMeaning: e.target.value })} className="min-h-[50px]" placeholder="AI 理解该派生属性的含义" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => { setShowComputedDialog(false); setEditingComputedProp(null); }}>取消</Button>
                    <Button onClick={() => {
                      if (!entityId || !editingComputedProp) return;
                      const next = editingComputedProp.id
                        ? (selectedEntity.computedProperties || []).map(c => c.id === editingComputedProp!.id ? editingComputedProp! : c)
                        : [...(selectedEntity.computedProperties || []), { ...editingComputedProp, id: editingComputedProp.id || generateId() }];
                      updateEntity(entityId, { ...selectedEntity, computedProperties: next });
                      setEditingComputedProp(null);
                      setShowComputedDialog(false);
                    }}>保存</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* SourceMapping 编辑弹窗 */}
            <Dialog open={showSourceMappingDialog} onOpenChange={(open) => {
              setShowSourceMappingDialog(open);
              if (!open) setEditingSourceMapping(null);
            }}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingSourceMapping?.id ? '编辑源系统映射' : '添加源系统映射'}</DialogTitle>
                  <DialogDescription>将实体属性映射到外部系统字段</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>源系统</Label>
                    <Input value={editingSourceMapping?.sourceSystem || ''} onChange={(e) => setEditingSourceMapping({ ...editingSourceMapping!, sourceSystem: e.target.value })} placeholder="如：ERP、CRM、WMS" />
                  </div>
                  <div className="space-y-2">
                    <Label>源系统字段路径</Label>
                    <Input value={editingSourceMapping?.sourceFieldPath || ''} onChange={(e) => setEditingSourceMapping({ ...editingSourceMapping!, sourceFieldPath: e.target.value })} placeholder="如：cus_info.vip_level" />
                  </div>
                  <div className="space-y-2">
                    <Label>映射到属性</Label>
                    <Select value={editingSourceMapping?.attributeId || ''} onValueChange={(v) => setEditingSourceMapping({ ...editingSourceMapping!, attributeId: v })}>
                      <SelectTrigger><SelectValue placeholder="选择属性" /></SelectTrigger>
                      <SelectContent>
                        {selectedEntity?.attributes.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name} ({a.nameEn})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>转换规则 (可选)</Label>
                    <Input value={editingSourceMapping?.transformRule || ''} onChange={(e) => setEditingSourceMapping({ ...editingSourceMapping!, transformRule: e.target.value })} placeholder="如：trim()、substr(0,10)" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => { setShowSourceMappingDialog(false); setEditingSourceMapping(null); }}>取消</Button>
                    <Button onClick={() => {
                      if (!entityId || !editingSourceMapping || !editingSourceMapping.attributeId) return;
                      const smData: SourceMapping = {
                        ...editingSourceMapping,
                        id: editingSourceMapping.id || generateId(),
                        entityId,
                      };
                      const next = editingSourceMapping.id
                        ? (selectedEntity.sourceMappings || []).map(s => s.id === editingSourceMapping!.id ? smData : s)
                        : [...(selectedEntity.sourceMappings || []), smData];
                      updateEntity(entityId, { ...selectedEntity, sourceMappings: next });
                      setEditingSourceMapping(null);
                      setShowSourceMappingDialog(false);
                    }}>保存</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* 索引定义 (Indexes) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">索引定义</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => {
                    const fieldNames = prompt('索引字段（多个用逗号分隔）：');
                    if (!fieldNames) return;
                    const isUnique = confirm('点击确定=唯一索引, 取消=普通索引');
                    const idxType = prompt('索引类型（btree/hash，默认btree）：') || 'btree';
                    updateEntity(selectedEntity.id, {
                      ...selectedEntity,
                      indexes: [...(selectedEntity.indexes || []), { fields: fieldNames.split(',').map(s => s.trim()), type: idxType as 'btree' | 'hash', unique: isUnique }],
                    });
                  }}>
                    + 添加索引
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(!selectedEntity.indexes || selectedEntity.indexes.length === 0) ? (
                  <p className="text-sm text-muted-foreground">暂无索引定义</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEntity.indexes.map((idx, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant={idx.unique ? 'default' : 'outline'}>{idx.unique ? '唯一' : '普通'}</Badge>
                          <Badge variant="secondary">{idx.type}</Badge>
                          <span className="text-muted-foreground">{idx.fields.join(', ')}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                          onClick={() => updateEntity(selectedEntity.id, {
                            ...selectedEntity,
                            indexes: (selectedEntity.indexes || []).filter((_, j) => j !== i),
                          })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 领域事件 (Domain Events) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">领域事件</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => {
                    const availableEvents = eventDefinitions.filter(
                      (e: EventDefinition) => e.isDomainEvent && !(selectedEntity.domainEvents || []).includes(e.id)
                    );
                    if (availableEvents.length === 0) {
                      alert('没有可用的领域事件。请先在事件模型中创建领域事件。');
                      return;
                    }
                    const eventId = prompt('输入领域事件ID（可用：' + availableEvents.map((e: EventDefinition) => e.name).join(', ') + '）：');
                    if (!eventId) return;
                    const found = availableEvents.find((e: EventDefinition) => e.id === eventId || e.name === eventId);
                    if (!found) { alert('未找到该领域事件'); return; }
                    updateEntity(selectedEntity.id, {
                      ...selectedEntity,
                      domainEvents: [...(selectedEntity.domainEvents || []), found.id],
                    });
                  }}>
                    + 关联领域事件
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(!selectedEntity.domainEvents || selectedEntity.domainEvents.length === 0) ? (
                  <p className="text-sm text-muted-foreground">暂无领域事件（聚合根可发布领域事件）</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEntity.domainEvents.map((eventId: string) => {
                      const evt = eventDefinitions.find((e: EventDefinition) => e.id === eventId);
                      return (
                        <div key={eventId} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="default">领域事件</Badge>
                            <span>{evt ? evt.name : eventId}</span>
                            {evt && <span className="text-muted-foreground text-xs">({evt.trigger})</span>}
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                            onClick={() => updateEntity(selectedEntity.id, {
                              ...selectedEntity,
                              domainEvents: (selectedEntity.domainEvents || []).filter((id: string) => id !== eventId),
                            })}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
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
