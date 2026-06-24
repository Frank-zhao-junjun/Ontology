'use client';

import { useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ProjectVersion, PublishConfig } from '@/types/ontology';

interface VersionManagerProps {
  onPublish?: (version: ProjectVersion, config: PublishConfig) => void;
}

export function VersionManager({ onPublish }: VersionManagerProps) {
  const { project, versions, createVersion, publishVersion, archiveVersion, deleteVersion, getLatestVersion } = useOntologyStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(null);
  
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

  const handleCreateVersion = () => {
    if (!newVersion.name.trim()) {
      alert('请输入版本名称');
      return;
    }
    createVersion(newVersion);
    setNewVersion({
      version: suggestNextVersion(),
      name: '',
      description: '',
    });
    setShowCreateDialog(false);
  };

  const handlePublish = () => {
    if (!selectedVersion) return;
    publishVersion(selectedVersion.id);
    onPublish?.(selectedVersion, publishConfig);
    setShowPublishDialog(false);
    setSelectedVersion(null);
  };

  const getStatusBadge = (status: ProjectVersion['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">草稿</Badge>;
      case 'published':
        return <Badge variant="outline" className="text-green-600 border-green-300">已发布</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-gray-600 border-gray-300">已归档</Badge>;
    }
  };

  if (!project) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          请先创建项目
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">版本管理</h2>
          <p className="text-sm text-muted-foreground">
            管理项目版本，支持发布和归档
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setNewVersion({ ...newVersion, version: suggestNextVersion() })}>
              创建新版本
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新版本</DialogTitle>
              <DialogDescription>保存当前项目状态为新版本</DialogDescription>
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
                <Label>描述</Label>
                <Textarea
                  value={newVersion.description}
                  onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                  placeholder="版本更新说明"
                />
              </div>
              
              {/* 当前模型统计 */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium mb-2">当前模型快照</div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-bold">{project.dataModel?.entities.length || 0}</div>
                    <div className="text-muted-foreground">实体</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{project.behaviorModel?.stateMachines.length || 0}</div>
                    <div className="text-muted-foreground">状态机</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{project.ruleModel?.rules.length || 0}</div>
                    <div className="text-muted-foreground">规则</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{project.eventModel?.events.length || 0}</div>
                    <div className="text-muted-foreground">事件</div>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleCreateVersion} className="w-full">
                创建版本
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Version List */}
      {projectVersions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <div className="text-3xl mb-2">📦</div>
            <p>暂无版本</p>
            <p className="text-xs mt-1">点击上方按钮创建第一个版本</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {projectVersions.map((version) => (
              <Card key={version.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{version.name}</CardTitle>
                      <Badge variant="secondary">v{version.version}</Badge>
                      {getStatusBadge(version.status)}
                    </div>
                    <div className="flex items-center gap-1">
                      {version.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedVersion(version);
                            setShowPublishDialog(true);
                          }}
                        >
                          发布
                        </Button>
                      )}
                      {version.status === 'published' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => archiveVersion(version.id)}
                        >
                          归档
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('确定要删除此版本吗？')) {
                            deleteVersion(version.id);
                          }
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  {version.description && (
                    <p className="text-sm text-muted-foreground mb-2">{version.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>创建: {new Date(version.createdAt).toLocaleString()}</span>
                      {version.publishedAt && (
                        <span>发布: {new Date(version.publishedAt).toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>实体: {version.metamodels.data?.entities.length || 0}</span>
                      <span>状态机: {version.metamodels.behavior?.stateMachines.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>发布版本 {selectedVersion?.version}</DialogTitle>
            <DialogDescription>配置发布选项并生成代码包</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Alert>
              <AlertDescription>
                发布后将生成完整的代码包（Flask后端 + React前端 + Docker配置），可用于部署运行时系统。
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label>发布目标</Label>
              <Select
                value={publishConfig.target}
                onValueChange={(value: 'local' | 'remote' | 'download') => 
                  setPublishConfig({ ...publishConfig, target: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="download">下载代码包</SelectItem>
                  <SelectItem value="local">本地Docker</SelectItem>
                  <SelectItem value="remote">远程服务器</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label>发布选项</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeData"
                  checked={publishConfig.includeData}
                  onCheckedChange={(checked) => 
                    setPublishConfig({ ...publishConfig, includeData: !!checked })
                  }
                />
                <label htmlFor="includeData" className="text-sm cursor-pointer">
                  包含示例数据（生成seed.sql）
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
                  启用AI运行时助手（生成AI编排器服务）
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
                  生成Docker Compose配置
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                取消
              </Button>
              <Button onClick={handlePublish} className="bg-gradient-to-r from-green-600 to-blue-600">
                确认发布
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
