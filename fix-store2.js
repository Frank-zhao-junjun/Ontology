const fs = require('fs');
const path = require('path');
const file = path.join('E:/00 - AI/Ontology/repo-main/src/store/ontology-store.ts');
let content = fs.readFileSync(file, 'utf8');

// Fix types in implementations
content = content.replace(/addAction:\s*\([^)]*\)\s*=>/g, 'addAction: (action: Action) =>');
content = content.replace(/updateAction:\s*\([^)]*\)\s*=>/g, 'updateAction: (actionId: string, action: Action) =>');
content = content.replace(/deleteAction:\s*\([^)]*\)\s*=>/g, 'deleteAction: (actionId: string) =>');
content = content.replace(/addFunction:\s*\([^)]*\)\s*=>/g, 'addFunction: (func: FunctionDefinition) =>');
content = content.replace(/updateFunction:\s*\([^)]*\)\s*=>/g, 'updateFunction: (funcId: string, func: FunctionDefinition) =>');
content = content.replace(/deleteFunction:\s*\([^)]*\)\s*=>/g, 'deleteFunction: (funcId: string) =>');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed types in store with regex.');