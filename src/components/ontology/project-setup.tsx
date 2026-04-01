'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ProjectList } from './project-list';
import type { Domain, OntologyProject } from '@/types/ontology';
import { createProject } from '@/services/project-service';

const PRESET_DOMAINS: Domain[] = [
  { id: 'contract', name: '合同管理', nameEn: 'Contract Management', description: '企业合同全生命周期管理', icon: '📄', color: '#3B82F6' },
  { id: 'customer', name: '客户关系', nameEn: 'CRM', description: '客户关系管理', icon: '👥', color: '#10B981' },
  { id: 'inventory', name: '库存管理', nameEn: 'Inventory', description: '仓储库存管理', icon: '📦', color: '#F59E0B' },
  { id: 'hr', name: '人力资源', nameEn: 'HR', description: '人力资源管理', icon: '👔', color: '#8B5CF6' },
  { id: 'finance', name: '财务管理', nameEn: 'Finance', description: '企业财务管理', icon: '💰', color: '#EF4444' },
  { id: 'project', name: '项目管理', nameEn: 'Project', description: '项目进度管理', icon: '📊', color: '#06B6D4' },
  { id: 'custom', name: '自定义领域', nameEn: 'Custom', description: '自定义业务领域', icon: '⚙️', color: '#6B7280' },
];

export function ProjectSetup() {
  const router = useRouter();
  const { createProject: setProject, importProject } = useOntologyStore();
  const [step, setStep] = useState<'domain' | 'details'>('domain');
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [customDomainName, setCustomDomainName] = useState('');
  const constomDomainNameEn = useState('');
  const [importJson, setImportJson] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleDomainSelect = (domain: Domain) => {
    setSelectedDomain(domain);
    setProjectName(`${domain.name}本体模型`);
    setProjectDescription(domain.description);
    if (domain.id !== 'custom') {
      setStep('details');
    }
  };

  const handleCreateProject = async () => {
    if (!selectedDomain) return;
    
    let domain = selectedDomain;
    if (selectedDomain.id === 'custom') {
      domain = {
        id: customDomainName.toLowerCase().replace(/\s+/g, '_'),
        name: customDomainName,
        nameEn: customDomainName,
        description: projectDescription,
        icon: '⚙️',
        color: '#6B7280',
      };
    }
    
    // 创建项目对象
    const now = new Date().toISOString();
    const projectId = Math.random().toString(36).substring(2, 15);
    const newProject: OntologyProject = {
      id: projectId,
      name: projectName,
      description: projectDescription,
      domain,
      dataModel: null,
      behaviorModel: null,
      ruleModel: null,
      processModel: null,
      eventModel: null,
      createdAt: now,
      updatedAt: now,
    };
    
    try {
      // 保存到数据库
      await createProject(newProject);
      // 更新本地 store
      setProject(projectName, domain, projectDescription);
    } catch (error) {
      console.error('创建项目失败:', error);
      alert(error instanceof Error ? error.message : '创建项目失败');
    }
  };

  const handleImport = () => {
    if (importJson.trim()) {
      importProject(importJson);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            本体模型建模工具
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            基于 Ontology 驱动的元模型建模系统，支持数据、行为、规则、流程、事件五大模型的可视化建模，并生成完整建模手册
          </p>
        </div>

        {showImport ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>导入项目</CardTitle>
              <CardDescription>粘贴之前导出的项目 JSON 数据</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder='{"id":"xxx","name":"..."}'
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={!importJson.trim()}>
                  导入
                </Button>
                <Button variant="outline" onClick={() => setShowImport(false)}>
                  返回
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : step === 'domain' ? (
          <div className="space-y-6">
            {/* Domain Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_DOMAINS.map((domain) => (
                <Card
                  key={domain.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                    selectedDomain?.id === domain.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleDomainSelect(domain)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="text-3xl p-2 rounded-lg"
                        style={{ backgroundColor: `${domain.color}20` }}
                      >
                        {domain.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{domain.name}</h3>
                        <p className="text-sm text-muted-foreground">{domain.nameEn}</p>
                        <p className="text-sm text-muted-foreground mt-1">{domain.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Import Option */}
            <div className="text-center">
              <Button variant="outline" onClick={() => setShowImport(true)}>
                导入已有项目
              </Button>
            </div>
          </div>
        ) : (
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>项目信息</CardTitle>
              <CardDescription>
                为您的 {selectedDomain?.name} 领域本体模型设置基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">项目名称</Label>
                <Input
                  id="name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="输入项目名称"
                />
              </div>
              
              {selectedDomain?.id === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="domainName">领域名称</Label>
                  <Input
                    id="domainName"
                    value={customDomainName}
                    onChange={(e) => setCustomDomainName(e.target.value)}
                    placeholder="输入自定义领域名称"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="description">项目描述</Label>
                <Textarea
                  id="description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="描述这个本体模型的用途"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateProject}
                  disabled={!projectName.trim() || (selectedDomain?.id === 'custom' && !customDomainName.trim())}
                >
                  开始建模
                </Button>
                <Button variant="outline" onClick={() => setStep('domain')}>
                  返回选择领域
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project List */}
        {step === 'domain' && (
          <div className="mt-12">
            <ProjectList />
          </div>
        )}

        {/* Features Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: '数据模型', desc: '实体、属性、关系定义', icon: '🗄️' },
            { title: '行为模型', desc: '状态机、流转、动作', icon: '⚡' },
            { title: '规则模型', desc: '校验、约束、条件', icon: '📋' },
            { title: '事件模型', desc: '事件、订阅、触发', icon: '📨' },
          ].map((item) => (
            <Card key={item.title} className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
