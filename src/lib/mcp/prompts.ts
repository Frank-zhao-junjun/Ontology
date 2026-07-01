import type { PromptDefinition, PromptHandler } from './types';
import { projectStore } from './types';

// ── Prompt Definitions (2) ────────────────────────────────────────

export const allPromptDefinitions: PromptDefinition[] = [
  {
    name: 'ontology-copilot',
    description: 'Start a conversation with the ontology modeling copilot',
    arguments: [
      {
        name: 'projectId',
        description: 'Project ID to model (optional)',
        required: false,
      },
      {
        name: 'task',
        description: 'What do you want to do? (e.g. create value domain, design EPC)',
        required: true,
      },
    ],
  },
  {
    name: 'business-chain-design',
    description: 'Design a business chain (value domain → capability → scenario → EPC)',
    arguments: [
      {
        name: 'projectId',
        description: 'Project ID',
        required: true,
      },
      {
        name: 'description',
        description: 'Describe the business chain you want to design',
        required: true,
      },
    ],
  },
];

export const allPromptHandlers: Record<string, PromptHandler> = {
  'ontology-copilot': async (args) => {
    const task = args['task'] || 'help me with ontology modeling';
    const projectId = args['projectId'];

    let projectContext = '';
    if (projectId) {
      const project = await projectStore.get(projectId);
      if (project) {
        projectContext = `\n\nCurrent Project:\n${JSON.stringify({ id: project.id, name: project.name, domain: project.domain, valueDomains: (project.valueDomains || []).length }, null, 2)}`;
      }
    }

    return {
      description: 'Ontology Modeling Copilot',
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `You are an ontology modeling expert. ${task}${projectContext}\n\nPlease help with the ontology modeling task above. Use the available MCP tools to create or modify the model as needed.`,
          },
        },
      ],
    };
  },

  'business-chain-design': async (args) => {
    const projectId = args['projectId'];
    const description = args['description'] || 'Design a business chain';

    if (!projectId) throw new Error("'projectId' is required");
    const project = await projectStore.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    return {
      description: 'Business Chain Design',
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Design a business chain for project "${project.name}".\n\nRequest: ${description}\n\nCurrent project has ${(project.valueDomains || []).length} value domains.\n\nPlease design the business chain (value domain → capability → scenario → EPC) and use the MCP tools to add them to the project.`,
          },
        },
      ],
    };
  },
};
