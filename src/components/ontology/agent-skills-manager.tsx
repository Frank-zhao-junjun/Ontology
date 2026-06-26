'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Bot,
  Zap,
  GitBranch,
  Play,
  Pause,
  Square,
  RotateCcw,
  Plus,
  Loader2,
  Cpu,
  Users,
  Rocket,
  AlertCircle,
} from 'lucide-react';

interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  dependencies?: string[];
  enabled: boolean;
}

interface GstackWorkflowStep {
  id: string;
  name: string;
  type: 'planning' | 'review' | 'execution' | 'validation';
  prompt: string;
  timeout?: number;
  retryCount?: number;
}

interface GstackWorkflow {
  id: string;
  name: string;
  role: string;
  description: string;
  steps: GstackWorkflowStep[];
  enabled: boolean;
}

interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'high' | 'medium' | 'low';
  assignee?: string;
  attempts: number;
  maxAttempts: number;
  errors: string[];
}

interface RalphLoopState {
  iteration: number;
  totalStories: number;
  completedStories: number;
  failedStories: number;
  inProgressStories: number;
  startTime: string;
  lastUpdateTime: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
}

const CATEGORY_LABELS: Record<string, string> = {
  planning: '规划',
  coding: '编码',
  testing: '测试',
  review: '评审',
  deployment: '部署',
  documentation: '文档',
};

const ROLE_LABELS: Record<string, string> = {
  ceo: 'CEO',
  designer: '设计师',
  eng_manager: '工程经理',
  release_manager: '发布经理',
  doc_engineer: '文档工程师',
  qa: 'QA',
};

const STATUS_LABELS: Record<string, string> = {
  idle: '空闲',
  running: '运行中',
  paused: '已暂停',
  completed: '已完成',
  failed: '失败',
};

