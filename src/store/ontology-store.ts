'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createEmptyEpcModel, ensureEpcProfile as buildEpcProfile, regenerateEpcProfile as rebuildEpcProfile } from '@/lib/epc-generator';
import { normalizeEntity, normalizeOntologyProject } from '@/lib/ontology-normalizer';
import type { 
  OntologyProject, 
  Domain, 
  DataModel, 
  BehaviorModel, 
  RuleModel, 
  ProcessModel, 
  EventModel,
  Entity,
  EntityProject,
  BusinessScenario,
  StateMachine,
  Rule,
  Orchestration,
  EventDefinition,
  Subscription,
  EpcModel,
  EpcAggregateProfile,
  Metadata,
  MasterData,
  MasterDataRecord,
  ProjectVersion,
  PublishConfig
} from '@/types/ontology';

interface OntologyState {
  // 项目信息
  project: OntologyProject | null;
  
  // 元数据列表（全局）
  metadataList: Metadata[];
  
  // 主数据列表（全局）
  masterDataList: MasterData[];
  masterDataRecords: Record<string, MasterDataRecord[]>;
  
  // 版本管理 (M1)
  versions: ProjectVersion[];
  
  // 当前编辑的模型
  activeModelType: 'data' | 'behavior' | 'rule' | 'process' | 'event' | null;
  
  // Actions
  createProject: (name: string, domain: Domain, description?: string) => void;
  updateProjectName: (name: string) => void;
  updateProjectDescription: (description: string) => void;
  
  // 数据模型操作
  setDataModel: (model: DataModel) => void;
  addEntity: (entity: Entity) => void;
  updateEntity: (entityId: string, entity: Entity) => void;
  deleteEntity: (entityId: string) => void;
  
  // 项目分类操作
  addEntityProject: (project: EntityProject) => void;
  updateEntityProject: (projectId: string, project: EntityProject) => void;
  deleteEntityProject: (projectId: string) => void;
  
  // 业务场景操作
  addBusinessScenario: (scenario: BusinessScenario) => void;
  updateBusinessScenario: (scenarioId: string, scenario: BusinessScenario) => void;
  deleteBusinessScenario: (scenarioId: string) => void;
  
  // 行为模型操作
  setBehaviorModel: (model: BehaviorModel) => void;
  addStateMachine: (stateMachine: StateMachine) => void;
  updateStateMachine: (smId: string, stateMachine: StateMachine) => void;
  deleteStateMachine: (smId: string) => void;
  
  // 规则模型操作
  setRuleModel: (model: RuleModel) => void;
  addRule: (rule: Rule) => void;
  updateRule: (ruleId: string, rule: Rule) => void;
  deleteRule: (ruleId: string) => void;
  
  // 流程模型操作（兼容保留，不在当前 UI 暴露）
  setProcessModel: (model: ProcessModel) => void;
  addOrchestration: (orchestration: Orchestration) => void;
  updateOrchestration: (oId: string, orchestration: Orchestration) => void;
  deleteOrchestration: (oId: string) => void;
  
  // 事件模型操作
  setEventModel: (model: EventModel) => void;
  addEventDefinition: (event: EventDefinition) => void;
  updateEventDefinition: (eventId: string, event: EventDefinition) => void;
  deleteEventDefinition: (eventId: string) => void;
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (subId: string, subscription: Subscription) => void;
  deleteSubscription: (subId: string) => void;

  // EPC模型操作
  setEpcModel: (model: EpcModel) => void;
  ensureEpcProfile: (aggregateId: string) => EpcAggregateProfile;
  regenerateEpcDocument: (aggregateId: string) => void;
  
  // 元数据操作
  setMetadataList: (list: Metadata[]) => void;
  addMetadata: (metadata: Metadata) => void;
  updateMetadata: (id: string, metadata: Metadata) => void;
  deleteMetadata: (id: string) => void;
  findMetadataByName: (name: string) => Metadata | undefined;
  findMetadataByNameEn: (nameEn: string) => Metadata | undefined;
  
