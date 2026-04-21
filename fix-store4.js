const fs = require('fs');
const path = require('path');
const file = path.join('E:/00 - AI/Ontology/repo-main/src/store/ontology-store.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\},[\r\n\s]*addAction: \(action: Action\) => \{/g, '  },\n        addAction: (action: Action) => {');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed brace formatting.');
