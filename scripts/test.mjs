#!/usr/bin/env node
// Comprueba el repo entero. Uso: npm test
//
//   1. tokens.json y tokens.css coinciden y los contrastes llegan al mínimo;
//   2. las hojas no llevan valores a mano;
//   3. la copia del sistema y classes.json del plugin están al día;
//   4. las páginas del ejemplo y los fragmentos de diagrams pasan delphos-check;
//   5. el sitio del ejemplo está generado con la versión actual de site.py;
//   6. site.py funciona con el sistema en jsDelivr (system como URL): ni copia ni rutas a una copia.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classes, SHIPPED, version } from './build.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PLUGIN = join(ROOT, 'plugins', 'documentation');
const errors = [];
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });

function files(dir, pred = () => true) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p, pred));
    else if (pred(p)) out.push(p);
  }
  return out;
}

run('node', ['scripts/check-tokens.mjs'], { stdio: ['inherit', 'ignore', 'inherit'] });
run('node', ['scripts/check-css.mjs', ...files(join(ROOT, 'system', 'css')).map((f) => relative(ROOT, f))]);

// 3. Copias del plugin.
for (const item of SHIPPED) {
  const src = join(ROOT, 'system', item);
  for (const f of statSync(src).isFile() ? [src] : files(src)) {
    const rel = relative(join(ROOT, 'system'), f);
    let copy;
    try { copy = readFileSync(join(PLUGIN, 'system', rel)); } catch { errors.push(`falta plugins/documentation/system/${rel}: ejecuta npm run build`); continue; }
    if (!copy.equals(readFileSync(f))) errors.push(`plugins/documentation/system/${rel} no coincide con system/${rel}: ejecuta npm run build`);
  }
}
const shippedVersion = readFileSync(join(PLUGIN, 'system', 'VERSION'), 'utf8').trim();
if (shippedVersion !== version()) errors.push(`el plugin lleva el sistema v${shippedVersion} y package.json dice v${version()}`);
const listed = JSON.parse(readFileSync(join(PLUGIN, 'skills', 'check', 'classes.json'), 'utf8'));
if (JSON.stringify(listed) !== JSON.stringify(classes())) errors.push('skills/check/classes.json no coincide con las hojas: ejecuta npm run build');
const tokensVersion = JSON.parse(readFileSync(join(ROOT, 'system', 'tokens.json'), 'utf8')).version;
if (tokensVersion !== version()) errors.push(`system/tokens.json dice v${tokensVersion} y package.json, v${version()}`);
for (const name of ['documentation', 'diagrams']) {
  const m = JSON.parse(readFileSync(join(ROOT, 'plugins', name, '.claude-plugin', 'plugin.json'), 'utf8'));
  if (m.version !== version()) errors.push(`plugins/${name} declara v${m.version}; package.json, v${version()}`);
}

// 4. delphos-check sobre el ejemplo y los fragmentos de diagrams.
const pages = [
  ...files(join(ROOT, 'examples'), (f) => f.endsWith('.html') && !f.includes(`${join('docs', 'design-system')}`)),
  ...files(join(ROOT, 'plugins', 'diagrams', 'skills', 'diagram', 'examples'), (f) => f.endsWith('.html')),
];
try { run('node', [join(PLUGIN, 'scripts', 'delphos-check'), ...pages.map((f) => relative(ROOT, f))], { stdio: ['inherit', 'ignore', 'inherit'] }); }
catch { errors.push('delphos-check encuentra fallos (arriba)'); }

// 5. El sitio del ejemplo, regenerado, no cambia.
try {
  run('uv', ['run', '--quiet', '--no-project', '--with', 'markdown', 'python', join(PLUGIN, 'scripts', 'site.py'), 'build', '--root', 'examples/sample-project', '--check'], { stdio: ['inherit', 'ignore', 'inherit'] });
} catch { errors.push('el sitio del ejemplo no está al día: ejecuta npm run example'); }

// 6. El sistema desde jsDelivr: el ejemplo, sin su copia y con system como URL.
{
  const CDN = `https://cdn.jsdelivr.net/gh/AS-prog/asprog-design-system@v${version()}/system`;
  const tmp = mkdtempSync(join(tmpdir(), 'site-cdn-'));
  try {
    cpSync(join(ROOT, 'examples', 'sample-project'), tmp, { recursive: true, filter: (f) => !f.includes(join('docs', 'design-system')) });
    const toml = join(tmp, 'docs', 'site', 'site.toml');
    const text = readFileSync(toml, 'utf8');
    writeFileSync(toml, /^system\s*=/m.test(text) ? text.replace(/^system\s*=.*$/m, `system = "${CDN}"`) : text.replace(/^\[project\]$/m, `[project]\nsystem = "${CDN}"`));
    const site = (...a) => execFileSync('uv', ['run', '--quiet', '--no-project', '--with', 'markdown', 'python', join(PLUGIN, 'scripts', 'site.py'), ...a, '--root', tmp], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    site('vendor');
    if (files(tmp).some((f) => f.includes('design-system'))) errors.push('site.py vendor con system como URL ha copiado el sistema');
    site('build');
    site('new', 'document', 'registro/prueba/nueva.html', '--title', 'Nueva');
    const mapped = files(tmp, (f) => f.endsWith('.html'));
    for (const f of mapped) {
      const src = readFileSync(f, 'utf8');
      if (/design-system\/v\d/.test(src)) errors.push(`con system como URL, ${relative(tmp, f)} aún enlaza una copia del sistema`);
    }
    const index = readFileSync(join(tmp, 'index.html'), 'utf8');
    for (const want of ['/tokens.css', '/css/base.css', '/css/document.css', '/css/library.css', '/js/library-fold.js']) {
      if (!index.includes(CDN + want)) errors.push(`con system como URL, index.html no enlaza ${CDN + want}`);
    }
    if (!readFileSync(join(tmp, 'registro', 'prueba', 'nueva.html'), 'utf8').includes(`${CDN}/tokens.css`)) errors.push('site.py new no pone la URL del sistema en la plantilla');
    try { run('node', [join(PLUGIN, 'scripts', 'delphos-check'), join(tmp, 'index.html')], { stdio: ['inherit', 'ignore', 'inherit'] }); }
    catch { errors.push('delphos-check no acepta la portada con el sistema en jsDelivr'); }
  } catch (e) { errors.push(`site.py con system como URL falla: ${e.stderr?.toString().trim() || e.message}`); }
  finally { rmSync(tmp, { recursive: true, force: true }); }
}

if (errors.length) { console.error('\n' + errors.map((e) => '✗ ' + e).join('\n')); process.exit(1); }
console.log(`✓ sistema v${version()}: tokens, hojas, plugin, ejemplo y diagramas correctos (${pages.length} páginas revisadas)`);
