// Pi uses the same skill as Claude Code and Codex, with neutral map prompts and no CLI bridge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { REPO, SKILL, makeProject, cleanup, readJson, readGraph } from './helpers.mjs';

test('the Pi package exposes only the shared floorplan skill', () => {
  const pkg = readJson(path.join(REPO, 'package.json'));
  assert.deepEqual(pkg.pi, { skills: ['./skills/floorplan'] });
  assert.ok(fs.existsSync(path.join(REPO, pkg.pi.skills[0], 'SKILL.md')));
  assert.ok(!pkg.dependencies, 'the skill needs no package dependencies');
});

test('the Pi neutral workflow builds and refreshes without host notes or CLI calls', () => {
  const root = makeProject({ 'app.js': 'export const greeting = "Hello";\n' }, {
    arch: { project: { name: 'Hello', summary: 'Greets visitors.' }, nodes: [
      { id: 'app', label: 'Welcome', kind: 'library', summary: 'Greets visitors.', paths: ['app.js'] },
    ] },
  });
  const bin = path.join(root, 'bin');
  const marker = path.join(root, 'host-cli-called');
  fs.mkdirSync(bin);
  for (const cli of ['claude', 'codex']) {
    fs.writeFileSync(path.join(bin, cli), `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)}, 'called'); process.exit(1);\n`, { mode: 0o755 });
  }
  const env = { ...process.env, FLOORPLAN_AGENT: 'none', FLOORPLAN_UNATTENDED: '0', PATH: bin + path.delimiter + process.env.PATH };
  const script = (name, ...args) => execFileSync(process.execPath, [path.join(SKILL, 'scripts', name), root, ...args], { env, encoding: 'utf8' });
  try {
    script('status.mjs');
    script('scan.mjs');
    const build = script('build.mjs', '--claude-md');
    assert.doesNotMatch(build, /CLAUDE\.LOCAL\.MD/);
    script('describe.mjs');
    script('recent.mjs');
    fs.appendFileSync(path.join(root, 'app.js'), 'export const farewell = "Goodbye";\n');
    script('refresh.mjs');
    assert.equal(readGraph(root).meta.agent, 'none');
    assert.ok(fs.existsSync(path.join(root, 'floorplan', 'index.html')));
    assert.ok(!fs.existsSync(path.join(root, 'CLAUDE.local.md')));
    assert.ok(!fs.existsSync(path.join(root, 'AGENTS.md')));
    assert.ok(!fs.existsSync(path.join(root, 'floorplan', '.cache', 'server.json')));
    assert.ok(!fs.existsSync(marker), 'generation never invokes Claude Code or Codex');
  } finally { cleanup(root); }
});
