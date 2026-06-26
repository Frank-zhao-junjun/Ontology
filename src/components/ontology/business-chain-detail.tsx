'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useOntologyStore } from '@/store/ontology-store';
import { getBusinessChainDisplayPath, type BusinessChainNodeKind } from '@/lib/business-chain/tree';
import { ModuleStatusBadge } from '@/components/ontology/module-status-badge';
import { ModuleDetailActions } from '@/components/ontology/module-detail-actions';
import { VersionHistoryPanel } from '@/components/ontology/version-history-panel';
import { ModuleReferenceList } from '@/components/ontology/module-reference-list';
import { AiDraftFillTrigger } from '@/components/ontology/ai-draft-fill-dialog';
import { EpcStepsEditor } from '@/components/ontology/epc-steps-editor';
import { ScenarioWorkspace } from '@/components/ontology/scenario-workspace';
import { validateConfirm } from '@/lib/module-version/confirm-flow';
import {
  listIncomingModuleReferences,
  listOutgoingModuleReferences,
} from '@/lib/module-version/module-references';
import { getLatestConfirmed, getModuleDraft } from '@/lib/module-version';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { EpcProcess, MetaDimension, ModuleVersionRecord, Scenario } from '@/types/ontology';
import { generateId } from '@/lib/id';


export interface BusinessChainDetailProps {
  onNavigateToElement?: (elementId: string, dimension: MetaDimension) => void;
}

