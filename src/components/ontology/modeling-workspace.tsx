'use client';

import { useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { useProjectSync } from '@/hooks/use-project-sync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Pencil, Trash2, ChevronDown, MoreHorizontal, Network, Library, AlertTriangle, Gauge, ShieldCheck, Database, BookOpen, Download, Box, GitBranch, ScrollText, Bell, Package } from 'lucide-react';
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
import { ThemeToggle } from '@/components/theme-toggle';
import { updateProject, deleteProject } from '@/services/project-service';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from 'sonner';
import type { MetaDimension, OntologyProject } from '@/types/ontology';

interface ModelingWorkspaceProps {
  project: OntologyProject;
}

type ContentTab = 'businessChain' | 'elementLibrary' | 'warnings' | 'metrics' | 'governance' | 'dataSources';

export function ModelingWorkspace({ project }: ModelingWorkspaceProps) {
  useProjectSync();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();

  const { resetProject, exportProject, clearAllModels } = useOntologyStore();
  const getBusinessEpcWarnings = useOntologyStore((s) => s.getBusinessEpcWarnings);
  const setSelectedBusinessChainNode = useOntologyStore((s) => s.setSelectedBusinessChainNode);
  const epcWarnings = getBusinessEpcWarnings();
  const getCrossConsistency = useOntologyStore((s) => s.getCrossConsistency);
  const selectedNode = useOntologyStore((s) => s.selectedBusinessChainNode);
  const vxIssues = (selectedNode?.kind === 'C') ? getCrossConsistency(selectedNode.id) : [];

  const [activeTab, setActiveTab] = useState<ContentTab>('businessChain');
  const [activeDimension, setActiveDimension] = useState<MetaDimension>('E1');
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

  // Header dropdown dialog states
  const [showManifestExport, setShowManifestExport] = useState(false);
  const [showExcelImportExport, setShowExcelImportExport] = useState(false);
  const [showPublishSnap, setShowPublishSnap] = useState(false);
  const [showPublishHistory, setShowPublishHistory] = useState(false);

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

  const metaElementCount = project.metaElements?.length ?? 0;

  const warningCount = epcWarnings.length + vxIssues.length;

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
    if (!(await confirm({ description: message, variant: 'destructive', confirmLabel: '删除' }))) return;

    try {
      await deleteProject(project.id);
      resetProject();
      router.push('/');
    } catch (error) {
      console.error('删除项目失败:', error);
      toast.error('删除项目失败，请重试');
    }
  };

  const handleSaveEditProject = async () => {
    if (!editProjectName.trim()) {
      toast.error('项目名称不能为空');
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
      toast.error('保存项目失败，请重试');
    } finally {
      setSavingProject(false);
    }
  };

  const TABS: { id: ContentTab; label: string; count?: number; icon: typeof Network }[] = [
    { id: 'businessChain', label: '业务链', icon: Network },
    { id: 'elementLibrary', label: '要素库', icon: Library },
    { id: 'warnings', label: '警示', count: warningCount, icon: AlertTriangle },
    { id: 'metrics', label: '指标', icon: Gauge },
    { id: 'governance', label: '治理', icon: ShieldCheck },
    { id: 'dataSources', label: '数据源', icon: Database },
  ];

  if (showManual) {
    return <ManualGenerator onBack={() => setShowManual(false)} />;
  }

  if (showMetadata) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">元数据管理</h1>
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
      {/* ========== HEADER ========== */}
      <header className="border-b bg-card shrink-0">
        <div className="px-5 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Project info */}
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${project.domain.color}15` }}
              >
                <span className="text-lg">{project.domain.icon}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base font-semibold truncate">{project.name}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={handleOpenEditProjectDialog}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive shrink-0"
                  onClick={handleDeleteProject}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">{project.domain.name}</span>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Export dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="header-export-dropdown">
                    <Download className="w-4 h-4 mr-1.5" />
                    导出 <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setShowManifestExport(true)}>
                    Manifest 导出
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleExport}>
                    导出 JSON 备份
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setShowExcelImportExport(true)}
                    data-testid="header-export-excel"
                  >
                    Excel 导入导出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" onClick={() => setShowManual(true)}>
                <BookOpen className="w-4 h-4 mr-1.5" />
                生成建模手册
              </Button>

              {/* More actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="更多操作">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setShowMetadata(true)}>
                    元数据管理
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setShowMasterData(true)}>
                    主数据管理
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setShowPublishSnap(true)}>
                    保存快照
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setShowPublishHistory(true)}>
                    快照历史
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={resetProject}>
                    新建项目
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="border-b bg-card shrink-0" role="tablist" aria-label="视图切换">
            <div className="flex px-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    data-testid={`workspace-tab-${tab.id}`}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                      activeTab === tab.id
                        ? 'text-foreground border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-b-2 border-transparent',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-xs leading-none bg-destructive/10 text-destructive hover:bg-destructive/10">
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Business Chain: tree + detail with resizable split */}
            {activeTab === 'businessChain' && (
              <ResizablePanelGroup orientation="horizontal" className="flex-1">
                <ResizablePanel defaultSize={28} minSize={18} maxSize={50}>
                  <BusinessChainTree />
                </ResizablePanel>
                <ResizableHandle withHandle className="w-1.5 hover:w-2 transition-all after:w-2.5" />
                <ResizablePanel defaultSize={72} minSize={30}>
                  <BusinessChainDetail
                    onNavigateToElement={(elementId, dimension) => {
                      setElementLibraryFocus({ elementId, dimension });
                      setActiveTab('elementLibrary');
                    }}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}

            {/* Element Library */}
            {activeTab === 'elementLibrary' && (
              <div className="flex-1 overflow-auto p-6">
                <ElementLibrary
                  focusTarget={elementLibraryFocus}
                  onFocusConsumed={() => setElementLibraryFocus(null)}
                  activeDimension={activeDimension}
                  onDimensionChange={setActiveDimension}
                />
              </div>
            )}

            {/* Warnings */}
            {activeTab === 'warnings' && (
              <div className="flex-1 overflow-auto p-6">
                <WarningCenter
                  warnings={epcWarnings}
                  vxIssues={vxIssues}
                  onNavigate={(kind, id) => {
                    if (kind === 'A' || kind === 'B' || kind === 'C' || kind === 'EPC') {
                      setSelectedBusinessChainNode({ kind, id });
                      setActiveTab('businessChain');
                    }
                  }}
                />
              </div>
            )}

            {/* Metrics */}
            {activeTab === 'metrics' && (
              <div className="flex-1 overflow-auto p-6">
                <MetricsEditor />
              </div>
            )}

            {/* Governance */}
            {activeTab === 'governance' && (
              <div className="flex-1 overflow-auto p-6">
                <GovernanceEditor />
              </div>
            )}

            {/* Data Sources */}
            {activeTab === 'dataSources' && (
              <div className="flex-1 overflow-auto p-6">
                <DataSourceEditor />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========== STATUS FOOTER ========== */}
      <footer
        className="border-t bg-muted/30 px-4 py-1.5 flex items-center justify-between text-xs text-muted-foreground shrink-0"
        data-testid="workspace-status-bar"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <Box className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground tabular-nums">{stats.entities}</span> 实体
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground tabular-nums">{stats.stateMachines}</span> 状态机
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <ScrollText className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground tabular-nums">{stats.rules}</span> 规则
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <Bell className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground tabular-nums">{stats.events}</span> 事件
          </span>
          <span className="text-border hidden sm:inline">·</span>
          <span className="hidden sm:flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            要素库 <span className="font-semibold text-foreground tabular-nums">{metaElementCount}</span> 个
          </span>
        </div>
        {hasModelData && (
          <button
            type="button"
            className="text-red-500 hover:text-red-700 underline shrink-0"
            onClick={async () => {
              if (await confirm({
                description: '确定要清空所有建模数据吗？此操作不可恢复，但会保留项目和分类。',
                variant: 'destructive',
                confirmLabel: '清空',
              })) {
                clearAllModels();
              }
            }}
          >
            清空数据
          </button>
        )}
      </footer>

      {/* ========== DIALOGS ========== */}

      {/* Edit Project Dialog */}
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

      {/* Controlled dialogs from header dropdowns */}
      <ManifestExportDialog
        project={project}
        open={showManifestExport}
        onOpenChange={setShowManifestExport}
      />
      <ExcelImportExportDialog
        open={showExcelImportExport}
        onOpenChange={setShowExcelImportExport}
      />
      <PublishDialog
        hideTrigger
        openSnap={showPublishSnap}
        onOpenSnapChange={setShowPublishSnap}
        openHistory={showPublishHistory}
        onOpenHistoryChange={setShowPublishHistory}
      />
      {ConfirmDialog}
    </div>
  );
}
