#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKILLS = join(ROOT, 'plugins', 'documentation', 'skills');
const CHECK = join(SKILLS, 'check', 'scripts', 'delphos-check');
const SINGLE = join(SKILLS, 'single', 'scripts', 'single-html');
const EXAMPLES = join(ROOT, 'examples', 'single');

const node = (...args) => spawnSync('node', args, { encoding: 'utf8' });
const check = (file, ...flags) => node(CHECK, file, ...flags);

const FILL = {
  'una frase: de qué trata': 'Un informe de prueba en un solo fichero.',
  brand: 'riego',
  'área': 'pruebas',
  date: '2026-11-28',
  'borrador | revisado | vigente | archivado': 'borrador',
  'Sección 1': 'Qué mide',
  texto: 'El controlador lee la humedad cada diez minutos.',
  'Fuente: ruta.md o enlace': 'Fuente: informe.md',
};
const fill = (html) => html.replace(/\{\{([^}]*)\}\}/g, (_, k) => FILL[k] ?? k);

const DIAGRAM = `<figure class="figwrap"><svg role="img" viewBox="0 0 10 10"><title>Caja</title><desc>Una caja.</desc><rect class="d-box" x="1" y="1" width="8" height="8"/></svg><figcaption>Una caja.</figcaption></figure>`;

const tmp = mkdtempSync(join(tmpdir(), 'single-'));
try {
  const file = join(tmp, 'informe.html');
  let r = node(SINGLE, 'new', file, '--title', 'Informe de riego');
  assert.equal(r.status, 0, r.stderr);
  const page = fill(readFileSync(file, 'utf8')).replace('</article>', `${DIAGRAM}\n</article>`);
  writeFileSync(file, page);
  assert.match(page, /^<!doctype html>/, 'el destino file lleva su documento completo');
  assert.match(page, /fonts=embed/, 'el destino file mete las fuentes por defecto');
  assert.doesNotMatch(page, /https?:\/\//, 'el destino file no pide nada a la red');
  assert.doesNotMatch(page, /data-theme="auto"/, 'el destino file no fija data-theme');
  r = check(file);
  assert.equal(r.status, 0, `la página generada pasa delphos-check:\n${r.stderr}`);
  r = check(file, '--single');
  assert.equal(r.status, 0, `y también con --single:\n${r.stderr}`);

  r = node(SINGLE, 'build', file);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(file, 'utf8'), page, 'single-html build no cambia una página al día');

  const bad = (name, html, rule) => {
    const f = join(tmp, name);
    writeFileSync(f, html);
    const res = check(f);
    assert.equal(res.status, 2, `${name} debería fallar`);
    assert.match(res.stderr, new RegExp(`regla ${rule}:`), `${name} falla por la regla ${rule}:\n${res.stderr}`);
  };
  bad('var-attr.html', page.replace('<rect class="d-box"', '<rect fill="var(--ink)"'), 2);
  bad('cdn-link.html', page.replace('</title>', '</title>\n<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/x@1.0.0/x.css" />'), 4);
  bad('script-src.html', page.replace('</title>', '</title>\n<script src="https://cdn.jsdelivr.net/npm/x@1.0.0/x.js"></script>'), 3);
  bad('local-img.html', page.replace('</article>', '<img src="figura.png" alt="Figura" />\n</article>'), 3);
  bad('edited-style.html', page.replace('--ink: #1f2be0;', '--ink: #000000;'), 1);
  bad('two-blocks.html', page.replace('</head>', '<!-- single:style v0 fonts=embed sha256=0 --><!-- /single:style -->\n</head>'), 1);

  const plain = join(tmp, 'plain.html');
  writeFileSync(plain, readFileSync(join(ROOT, 'examples', 'sample-project', 'tecnica', 'lector-sensores', 'lector-sensores.html'), 'utf8'));
  r = check(plain, '--single');
  assert.equal(r.status, 2, 'una página del sitio no pasa como un solo fichero');

  const art = join(tmp, 'artefacto.html');
  r = node(SINGLE, 'new', art, '--title', 'Informe de riego', '--target', 'artifact');
  assert.equal(r.status, 0, r.stderr);
  const artifact = fill(readFileSync(art, 'utf8'));
  writeFileSync(art, artifact);
  assert.doesNotMatch(artifact, /<!doctype|<html\b|<\/?body\b|<\/?head\b|<meta charset/i, 'un artefacto no lleva su propio documento');
  assert.match(artifact, /<title>Informe de riego<\/title>/, 'un artefacto lleva su <title>');
  assert.match(artifact, /fonts=google/, 'un artefacto toma las fuentes de Google por defecto');
  r = check(art);
  assert.equal(r.status, 0, `el artefacto pasa delphos-check:\n${r.stderr}`);

  for (const f of readdirSync(EXAMPLES).filter((n) => n.endsWith('.html'))) {
    const copy = join(tmp, `example-${f}`);
    const before = readFileSync(join(EXAMPLES, f), 'utf8');
    writeFileSync(copy, before);
    r = node(SINGLE, 'build', copy);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(copy, 'utf8'), before, `examples/single/${f} no está al día: ejecuta npm run build`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log('✓ single-html y delphos-check --single');
