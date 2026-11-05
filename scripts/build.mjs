#!/usr/bin/env node
// Prepara el plugin documentation a partir de system/. Uso: npm run build
//
// El plugin no puede mirar fuera de su carpeta (Claude Code lo copia a su
// caché), así que lleva una copia de las hojas, los tokens y las fuentes, y la
// lista de clases que delphos-check admite. Las dos cosas se generan aquí;
// npm test falla si se quedan atrás.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTokens, buildCss } from './tokens-lib.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SYSTEM = join(ROOT, 'system');
const PLUGIN = join(ROOT, 'plugins', 'documentation');

// Lo que viaja con el plugin y luego se copia a cada proyecto.
export const SHIPPED = ['tokens.css', 'css', 'fonts'];

// Prefijos de las clases que delphos-check vigila (regla 8).
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

function main() {
  writeFileSync(join(SYSTEM, 'tokens.css'), buildCss(loadTokens()));
  const target = join(PLUGIN, 'system');
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  for (const item of SHIPPED) cpSync(join(SYSTEM, item), join(target, item), { recursive: true });
  writeFileSync(join(target, 'VERSION'), version() + '\n');
  writeFileSync(join(PLUGIN, 'skills', 'check', 'classes.json'), JSON.stringify(classes(), null, 2) + '\n');
  for (const name of ['documentation', 'diagrams']) {
    const p = join(ROOT, 'plugins', name, '.claude-plugin', 'plugin.json');
    const manifest = JSON.parse(readFileSync(p, 'utf8'));
    manifest.version = version();
    writeFileSync(p, JSON.stringify(manifest, null, 2) + '\n');
  }
  console.log(`plugin documentation preparado con el sistema v${version()}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
