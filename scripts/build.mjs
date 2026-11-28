#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTokens, buildCss, buildStandaloneTokens } from './tokens-lib.mjs';
import { buildDesignMd, designTargets } from './design-md.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SYSTEM = join(ROOT, 'system');
const PLUGIN = join(ROOT, 'plugins', 'documentation');

export const SHIPPED = ['tokens.css', 'standalone.css', 'css', 'js', 'fonts'];
export const STANDALONE_SHEETS = ['css/base.css', 'css/document.css', 'css/single.css'];

const WATCHED = /^(doc-|d-|hl-|g-|lib-|notice)/;

export function classes() {
  const found = new Set();
  for (const f of readdirSync(join(SYSTEM, 'css'))) {
    const css = readFileSync(join(SYSTEM, 'css', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/\.([a-z][a-z0-9-]*)/g)) if (WATCHED.test(m[1])) found.add(m[1]);
  }
  return [...found].sort();
}

export function version() {
  return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
}

/** The single-file stylesheet: standalone tokens followed by the document sheets, comments removed. */
export function standaloneCss(tokens = loadTokens()) {
  const sheets = STANDALONE_SHEETS.map((s) => readFileSync(join(SYSTEM, s), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n{3,}/g, '\n\n').trim());
  return [buildStandaloneTokens(tokens).trim(), ...sheets].join('\n\n') + '\n';
}

function main() {
  const tokens = loadTokens();
  writeFileSync(join(SYSTEM, 'tokens.css'), buildCss(tokens));
  writeFileSync(join(SYSTEM, 'standalone.css'), standaloneCss(tokens));
  rmSync(join(SYSTEM, 'design'), { recursive: true, force: true });
  mkdirSync(join(SYSTEM, 'design'), { recursive: true });
  for (const d of designTargets(tokens)) writeFileSync(join(SYSTEM, 'design', d.file), buildDesignMd(tokens, d.theme, d.palette));
  const target = join(PLUGIN, 'skills', 'site', 'system');
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  for (const item of SHIPPED) cpSync(join(SYSTEM, item), join(target, item), { recursive: true });
  writeFileSync(join(target, 'VERSION'), version() + '\n');
  writeFileSync(join(PLUGIN, 'skills', 'check', 'classes.json'), JSON.stringify(classes(), null, 2) + '\n');
  const examples = join(ROOT, 'examples', 'single');
  for (const f of readdirSync(examples).filter((n) => n.endsWith('.html'))) {
    execFileSync('node', [join(PLUGIN, 'skills', 'single', 'scripts', 'single-html'), 'build', join(examples, f)], { stdio: 'ignore' });
  }
  for (const name of ['documentation', 'diagrams']) {
    const p = join(ROOT, 'plugins', name, '.claude-plugin', 'plugin.json');
    const manifest = JSON.parse(readFileSync(p, 'utf8'));
    manifest.version = version();
    writeFileSync(p, JSON.stringify(manifest, null, 2) + '\n');
  }
  console.log(`plugin documentation preparado con el sistema v${version()}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
