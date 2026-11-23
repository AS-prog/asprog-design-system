#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCRIPT = join(ROOT, 'plugins', 'documentation', 'skills', 'change', 'scripts', 'publish-draft');
const EXAMPLE = join(ROOT, 'examples', 'sample-project');
const PAGE = join('tecnica', 'lector-sensores', 'lector-sensores.html');

const FAKE_GH = `#!/usr/bin/env node
const { appendFileSync, copyFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify(args) + '\\n');
const fail = process.env.FAKE_GH_FAIL || '';
const line = args.join(' ');
if (fail && line.startsWith(fail)) { console.error('gh doble: fallo pedido en ' + fail); process.exit(1); }
if (line.startsWith('issue create')) {
  copyFileSync(args[args.indexOf('--body-file') + 1], process.env.FAKE_GH_LOG + '.body');
  console.log('https://github.com/acme/riego/issues/41');
}
else if (args[0] === 'api' && !args.includes('POST')) console.log('9001');
`;

const DRAFT = `---
type: bug
title: El riego no arranca tras un corte de luz
repo: acme/riego
labels: [bug, needs-triage]
parent: 7
status: borrador
date: 2026-11-23
---

## Qué pasa

El controlador se queda en espera. Ejemplo de ruta: \`/tmp/<azar>/estado.json\`.

## Cómo reproducirlo

1. Cortar la corriente.
`;

function workspace({ draft = DRAFT, html = false, broken = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'publish-draft-'));
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'gh'), FAKE_GH);
  chmodSync(join(bin, 'gh'), 0o755);
  let scratch = join(dir, '.scratch', 'riego');
  let page = '';
  if (html) {
    cpSync(EXAMPLE, join(dir, 'site'), { recursive: true });
    scratch = join(dir, 'site', 'tecnica', 'lector-sensores');
    page = join(scratch, 'borrador.html');
    let source = readFileSync(join(dir, 'site', PAGE), 'utf8');
    if (broken) source = source.replace('<body', '<body style="color:#ff0000"');
    writeFileSync(page, source);
  }
  mkdirSync(scratch, { recursive: true });
  const md = join(scratch, 'borrador.md');
  writeFileSync(md, draft);
  return { dir, md, page, log: join(dir, 'gh.log') };
}

function publish(ws, args = [], env = {}) {
  const result = spawnSync('node', [SCRIPT, ws.md, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: join(ws.dir, 'bin') + delimiter + process.env.PATH, FAKE_GH_LOG: ws.log, ...env },
  });
  const calls = existsSync(ws.log) ? readFileSync(ws.log, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  return { code: result.status, out: result.stdout, err: result.stderr, calls };
}

const WRITES = (call) => call[0] === 'issue' || call.includes('POST');
const cases = [];
const test = (name, fn) => cases.push([name, fn]);

test('en seco enseña el plan y no ejecuta ningún gh que escriba', () => {
  const ws = workspace();
  const r = publish(ws);
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(r.calls.filter(WRITES), []);
  for (const want of ['acme/riego', 'El riego no arranca tras un corte de luz', 'bug', 'needs-triage', '#7', ws.md]) assert.ok(r.out.includes(want), `falta ${want} en el plan:\n${r.out}`);
  assert.ok(existsSync(ws.md));
});

test('con --apply sin página: crea con etiquetas y cuerpo sin frontmatter, enlaza al padre y borra el borrador', () => {
  const ws = workspace();
  const r = publish(ws, ['--apply']);
  assert.equal(r.code, 0, r.err);
  const writes = r.calls.filter(WRITES);
  assert.equal(writes.length, 2, JSON.stringify(r.calls));
  const create = writes[0];
  assert.deepEqual(create.slice(0, 2), ['issue', 'create']);
  assert.equal(create[create.indexOf('--repo') + 1], 'acme/riego');
  assert.equal(create[create.indexOf('--title') + 1], 'El riego no arranca tras un corte de luz');
  assert.deepEqual(create.filter((a, i) => create[i - 1] === '--label'), ['bug', 'needs-triage']);
  assert.ok(writes[1].includes('repos/acme/riego/issues/7/sub_issues'));
  assert.ok(writes[1].includes('sub_issue_id=9001'));
  assert.ok(r.out.includes('#41'));
  assert.ok(!existsSync(ws.md));
});

