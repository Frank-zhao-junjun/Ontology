const fs = require('fs');
const path = require('path');
const file = path.join('E:/00 - AI/Ontology/repo-main/src/store/ontology-store.ts');
let content = fs.readFileSync(file, 'utf8');

const additionalMethods = `
      addAction: (action) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.behaviorModel || {
            id: generateId(),
            name: \`\${state.project.domain.name}行为模型\`,
            version: '1.0.0',
            domain: state.project.domain.id,
            stateMachines: [],
            actions: [],
            functions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...currentModel,
                actions: [...(currentModel.actions || []), action],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      updateAction: (actionId, action) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                actions: (state.project.behaviorModel.actions || []).map((a) =>
                  a.id === actionId ? action : a
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      deleteAction: (actionId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                actions: (state.project.behaviorModel.actions || []).filter(
                  (a) => a.id !== actionId
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      addFunction: (func) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.behaviorModel || {
            id: generateId(),
            name: \`\${state.project.domain.name}行为模型\`,
            version: '1.0.0',
            domain: state.project.domain.id,
            stateMachines: [],
            actions: [],
            functions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...currentModel,
                functions: [...(currentModel.functions || []), func],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      updateFunction: (funcId, func) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                functions: (state.project.behaviorModel.functions || []).map((f) =>
                  f.id === funcId ? func : f
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      deleteFunction: (funcId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                functions: (state.project.behaviorModel.functions || []).filter(
                  (f) => f.id !== funcId
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },`;

const index = content.indexOf('      deleteStateMachine: (smId) => {');
if (index !== -1) {
  const nextTarget = content.indexOf('      },', index);
  if (nextTarget !== -1) {
    const insertPos = nextTarget + 9;
    content = content.slice(0, insertPos) + additionalMethods + content.slice(insertPos);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully injected methods.');
  }
} else {
  console.log('Could not find deleteStateMachine');
}