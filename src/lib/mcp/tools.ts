import type { OntologyProject } from '@/types/ontology';
import type { ToolDefinition, ToolHandler } from './types';
import { projectStore, uuidv4, readProjectInput } from './types';

// ── Project Tools (4) ─────────────────────────────────────────────

const listProjectsDefs: ToolDefinition[] = [
  {
    name: 'list_projects',
    description: 'List all ontology modeling projects',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

const listProjectsHandlers: Record<string, ToolHandler> = {
  list_projects: async () => {
    const projects = await projectStore.list();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(projects, null, 2),
        },
      ],
    };
  },
};

const getProjectDefs: ToolDefinition[] = [
  {
    name: 'get_project',
    description: 'Get full project data by ID',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },
];

const getProjectHandlers: Record<string, ToolHandler> = {
  get_project: async (args) => {
    const projectId = args['projectId'] as string;
    if (!projectId) throw new Error("'projectId' is required");
    const project = await projectStore.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(project, null, 2),
        },
      ],
    };
  },
};

const createProjectDefs: ToolDefinition[] = [
  {
    name: 'create_project',
    description: 'Create a new ontology modeling project',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        domain: { type: 'string', description: 'Domain name (e.g. discrete-manufacturing)' },
        description: { type: 'string', description: 'Project description' },
      },
      required: ['name', 'domain'],
    },
  },
];

const createProjectHandlers: Record<string, ToolHandler> = {
  create_project: async (args) => {
    const name = args['name'] as string;
    const domain = args['domain'] as string;
    const description = (args['description'] as string) || '';
    if (!name) throw new Error("'name' is required");

    const projectId = uuidv4();
    const now = new Date().toISOString();
    const project: OntologyProject = {
      id: projectId,
      name,
      domain: { id: domain, name: domain, nameEn: domain, description: '' },
      description,
      dataModel: null,
      behaviorModel: null,
      ruleModel: null,
      processModel: null,
      eventModel: null,
      valueDomains: [],
      capabilities: [],
      scenarios: [],
      epcProcesses: [],
      createdAt: now,
      updatedAt: now,
    };
    await projectStore.save(projectId, name, project);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Project created successfully.\nID: ${projectId}\nName: ${name}\nDomain: ${domain}`,
        },
      ],
    };
  },
};

const exportProjectDefs: ToolDefinition[] = [
  {
    name: 'export_project',
    description: 'Export project data as JSON',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID to export' },
      },
      required: ['projectId'],
    },
  },
];

const exportProjectHandlers: Record<string, ToolHandler> = {
  export_project: async (args) => {
    const projectId = args['projectId'] as string;
    if (!projectId) throw new Error("'projectId' is required");
    const project = await projectStore.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(project, null, 2),
        },
      ],
    };
  },
};

// ── Business Chain Tools (4) ──────────────────────────────────────

const addValueDomainDefs: ToolDefinition[] = [
  {
    name: 'add_value_domain',
    description: 'Add a value domain to a project',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project JSON or object' },
        name: { type: 'string', description: 'Value domain name' },
        nameEn: { type: 'string', description: 'English name' },
        description: { type: 'string', description: 'Description' },
      },
      required: ['project', 'name'],
    },
  },
];

const addValueDomainHandlers: Record<string, ToolHandler> = {
  add_value_domain: async (args) => {
    const project = readProjectInput(args);
    const name = args['name'] as string;
    const nameEn = (args['nameEn'] as string) || '';
    const description = (args['description'] as string) || '';
    if (!name) throw new Error("'name' is required");

    const id = uuidv4();
    const valueDomain = { id, name, nameEn, description, capabilities: [] };
    project.valueDomains = project.valueDomains || [];
    project.valueDomains.push(valueDomain);
    await projectStore.update(project.id, project);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Value domain added.\nID: ${id}\nName: ${name}`,
        },
      ],
    };
  },
};

const addCapabilityDefs: ToolDefinition[] = [
  {
    name: 'add_capability',
    description: 'Add a capability under a value domain',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project JSON or object' },
        parentId: { type: 'string', description: 'Parent value domain ID' },
        name: { type: 'string', description: 'Capability name' },
        nameEn: { type: 'string', description: 'English name' },
        description: { type: 'string', description: 'Description' },
      },
      required: ['project', 'parentId', 'name'],
    },
  },
];