test('el cuerpo que recibe gh no lleva el frontmatter', () => {
  const ws = workspace();
  publish(ws, ['--apply']);
  const body = readFileSync(ws.log + '.body', 'utf8');
  assert.ok(body.startsWith('## Qué pasa'), body.slice(0, 60));
  assert.ok(!body.includes('status: borrador'));
});

test('con --apply y página: crear, enlazar al padre, subir el artefacto, y después borra los dos archivos', () => {
  const ws = workspace({ html: true });
  const r = publish(ws, ['--apply']);
  assert.equal(r.code, 0, r.err + r.out);
  const writes = r.calls.filter(WRITES);
  assert.deepEqual(writes.map((c) => (c[0] === 'api' ? 'parent' : c.slice(0, 3).join(' '))), ['issue create --repo', 'parent', 'issue artifact create']);
  const artifact = writes[2];
  assert.equal(artifact[3], '41');
  assert.match(artifact[4], /[A-Za-z0-9._-]+\.html$/);
  assert.equal(artifact[artifact.indexOf('--repo') + 1], 'acme/riego');
  assert.ok(!existsSync(ws.md) && !existsSync(ws.page));
});

test('un borrador con un <…> de la plantilla no publica nada y lo nombra', () => {
  const ws = workspace({ draft: DRAFT.replace('El controlador se queda en espera.', '<El síntoma, tal como se ve.>') });
  const r = publish(ws, ['--apply']);
  assert.notEqual(r.code, 0);
  assert.deepEqual(r.calls, []);
  assert.ok(r.err.includes('<El síntoma, tal como se ve.>'), r.err);
  assert.ok(existsSync(ws.md));
});

test('sin title o sin repo falla y dice cuál falta', () => {
  const ws = workspace({ draft: DRAFT.replace('repo: acme/riego\n', '') });
  const r = publish(ws, ['--apply']);
  assert.notEqual(r.code, 0);
  assert.deepEqual(r.calls, []);
  assert.ok(r.err.includes('repo'), r.err);
});

test('una página que no pasa delphos-check no publica nada', () => {
  const ws = workspace({ html: true, broken: true });
  const r = publish(ws, ['--apply']);
  assert.notEqual(r.code, 0);
  assert.deepEqual(r.calls, []);
  assert.ok(existsSync(ws.md) && existsSync(ws.page));
});

test('si falla la subida del artefacto, el borrador sigue en su sitio y la salida da el número del issue', () => {
  const ws = workspace({ html: true });
  const r = publish(ws, ['--apply'], { FAKE_GH_FAIL: 'issue artifact' });
  assert.notEqual(r.code, 0);
  assert.ok((r.out + r.err).includes('#41'), r.out + r.err);
  assert.ok(existsSync(ws.md) && existsSync(ws.page));
});

test('un padre en otro repo se enlaza en ese repo', () => {
  const ws = workspace({ draft: DRAFT.replace('parent: 7', 'parent: acme/planes#169') });
  const r = publish(ws, ['--apply']);
  assert.equal(r.code, 0, r.err);
  assert.ok(r.calls.some((c) => c.includes('repos/acme/planes/issues/169/sub_issues')));
});

test('sin padre no se enlaza nada', () => {
  const ws = workspace({ draft: DRAFT.replace('parent: 7', 'parent: null') });
  const r = publish(ws, ['--apply']);
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(r.calls.filter(WRITES).map((c) => c[0]), ['issue']);
});

let failed = 0;
for (const [name, fn] of cases) {
  try { fn(); console.log(`✓ ${name}`); } catch (e) { failed++; console.error(`✗ ${name}\n  ${String(e.message).split('\n').join('\n  ')}`); }
}
if (failed) { console.error(`publish-draft: ${failed} de ${cases.length} pruebas fallan`); process.exit(1); }
console.log(`✓ publish-draft: ${cases.length} pruebas`);
