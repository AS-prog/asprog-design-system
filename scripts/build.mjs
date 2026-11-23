#!/usr/bin/env node
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTokens, buildCss } from './tokens-lib.mjs';
import { buildDesignMd, designTargets } from './design-md.mjs';
import { buildGrillUi, demoBootstrap } from './build-grill.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SYSTEM = join(ROOT, 'system');
const PLUGIN = join(ROOT, 'plugins', 'documentation');
const GRILL_PLUGIN = join(ROOT, 'plugins', 'grill');

export const SHIPPED = ['tokens.css', 'css', 'js', 'fonts'];
export const PLUGINS = ['documentation', 'diagrams', 'grill'];

const WATCHED = /^(doc-|d-|hl-|g-|lib-|grill-|notice)/;

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

function main() {
  const tokens = loadTokens();
  writeFileSync(join(SYSTEM, 'tokens.css'), buildCss(tokens));

  rmSync(join(SYSTEM, 'design'), { recursive: true, force: true });
  mkdirSync(join(SYSTEM, 'design'), { recursive: true });
  for (const d of designTargets(tokens)) {
    writeFileSync(join(SYSTEM, 'design', d.file), buildDesignMd(tokens, d.theme, d.palette));
  }

  const target = join(PLUGIN, 'skills', 'site', 'system');
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  for (const item of SHIPPED) cpSync(join(SYSTEM, item), join(target, item), { recursive: true });
  writeFileSync(join(target, 'VERSION'), version() + '\n');
  writeFileSync(join(PLUGIN, 'skills', 'check', 'classes.json'), JSON.stringify(classes(), null, 2) + '\n');

  const grillAssets = join(GRILL_PLUGIN, 'skills', 'grill-me', 'assets');
  mkdirSync(grillAssets, { recursive: true });
  writeFileSync(join(grillAssets, 'ui.html'), buildGrillUi(tokens));

  const grillDocs = join(GRILL_PLUGIN, 'docs');
  mkdirSync(grillDocs, { recursive: true });
  writeFileSync(join(grillDocs, 'demo.html'), buildGrillUi(tokens, { bootstrap: demoBootstrap() }));

  for (const name of PLUGINS) {
    const p = join(ROOT, 'plugins', name, '.claude-plugin', 'plugin.json');
    const manifest = JSON.parse(readFileSync(p, 'utf8'));
    manifest.version = version();
    writeFileSync(p, JSON.stringify(manifest, null, 2) + '\n');
  }
  console.log(`plugins preparados con el sistema v${version()}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
