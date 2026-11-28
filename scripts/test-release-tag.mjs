#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { version } from './build.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKILLS = join(ROOT, 'plugins', 'documentation', 'skills');
const CHECK = join(SKILLS, 'check', 'scripts', 'delphos-check');
const STANDALONE = join(SKILLS, 'change', 'scripts', 'standalone-html');
const CDN = `https://cdn.jsdelivr.net/gh/AS-prog/asprog-design-system@v${version()}/system`;

const FETCH_STUB = `globalThis.fetch = async (url, opts = {}) => {
  const status = Number(process.env.STUB_STATUS);
  if (process.env.STUB_OFFLINE) throw new TypeError('fetch failed');
  return { ok: status === 200, status, json: async () => [], arrayBuffer: async () => new ArrayBuffer(0) };
};
`;

const PAGE = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Prueba del tag</title>
<meta name="description" content="Página mínima que enlaza el sistema en jsDelivr.">
<link rel="stylesheet" href="${CDN}/tokens.css">
</head>
<body><main class="doc-prose"><h1>Prueba del tag</h1></main></body>
</html>
`;

const tmp = mkdtempSync(join(tmpdir(), 'release-tag-'));
try {
  const stub = join(tmp, 'fetch-stub.mjs');
  const page = join(tmp, 'page.html');
  writeFileSync(stub, FETCH_STUB);
  writeFileSync(page, PAGE);
  const run = (script, args, env) => spawnSync('node', ['--import', stub, script, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });

  const missing = run(CHECK, [page], { STUB_STATUS: '404' });
  assert.match(missing.stderr, new RegExp(`aviso: jsDelivr no tiene el tag v${version().replaceAll('.', '\\.')}`), 'delphos-check avisa si el tag de la versión del plugin no está publicado');
  const published = run(CHECK, [page], { STUB_STATUS: '200' });
  assert.equal(missing.status, published.status, 'el aviso no cambia la salida de delphos-check');
  assert.doesNotMatch(published.stderr, /jsDelivr no tiene el tag/, 'delphos-check calla si el tag está publicado');
  const offline = run(CHECK, [page], { STUB_OFFLINE: '1' });
  assert.equal(offline.status, published.status, 'sin red, delphos-check sigue igual');
  assert.doesNotMatch(offline.stderr, /jsDelivr no tiene el tag/, 'sin red, delphos-check no avisa del tag');

  const out = (name) => join(tmp, name);
  const sMissing = run(STANDALONE, [page, out('missing.html')], { STUB_STATUS: '404' });
  assert.equal(sMissing.status, 0, `standalone-html termina aunque falte el tag: ${sMissing.stderr}`);
  assert.match(sMissing.stderr, /standalone-html: aviso: jsDelivr no tiene el tag/, 'standalone-html avisa si el tag no está publicado');
  const sPublished = run(STANDALONE, [page, out('published.html')], { STUB_STATUS: '200' });
  assert.equal(sPublished.status, 0, `standalone-html termina con el tag publicado: ${sPublished.stderr}`);
  assert.doesNotMatch(sPublished.stderr, /jsDelivr no tiene el tag/, 'standalone-html calla si el tag está publicado');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log('✓ delphos-check y standalone-html avisan del tag sin publicar');
