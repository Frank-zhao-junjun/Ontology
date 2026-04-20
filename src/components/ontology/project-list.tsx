'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { fetchProjects, deleteProject, updateProject } from '@/services/project-service';
import { useOntologyStore } from '@/store/ontology-store';
import type { OntologyProject } from '@/types/ontology';

interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  domain_id: string;
  domain_name: string;
  created_at: string;
  updated_at: string;
}

export function ProjectList() {
  const router = useRouter();
  const { importProject, project: currentProject } = useOntologyStore();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      console.error('加载项目列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadProjects();
    });
  }, [loadProjects]);

  const handleOpenProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        importProject(JSON.stringify(result.data));
        router.push('/tool');
      }
    } catch (error) {
      console.error('打开项目失败:', error);
      alert('打开项目失败');
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`确定要删除项目 "${projectName}" 吗？此操作不可恢复。`)) {
      return;
    }
    
    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('删除项目失败:', error);
      alert('删除项目失败');
    }
  };

  // 打开编辑对话框
  const handleOpenEditDialog = async (project: ProjectListItem) => {
    try {
      // 获取完整项目数据
      const response = await fetch(`/api/projects/${project.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setEditingProject(project);
        setEditName(result.data.name);
        setEditDescription(result.data.description || '');
        setShowEditDialog(true);
      }
    } catch (error) {
      console.error('获取项目数据失败:', error);
      alert('获取项目数据失败');
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingProject || !editName.trim()) {
      alert('项目名称不能为空');
      return;
    }

    setSaving(true);
    try {
      // 获取完整项目数据
      const response = await fetch(`/api/projects/${editingProject.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const fullProject: OntologyProject = result.data;
        // 更新项目名称和描述
        const updatedProject: OntologyProject = {
          ...fullProject,
          name: editName.trim(),
          description: editDescription.trim() || undefined,
        };
        
        await updateProject(updatedProject);
        
        // 更新列表显示
        setProjects(projects.map(p => 
          p.id === editingProject.id 
            ? { ...p, name: editName.trim(), description: editDescription.trim() || null }
            : p
        ));
        
        // 如果当前正在编辑这个项目，也更新 store
        if (currentProject?.id === editingProject.id) {
          importProject(JSON.stringify(updatedProject));
        }
        
        setShowEditDialog(false);
        setEditingProject(null);
      }
    } catch (error) {
      console.error('更新项目失败:', error);
      alert('更新项目失败');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">已有项目</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge variant="secondary">{project.domain_name}</Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {project.description || '暂无描述'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  更新于 {formatDate(project.updated_at)}
                </span>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleOpenProject(project.id)}
                  >
                    打开
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => handleOpenEditDialog(project)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteProject(project.id, project.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 编辑项目对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑项目</DialogTitle>
            <DialogDescription>修改项目名称和描述</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">项目名称</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="输入项目名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">项目描述</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="输入项目描述"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
              >
                取消
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={saving || !editName.trim()}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
