'use client';

import { useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { useProjectSync } from '@/hooks/use-project-sync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ManualGenerator } from './manual-generator';
import { MetadataManager } from './metadata-manager';
import { MasterDataManager } from './masterdata-manager';
import { PublishDialog } from './publish-dialog';
import { ManifestExportDialog } from './manifest-export-dialog';
import { GovernanceEditor } from './governance-editor';
import { DataSourceEditor } from './data-source-editor';
import { MetricsEditor } from './metrics-editor';
import { BusinessChainTree } from './business-chain-tree';
import { BusinessChainDetail } from './business-chain-detail';
import { ElementLibrary } from './element-library';
import { WarningCenter } from './warning-center';
import { ExcelImportExportDialog } from './excel-import-export-dialog';
import { updateProject, deleteProject } from '@/services/project-service';
import { cn } from '@/lib/utils';
import { META_DIMENSION_LABELS, META_DIMENSION_ORDER } from '@/lib/element-selector/constants';
import type { MetaDimension, OntologyProject } from '@/types/ontology';

interface ModelingWorkspaceProps {
  project: OntologyProject;
}

type WorkspaceScope =
  | 'businessChain'
  | 'elementLibrary'
  | 'warnings'
  | 'metrics'
  | 'governance'
  | 'dataSources';

interface MenuItem {
  id: WorkspaceScope;
  label: string;
  icon: string;
  children?: { id: MetaDimension; label: string }[];
}

const LEFT_MENU_ITEMS: MenuItem[] = [
  { id: 'businessChain', label: '业务链', icon: '🌳' },
  {
    id: 'elementLibrary',
    label: '要素库',
    icon: '📦',
    children: META_DIMENSION_ORDER.map((dim) => ({
      id: dim,
      label: META_DIMENSION_LABELS[dim],
    })),
  },
  { id: 'warnings', label: '警示', icon: '⚠️' },
  { id: 'metrics', label: '指标', icon: '📊' },
  { id: 'governance', label: '治理', icon: '🛡️' },
  { id: 'dataSources', label: '数据源', icon: '🔌' },
];

export function ModelingWorkspace({ project }: ModelingWorkspaceProps) {
  useProjectSync();
  const router = useRouter();

  const { resetProject, exportProject, clearAllModels } = useOntologyStore();
  const getBusinessEpcWarnings = useOntologyStore((s) => s.getBusinessEpcWarnings);
  const setSelectedBusinessChainNode = useOntologyStore((s) => s.setSelectedBusinessChainNode);
  const epcWarnings = getBusinessEpcWarnings();
  const getCrossConsistency = useOntologyStore((s) => s.getCrossConsistency);
  const selectedNode = useOntologyStore((s) => s.selectedBusinessChainNode);
  const vxIssues = (selectedNode?.kind === 'C') ? getCrossConsistency(selectedNode.id) : [];

  const [workspaceScope, setWorkspaceScope] = useState<WorkspaceScope>('businessChain');
  const [activeDimension, setActiveDimension] = useState<MetaDimension>('E1');
  const [elementLibraryExpanded, setElementLibraryExpanded] = useState(true);
  const [elementLibraryFocus, setElementLibraryFocus] = useState<{
    elementId: string;
    dimension: MetaDimension;
  } | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showMasterData, setShowMasterData] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  const stats = {
    entities: project.dataModel?.entities.length || 0,
    stateMachines: project.behaviorModel?.stateMachines.length || 0,
    rules: project.ruleModel?.rules.length || 0,
    events: project.eventModel?.events.length || 0,
    subscriptions: project.eventModel?.subscriptions.length || 0,
  };
  const hasModelData =
    stats.entities > 0 ||
    stats.stateMachines > 0 ||
    stats.rules > 0 ||
    stats.events > 0 ||
    stats.subscriptions > 0;

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

  const handleOpenEditProjectDialog = () => {
    setEditProjectName(project.name);
    setEditProjectDescription(project.description || '');
    setShowEditProjectDialog(true);
  };

  const handleDeleteProject = async () => {
    const entityCount = project.dataModel?.entities.length ?? 0;
    const message =
      entityCount > 0
        ? `该项目下有 ${entityCount} 个实体，确定要删除整个项目吗？此操作不可恢复。`
        : `确定要删除项目 "${project.name}" 吗？此操作不可恢复。`;
    if (!confirm(message)) return;

    try {
      await deleteProject(project.id);
      resetProject();
      router.push('/');
    } catch (error) {
      console.error('删除项目失败:', error);
      alert('删除项目失败，请重试');
    }
  };

  const handleSaveEditProject = async () => {
    if (!editProjectName.trim()) {
      alert('项目名称不能为空');
      return;
    }

    setSavingProject(true);
    try {
      const { updateProjectName, updateProjectDescription } = useOntologyStore.getState();
      updateProjectName(editProjectName.trim());
      if (editProjectDescription.trim()) {
        updateProjectDescription(editProjectDescription.trim());
      }

      await updateProject({
        ...project,
        name: editProjectName.trim(),
        description: editProjectDescription.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      setShowEditProjectDialog(false);
    } catch (error) {
      console.error('保存项目失败:', error);
      alert('保存项目失败，请重试');
    } finally {
      setSavingProject(false);
    }
  };

  if (showManual) {
    return <ManualGenerator onBack={() => setShowManual(false)} />;
  }

  if (showMetadata) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">📚 元数据管理</h1>
            <Button variant="ghost" onClick={() => setShowMetadata(false)}>
              ← 返回建模
            </Button>
          </div>
        </header>
        <MetadataManager />
      </div>
    );
  }

  if (showMasterData) {
    return <MasterDataManager onBack={() => setShowMasterData(false)} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="modeling-workspace">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
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
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setShowMetadata(true)}>
                📚 元数据管理
              </Button>
              <Button variant="outline" onClick={() => setShowMasterData(true)}>
                📊 主数据管理
              </Button>
              <ManifestExportDialog project={project} />
              <PublishDialog />
              <Button variant="outline" onClick={handleExport}>
                导出 JSON 备份
              </Button>
              <ExcelImportExportDialog />
              <Button onClick={() => setShowManual(true)}>生成建模手册</Button>
              <Button variant="ghost" onClick={resetProject}>
                新建项目
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <Badge variant="secondary">🗄️ 实体: {stats.entities}</Badge>
            <Badge variant="secondary">⚡ 状态机: {stats.stateMachines}</Badge>
            <Badge variant="secondary">📋 规则: {stats.rules}</Badge>
            <Badge variant="secondary">📨 事件: {stats.events}</Badge>
            <Badge variant="secondary">🔔 订阅: {stats.subscriptions}</Badge>
          </div>
          {hasModelData && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                if (confirm('确定要清空所有建模数据吗？此操作不可恢复，但会保留项目和分类。')) {
                  clearAllModels();
                }
              }}
            >
              🗑️ 清空数据
            </Button>
          )}
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        {/* 左侧垂直菜单 */}
        <aside className="w-56 shrink-0 border-r bg-card flex flex-col overflow-y-auto">
          <nav className="p-3 space-y-1">
            {LEFT_MENU_ITEMS.map((item) => {
              const isActive = workspaceScope === item.id;
              const hasChildren = item.children && item.children.length > 0;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceScope(item.id);
                      if (hasChildren) {
                        setElementLibraryExpanded(true);
                      }
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-foreground',
                    )}
                  >
                    <span>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {hasChildren && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setElementLibraryExpanded((v) => !v);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            setElementLibraryExpanded((v) => !v);
                          }
                        }}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                      >
                        {elementLibraryExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </button>
                  {hasChildren && elementLibraryExpanded && item.children && (
                    <div className="ml-4 mt-1 space-y-1 border-l pl-2">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            setWorkspaceScope(item.id);
                            setActiveDimension(child.id);
                            setElementLibraryExpanded(true);
                          }}
                          className={cn(
                            'w-full px-3 py-1.5 rounded-md text-sm text-left transition-colors',
                            workspaceScope === item.id && activeDimension === child.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* 右侧内容区 */}
        {workspaceScope === 'warnings' && (
          <div className="flex-1 overflow-auto p-6">
            <WarningCenter
              warnings={epcWarnings}
              vxIssues={vxIssues}
              onNavigate={(kind, id) => {
                if (kind === 'A' || kind === 'B' || kind === 'C' || kind === 'EPC') {
                  setSelectedBusinessChainNode({ kind, id });
                  setWorkspaceScope('businessChain');
                }
              }}
            />
          </div>
        )}
        {workspaceScope === 'elementLibrary' && (
          <div className="flex-1 overflow-auto p-6">
            <ElementLibrary
              focusTarget={elementLibraryFocus}
              onFocusConsumed={() => setElementLibraryFocus(null)}
              activeDimension={activeDimension}
              onDimensionChange={setActiveDimension}
            />
          </div>
        )}
        {workspaceScope === 'businessChain' && (
          <>
            <div className="w-80 flex flex-col shrink-0">
              <BusinessChainTree />
            </div>
            <BusinessChainDetail
              onNavigateToElement={(elementId, dimension) => {
                setElementLibraryFocus({ elementId, dimension });
                setWorkspaceScope('elementLibrary');
              }}
            />
          </>
        )}
        {workspaceScope === 'metrics' && (
          <div className="flex-1 overflow-auto p-6">
            <h2 className="text-lg font-semibold mb-4">指标 (E6)</h2>
            <MetricsEditor />
          </div>
        )}
        {workspaceScope === 'governance' && (
          <div className="flex-1 overflow-auto p-6">
            <h2 className="text-lg font-semibold mb-4">治理层 (E5)</h2>
            <GovernanceEditor />
          </div>
        )}
        {workspaceScope === 'dataSources' && (
          <div className="flex-1 overflow-auto p-6">
            <h2 className="text-lg font-semibold mb-4">数据源 (E8)</h2>
            <DataSourceEditor />
          </div>
        )}
      </main>

      <Dialog open={showEditProjectDialog} onOpenChange={setShowEditProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑项目信息</DialogTitle>
            <DialogDescription>修改项目名称和描述</DialogDescription>
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

