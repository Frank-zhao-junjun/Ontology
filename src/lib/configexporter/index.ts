/**
 * 配置导出器 - 按代码生成器草案实现
 * 
 * 导出流程：
 * 1. 校验版本快照完整性
 * 2. 标准化四大元模型并建立实体索引
 * 3. 生成根目录配置文件
 * 4. 生成数据文件
 * 5. 打包为 zip 或目录，并写入导出记录
 */

import { normalizeEntityRoleFields, resolveEntityRole } from '@/lib/entity-role';
import type { 
  OntologyProject, 
  DataModel, 
  BehaviorModel, 
  RuleModel, 
  EventModel,
  Entity,
  EntityRole,
  Attribute,
  StateMachine,
  Rule,
  EventDefinition,
  Subscription
} from '@/types/ontology';

// ========== 导出配置 ==========

export interface ExportConfig {
  includeData: boolean;         // 是否包含示例数据
}

// ========== 导出结果 ==========

export interface ExportedFile {
  path: string;
  content: string;
}

export interface ConfigPackageManifest {
  projectId: string;
  version: string;
  generatedAt: string;
  entityCount: number;
  stateMachineCount: number;
  ruleCount: number;
  eventCount: number;
}

export interface ConfigPackage {
  files: ExportedFile[];
  manifest: ConfigPackageManifest;
}

// ========== 标准化模型 ==========

export interface NormalizedEntity {
  id: string;
  name: string;
  nameEn: string;
  fileName: string;
  className: string;
  tableName: string;
  entityRole: EntityRole;
  parentAggregateId?: string;
  isAggregateRoot: boolean;
  attributes: NormalizedAttribute[];
  relations: NormalizedRelation[];
  stateMachine?: StateMachine;
  rules: Rule[];
  events: EventDefinition[];
}

export interface NormalizedAttribute {
  id: string;
  name: string;
  nameEn: string;
  type: string;
  required: boolean;
  unique: boolean;
  length?: number;
  description?: string;
  columnName: string;
  refEntity?: string;
  referenceTargetType?: 'entity' | 'masterdata';
  masterDataId?: string;
  masterDataName?: string;
  masterDataIds?: string[];
  masterDataNames?: string[];
}

export interface NormalizedRelation {
  id: string;
  name: string;
  type: string;
  targetEntity: string;
  targetEntityName: string;
  foreignKey?: string;
}

// ========== 导出器类 ==========

export class ConfigExporter {
  /**
   * 导出项目配置包
   */
  async export(project: OntologyProject, config: ExportConfig): Promise<ConfigPackage> {
    // 1. 校验项目完整性
    this.validateProject(project);

    // 2. 标准化实体
    const entities = this.normalizeEntities(project);

    // 3. 生成文件
    const files: ExportedFile[] = [
      ...this.generateRootFiles(project, entities),
      ...this.generateDataFiles(project, entities, config)
    ];

    // 4. 构建 manifest
    const manifest: ConfigPackageManifest = {
      projectId: project.id,
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      entityCount: entities.length,
      stateMachineCount: project.behaviorModel?.stateMachines.length || 0,
      ruleCount: project.ruleModel?.rules.length || 0,
      eventCount: project.eventModel?.events.length || 0,
    };

    return { files, manifest };
  }

  /**
   * 校验项目完整性
   */
  private validateProject(project: OntologyProject): void {
    if (!project.id) {
      throw new Error('导出失败：项目ID不能为空');
    }

    if (!project.name) {
      throw new Error('导出失败：项目名称不能为空');
    }

    if (!project.dataModel?.entities?.length) {
      throw new Error('导出失败：数据模型为空，无法生成配置包');
    }
  }

  /**
   * 标准化实体列表
   */
  private normalizeEntities(project: OntologyProject): NormalizedEntity[] {
    const entities = project.dataModel?.entities || [];
    const stateMachines = project.behaviorModel?.stateMachines || [];
    const rules = project.ruleModel?.rules || [];
    const events = project.eventModel?.events || [];

    return entities.map(entity => {
      const normalizedEntity = normalizeEntityRoleFields(entity);

      // 标准化属性
      const attributes = entity.attributes.map(attr => this.normalizeAttribute(attr));
      
      // 标准化关系
      const relations = entity.relations.map(rel => this.normalizeRelation(rel, entities));

      // 关联状态机
      const stateMachine = stateMachines.find(sm => sm.entity === entity.id);

      // 关联规则
      const entityRules = rules.filter(r => r.entity === entity.id);

      // 关联事件
      const entityEvents = events.filter(e => e.entity === entity.id);

      return {
        id: entity.id,
        name: entity.name,
        nameEn: entity.nameEn,
        fileName: this.toFileName(entity.nameEn),
        className: this.toClassName(entity.nameEn),
        tableName: this.toTableName(entity.nameEn),
        entityRole: normalizedEntity.entityRole,
        parentAggregateId: normalizedEntity.parentAggregateId,
        isAggregateRoot: resolveEntityRole(entity) === 'aggregate_root',
        attributes,
        relations,
        stateMachine,
        rules: entityRules,
        events: entityEvents,
      };
    });
  }

