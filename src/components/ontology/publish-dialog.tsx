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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PublishConfig } from '@/types/ontology';

interface PublishDialogProps {
  onPublished?: () => void;
}

export function PublishDialog({ onPublished }: PublishDialogProps) {
  const { project, versions, createVersion, publishVersion, getLatestVersion } = useOntologyStore();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLog, setGenerationLog] = useState<string[]>([]);
  
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

  const handlePublish = async () => {
    if (!project) return;
    if (!newVersion.name.trim()) {
      alert('请输入版本名称');
      return;
    }
    
    setIsGenerating(true);
    setGenerationLog(['开始生成代码包...']);
    
    try {
      // 创建版本
      setGenerationLog(prev => [...prev, '创建版本快照...']);
      const version = createVersion(newVersion);
      
      // 发布版本
      setGenerationLog(prev => [...prev, '标记版本为已发布...']);
      publishVersion(version.id);
      
      // 调用代码生成API
      setGenerationLog(prev => [...prev, '生成后端代码 (Flask/SQLAlchemy)...']);
      
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
      
      setGenerationLog(prev => [...prev, '生成前端代码 (React/Vite)...']);
      setGenerationLog(prev => [...prev, '生成数据库脚本 (SQLite)...']);
      
      if (publishConfig.dockerCompose) {
        setGenerationLog(prev => [...prev, '生成Docker配置...']);
      }
      
      // 下载代码包
      if (publishConfig.target === 'download' && result.package) {
        setGenerationLog(prev => [...prev, '打包文件...']);
        
        // 将代码包转换为文件结构并打包下载
        const codePackage = result.package;
        const files = codePackage.files || [];
        
        // 下载完整代码包
        const blob = new Blob([JSON.stringify(codePackage, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/\s+/g, '_')}_v${version.version}_code.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        setGenerationLog(prev => [...prev, `✅ 成功生成 ${files.length} 个文件`]);
      }
      
      // 重置表单
      setNewVersion({
        version: suggestNextVersion(),
        name: '',
        description: '',
      });
      
      // 延迟关闭对话框，让用户看到完成状态
      setTimeout(() => {
        setShowPublishDialog(false);
        setGenerationLog([]);
        onPublished?.();
      }, 1500);
      
    } catch (error) {
      console.error('发布失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setGenerationLog(prev => [...prev, `❌ 错误: ${errorMessage}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">草稿</Badge>;
      case 'published':
        return <Badge variant="outline" className="text-green-600 border-green-300">已发布</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-gray-600 border-gray-300">已归档</Badge>;
      default:
        return null;
    }
  };

  if (!project) return null;

  return (
    <>
      {/* 发布下拉按钮 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            📦 发布
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => {
            setNewVersion({ ...newVersion, version: suggestNextVersion() });
            setShowPublishDialog(true);
          }}>
            📦 发布新版本...
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowHistoryDialog(true)}>
            📋 版本历史
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={projectVersions.length === 0}>
            最新: v{latestVersion?.version || '-'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 发布对话框 */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>发布新版本</DialogTitle>
            <DialogDescription>保存当前项目状态并生成代码包</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
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
                <Label>版本名称 *</Label>
                <Input
                  value={newVersion.name}
                  onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                  placeholder="如: 初始版本"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>说明</Label>
              <Textarea
                value={newVersion.description}
                onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                placeholder="版本更新说明"
                className="h-16"
              />
            </div>
            
            {/* 发布选项 */}
            <div className="space-y-3 border-t pt-4">
              <Label>发布选项</Label>
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
            {generationLog.length > 0 && (
              <div className="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-xs max-h-32 overflow-y-auto">
                {generationLog.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => !isGenerating && setShowPublishDialog(false)} disabled={isGenerating}>
                取消
              </Button>
              <Button 
                onClick={handlePublish} 
                disabled={isGenerating}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isGenerating ? '生成中...' : '生成并发布'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 版本历史对话框 */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>版本历史</DialogTitle>
            <DialogDescription>查看所有已创建的版本</DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            {projectVersions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无版本记录
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
