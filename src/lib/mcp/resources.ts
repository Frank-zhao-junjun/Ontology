import type { ResourceDefinition, ResourceReader } from './types';
import { projectStore } from './types';

// ── Resource Definitions (4) ──────────────────────────────────────

export const allResourceDefinitions: ResourceDefinition[] = [
  {
    uri: 'ontology://projects',
    name: 'All Projects',
    description: 'List all ontology modeling projects',
    mimeType: 'application/json',
  },
  {
    uri: 'ontology://project/{id}',
    name: 'Project Detail',
    description: 'Get full project data by ID',
    mimeType: 'application/json',
  },
  {
    uri: 'ontology://project/{id}/business-chain',
    name: 'Business Chain',
    description: 'Get the business chain tree for a project',
    mimeType: 'application/json',
  },
  {
    uri: 'ontology://project/{id}/analysis',
    name: 'Project Analysis',
    description: 'Get analysis statistics for a project',
    mimeType: 'application/json',
  },
];

export const allResourceReaders: Record<string, ResourceReader> = {
  'ontology://projects': async () => {
    const projects = await projectStore.list();
    return JSON.stringify(projects, null, 2);
  },

  'ontology://project/{id}': async (uri: string) => {
    const match = uri.match(/ontology:\/\/project\/([^/]+)/);
    if (!match) throw new Error(`Invalid URI: ${uri}`);
    const project = await projectStore.get(match[1]!);
    if (!project) throw new Error(`Project ${match[1]} not found`);
    return JSON.stringify(project, null, 2);
  },

  'ontology://project/{id}/business-chain': async (uri: string) => {
    const match = uri.match(/ontology:\/\/project\/([^/]+)\/business-chain/);
    if (!match) throw new Error(`Invalid URI: ${uri}`);
    const project = await projectStore.get(match[1]!);
    if (!project) throw new Error(`Project ${match[1]} not found`);
    return JSON.stringify(project.valueDomains || [], null, 2);
  },

  'ontology://project/{id}/analysis': async (uri: string) => {
    const match = uri.match(/ontology:\/\/project\/([^/]+)\/analysis/);
    if (!match) throw new Error(`Invalid URI: ${uri}`);
    const project = await projectStore.get(match[1]!);
    if (!project) throw new Error(`Project ${match[1]} not found`);

    const stats = {
      valueDomains: (project.valueDomains || []).length,
      capabilities: (project.capabilities || []).length,
      scenarios: (project.scenarios || []).length,
      epcProcesses: (project.epcProcesses || []).length,
    };
    return JSON.stringify(stats, null, 2);
  },
};