  // 主数据操作
  setMasterDataList: (list: MasterData[]) => void;
  setMasterDataRecords: (records: Record<string, MasterDataRecord[]>) => void;
  addMasterData: (masterData: MasterData) => void;
  updateMasterData: (id: string, masterData: MasterData) => void;
  deleteMasterData: (id: string) => void;
  addMasterDataRecord: (definitionId: string, record: MasterDataRecord) => void;
  updateMasterDataRecord: (definitionId: string, recordId: string, updates: Partial<MasterDataRecord>) => void;
  deleteMasterDataRecord: (definitionId: string, recordId: string) => void;
  toggleMasterDataRecordStatus: (definitionId: string, recordId: string) => void;
  
  // 版本管理操作 (M1)
  createVersion: (config: { version: string; name: string; description?: string }) => ProjectVersion;
  updateVersion: (versionId: string, updates: Partial<ProjectVersion>) => void;
  deleteVersion: (versionId: string) => void;
  publishVersion: (versionId: string) => void;
  archiveVersion: (versionId: string) => void;
  getVersionsByProject: (projectId: string) => ProjectVersion[];
  getLatestVersion: () => ProjectVersion | null;
  
  // UI状态
  setActiveModelType: (type: 'data' | 'behavior' | 'rule' | 'process' | 'event' | null) => void;
  
  // 重置
  resetProject: () => void;
  clearAllModels: () => void;
  
  // 导入导出
  exportProject: () => string;
  importProject: (json: string) => void;
  