export function BusinessChainDetail({ onNavigateToElement }: BusinessChainDetailProps = {}) {
  const project = useOntologyStore((s) => s.project);
  const selected = useOntologyStore((s) => s.selectedBusinessChainNode);
  const getStatus = useOntologyStore((s) => s.getBusinessChainModuleStatus);
  const updateValueDomain = useOntologyStore((s) => s.updateValueDomain);
  const updateCapability = useOntologyStore((s) => s.updateCapability);
  const updateScenario = useOntologyStore((s) => s.updateScenario);
  const updateEpcProcess = useOntologyStore((s) => s.updateEpcProcess);
  const saveEpc = useOntologyStore((s) => s.saveEpc);
  const getScenarioChildEpcs = useOntologyStore((s) => s.getScenarioChildEpcs);
  const getScenarioReferenceUnion = useOntologyStore((s) => s.getScenarioReferenceUnion);
  const setSelectedBusinessChainNode = useOntologyStore((s) => s.setSelectedBusinessChainNode);
  const confirmModuleValidated = useOntologyStore((s) => s.confirmModuleValidated);
  const cancelModuleDraft = useOntologyStore((s) => s.cancelModuleDraft);
  const forkModuleToDraft = useOntologyStore((s) => s.forkModuleToDraft);
  const applyAiModuleDraft = useOntologyStore((s) => s.applyAiModuleDraft);
  const getModuleVersions = useOntologyStore((s) => s.getModuleVersions);
  const deriveEpcStepsFromScenario = useOntologyStore((s) => s.deriveEpcStepsFromScenario);
  const applyDerivedStepsToScenarioEpc = useOntologyStore((s) => s.applyDerivedStepsToScenarioEpc);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [derivedSteps, setDerivedSteps] = useState<import('@/lib/epc-derivation').DerivedEpcStep[] | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [archivedPreview, setArchivedPreview] = useState<ModuleVersionRecord | null>(null);

  const slices = useMemo(
    () => ({
      valueDomains: project?.valueDomains,
      capabilities: project?.capabilities,
      scenarios: project?.scenarios,
      epcProcesses: project?.epcProcesses,
    }),
    [project],
  );

  const node = useMemo(() => {
    if (!selected || !project) return null;
    if (selected.kind === 'A') {
      return project.valueDomains?.find((n) => n.id === selected.id) ?? null;
    }
    if (selected.kind === 'B') {
      return project.capabilities?.find((n) => n.id === selected.id) ?? null;
    }
    if (selected.kind === 'C') {
      return project.scenarios?.find((n) => n.id === selected.id) ?? null;
    }
    return project.epcProcesses?.find((n) => n.id === selected.id) ?? null;
  }, [project, selected]);

  const records = project?.moduleVersionRecords ?? [];
  const draft = selected ? getModuleDraft(records, selected.kind, selected.id) : undefined;
  const latestConfirmed = selected ? getLatestConfirmed(records, selected.kind, selected.id) : undefined;
  const status = selected ? getStatus(selected.kind, selected.id) : 'draft';
  const readOnly = status === 'archived' && !latestConfirmed;

  const validationErrors =
    !selected || !project || !node
      ? []
      : validateConfirm(selected.kind, draft?.snapshot ?? node, project);

  const incomingRefs =
    !selected || !project
      ? []
      : listIncomingModuleReferences(project, selected.kind, selected.id);
  const outgoingRefs =
    !selected || !project
      ? []
      : listOutgoingModuleReferences(project, selected.kind, selected.id);

  if (!selected || !project) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
        请在左侧选择业务链节点
      </div>
    );
  }

  if (!node) {
    return null;
  }

  const path = getBusinessChainDisplayPath(slices, selected.kind, selected.id);
  const versions = getModuleVersions(selected.kind, selected.id);
  const previewSnapshot = archivedPreview?.snapshot as { name?: string; description?: string } | undefined;
  const displayName = previewSnapshot?.name ?? node.name;
  const displayDescription = previewSnapshot?.description ?? node.description ?? '';
  const nextVersionNumber = latestConfirmed?.version?.match(/^v(\d+)$/)?.[1] ?? '0';
  const nextVersionLabel = `v${Number.parseInt(nextVersionNumber, 10) + 1}`;

  const applyUpdate = (updates: { name?: string; description?: string }) => {
    if (readOnly) return;
    setFieldErrors([]);
    if (selected.kind === 'A') updateValueDomain(selected.id, updates);
    else if (selected.kind === 'B') updateCapability(selected.id, updates);
    else if (selected.kind === 'C') updateScenario(selected.id, updates);
    else updateEpcProcess(selected.id, updates);
  };

  const handleConfirm = () => {
    const result = confirmModuleValidated(selected.kind, selected.id);
    if (!result.ok) {
      setFieldErrors(result.errors.map((item) => item.field));
      toast.error(result.errors.map((item) => item.message).join('；'));
      return;
    }
    setFieldErrors([]);
    setArchivedPreview(null);
    const archivedMsg = result.archived?.version
      ? `${result.archived.version} → archived；`
      : '';
    toast.success(`${archivedMsg}${result.confirmed.version} 已 confirmed`);
  };

  const handleCancelEdit = () => {
    cancelModuleDraft(selected.kind, selected.id);
    setFieldErrors([]);
    setArchivedPreview(null);
    toast.message('已取消编辑');
  };

  const handleFork = () => {
    forkModuleToDraft(selected.kind, selected.id, node);
    toast.message('已创建新草稿，可继续编辑');
  };

  const ensureDraftForAi = () => {
    if (!draft && latestConfirmed) {
      forkModuleToDraft(selected.kind, selected.id, node);
    }
  };

  const handleApplyAiDraft = (suggestion: Parameters<typeof applyAiModuleDraft>[2]) => {
    applyAiModuleDraft(selected.kind, selected.id, suggestion);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div>
        <p className="text-xs text-muted-foreground mb-1">路径</p>
        <p className="text-sm font-medium" data-testid="business-chain-path">
          {path || displayName}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">版本状态</span>
        <ModuleStatusBadge status={status} />
        <ModuleDetailActions
          kind={selected.kind}
          status={status}
          hasDraft={Boolean(draft)}
          hasConfirmed={Boolean(latestConfirmed)}
          nextVersionLabel={nextVersionLabel}
          validationErrors={validationErrors}
          readOnly={readOnly}
          onConfirm={handleConfirm}
          onCancelEdit={handleCancelEdit}
          onFork={handleFork}
          onViewHistory={() => setHistoryOpen(true)}
        />
        {!readOnly && !archivedPreview && (
          <AiDraftFillTrigger
            moduleKind={selected.kind}
            moduleId={selected.id}
            project={project}
            onEnsureDraft={ensureDraftForAi}
            onApply={handleApplyAiDraft}
          />
        )}
      </div>
      <div className="space-y-2 max-w-md">
        <Label htmlFor="bc-detail-name">名称</Label>
        <Input
          id="bc-detail-name"
          value={displayName}
          disabled={readOnly || Boolean(archivedPreview)}
          aria-invalid={fieldErrors.includes('name')}
          className={fieldErrors.includes('name') ? 'border-destructive' : undefined}
          onChange={(e) => applyUpdate({ name: e.target.value })}
        />
      </div>
      <div className="space-y-2 max-w-lg">
        <Label htmlFor="bc-detail-desc">描述</Label>
        <Textarea
          id="bc-detail-desc"
          value={displayDescription}
          disabled={readOnly || Boolean(archivedPreview)}
          onChange={(e) => applyUpdate({ description: e.target.value })}
          placeholder="节点描述"
        />
      </div>
      {archivedPreview && (
        <p className="text-xs text-amber-700" data-testid="archived-preview-banner">
          正在查看归档版本 {archivedPreview.version}（只读）
        </p>
      )}
      {selected.kind === 'C' && !archivedPreview && (
        <ScenarioWorkspace
          scenario={node as Scenario}
          childEpcs={getScenarioChildEpcs(selected.id)}
          referenceUnion={getScenarioReferenceUnion(selected.id)}
          canApplyDerivedSteps={Boolean(latestConfirmed)}
          onSelectEpc={(epcId) => setSelectedBusinessChainNode({ kind: 'EPC', id: epcId })}
          onNavigateToElement={onNavigateToElement}
          onNavigateToChain={(kind, id) => setSelectedBusinessChainNode({ kind: kind as BusinessChainNodeKind, id })}
          derivedSteps={derivedSteps ?? []}
          onDeriveSteps={() => {
            const steps = deriveEpcStepsFromScenario(selected.id);
            setDerivedSteps(steps);
            if (steps.length === 0) {
              toast.message('无可推导步骤，请先确认八维要素');
            }
          }}
          onApplyDerivedSteps={() => {
            const result = applyDerivedStepsToScenarioEpc(selected.id);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(`已生成 ${result.stepCount} 个步骤到 EPC 草稿`);
            setSelectedBusinessChainNode({ kind: 'EPC', id: result.epcId });
          }}
        />
      )}
      {selected.kind === 'EPC' && !archivedPreview && (
        <div className="max-w-2xl border-t pt-6">
          <EpcStepsEditor
            key={selected.id}
            epc={node as EpcProcess}
            metaElements={project.metaElements ?? []}
            onSave={(next) => saveEpc(selected.id, next)}
            generateId={generateId}
          />
        </div>
      )}
      <ModuleReferenceList incoming={incomingRefs} outgoing={outgoingRefs} />
      <VersionHistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        kind={selected.kind}
        moduleId={selected.id}
        versions={versions}
        latestConfirmedVersion={latestConfirmed?.version}
        onViewSnapshot={(record) => {
          setArchivedPreview(record);
          setHistoryOpen(false);
        }}
      />
    </div>
  );
}
