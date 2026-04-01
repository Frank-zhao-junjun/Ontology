'use client';

import { useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { useProjectSync } from '@/hooks/use-project-sync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { getAggregateRootEntities, getEntityRoleLabel, isEntityAggregateRoot, normalizeEntityRoleFields, resolveEntityRole } from '@/lib/entity-role';
import { useRouter } from 'next/navigation';
import { DataModelEditor } from './data-model-editor';
import { BehaviorModelEditor } from './behavior-model-editor';
import { RuleModelEditor } from './rule-model-editor';
import { EventModelEditor } from './event-model-editor';
import { ManualGenerator } from './manual-generator';
import { MetadataManager } from './metadata-manager';
import { MasterDataManager } from './masterdata-manager';
import { PublishDialog } from './publish-dialog';
import { updateProject, deleteProject } from '@/services/project-service';
import type { OntologyProject, Entity, EntityProject, BusinessScenario } from '@/types/ontology';

// Business Scenario Form Component
function BusinessScenarioForm({ projectId, onSuccess }: { projectId: string; onSuccess: () => void }) {
  const { addBusinessScenario } = useOntologyStore();
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const handleSubmit = () => {
    if (!name.trim() || !projectId) return;
    
    addBusinessScenario({
      id: Math.random().toString(36).substring(2, 10),
      name: name.trim(),
      nameEn: nameEn.trim() || name.trim(),
      description,
      projectId,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    setName('');
    setNameEn('');
    setDescription('');
    onSuccess();
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>中文名称 *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：合同签订" />
        </div>
        <div className="space-y-2">
          <Label>英文名称</Label>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="如：ContractSigning" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>描述</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="场景描述" />
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={handleSubmit}>创建</Button>
      </div>
    </div>
  );
}

interface ModelingWorkspaceProps {
  project: OntologyProject;
}

type ModelType = 'data' | 'behavior' | 'rule' | 'event';

const MODEL_TABS = [
  { id: 'data' as ModelType, label: '数据模型', icon: '🗄️' },
  { id: 'behavior' as ModelType, label: '行为模型', icon: '⚡' },
  { id: 'rule' as ModelType, label: '规则模型', icon: '📋' },
  { id: 'event' as ModelType, label: '事件模型', icon: '📨' },
];

const PROJECT_COLORS = [
  { value: '#3b82f6', label: '蓝色' },
  { value: '#22c55e', label: '绿色' },
  { value: '#f59e0b', label: '橙色' },
  { value: '#ef4444', label: '红色' },
  { value: '#8b5cf6', label: '紫色' },
  { value: '#ec4899', label: '粉色' },
];

const ENTITY_ROLE_OPTIONS = [
  { value: 'aggregate_root', label: '聚合根' },
  { value: 'child_entity', label: '聚合内子实体' },
] as const;

const generateId = () => Math.random().toString(36).substring(2, 10);

export function ModelingWorkspace({ project }: ModelingWorkspaceProps) {
  // 自动同步项目到数据库
  useProjectSync();
  const router = useRouter();
  
  const { resetProject, exportProject, addEntityProject, updateEntityProject, deleteEntityProject, addEntity } = useOntologyStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ModelType>('data');
  const [showManual, setShowManual] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [savingProject, setSavingProject] = useState(false);
  const [showMasterData, setShowMasterData] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<EntityProject>>({ color: '#3b82f6' });
  const [editingEntity, setEditingEntity] = useState<Partial<Entity>>({});

  const allEntities = project.dataModel?.entities || [];
  const projects = project.dataModel?.projects || [];
  const businessScenarios = project.dataModel?.businessScenarios || [];
  const aggregateRootEntities = getAggregateRootEntities(allEntities);
  const editingEntityRole = resolveEntityRole(editingEntity);
  
  // Filter entities by selected project and scenario
  const entities = (() => {
    let filtered = selectedProjectId === 'all' 
      ? allEntities 
      : allEntities.filter(e => e.projectId === selectedProjectId);
    
    if (selectedScenarioId) {
      filtered = filtered.filter(e => e.scenarioId === selectedScenarioId);
    }
    
    return filtered;
  })();
  
  // Helper function to get project name by id
  const getProjectName = (projectId: string | undefined) => {
    if (!projectId) return '未分类';
    const found = projects.find(p => p.id === projectId);
    return found?.name || '未分类';
  };
  
  // Helper function to get project color by id
  const getProjectColor = (projectId: string | undefined) => {
    if (!projectId) return '#6b7280';
    const found = projects.find(p => p.id === projectId);
    return found?.color || '#6b7280';
  };

  const getModelStats = () => {
    return {
      entities: project.dataModel?.entities.length || 0,
      stateMachines: project.behaviorModel?.stateMachines.length || 0,
      rules: project.ruleModel?.rules.length || 0,
      events: project.eventModel?.events.length || 0,
      subscriptions: project.eventModel?.subscriptions.length || 0,
    };
  };

  const stats = getModelStats();

  const handleExport = () => {
    const json = exportProject();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_ontology.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 获取选中实体相关的模型数据
  const getRelatedModels = (entityId: string | null) => {
    if (!entityId) return null;
    
    const entity = allEntities.find(e => e.id === entityId);
    const stateMachines = project.behaviorModel?.stateMachines.filter(sm => sm.entity === entityId) || [];
    const rules = project.ruleModel?.rules.filter(r => r.entity === entityId) || [];
    const orchestrations = project.processModel?.orchestrations.filter(o => 
      o.steps.some(s => s.config?.entity === entityId)
    ) || [];
    const events = project.eventModel?.events.filter(e => e.entity === entityId) || [];
    const eventIds = events.map(e => e.id);
    const subscriptions = project.eventModel?.subscriptions.filter(s => eventIds.includes(s.eventId)) || [];

    return {
      entity,
      stateMachines,
      rules,
      orchestrations,
      events,
      subscriptions,
    };
  };

  const relatedModels = getRelatedModels(selectedEntityId);

  // Handle create project
  const handleCreateProject = () => {
    const newProject: EntityProject = {
      id: generateId(),
      name: editingProject.name || '新项目',
      nameEn: editingProject.nameEn || 'NewProject',
      description: editingProject.description,
      color: editingProject.color || '#3b82f6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addEntityProject(newProject);
    setEditingProject({ color: '#3b82f6' });
    setShowProjectDialog(false);
    setSelectedProjectId(newProject.id);
  };

  // Handle create entity
  const handleCreateEntity = () => {
    // 确定项目ID：优先使用用户选择的，其次使用当前选中的项目，最后使用第一个自定义项目
    const projectId = editingEntity.projectId || 
      (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || '');
    const entityRole = resolveEntityRole(editingEntity);
    
    if (!projectId) {
      alert('请先创建一个项目');
      return;
    }

    if (entityRole === 'child_entity' && !editingEntity.parentAggregateId) {
      alert('聚合内子实体必须选择所属聚合根。');
      return;
    }
    
    const newEntity: Entity = normalizeEntityRoleFields({
      id: generateId(),
      name: editingEntity.name || '新实体',
      nameEn: editingEntity.nameEn || 'NewEntity',
      description: editingEntity.description,
      projectId,
      entityRole,
      parentAggregateId: entityRole === 'child_entity' ? editingEntity.parentAggregateId : undefined,
      attributes: [],
      relations: [],
    });
    addEntity(newEntity);
    setEditingEntity({});
    setShowEntityDialog(false);
    setSelectedEntityId(newEntity.id);
  };

  // Count entities per project
  const getEntityCountByProject = (projectId: string) => {
    return allEntities.filter(e => e.projectId === projectId).length;
  };

  // 打开编辑项目对话框
  const handleOpenEditProjectDialog = () => {
    setEditProjectName(project.name);
    setEditProjectDescription(project.description || '');
    setShowEditProjectDialog(true);
  };

  // 删除项目分类
  const handleDeleteEntityProject = async (proj: EntityProject) => {
    const entityCount = getEntityCountByProject(proj.id);
    
    if (entityCount > 0) {
      alert(`该项目下有 ${entityCount} 个实体，请先删除或移动这些实体后再删除项目`);
      return;
    }
    
    if (!confirm(`确定要删除项目分类 "${proj.name}" 吗？`)) {
      return;
    }
    
    try {
      const { deleteEntityProject } = useOntologyStore.getState();
      deleteEntityProject(proj.id);
      
      // 如果删除的是当前选中的项目，切换到"全部项目"
      if (selectedProjectId === proj.id) {
        setSelectedProjectId('all');
      }
      
      // 保存到 Supabase
      const updatedProject: OntologyProject = {
        ...project,
        dataModel: {
          ...project.dataModel!,
          projects: project.dataModel!.projects.filter(p => p.id !== proj.id),
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };
      await updateProject(updatedProject);
    } catch (error) {
      console.error('删除项目分类失败:', error);
      alert('删除项目分类失败');
    }
  };

  // 删除整个项目
  const handleDeleteProject = async () => {
    const entityCount = allEntities.length;
    
    if (entityCount > 0) {
      if (!confirm(`该项目下有 ${entityCount} 个实体，确定要删除整个项目吗？此操作不可恢复。`)) {
        return;
      }
    } else {
      if (!confirm(`确定要删除项目 "${project.name}" 吗？此操作不可恢复。`)) {
        return;
      }
    }
    
    try {
      await deleteProject(project.id);
      resetProject();
      router.push('/');
    } catch (error) {
      console.error('删除项目失败:', error);
      alert('删除项目失败，请重试');
    }
  };

  // 保存项目信息编辑
  const handleSaveEditProject = async () => {
    if (!editProjectName.trim()) {
      alert('项目名称不能为空');
      return;
    }
    
    setSavingProject(true);
    try {
      // 更新本地状态
      const { updateProjectName, updateProjectDescription } = useOntologyStore.getState();
      updateProjectName(editProjectName.trim());
      if (editProjectDescription.trim()) {
        updateProjectDescription(editProjectDescription.trim());
      }
      
      // 保存到 Supabase
      const updatedProject: OntologyProject = {
        ...project,
        name: editProjectName.trim(),
        description: editProjectDescription.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      await updateProject(updatedProject);
      
      setShowEditProjectDialog(false);
    } catch (error) {
      console.error('保存项目失败:', error);
      alert('保存项目失败，请重试');
    } finally {
      setSavingProject(false);
    }
  };

  if (showManual) {
    return (
      <ManualGenerator 
        onBack={() => setShowManual(false)} 
        selectedEntityId={selectedEntityId}
        relatedModels={relatedModels}
      />
    );
  }

  if (showMetadata) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">📚 元数据管理</h1>
              <Button variant="ghost" onClick={() => setShowMetadata(false)}>
                ← 返回建模
              </Button>
            </div>
          </div>
        </header>
        <Card className="flex-1 rounded-none border-0">
          <MetadataManager />
        </Card>
      </div>
    );
  }

  if (showMasterData) {
    return (
      <MasterDataManager onBack={() => setShowMasterData(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="text-3xl p-2 rounded-lg"
                style={{ backgroundColor: `${project.domain.color}20` }}
              >
                {project.domain.icon}
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{project.name}</h1>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-muted-foreground"
                  onClick={handleOpenEditProjectDialog}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={handleDeleteProject}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{project.domain.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowMetadata(true)}>
                📚 元数据管理
              </Button>
              <Button variant="outline" onClick={() => setShowMasterData(true)}>
                📊 主数据管理
              </Button>
              <PublishDialog />
              <Button variant="outline" onClick={handleExport}>
                导出项目
              </Button>
              {selectedEntityId && relatedModels?.entity ? (
                <Button onClick={() => setShowManual(true)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  ✨ AI生成实体模型
                </Button>
              ) : (
                <Button onClick={() => setShowManual(true)}>
                  生成建模手册
                </Button>
              )}
              <Button variant="ghost" onClick={resetProject}>
                新建项目
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="secondary" className="gap-1">
              🗄️ 实体: {stats.entities}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              ⚡ 状态机: {stats.stateMachines}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              📋 规则: {stats.rules}
            </Badge>
            <Badge variant="secondary" className="gap-1">
               事件: {stats.events}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              🔔 订阅: {stats.subscriptions}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Project & Entity Selection */}
        <div className="w-80 border-r bg-card flex flex-col">
          {/* Project Section */}
          <div className="border-b">
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  📁 项目列表
                </h2>
                <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={() => setEditingProject({ color: '#3b82f6' })}>
                      + 新建
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>创建项目</DialogTitle>
                      <DialogDescription>创建一个新的项目来组织实体</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>项目名称</Label>
                          <Input
                            value={editingProject.name || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                            placeholder="如：订单系统"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>英文名称</Label>
                          <Input
                            value={editingProject.nameEn || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, nameEn: e.target.value })}
                            placeholder="如：OrderSystem"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>项目颜色</Label>
                        <div className="flex gap-2">
                          {PROJECT_COLORS.map((color) => (
                            <button
                              key={color.value}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                editingProject.color === color.value ? 'border-foreground scale-110' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color.value }}
                              onClick={() => setEditingProject({ ...editingProject, color: color.value })}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>描述</Label>
                        <Textarea
                          value={editingProject.description || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                          placeholder="项目用途说明"
                        />
                      </div>
                      <Button onClick={handleCreateProject} className="w-full">
                        创建项目
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <ScrollArea className="max-h-48">
              <div className="p-2">
                {/* All Projects Option */}
                <div
                  className={`p-2 rounded-lg cursor-pointer transition-all mb-1 flex items-center justify-between ${
                    selectedProjectId === 'all'
                      ? 'bg-primary/20 border border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => {
                    setSelectedProjectId('all');
                    setSelectedEntityId(null);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="font-medium">全部项目</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {projects.length}
                  </Badge>
                </div>
                
                {/* Custom Projects */}
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className={`p-2 rounded-lg cursor-pointer transition-all mb-1 flex items-center justify-between group ${
                      selectedProjectId === proj.id
                        ? 'bg-primary/20 border border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-2 flex-1"
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setSelectedEntityId(null);
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: proj.color }}
                      />
                      <span className="font-medium">{proj.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {getEntityCountByProject(proj.id)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEntityProject(proj);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Business Scenarios Section */}
            <div className="border-t">
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    📋 业务场景
                  </h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost">+ 新建</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>创建业务场景</DialogTitle>
                        <DialogDescription>定义一个业务场景用于实体分类管理</DialogDescription>
                      </DialogHeader>
                      <BusinessScenarioForm 
                        projectId={selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || ''} 
                        onSuccess={() => {}} 
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <ScrollArea className="max-h-32">
                <div className="p-2">
                  {businessScenarios.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">暂无业务场景</p>
                  ) : (
                    businessScenarios.map((scenario) => (
                      <div
                        key={scenario.id}
                        className={`p-2 rounded-lg cursor-pointer transition-all mb-1 flex items-center justify-between group ${
                          selectedScenarioId === scenario.id
                            ? 'bg-primary/20 border border-primary'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => {
                          setSelectedScenarioId(selectedScenarioId === scenario.id ? null : scenario.id);
                          setSelectedEntityId(null);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: scenario.color || '#3b82f6' }}
                          />
                          <span className="font-medium text-sm">{scenario.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {allEntities.filter(e => e.scenarioId === scenario.id).length}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Entity Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    🗄️ 实体列表
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedProjectId === 'all' ? '全部项目' : getProjectName(selectedProjectId)} · {entities.length} 个实体
                  </p>
                </div>
                <Dialog open={showEntityDialog} onOpenChange={setShowEntityDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setEditingEntity({ 
                      projectId: selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || '',
                      entityRole: 'child_entity'
                    })}>
                      + 新建
                    </Button>
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
                              projects.map((proj) => (
                                <SelectItem key={proj.id} value={proj.id}>
                                  {proj.name}
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
                            {ENTITY_ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          仅 `aggregate_root` 可发布领域事件；`child_entity` 需要归属到某个聚合根。
                        </p>
                      </div>
                      {editingEntityRole === 'child_entity' && (
                        <div className="space-y-2">
                          <Label>所属聚合根 *</Label>
                          <Select
                            value={editingEntity.parentAggregateId || ''}
                            onValueChange={(value) => setEditingEntity({ ...editingEntity, parentAggregateId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择所属聚合根" />
                            </SelectTrigger>
                            <SelectContent>
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
                      <Button onClick={handleCreateEntity} className="w-full">
                        创建实体
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {entities.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 px-4">
                    <div className="text-2xl mb-2">🗄️</div>
                    <p className="text-sm">暂无实体</p>
                    <p className="text-xs mt-1">点击上方按钮添加实体</p>
                  </div>
                ) : (
                  entities.map((entity) => {
                    const smCount = project.behaviorModel?.stateMachines.filter(sm => sm.entity === entity.id).length || 0;
                    const ruleCount = project.ruleModel?.rules.filter(r => r.entity === entity.id).length || 0;
                    const eventCount = project.eventModel?.events.filter(e => e.entity === entity.id).length || 0;
                    
                    return (
                      <div
                        key={entity.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all mb-2 ${
                          selectedEntityId === entity.id
                            ? 'bg-primary/20 border-primary ring-2 ring-primary/50'
                            : 'hover:bg-muted border-transparent hover:border-border'
                        }`}
                        onClick={() => {
                          setSelectedEntityId(entity.id);
                          setActiveTab('data');
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: getProjectColor(entity.projectId) }}
                            />
                            <span className="font-medium">{entity.name}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1 py-0 ${
                                isEntityAggregateRoot(entity)
                                  ? 'text-blue-600 border-blue-300'
                                  : 'text-slate-600 border-slate-300'
                              }`}
                            >
                              {getEntityRoleLabel(resolveEntityRole(entity))}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{entity.nameEn}</span>
                        </div>
                        {selectedProjectId === 'all' && (
                          <div className="mb-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ 
                              backgroundColor: `${getProjectColor(entity.projectId)}15`,
                              color: getProjectColor(entity.projectId),
                              borderColor: `${getProjectColor(entity.projectId)}40`
                            }}>
                              {getProjectName(entity.projectId)}
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs">
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {entity.attributes.length} 属性
                          </Badge>
                          {smCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              ⚡ {smCount}
                            </Badge>
                          )}
                          {ruleCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              📋 {ruleCount}
                            </Badge>
                          )}
                          {eventCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              📨 {eventCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Content - Entity Models */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedEntityId && relatedModels?.entity ? (
            (() => {
              const entity = relatedModels.entity;
              return (
                <>
                  {/* Entity Header */}
                  <div className="p-4 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getProjectColor(entity.projectId) }}
                          />
                          <span className="text-sm text-muted-foreground">{getProjectName(entity.projectId)}</span>
                        </div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          {entity.name}
                          <span className="text-sm font-normal text-muted-foreground">
                            {entity.nameEn}
                          </span>
                        </h2>
                        {entity.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {entity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Model Tabs */}
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ModelType)} className="flex-1 flex flex-col overflow-hidden">
                    <div className="border-b px-4">
                      <TabsList className="h-12">
                        {MODEL_TABS.map((tab) => {
                          const count = tab.id === 'data' 
                            ? entity.attributes.length
                            : tab.id === 'behavior'
                            ? relatedModels.stateMachines.length
                            : tab.id === 'rule'
                            ? relatedModels.rules.length
                            : relatedModels.events.length;
                          
                          return (
                            <TabsTrigger key={tab.id} value={tab.id} className="gap-2 px-4">
                              <span>{tab.icon}</span>
                              {tab.label}
                              <Badge variant="outline" className="ml-1 text-[10px] px-1">
                                {count}
                              </Badge>
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                      <TabsContent value="data" className="mt-0">
                        <DataModelEditor 
                          mode="entity-detail" 
                          entityId={selectedEntityId} 
                        />
                      </TabsContent>

                      <TabsContent value="behavior" className="mt-0">
                        <BehaviorModelEditor 
                          mode="entity-detail" 
                          entityId={selectedEntityId} 
                        />
                      </TabsContent>

                      <TabsContent value="rule" className="mt-0">
                        <RuleModelEditor 
                          mode="entity-detail" 
                          entityId={selectedEntityId} 
                        />
                      </TabsContent>

                      <TabsContent value="event" className="mt-0">
                        <EventModelEditor 
                          mode="entity-detail" 
                          entityId={selectedEntityId} 
                        />
                      </TabsContent>
                    </div>
                  </Tabs>
                </>
              );
            })()
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="max-w-md mx-4">
                <CardContent className="p-8 text-center">
                  <div className="text-5xl mb-4">🏗️</div>
                  <h3 className="text-lg font-semibold mb-2">选择实体开始建模</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    从左侧选择一个实体，或创建新实体来定义该实体的四类模型
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="text-sm font-medium mb-2">层级结构</div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Badge variant="secondary">📁 项目</Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="secondary">🗄️ 实体</Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="secondary">📝 模型</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {MODEL_TABS.map((tab) => (
                      <div key={tab.id} className="text-center p-2 rounded-lg bg-muted/50">
                        <div className="text-xl">{tab.icon}</div>
                        <div className="text-[10px] mt-1">{tab.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* 编辑项目对话框 */}
      <Dialog open={showEditProjectDialog} onOpenChange={setShowEditProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑项目信息</DialogTitle>
            <DialogDescription>
              修改项目名称和描述
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">项目名称</label>
              <Input
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                placeholder="输入项目名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">项目描述</label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md resize-none"
                value={editProjectDescription}
                onChange={(e) => setEditProjectDescription(e.target.value)}
                placeholder="输入项目描述"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditProjectDialog(false)} disabled={savingProject}>
              取消
            </Button>
            <Button onClick={handleSaveEditProject} disabled={savingProject}>
              {savingProject ? '保存中...' : '保存'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
