import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Coze deploy scripts', () => {
  it('should start from the project directory when invoked from a parent Ontology layout', () => {
    const parentDir = mkdtempPath();
    const projectDir = join(parentDir, 'Ontology');
    mkdirSync(join(projectDir, 'scripts'), { recursive: true });
    mkdirSync(join(projectDir, 'dist'), { recursive: true });
    writeFileSync(join(projectDir, 'package.json'), '{"name":"ontology-fixture"}\n');
    cpSync(join(process.cwd(), 'scripts', 'start.sh'), join(projectDir, 'scripts', 'start.sh'));

    const cwdFile = join(parentDir, 'started-cwd.txt');
    writeFileSync(
      join(projectDir, 'dist', 'server.js'),
      `require('node:fs').writeFileSync(${JSON.stringify(cwdFile)}, process.cwd());\n`,
    );

    const result = spawnSync('bash', ['Ontology/scripts/start.sh'], {
      cwd: parentDir,
      encoding: 'utf8',
      env: scriptEnv(),
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(readFileSync(cwdFile, 'utf8')).toBe(projectDir);
  });
});

function mkdtempPath(): string {
  return mkdtempSync(join(tmpdir(), 'ontology-coze-'));
}

function scriptEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env, DEPLOY_RUN_PORT: '5999' };
  delete env.COZE_WORKSPACE_PATH;
  return env;
}