const STORY_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export function AgentSkillsManager() {
  const [activeTab, setActiveTab] = useState('superpowers');

  // Superpowers
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Gstack
  const [workflows, setWorkflows] = useState<GstackWorkflow[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);

  // Ralph Loop
  const [ralphState, setRalphState] = useState<RalphLoopState | null>(null);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loadingRalph, setLoadingRalph] = useState(false);
  const [ralphActionLoading, setRalphActionLoading] = useState(false);

  // New story form
  const [showAddStory, setShowAddStory] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryDesc, setNewStoryDesc] = useState('');
  const [newStoryPriority, setNewStoryPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const loadSuperpowers = useCallback(async () => {
    setLoadingSkills(true);
    try {
      const res = await fetch('/api/agent/skills?type=superpowers');
      if (res.ok) {
        const data = await res.json();
        setSkills(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  const loadGstack = useCallback(async () => {
    setLoadingWorkflows(true);
    try {
      const res = await fetch('/api/agent/skills?type=gstack');
      if (res.ok) {
        const data = await res.json();
        setWorkflows(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingWorkflows(false);
    }
  }, []);

  const loadRalph = useCallback(async () => {
    setLoadingRalph(true);
    try {
      const res = await fetch('/api/agent/skills?type=ralph');
      if (res.ok) {
        const data = await res.json();
        setRalphState(data.data?.state ?? null);
        setStories(Array.isArray(data.data?.stories) ? data.data.stories : []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingRalph(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSuperpowers();
    });
  }, [loadSuperpowers]);

  useEffect(() => {
    if (activeTab === 'gstack' && workflows.length === 0) {
      queueMicrotask(() => {
        void loadGstack();
      });
    }
  }, [activeTab, workflows.length, loadGstack]);

  useEffect(() => {
    if (activeTab === 'ralph' && !ralphState) {
      queueMicrotask(() => {
        void loadRalph();
      });
    }
  }, [activeTab, ralphState, loadRalph]);

  const handleToggleSkill = async (skillId: string, enabled: boolean) => {
    setTogglingId(skillId);
    try {
      const res = await fetch('/api/agent/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-skill',
          type: 'superpowers',
          data: { skillId, enabled },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSkills((prev) =>
            prev.map((s) => (s.id === skillId ? { ...s, enabled } : s)),
          );
          toast.success(enabled ? '技能已启用' : '技能已禁用');
        } else {
          toast.error('操作失败');
        }
      } else {
        toast.error('操作失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRalphAction = async (action: string) => {
    setRalphActionLoading(true);
    try {
      const res = await fetch('/api/agent/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, type: 'ralph' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success(data.message || '操作成功');
          if (data.state) setRalphState(data.state);
        } else {
          toast.error(data.error || '操作失败');
        }
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setRalphActionLoading(false);
    }
  };

  const handleAddStory = async () => {
    if (!newStoryTitle.trim()) {
      toast.error('请填写故事标题');
      return;
    }
    setRalphActionLoading(true);
    try {
      const res = await fetch('/api/agent/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-story',
          type: 'ralph',
          data: {
            title: newStoryTitle.trim(),
            description: newStoryDesc.trim(),
            acceptanceCriteria: [],
            priority: newStoryPriority,
            maxAttempts: 3,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success('用户故事已添加');
          setShowAddStory(false);
          setNewStoryTitle('');
          setNewStoryDesc('');
          loadRalph();
        }
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setRalphActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          Agent 技能管理
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          管理 AI Agent 技能、工作流和自主循环
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="superpowers" className="gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Superpowers 技能
          </TabsTrigger>
          <TabsTrigger value="gstack" className="gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            Gstack 工作流
          </TabsTrigger>
          <TabsTrigger value="ralph" className="gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            Ralph Loop
          </TabsTrigger>
        </TabsList>

        {/* ========== Superpowers Skills ========== */}
        <TabsContent value="superpowers" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              预定义 AI 技能，可启用/禁用以控制 Agent 行为
            </p>
            <Button variant="ghost" size="sm" onClick={loadSuperpowers} disabled={loadingSkills}>
              {loadingSkills ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            </Button>
          </div>

          {loadingSkills && skills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              加载中...
            </div>
          ) : skills.length === 0 ? (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>暂无可用技能</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.map((skill) => (
                <Card key={skill.id} className={skill.enabled ? '' : 'opacity-60'}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold truncate">{skill.name}</h4>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {CATEGORY_LABELS[skill.category] || skill.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{skill.description}</p>
                        {skill.dependencies && skill.dependencies.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            依赖: {skill.dependencies.join(', ')}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={skill.enabled}
                        disabled={togglingId === skill.id}
                        onCheckedChange={(v) => handleToggleSkill(skill.id, v)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========== Gstack Workflows ========== */}
        <TabsContent value="gstack" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Claude Code 工作流技能，按角色组织的工作流步骤
            </p>
            <Button variant="ghost" size="sm" onClick={loadGstack} disabled={loadingWorkflows}>
              {loadingWorkflows ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            </Button>
          </div>

          {loadingWorkflows && workflows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              加载中...
            </div>
          ) : workflows.length === 0 ? (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>暂无可用工作流</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {workflows.map((wf) => (
                <Card key={wf.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">{wf.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {ROLE_LABELS[wf.role] || wf.role}
                        </Badge>
                      </div>
                      <Badge variant={wf.enabled ? 'default' : 'secondary'} className="text-xs">
                        {wf.enabled ? '已启用' : '已禁用'}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">{wf.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {wf.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-2">
                          {idx > 0 && <span className="text-muted-foreground text-xs">→</span>}
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded border bg-muted/30 text-xs">
                            <span className="font-medium">{step.name}</span>
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {step.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========== Ralph Loop ========== */}
        <TabsContent value="ralph" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              自主 AI 代理循环，自动执行用户故事
            </p>
            <Button variant="ghost" size="sm" onClick={loadRalph} disabled={loadingRalph}>
              {loadingRalph ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            </Button>
          </div>

          {/* State panel */}
          {ralphState ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Ralph Loop — {STATUS_LABELS[ralphState.status] || ralphState.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        迭代 {ralphState.iteration} · 启动于 {new Date(ralphState.startTime).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ralphState.status !== 'running' ? (
                      <Button
                        size="sm"
                        disabled={ralphActionLoading}
                        onClick={() => handleRalphAction('start-loop')}
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />
                        启动
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={ralphActionLoading}
                        onClick={() => handleRalphAction('pause-loop')}
                      >
                        <Pause className="w-3.5 h-3.5 mr-1" />
                        暂停
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={ralphActionLoading}
                      onClick={() => handleRalphAction('stop-loop')}
                    >
                      <Square className="w-3.5 h-3.5 mr-1" />
                      停止
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={ralphActionLoading}
                      onClick={() => handleRalphAction('reset-loop')}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      重置
                    </Button>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">总故事数</p>
                    <p className="text-lg font-semibold tabular-nums">{ralphState.totalStories}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">已完成</p>
                    <p className="text-lg font-semibold tabular-nums text-green-600">{ralphState.completedStories}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">进行中</p>
                    <p className="text-lg font-semibold tabular-nums text-blue-600">{ralphState.inProgressStories}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">失败</p>
                    <p className="text-lg font-semibold tabular-nums text-red-600">{ralphState.failedStories}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {loadingRalph ? '加载中...' : '暂无 Ralph Loop 状态'}
            </div>
          )}

          {/* Add story */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  用户故事
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddStory((v) => !v)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  添加故事
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAddStory && (
                <div className="border rounded-md p-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">标题</Label>
                    <Input
                      className="h-9"
                      placeholder="作为...，我希望...，以便..."
                      value={newStoryTitle}
                      onChange={(e) => setNewStoryTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">描述</Label>
                    <Input
                      className="h-9"
                      placeholder="详细描述..."
                      value={newStoryDesc}
                      onChange={(e) => setNewStoryDesc(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">优先级</Label>
                      <div className="flex gap-1">
                        {(['high', 'medium', 'low'] as const).map((p) => (
                          <Button
                            key={p}
                            size="sm"
                            variant={newStoryPriority === p ? 'default' : 'outline'}
                            className="h-7 px-2 text-xs"
                            onClick={() => setNewStoryPriority(p)}
                          >
                            {PRIORITY_LABELS[p]}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" disabled={ralphActionLoading} onClick={handleAddStory}>
                      确认添加
                    </Button>
                  </div>
                </div>
              )}

              {stories.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  暂无用户故事
                </div>
              ) : (
                <div className="space-y-2">
                  {stories.map((story) => (
                    <div key={story.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STORY_STATUS_COLORS[story.status] || ''}`}>
                            {story.status}
                          </span>
                          <span className="text-sm font-medium truncate">{story.title}</span>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {PRIORITY_LABELS[story.priority] || story.priority}
                        </Badge>
                      </div>
                      {story.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{story.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>尝试 {story.attempts}/{story.maxAttempts}</span>
                        {story.errors.length > 0 && (
                          <span className="text-destructive">错误 {story.errors.length}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
