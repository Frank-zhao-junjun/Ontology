'use client';

import { useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Info, Save, History } from 'lucide-react';
import type { PublishConfig } from '@/types/ontology';

interface PublishDialogProps {
  onPublished?: () => void;
}

export function PublishDialog({ onPublished }: PublishDialogProps) {
  const { project, versions, createVersion, publishVersion, getLatestVersion, approveVersion, rejectVersion } = useOntologyStore();
  const [showSnapDialog, setShowSnapDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveLog, setSaveLog] = useState<string[]>([]);

  // 创建版本表单
  const [newVersion, setNewVersion] = useState({
    version: '1.0.0',
    name: '',
    description: '',
  });

  // 发布配置
  const [publishConfig, setPublishConfig] = useState<PublishConfig>({
    target: 'download',
    includeData: false,
    aiAgentEnabled: true,
    dockerCompose: true,
  });

  const projectVersions = project ? versions.filter((v) => v.projectId === project.id) : [];
  const latestVersion = getLatestVersion();

  // 生成下一个版本号建议
  const suggestNextVersion = () => {
    if (!latestVersion) return '1.0.0';
    const parts = latestVersion.version.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  };

  const handleSaveSnapshot = async () => {
    if (!project) return;
    if (!newVersion.name.trim()) {
      alert('请输入快照名称');
      return;
    }

    setIsSaving(true);
    setSaveLog(['正在创建本地快照...']);

    try {
      // 创建版本
      setSaveLog(prev => [...prev, '保存项目状态...']);
      const version = createVersion(newVersion);

      // 发布版本（标记为本地已发布）
      setSaveLog(prev => [...prev, '标记快照为已保存...']);
      publishVersion(version.id);

      // 调用代码生成API（代码包导出）
      setSaveLog(prev => [...prev, '生成代码包 (Flask/SQLAlchemy)...']);

      const response = await fetch('/api/codegen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: version.id,
          version,
          config: publishConfig,
          projectName: project.name,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '代码生成失败');
      }

      setSaveLog(prev => [...prev, '生成前端代码 (React/Vite)...']);
      setSaveLog(prev => [...prev, '生成数据库脚本 (SQLite)...']);

      if (publishConfig.dockerCompose) {
        setSaveLog(prev => [...prev, '生成Docker配置...']);
      }

      // 下载代码包
      if (publishConfig.target === 'download' && result.package) {
        setSaveLog(prev => [...prev, '打包文件...']);

        const codePackage = result.package;
        const files = codePackage.files || [];

        const blob = new Blob([JSON.stringify(codePackage, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/\s+/g, '_')}_v${version.version}_code.json`;
        a.click();
        URL.revokeObjectURL(url);

        setSaveLog(prev => [...prev, `✅ 快照已保存，共 ${files.length} 个文件`]);
      }

      // 重置表单
      setNewVersion({
        version: suggestNextVersion(),
        name: '',
        description: '',
      });

      // 延迟关闭对话框
      setTimeout(() => {
        setShowSnapDialog(false);
        setSaveLog([]);
        onPublished?.();
      }, 1500);

    } catch (error) {
      console.error('保存快照失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setSaveLog(prev => [...prev, `❌ 错误: ${errorMessage}`]);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">草稿</Badge>;
      case 'published':
        return <Badge variant="outline" className="text-green-600 border-green-300">已保存</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-gray-600 border-gray-300">已归档</Badge>;
      case 'pending_review':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">待审核</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-300">已驳回</Badge>;
      default:
        return null;
    }
  };

  if (!project) return null;

  return (
    <>
      {/* 下拉按钮 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            快照与历史
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => {
            setNewVersion({ ...newVersion, version: suggestNextVersion() });
            setShowSnapDialog(true);
          }}>
            <Save className="h-4 w-4 mr-2" />
            保存草稿快照...
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowHistoryDialog(true)}>
            <History className="h-4 w-4 mr-2" />
            快照历史
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={projectVersions.length === 0}>
            最新: v{latestVersion?.version || '-'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 草稿快照对话框 */}
      <Dialog open={showSnapDialog} onOpenChange={setShowSnapDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>保存草稿快照</DialogTitle>
            <DialogDescription>
              将当前建模项目保存为本地版本快照，并可选生成代码包
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* 平台交接提示 */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <strong>如需交付给 ontology-platform</strong>，请使用工具栏的
                <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 mx-1">
                  <Download className="h-3 w-3" />
                  导出 OntologyManifest
                </span>
                按钮。本快照功能仅保存设计台本地草稿。
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>版本号 *</Label>
                <Input
                  value={newVersion.version}
                  onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                  placeholder="如: 1.0.0"
                />
              </div>
              <div className="space-y-2">
                <Label>快照名称 *</Label>
                <Input
                  value={newVersion.name}
                  onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                  placeholder="如: 初始草稿"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>说明</Label>
              <Textarea
                value={newVersion.description}
                onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                placeholder="快照变更说明"
                className="h-16"
              />
            </div>

            {/* 代码包选项 */}
            <div className="space-y-3 border-t pt-4">
              <Label>代码包选项</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeData"
                    checked={publishConfig.includeData}
                    onCheckedChange={(checked) =>
                      setPublishConfig({ ...publishConfig, includeData: !!checked })
                    }
                  />
                  <label htmlFor="includeData" className="text-sm cursor-pointer">
                    包含示例数据
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="aiAgentEnabled"
                    checked={publishConfig.aiAgentEnabled}
                    onCheckedChange={(checked) =>
                      setPublishConfig({ ...publishConfig, aiAgentEnabled: !!checked })
                    }
                  />
                  <label htmlFor="aiAgentEnabled" className="text-sm cursor-pointer">
                    启用AI运行时助手
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dockerCompose"
                    checked={publishConfig.dockerCompose}
                    onCheckedChange={(checked) =>
                      setPublishConfig({ ...publishConfig, dockerCompose: !!checked })
                    }
                  />
                  <label htmlFor="dockerCompose" className="text-sm cursor-pointer">
                    生成Docker配置
                  </label>
                </div>
              </div>
            </div>

            {/* 当前模型统计 */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm font-medium mb-2">当前模型快照</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-bold text-lg">{project.dataModel?.entities.length || 0}</div>
                  <div className="text-muted-foreground">实体</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{project.behaviorModel?.stateMachines.length || 0}</div>
                  <div className="text-muted-foreground">状态机</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{project.ruleModel?.rules.length || 0}</div>
                  <div className="text-muted-foreground">规则</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{project.eventModel?.events.length || 0}</div>
                  <div className="text-muted-foreground">事件</div>
                </div>
              </div>
            </div>

            {/* 生成日志 */}
            {saveLog.length > 0 && (
              <div className="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-xs max-h-32 overflow-y-auto">
                {saveLog.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => !isSaving && setShowSnapDialog(false)} disabled={isSaving}>
                取消
              </Button>
              <Button
                onClick={handleSaveSnapshot}
                disabled={isSaving}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isSaving ? '保存中...' : '保存快照'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 版本历史对话框 */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>快照历史</DialogTitle>
            <DialogDescription>查看所有已保存的本地版本快照</DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            {/* 平台交接提示 */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 mb-4">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                这些是<strong>设计台本地快照</strong>。如需交付给 ontology-platform，请使用
                <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 mx-1">
                  <Download className="h-3 w-3" />
                  导出 OntologyManifest
                </span>
                。
              </AlertDescription>
            </Alert>
            {projectVersions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无快照记录
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {projectVersions
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((version) => (
                    <div key={version.id} className="border rounded-lg p-3 hover:bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{version.name}</span>
                          <Badge variant="secondary">v{version.version}</Badge>
                          {getStatusBadge(version.status)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(version.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {version.description && (
                        <p className="text-sm text-muted-foreground">{version.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>实体: {version.metamodels.data?.entities.length || 0}</span>
                        <span>状态机: {version.metamodels.behavior?.stateMachines.length || 0}</span>
                        <span>规则: {version.metamodels.rules?.rules.length || 0}</span>
                        <span>事件: {version.metamodels.events?.events.length || 0}</span>
                      </div>
                      {version.status === 'pending_review' && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button size="sm" onClick={() => { approveVersion(version.id); }} className="h-7 text-xs">
                            通过
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { rejectVersion(version.id, '版本审核驳回'); }} className="h-7 text-xs">
                            驳回
                          </Button>
                        </div>
                      )}
                      {version.status === 'rejected' && version.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1">驳回原因: {version.rejectionReason}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