  /**
   * 标准化属性
   */
  private normalizeAttribute(attr: Attribute): NormalizedAttribute {
    return {
      id: attr.id,
      name: attr.name,
      nameEn: attr.nameEn || '',
      type: attr.type,
      required: attr.required || false,
      unique: attr.unique || false,
      length: attr.length,
      description: attr.description,
      columnName: this.toColumnName(attr.nameEn || attr.name),
      refEntity: attr.refEntity,
      referenceTargetType: attr.referenceTargetType,
      masterDataId: attr.masterDataId,
      masterDataName: attr.masterDataName,
      masterDataIds: attr.masterDataIds,
      masterDataNames: attr.masterDataNames,
    };
  }

  /**
   * 标准化关系
   */
  private normalizeRelation(rel: { id: string; name: string; type: string; targetEntity: string; foreignKey?: string }, entities: Entity[]): NormalizedRelation {
    const targetEntity = entities.find(e => e.id === rel.targetEntity);
    return {
      id: rel.id,
      name: rel.name,
      type: rel.type,
      targetEntity: rel.targetEntity,
      targetEntityName: targetEntity?.name || 'Unknown',
      foreignKey: rel.foreignKey,
    };
  }

  /**
   * 生成根目录文件
   */
  private generateRootFiles(project: OntologyProject, entities: NormalizedEntity[]): ExportedFile[] {
    const now = new Date().toISOString();

    return [
      {
        path: 'config.json',
        content: JSON.stringify({
          project: project.name,
          version: '1.0.0',
          description: project.description,
          domain: project.domain.name,
          generatedAt: now,
        }, null, 2)
      },
      {
        path: 'README.md',
        content: this.generateReadme(project, entities)
      },
      {
        path: 'manifest.json',
        content: JSON.stringify({
          projectId: project.id,
          version: '1.0.0',
          generatedAt: now,
          entityCount: entities.length,
        }, null, 2)
      }
    ];
  }

  /**
   * 生成数据文件
   */
  private generateDataFiles(project: OntologyProject, entities: NormalizedEntity[], config: ExportConfig): ExportedFile[] {
    const files: ExportedFile[] = [
      {
        path: 'data/entities.json',
        content: JSON.stringify(entities, null, 2)
      },
      {
        path: 'data/state_machines.json',
        content: JSON.stringify(project.behaviorModel?.stateMachines || [], null, 2)
      },
      {
        path: 'data/rules.json',
        content: JSON.stringify(project.ruleModel?.rules || [], null, 2)
      },
      {
        path: 'data/events.json',
        content: JSON.stringify({
          events: project.eventModel?.events || [],
          subscriptions: project.eventModel?.subscriptions || [],
        }, null, 2)
      }
    ];

    // 可选：包含示例数据
    if (config.includeData) {
      files.push({
        path: 'data/seed_data.json',
        content: JSON.stringify(this.generateSeedData(entities), null, 2)
      });
    }

    return files;
  }

  /**
   * 生成 README 内容
   */
  private generateReadme(project: OntologyProject, entities: NormalizedEntity[]): string {
    return `# ${project.name}

## 项目信息
- **领域**: ${project.domain.name}
- **描述**: ${project.description || '暂无描述'}
- **生成时间**: ${new Date().toISOString()}

## 实体列表

${entities.map(e => `### ${e.name} (${e.nameEn})
- 实体角色: ${e.entityRole === 'aggregate_root' ? '聚合根' : '聚合内子实体'}
- 所属聚合: ${e.parentAggregateId || '—'}
- 属性数量: ${e.attributes.length}
- 关系数量: ${e.relations.length}
`).join('\n')}

## 使用说明

1. 解压配置包
2. 在运行时系统中加载配置
3. 开始使用

## 文件结构

\`\`\`
├── config.json          # 模型配置
├── README.md            # 使用说明
├── manifest.json        # 清单文件
└── data/
    ├── entities.json    # 实体定义
    ├── state_machines.json  # 状态机配置
    ├── rules.json       # 业务规则
    ├── events.json      # 事件定义
    └── seed_data.json   # 示例数据（可选）
\`\`\`
`;
  }

  /**
   * 生成示例数据
   */
  private generateSeedData(entities: NormalizedEntity[]): Record<string, unknown[]> {
    const seedData: Record<string, unknown[]> = {};

    entities.forEach(entity => {
      seedData[entity.nameEn] = [{
        id: `sample-${entity.id}`,
        ...entity.attributes.reduce((obj, attr) => {
          obj[attr.nameEn || attr.name] = this.getSampleValue(attr.type);
          return obj;
        }, {} as Record<string, unknown>)
      }];
    });

    return seedData;
  }

  /**
   * 获取示例值
   */
  private getSampleValue(type: string): unknown {
    switch (type) {
      case 'string': return '示例文本';
      case 'text': return '这是一段示例长文本';
      case 'integer': return 123;
      case 'decimal': return 123.45;
      case 'boolean': return true;
      case 'date': return '2024-01-01';
      case 'datetime': return '2024-01-01T12:00:00Z';
      default: return null;
    }
  }

  // ========== 命名转换工具 ==========

  private toFileName(nameEn: string): string {
    return nameEn
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  private toClassName(nameEn: string): string {
    return nameEn
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private toTableName(nameEn: string): string {
    return 't_' + this.toFileName(nameEn);
  }

  private toColumnName(name: string): string {
    return name
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/\s+/g, '_');
  }
}

// 导出单例
export const configExporter = new ConfigExporter();