const addCapabilityHandlers: Record<string, ToolHandler> = {
  add_capability: async (args) => {
    const project = readProjectInput(args);
    const parentId = args['parentId'] as string;
    const name = args['name'] as string;
    const nameEn = (args['nameEn'] as string) || '';
    const description = (args['description'] as string) || '';
    if (!parentId) throw new Error("'parentId' is required");
    if (!name) throw new Error("'name' is required");

    const id = uuidv4();
    project.capabilities = project.capabilities || [];
    project.capabilities.push({ id, name, nameEn, description, parentId } as any);
    await projectStore.update(project.id, project);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Capability added.\nID: ${id}\nName: ${name}\nParent: ${parentId}`,
        },
      ],
    };
  },
};

const addScenarioDefs: ToolDefinition[] = [
  {
    name: 'add_scenario',
    description: 'Add a scenario under a capability',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project JSON or object' },
        parentId: { type: 'string', description: 'Parent capability ID' },
        name: { type: 'string', description: 'Scenario name' },
        nameEn: { type: 'string', description: 'English name' },
        description: { type: 'string', description: 'Description' },
      },
      required: ['project', 'parentId', 'name'],
    },
  },
];

const addScenarioHandlers: Record<string, ToolHandler> = {
  add_scenario: async (args) => {
    const project = readProjectInput(args);
    const parentId = args['parentId'] as string;
    const name = args['name'] as string;
    const nameEn = (args['nameEn'] as string) || '';
    const description = (args['description'] as string) || '';

    const cap = (project.capabilities || []).find((c) => c.id === parentId);
    if (!cap) throw new Error(`Capability ${parentId} not found`);

    const id = uuidv4();
    project.scenarios = project.scenarios || [];
    project.scenarios.push({ id, name, nameEn, description, parentId } as any);
    await projectStore.update(project.id, project);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Scenario added.\nID: ${id}\nName: ${name}\nParent: ${parentId}`,
        },
      ],
    };
  },
};

const addEpcProcessDefs: ToolDefinition[] = [
  {
    name: 'add_epc_process',
    description: 'Add an EPC process under a scenario',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project JSON or object' },
        parentId: { type: 'string', description: 'Parent scenario ID' },
        name: { type: 'string', description: 'EPC process name' },
        nameEn: { type: 'string', description: 'English name' },
        description: { type: 'string', description: 'Description' },
      },
      required: ['project', 'parentId', 'name'],
    },
  },
];

const addEpcProcessHandlers: Record<string, ToolHandler> = {
  add_epc_process: async (args) => {
    const project = readProjectInput(args);
    const parentId = args['parentId'] as string;
    const name = args['name'] as string;
    const nameEn = (args['nameEn'] as string) || '';
    const description = (args['description'] as string) || '';

    const sc = (project.scenarios || []).find((s) => s.id === parentId);
    if (!sc) throw new Error(`Scenario ${parentId} not found`);

    const id = uuidv4();
    project.epcProcesses = project.epcProcesses || [];
    project.epcProcesses.push({
      id,
      name,
      nameEn,
      description,
      steps: [],
      status: 'draft' as const,
      parentId,
    } as any);
    await projectStore.update(project.id, project);
    return {
      content: [
        {
          type: 'text' as const,
          text: `EPC process added.\nID: ${id}\nName: ${name}\nParent: ${parentId}`,
        },
      ],
    };
  },
};

// ── Analysis Tools (2) ────────────────────────────────────────────

const analyzeProjectDefs: ToolDefinition[] = [
  {
    name: 'analyze_project',
    description: 'Analyze a project structure and return statistics',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID to analyze' },
      },
      required: ['projectId'],
    },
  },
];

const analyzeProjectHandlers: Record<string, ToolHandler> = {
  analyze_project: async (args) => {
    const projectId = args['projectId'] as string;
    if (!projectId) throw new Error("'projectId' is required");
    const project = await projectStore.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const stats = {
      valueDomains: (project.valueDomains || []).length,
      capabilities: (project.capabilities || []).length,
      scenarios: (project.scenarios || []).length,
      epcProcesses: (project.epcProcesses || []).length,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: `Project Analysis: ${project.name}\n\nValue Domains: ${stats.valueDomains}\nCapabilities: ${stats.capabilities}\nScenarios: ${stats.scenarios}\nEPC Processes: ${stats.epcProcesses}`,
        },
      ],
    };
  },
};

const getBusinessChainDefs: ToolDefinition[] = [
  {
    name: 'get_business_chain',
    description: 'Get the full business chain tree for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },
];

const getBusinessChainHandlers: Record<string, ToolHandler> = {
  get_business_chain: async (args) => {
    const projectId = args['projectId'] as string;
    if (!projectId) throw new Error("'projectId' is required");
    const project = await projectStore.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            valueDomains: project.valueDomains || [],
            capabilities: project.capabilities || [],
            scenarios: project.scenarios || [],
            epcProcesses: project.epcProcesses || [],
          }, null, 2),
        },
      ],
    };
  },
};

// ── Exports ───────────────────────────────────────────────────────

export const allToolDefinitions: ToolDefinition[] = [
  ...listProjectsDefs,
  ...getProjectDefs,
  ...createProjectDefs,
  ...exportProjectDefs,
  ...addValueDomainDefs,
  ...addCapabilityDefs,
  ...addScenarioDefs,
  ...addEpcProcessDefs,
  ...analyzeProjectDefs,
  ...getBusinessChainDefs,
];

export const allToolHandlers: Record<string, ToolHandler> = {
  ...listProjectsHandlers,
  ...getProjectHandlers,
  ...createProjectHandlers,
  ...exportProjectHandlers,
  ...addValueDomainHandlers,
  ...addCapabilityHandlers,
  ...addScenarioHandlers,
  ...addEpcProcessHandlers,
  ...analyzeProjectHandlers,
  ...getBusinessChainHandlers,
};
