import re
import os

base = 'src'
store_path = os.path.join(base, 'store/ontology-store.ts')
with open(store_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove store-adapter import block
content = re.sub(
    r"import \{\s*storeAddValueDomain,\s*storeUpdateValueDomain,\s*storeDeleteValueDomain,\s*storeAddCapability,\s*storeUpdateCapability,\s*storeDeleteCapability,\s*storeAddScenario,\s*storeUpdateScenario,\s*storeDeleteScenario,\s*storeAddEpcProcess,\s*storeUpdateEpcProcess,\s*storeDeleteEpcProcess,\s*\} from '@/lib/ontology-core/store-adapter';\n",
    '',
    content,
    flags=re.DOTALL,
)

# Replace business chain CRUD block
old_block = """      addValueDomain: (input) => {
        if (!get().project) throw new Error('没有活动项目');
        return storeAddValueDomain(set, get().project, input);
      },

      updateValueDomain: (id, updates) => {
        if (!get().project) throw new Error('没有活动项目');
        storeUpdateValueDomain(set, get().project, id, updates);
      },

      deleteValueDomain: (id) => {
        storeDeleteValueDomain(set, get, id);
      },

      addCapability: (parentAId, input) => {
        if (!get().project) throw new Error('没有活动项目');
        return storeAddCapability(set, get().project, parentAId, input);
      },

      updateCapability: (id, updates) => {
        if (!get().project) throw new Error('没有活动项目');
        storeUpdateCapability(set, get().project, id, updates);
      },

      deleteCapability: (id) => {
        storeDeleteCapability(set, get, id);
      },

      addScenario: (parentBId, input) => {
        if (!get().project) throw new Error('没有活动项目');
        return storeAddScenario(set, get().project, parentBId, input);
      },

      updateScenario: (id, updates) => {
        if (!get().project) throw new Error('没有活动项目');
        storeUpdateScenario(set, get().project, id, updates);
      },

      deleteScenario: (id) => {
        storeDeleteScenario(set, get, id);
      },

      addEpcProcess: (parentCId, input) => {
        if (!get().project) throw new Error('没有活动项目');
        return storeAddEpcProcess(set, get().project, parentCId, input);
      },

      updateEpcProcess: (id, updates) => {
        if (!get().project) throw new Error('没有活动项目');
        storeUpdateEpcProcess(set, get().project, id, updates);
      },

      deleteEpcProcess: (id) => {
        storeDeleteEpcProcess(set, get, id);
      },"""

new_block = """      addValueDomain: (input) => {
        const { project } = get();
        if (!project) throw new Error('没有活动项目');
        const { project: nextProject, node } = addValueDomainPure(project, input);
        set({ project: nextProject, selectedBusinessChainNode: { kind: 'A', id: node.id } });
        return node;
      },

      updateValueDomain: (id, updates) => {
        const { project } = get();
        if (!project) throw new Error('没有活动项目');
        set({ project: updateValueDomainPure(project, id, updates).project });
      },

      deleteValueDomain: (id) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        const { project } = deleteValueDomainPure(state.project, id);
        set({
          project,
          selectedBusinessChainNode:
            state.selectedBusinessChainNode?.kind === 'A' && state.selectedBusinessChainNode.id === id
              ? null
              : state.selectedBusinessChainNode,
        });
      },

      addCapability: (parentAId, input) => {
        const { project } = get();
        if (!project) throw new Error('没有活动项目');
        const { project: nextProject, node } = addCapabilityPure(project, parentAId, input);
        set({ project: nextProject, selectedBusinessChainNode: { kind: 'B', id: node.id } });
        return node;
      },

      updateCapability: (id, updates) => {
        const { project } = get();
        if (!project) throw new Error('没有活动项目');
        set({ project: updateCapabilityPure(project, id, updates).project });
      },

      deleteCapability: (id) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        const { project } = deleteCapabilityPure(state.project, id);
        set({
          project,
          selectedBusinessChainNode:
            state.selectedBusinessChainNode?.kind === 'B' && state.selectedBusinessChainNode.id === id
              ? null
              : state.selectedBusinessChainNode,
        });
      },

      addScenario: (parentBId, input) => {
        const { project } = get();
        if (!project) throw new Error('没有活动项目');
        const { project: nextProject, node } = addScenarioPure(project, parentBId, input);
        set({ project: nextProject, selectedBusinessChainNode: { kind: 'C', id: node.id } });
        return node;
      },

      updateScenario: (id, updates) => {
        const { project } = get();
        if (!project) throw new Error('没有活动项目');
        set({ project: updateScenarioPure(project, id, updates).project });
      },

      deleteScenario: (id) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        const { project } = deleteScenarioPure(state.project, id);
        set({
          project,
          selectedBusinessChainNode:
            state.selectedBusinessChainNode?.kind === 'C' && state.selectedBusinessChainNode.id === id
              ? null
              : state.selectedBusinessChainNode,
        });
      },

      addEpcProcess: (parentCId, input) => {
        const { project } = get();
        if (!project) throw new Error('没有活动项目');
        const { project: nextProject, node } = addEpcProcessPure(project, parentCId, input);
        set({ project: nextProject, selectedBusinessChainNode: { kind: 'EPC', id: node.id } });
        return node;
      },

      updateEpcProcess: (id, updates) => {
        const { project } = get();
        if (!project) throw new Error('没有活动项目');
        set({ project: updateEpcProcessPure(project, id, updates).project });
      },

      deleteEpcProcess: (id) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        const { project } = deleteEpcProcessPure(state.project, id);
        set({
          project,
          selectedBusinessChainNode:
            state.selectedBusinessChainNode?.kind === 'EPC' && state.selectedBusinessChainNode.id === id
              ? null
              : state.selectedBusinessChainNode,
        });
      },"""

if old_block not in content:
    print('ERROR: business chain old block not found')
    raise SystemExit(1)
content = content.replace(old_block, new_block)
print('Replaced business chain block')

# Replace getBusinessEpcWarnings
old_warnings = """      getBusinessEpcWarnings: () => {
        const project = get().project;
        if (!project) return [];
        return lintBusinessEpc({
          moduleVersionRecords: project.moduleVersionRecords ?? [],
          scenarios: project.scenarios,
          epcProcesses: project.epcProcesses,
          metaElements: project.metaElements,
        });
      },"""

new_warnings = """      getBusinessEpcWarnings: () => {
        const { project } = get();
        return project ? getBusinessEpcWarningsPure(project) : [];
      },"""

if old_warnings in content:
    content = content.replace(old_warnings, new_warnings)
    print('Replaced getBusinessEpcWarnings')
else:
    print('WARNING: getBusinessEpcWarnings old block not found')

# Replace getSemanticCoverage
old_semantic = """      getSemanticCoverage: () => {
        const { project } = get();
        if (!project?.agentSemanticLayer) return null;
        const layer = project.agentSemanticLayer;
        const totalEntities = project.dataModel?.entities.length || 0;
        const totalActions = project.behaviorModel?.actions?.length || 0;
        const entitiesWithIntents = new Set(layer.intents.map((i) => i.targetEntityId)).size;
        const actionsWithRecovery = new Set(layer.errorRecoveries.map((er) => er.actionId)).size;
        return {
          entitiesWithIntents,
          totalEntities,
          actionsWithRecovery,
          totalActions,
        };
      },"""

new_semantic = """      getSemanticCoverage: () => {
        const { project } = get();
        return project ? getSemanticCoveragePure(project) : null;
      },"""

if old_semantic in content:
    content = content.replace(old_semantic, new_semantic)
    print('Replaced getSemanticCoverage')
else:
    print('WARNING: getSemanticCoverage old block not found, may already be adapted')

# Replace query functions
old_queries = """      getUnreferencedElements: () => {
        const elements = get().project?.metaElements ?? [];
        return filterUnreferencedElements(elements, true);
      },

      getScenarioChildEpcs: (scenarioId) => {
        return getChildEpcProcesses(scenarioId, get().project?.epcProcesses);
      },

      getScenarioReferenceUnion: (scenarioId) => {
        const project = get().project;
        return buildScenarioReferenceUnion(
          scenarioId,
          project?.epcProcesses,
          project?.metaElements,
        );
      },

      getEpcCoverage: (scenarioId) => {
        const project = get().project;
        if (!project) return emptyCoverageReport(scenarioId);
        return computeCoverage({
          scenarioId,
          scenarios: project.scenarios ?? [],
          epcProcesses: project.epcProcesses ?? [],
          metaElements: project.metaElements ?? [],
          moduleVersionRecords: project.moduleVersionRecords ?? [],
        });
      },

      getCrossConsistency: (scenarioId) => {
        const project = get().project;
        if (!project) return [];
        return validateCrossConsistency({
          scenarioId,
          scenarios: project.scenarios ?? [],
          capabilities: project.capabilities ?? [],
          valueDomains: project.valueDomains ?? [],
          epcProcesses: project.epcProcesses ?? [],
          metaElements: project.metaElements ?? [],
          moduleVersionRecords: project.moduleVersionRecords ?? [],
          behaviorModel: project.behaviorModel ?? null,
          eventModel: project.eventModel ?? null,
          ruleModel: project.ruleModel ?? null,
          metricsModel: project.metricsModel ?? null,
          dataSourcesModel: project.dataSourcesModel ?? null,
          governanceModel: project.governanceModel ?? null,
        });
      },

      deriveEpcStepsFromScenario: (scenarioId) => {
        const project = get().project;
        if (!project) return [];
        if (!getLatestConfirmed(project.moduleVersionRecords ?? [], 'C', scenarioId)) return [];
        const confirmed = filterConfirmedMetaElements(
          project.metaElements ?? [],
          project.moduleVersionRecords ?? [],
        );
        return deriveEpcSteps({ metaElements: confirmed });
      },"""

new_queries = """      getUnreferencedElements: () => {
        const { project } = get();
        return project ? getUnreferencedElementsPure(project) : [];
      },

      getScenarioChildEpcs: (scenarioId) => {
        return getChildEpcProcesses(scenarioId, get().project?.epcProcesses);
      },

      getScenarioReferenceUnion: (scenarioId) => {
        const project = get().project;
        return buildScenarioReferenceUnion(
          scenarioId,
          project?.epcProcesses,
          project?.metaElements,
        );
      },

      getEpcCoverage: (scenarioId) => {
        const { project } = get();
        return project ? getEpcCoveragePure(project, scenarioId) : emptyCoverageReport(scenarioId);
      },

      getCrossConsistency: (scenarioId) => {
        const { project } = get();
        return project ? getCrossConsistencyPure(project, scenarioId) : [];
      },

      deriveEpcStepsFromScenario: (scenarioId) => {
        const { project } = get();
        return project ? deriveEpcStepsFromScenarioPure(project, scenarioId) : [];
      },"""

if old_queries not in content:
    print('ERROR: query old block not found')
    raise SystemExit(1)
content = content.replace(old_queries, new_queries)
print('Replaced query block')

with open(store_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Wrote', store_path)

# Fix copilot panel
copilot_path = os.path.join(base, 'components/ontology/copilot/modeling-copilot-panel.tsx')
if os.path.exists(copilot_path):
    with open(copilot_path, 'r', encoding='utf-8') as f:
        copilot = f.read()

    import_marker = "import { useOntologyStore } from '@/store/ontology-store';"
    if import_marker in copilot and "from '@/lib/action-executor'" not in copilot:
        copilot = copilot.replace(
            import_marker,
            import_marker + "\nimport { executeActions, type ActionResult, type CopilotAction } from '@/lib/action-executor';"
        )
        print('Added action-executor import to copilot')

    with open(copilot_path, 'w', encoding='utf-8') as f:
        f.write(copilot)
    print('Wrote', copilot_path)

print('Done')