  // 代码生成 (M2准备)
  generateCodePackage: (versionId: string, config: PublishConfig) => Promise<string>;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

function ensureEntityScenario(entity: Entity, stateProject: OntologyProject | null): Entity {
  const scenarios = stateProject?.dataModel?.businessScenarios || [];
  const normalizedEntity = normalizeEntity(entity, scenarios);

  if (!normalizedEntity.businessScenarioId) {
    throw new Error('实体必须归属一个业务场景');
  }

  return normalizedEntity;
}

export const useOntologyStore = create<OntologyState>()(
  persist(
    (set, get) => ({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      
      createProject: (name, domain, description) => {
        const now = new Date().toISOString();
        set({
          project: {
            id: generateId(),
            name,
            description,
            domain,
            dataModel: null,
            behaviorModel: null,
            ruleModel: null,
            processModel: null,
            eventModel: null,
            epcModel: null,
            createdAt: now,
            updatedAt: now,
          },
          activeModelType: 'data',
        });
      },
      
      updateProjectName: (name) => {
        set((state) => ({
          project: state.project ? { ...state.project, name, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      updateProjectDescription: (description) => {
        set((state) => ({
          project: state.project ? { ...state.project, description, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      // 数据模型操作
      setDataModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, dataModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addEntity: (entity) => {
        set((state) => {
          if (!state.project) return state;
          const normalizedEntity = ensureEntityScenario(entity, state.project);
          const currentModel = state.project.dataModel || {
            id: generateId(),
            name: `${state.project.domain.name}数据模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            projects: [],
            businessScenarios: [],
            entities: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              dataModel: {
                ...currentModel,
                entities: [...currentModel.entities, normalizedEntity],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateEntity: (entityId, entity) => {
        set((state) => {
          if (!state.project?.dataModel) return state;
          const existingEntity = state.project.dataModel.entities.find((item) => item.id === entityId);
          if (!existingEntity) {
            return state;
          }

          const normalizedEntity = ensureEntityScenario({
            ...entity,
            businessScenarioId: existingEntity.businessScenarioId,
          }, state.project);

          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                entities: state.project.dataModel.entities.map((e) =>
                  e.id === entityId ? normalizedEntity : e
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteEntity: (entityId) => {
        set((state) => {
          if (!state.project?.dataModel) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                entities: state.project.dataModel.entities.filter((e) => e.id !== entityId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 项目分类管理
      addEntityProject: (project) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.dataModel || {
            id: generateId(),
            name: `${state.project.domain.name}数据模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            projects: [],
            businessScenarios: [],
            entities: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              dataModel: {
                ...currentModel,
                projects: [...(currentModel.projects || []), project],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateEntityProject: (projectId, project) => {
        set((state) => {
          if (!state.project?.dataModel?.projects) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                projects: state.project.dataModel.projects.map((p) =>
                  p.id === projectId ? project : p
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteEntityProject: (projectId) => {
        set((state) => {
          if (!state.project?.dataModel?.projects) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                projects: state.project.dataModel.projects.filter((p) => p.id !== projectId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 业务场景操作
      addBusinessScenario: (scenario) => {
        set((state) => {
          if (!state.project?.dataModel) return state;
          const scenarios = state.project.dataModel.businessScenarios || [];
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                businessScenarios: [...scenarios, scenario],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateBusinessScenario: (scenarioId, scenario) => {
        set((state) => {
          if (!state.project?.dataModel?.businessScenarios) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                businessScenarios: state.project.dataModel.businessScenarios.map((s) =>
                  s.id === scenarioId ? scenario : s
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteBusinessScenario: (scenarioId) => {
        set((state) => {
          if (!state.project?.dataModel?.businessScenarios) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                businessScenarios: state.project.dataModel.businessScenarios.filter((s) => s.id !== scenarioId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 行为模型操作
      setBehaviorModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, behaviorModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addStateMachine: (stateMachine) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.behaviorModel || {
            id: generateId(),
            name: `${state.project.domain.name}行为模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            stateMachines: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...currentModel,
                stateMachines: [...currentModel.stateMachines, stateMachine],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateStateMachine: (smId, stateMachine) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                stateMachines: state.project.behaviorModel.stateMachines.map((sm) =>
                  sm.id === smId ? stateMachine : sm
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteStateMachine: (smId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                stateMachines: state.project.behaviorModel.stateMachines.filter((sm) => sm.id !== smId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 规则模型操作
      setRuleModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, ruleModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addRule: (rule) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.ruleModel || {
            id: generateId(),
            name: `${state.project.domain.name}规则模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            rules: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              ruleModel: {
                ...currentModel,
                rules: [...currentModel.rules, rule],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateRule: (ruleId, rule) => {
        set((state) => {
          if (!state.project?.ruleModel) return state;
          return {
            project: {
              ...state.project,
              ruleModel: {
                ...state.project.ruleModel,
                rules: state.project.ruleModel.rules.map((r) =>
                  r.id === ruleId ? rule : r
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteRule: (ruleId) => {
        set((state) => {
          if (!state.project?.ruleModel) return state;
          return {
            project: {
              ...state.project,
              ruleModel: {
                ...state.project.ruleModel,
                rules: state.project.ruleModel.rules.filter((r) => r.id !== ruleId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 流程模型操作（兼容保留，不在当前 UI 暴露）
      setProcessModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, processModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addOrchestration: (orchestration) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.processModel || {
            id: generateId(),
            name: `${state.project.domain.name}流程模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            orchestrations: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              processModel: {
                ...currentModel,
                orchestrations: [...currentModel.orchestrations, orchestration],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateOrchestration: (oId, orchestration) => {
        set((state) => {
          if (!state.project?.processModel) return state;
          return {
            project: {
              ...state.project,
              processModel: {
                ...state.project.processModel,
                orchestrations: state.project.processModel.orchestrations.map((o) =>
                  o.id === oId ? orchestration : o
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteOrchestration: (oId) => {
        set((state) => {
          if (!state.project?.processModel) return state;
          return {
            project: {
              ...state.project,
              processModel: {
                ...state.project.processModel,
                orchestrations: state.project.processModel.orchestrations.filter((o) => o.id !== oId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 事件模型操作
      setEventModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, eventModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addEventDefinition: (event) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.eventModel || {
            id: generateId(),
            name: `${state.project.domain.name}事件模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            events: [],
            subscriptions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              eventModel: {
                ...currentModel,
                events: [...currentModel.events, event],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateEventDefinition: (eventId, event) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          return {
            project: {
              ...state.project,
              eventModel: {
                ...state.project.eventModel,
                events: state.project.eventModel.events.map((e) =>
                  e.id === eventId ? event : e
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteEventDefinition: (eventId) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          return {
            project: {
              ...state.project,
              eventModel: {
                ...state.project.eventModel,
                events: state.project.eventModel.events.filter((e) => e.id !== eventId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      addSubscription: (subscription) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.eventModel || {
            id: generateId(),
            name: `${state.project.domain.name}事件模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            events: [],
            subscriptions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              eventModel: {
                ...currentModel,
                subscriptions: [...currentModel.subscriptions, subscription],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateSubscription: (subId, subscription) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          return {
            project: {
              ...state.project,
              eventModel: {
                ...state.project.eventModel,
                subscriptions: state.project.eventModel.subscriptions.map((s) =>
                  s.id === subId ? subscription : s
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteSubscription: (subId) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          return {
            project: {
              ...state.project,
              eventModel: {
                ...state.project.eventModel,
                subscriptions: state.project.eventModel.subscriptions.filter((s) => s.id !== subId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      setEpcModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, epcModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },

      ensureEpcProfile: (aggregateId) => {
        const state = get();
        if (!state.project) {
          throw new Error('没有活动项目');
        }

        const profile = buildEpcProfile(state.project, aggregateId);

        set((currentState) => {
          if (!currentState.project) return currentState;

          const currentModel = currentState.project.epcModel || createEmptyEpcModel();
          const exists = currentModel.profiles.some((item) => item.aggregateId === aggregateId);
          const nextProfiles = exists
            ? currentModel.profiles.map((item) => (item.aggregateId === aggregateId ? profile : item))
            : [...currentModel.profiles, profile];

          return {
            project: {
              ...currentState.project,
              epcModel: {
                ...currentModel,
                profiles: nextProfiles,
                updatedAt: new Date().toISOString(),
                generatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });

        return profile;
      },

      regenerateEpcDocument: (aggregateId) => {
        set((state) => {
          if (!state.project) return state;

          const currentModel = state.project.epcModel || createEmptyEpcModel();
          const currentProfile = currentModel.profiles.find((profile) => profile.aggregateId === aggregateId) || buildEpcProfile(state.project, aggregateId);
          const nextProfile = rebuildEpcProfile(state.project, currentProfile);
          const exists = currentModel.profiles.some((profile) => profile.aggregateId === aggregateId);

          return {
            project: {
              ...state.project,
              epcModel: {
                ...currentModel,
                profiles: exists
                  ? currentModel.profiles.map((profile) => (profile.aggregateId === aggregateId ? nextProfile : profile))
                  : [...currentModel.profiles, nextProfile],
                updatedAt: new Date().toISOString(),
                generatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 元数据操作
      setMetadataList: (list) => {
        set({ metadataList: list });
      },
      
      addMetadata: (metadata) => {
        set((state) => ({
          metadataList: [...state.metadataList, metadata],
        }));
      },
      
      updateMetadata: (id, metadata) => {
        set((state) => ({
          metadataList: state.metadataList.map((m) =>
            m.id === id ? { ...metadata, updatedAt: new Date().toISOString() } : m
          ),
        }));
      },
      
      deleteMetadata: (id) => {
        set((state) => ({
          metadataList: state.metadataList.filter((m) => m.id !== id),
        }));
      },
      
      findMetadataByName: (name) => {
        const state = get();
        return state.metadataList.find((m) => m.name === name);
      },
      
      findMetadataByNameEn: (nameEn) => {
        const state = get();
        return state.metadataList.find((m) => m.nameEn === nameEn);
      },
      
      // 主数据操作
      setMasterDataList: (list) => {
        set({ masterDataList: list });
      },

      setMasterDataRecords: (records) => {
        set({ masterDataRecords: records });
      },
      
      addMasterData: (masterData) => {
        set((state) => ({
          masterDataList: [...state.masterDataList, masterData],
        }));
      },
      
      updateMasterData: (id, masterData) => {
        set((state) => ({
          masterDataList: state.masterDataList.map((m) => (m.id === id ? masterData : m)),
        }));
      },
      
      deleteMasterData: (id) => {
        set((state) => {
          const nextRecords = { ...state.masterDataRecords };
          delete nextRecords[id];
          return {
            masterDataList: state.masterDataList.filter((m) => m.id !== id),
            masterDataRecords: nextRecords,
          };
        });
      },

      addMasterDataRecord: (definitionId, record) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: [...(state.masterDataRecords[definitionId] || []), record],
          },
        }));
      },

      updateMasterDataRecord: (definitionId, recordId, updates) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: (state.masterDataRecords[definitionId] || []).map((record) =>
              record.id === recordId
                ? {
                    ...record,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                  }
                : record
            ),
          },
        }));
      },

      deleteMasterDataRecord: (definitionId, recordId) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: (state.masterDataRecords[definitionId] || []).filter((record) => record.id !== recordId),
          },
        }));
      },

      toggleMasterDataRecordStatus: (definitionId, recordId) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: (state.masterDataRecords[definitionId] || []).map((record) =>
              record.id === recordId
                ? {
                    ...record,
                    status: record.status === '00' ? '99' : '00',
                    updatedAt: new Date().toISOString(),
                  }
                : record
            ),
          },
        }));
      },
      
      // UI状态
      setActiveModelType: (type) => {
        set({ activeModelType: type });
      },
      
      // 重置
      resetProject: () => {
        set({ project: null, activeModelType: null });
      },

      clearAllModels: () => {
        set((state) => {
          if (!state.project) return state;

          const now = new Date().toISOString();

          return {
            project: {
              ...state.project,
              dataModel: state.project.dataModel ? {
                ...state.project.dataModel,
                entities: [],
                updatedAt: now,
              } : null,
              behaviorModel: null,
              ruleModel: null,
              processModel: null,
              eventModel: null,
              epcModel: null,
              updatedAt: now,
            },
            activeModelType: null,
          };
        });
      },
      
      // 导入导出
      exportProject: () => {
        const state = get();
        return JSON.stringify(state.project, null, 2);
      },
      
      importProject: (json) => {
        try {
          const project = normalizeOntologyProject(JSON.parse(json) as OntologyProject);
          set({ project, activeModelType: 'data' });
        } catch (error) {
          console.error('导入项目失败:', error);
        }
      },
      
      // 版本管理操作 (M1)
      createVersion: (config) => {
        const state = get();
        if (!state.project) {
          throw new Error('没有活动项目');
        }
        
        const newVersion: ProjectVersion = {
          id: generateId(),
          projectId: state.project.id,
          version: config.version,
          name: config.name,
          description: config.description,
          metamodels: {
            data: state.project.dataModel ? JSON.parse(JSON.stringify(state.project.dataModel)) : null,
            behavior: state.project.behaviorModel ? JSON.parse(JSON.stringify(state.project.behaviorModel)) : null,
            rules: state.project.ruleModel ? JSON.parse(JSON.stringify(state.project.ruleModel)) : null,
            process: state.project.processModel ? JSON.parse(JSON.stringify(state.project.processModel)) : null,
            events: state.project.eventModel ? JSON.parse(JSON.stringify(state.project.eventModel)) : null,
            epc: state.project.epcModel ? JSON.parse(JSON.stringify(state.project.epcModel)) : null,
          },
          createdAt: new Date().toISOString(),
          status: 'draft',
        };
        
        set((s) => ({
          versions: [...s.versions, newVersion],
        }));
        
        return newVersion;
      },
      
      updateVersion: (versionId, updates) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === versionId ? { ...v, ...updates } : v
          ),
        }));
      },
      
      deleteVersion: (versionId) => {
        set((state) => ({
          versions: state.versions.filter((v) => v.id !== versionId),
        }));
      },
      
      publishVersion: (versionId) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === versionId
              ? { ...v, status: 'published' as const, publishedAt: new Date().toISOString() }
              : v
          ),
        }));
      },
      
      archiveVersion: (versionId) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === versionId ? { ...v, status: 'archived' as const } : v
          ),
        }));
      },
      
      getVersionsByProject: (projectId) => {
        const state = get();
        return state.versions.filter((v) => v.projectId === projectId);
      },
      
      getLatestVersion: () => {
        const state = get();
        const projectVersions = state.versions.filter((v) => v.projectId === state.project?.id);
        if (projectVersions.length === 0) return null;
        return projectVersions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
      },
      
      // 代码生成 (M2准备 - 占位)
      generateCodePackage: async (versionId, config) => {
        const state = get();
        const version = state.versions.find((v) => v.id === versionId);
        if (!version) {
          throw new Error('版本不存在');
        }
        
        // M2阶段实现完整代码生成
        // 目前返回版本JSON
        const packageData = {
          version: version.version,
          config,
          metamodels: version.metamodels,
          generatedAt: new Date().toISOString(),
        };
        
        return JSON.stringify(packageData, null, 2);
      },
    }),
    {
      name: 'ontology-storage',
      merge: (persistedState, currentState) => {
        const typedState = persistedState as Partial<OntologyState> | undefined;

        return {
          ...currentState,
          ...typedState,
          project: typedState?.project ? normalizeOntologyProject(typedState.project) : currentState.project,
        };
      },
    }
  )
);
