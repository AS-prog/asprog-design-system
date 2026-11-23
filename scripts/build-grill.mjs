import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCss } from './tokens-lib.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SYSTEM = join(ROOT, 'system');

function inlineLatinFonts(tokens) {
  const css = buildCss(tokens);
  const latinFonts = tokens.type.fonts.filter((f) => !f.file.includes('latin-ext'));
  const fontRules = latinFonts.map((f) => {
    const b64 = readFileSync(join(SYSTEM, f.file)).toString('base64');
    return `@font-face { font-family: "${f.family}"; font-style: ${f.style}; font-weight: ${f.weight}; font-display: swap; src: url("data:font/woff2;base64,${b64}") format("woff2");${f.unicodeRange ? ` unicode-range: ${f.unicodeRange};` : ''} }`;
  });
  const stripped = css.replace(/^@font-face \{[^\n]+\}\n?/gm, '').trimStart();
  return fontRules.join('\n') + '\n\n' + stripped;
}

export function buildGrillUi(tokens, { palette = null, bootstrap = null } = {}) {
  const inlineCss = [
    inlineLatinFonts(tokens),
    readFileSync(join(SYSTEM, 'css', 'base.css'), 'utf8'),
    readFileSync(join(SYSTEM, 'css', 'document.css'), 'utf8'),
    readFileSync(join(SYSTEM, 'css', 'grill.css'), 'utf8'),
  ].join('\n\n');

  const appJs = readFileSync(join(SYSTEM, 'js', 'grill-app.js'), 'utf8');
  const paletteAttr = palette ? ` data-palette="${palette}"` : '';
  const bootstrapTag = bootstrap
    ? `<script>window.__GRILL_BOOTSTRAP__ = ${JSON.stringify(bootstrap).replace(/</g, '\\u003c')};</script>`
    : '<!--GRILL_BOOTSTRAP-->';

  return `<!DOCTYPE html>
<html lang="es" data-theme="auto"${paletteAttr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Interfaz interactiva autocontenida para sesiones de entrevista grill-me con el sistema de diseño Delphos.">
<title>grill-me · Delphos</title>
<style>
${inlineCss}
</style>
</head>
<body>
<div class="grill">
  <header class="doc-bar">
    <div class="grill-bar-left">
      <span class="doc-brand">Delphos · grill-me</span>
      <span id="grill-conn" class="grill-conn">Conectando</span>
    </div>
    <div class="grill-bar-actions">
      <button type="button" id="grill-export-btn" class="doc-theme">Exportar Markdown</button>
      <button type="button" id="grill-theme-btn" class="doc-theme" aria-pressed="false">Tema: Oscuro</button>
    </div>
  </header>

  <header class="grill-header">
    <h1 id="grill-title">Sesión grill-me</h1>
    <p id="grill-context" class="lede" hidden></p>
    <dl id="grill-stats" class="grill-stats"></dl>
  </header>

  <div class="grill-workspace">
    <aside id="grill-rail" class="grill-rail" aria-label="Árbol de decisiones e historial"></aside>
    <main id="grill-main" class="grill-main"></main>
  </div>

  <footer class="doc-footer">
    <span>Delphos v${tokens.version} · grill-me</span>
    <span>Interfaz autocontenida sin red</span>
  </footer>
</div>

<div id="grill-toast" class="grill-toast" role="status" aria-live="polite" hidden></div>

<dialog id="grill-export-dialog" class="grill-dialog" aria-labelledby="grill-export-title">
  <header class="grill-dialog-head">
    <h2 id="grill-export-title">Transcripción de la sesión</h2>
    <button type="button" class="grill-inspector-close" data-action="close-export" aria-label="Cerrar">×</button>
  </header>
  <pre id="grill-export-content" class="grill-dialog-pre"></pre>
  <div class="grill-dialog-actions">
    <button type="button" class="btn" data-action="copy-export">Copiar Markdown</button>
    <button type="button" class="btn btn-quiet" data-action="download-export">Descargar .md</button>
    <button type="button" class="btn btn-quiet" data-action="close-export">Cerrar</button>
  </div>
</dialog>

${bootstrapTag}
<script>
${appJs}
</script>
</body>
</html>
`;
}

export function demoBootstrap() {
  return {
    mode: 'demo',
    sessionId: 'demo-riego',
    title: 'Lectura por lotes del controlador de riego',
    context: 'Entrevista de diseño para pasar la lectura de sensores de humedad de sondeo individual a lectura por lotes sin perder trazabilidad por válvula.',
    phase: 'round',
    statusMessage: '',
    tree: [
      {
        id: 'root',
        label: 'Lectura por lotes',
        status: 'frontier',
        children: [
          {
            id: 'Q1',
            label: 'Ventana de agrupación',
            status: 'settled',
            round: 1,
            decision: 'Sí (recomendación aceptada) — Lotes fijos de 5 segundos por zona.'
          },
          {
            id: 'Q2',
            label: 'Formato de almacenamiento',
            status: 'settled',
            round: 1,
            decision: 'Opción: A (Una fila por lectura) — Mantener esquema actual.'
          },
          {
            id: 'Q3',
            label: 'Comportamiento ante fallo parcial',
            status: 'frontier',
            round: 2
          },
          {
            id: 'Q4',
            label: 'Reintentos de bus serie',
            status: 'frontier',
            round: 2
          },
          {
            id: 'alertas',
            label: 'Umbrales de alerta en tablero',
            status: 'pending'
          }
        ]
      }
    ],
    history: [
      {
        round: 1,
        title: 'Alcance y modelo de datos',
        questions: [
          {
            id: 'Q1',
            branch: 'Lectura por lotes',
            title: 'Ventana de agrupación por zona',
            recommendation: 'Sí, agrupar en ventanas fijas de 5 segundos por zona.'
          },
          {
            id: 'Q2',
            branch: 'Lectura por lotes',
            title: 'Granularidad en base de datos',
            recommendation: 'Sí, mantener una fila por sensor y marca temporal.'
          }
        ],
        submission: {
          round: 1,
          answers: [
            { id: 'Q1', title: 'Ventana de agrupación por zona', mode: 'accept', summary: 'Sí (recomendación aceptada)' },
            { id: 'Q2', title: 'Granularidad en base de datos', mode: 'option', summary: 'Opción: A (Una fila por lectura)' }
          ],
          revisions: [],
          generalNote: ''
        }
      }
    ],
    currentRound: {
      round: 2,
      title: 'Tolerancia a fallos y reintentos',
      intro: 'Con la ventana de **5 segundos** y una fila por sensor cerradas en la Ronda 1, quedan abiertas dos decisiones independientes sobre fallos parciales.',
      questions: [
        {
          id: 'Q3',
          branch: 'Fallo parcial',
          title: 'Qué hacer si uno de los sensores del lote no responde',
          body: 'Cuando el bus consulta 8 sensores en bloque y el sensor `S-04` agota el tiempo de espera:\n\n| Estrategia | Datos guardados | Riesgo |\n| --- | --- | --- |\n| Parcial + marca | 7 lecturas válidas + 1 error | Ninguna pérdida en los sanos |\n| Descartar lote | 0 lecturas | Hueco completo de 5 s |\n\n¿Guardamos las lecturas válidas del lote y registramos el fallo del sensor afectado en `sensor_errors`?',
          recommendation: 'Sí, guardar las lecturas válidas y registrar el error por sensor para no perder la serie de las válvulas sanas.',
          options: [
            { id: 'A', label: 'Guardar parcial y registrar error', description: 'Inserta las lecturas válidas y anota el sensor fallido con código `TIMEOUT`.', recommended: true },
            { id: 'B', label: 'Descartar el lote completo', description: 'Mantiene atomicidad estricta de toda la zona a costa de huecos.' }
          ],
          multiSelect: false
        },
        {
          id: 'Q4',
          branch: 'Bus serie',
          title: 'Política de reintentos dentro de la misma ventana',
          body: 'Cada lectura por bus tarda `~40 ms`. Dentro de una ventana de 5 s caben reintentos cortos sin solapar la siguiente lectura:\n\n```text\nintento 1 (0 ms) -> fallo -> espera 150 ms -> intento 2 -> marca error\n```\n\n¿Hacemos un único reintento inmediato a los `150 ms` antes de dar por fallida la lectura?',
          recommendation: 'Sí, un único reintento tras 150 ms: absorbe microcortes del bus sin bloquear la siguiente ventana.',
          options: [],
          multiSelect: false
        }
      ]
    },
    demoSummary: {
      title: 'Entendimiento compartido · Lectura por lotes',
      summary: 'La lectura de sensores del controlador de riego pasa a bloques de **5 segundos por zona**, conservando una fila por sensor y marca temporal.\n\n- Ante un fallo parcial se guardan las lecturas válidas y se registra el error del sensor en `sensor_errors`.\n- Cada fallo realiza un único reintento tras `150 ms` antes de anotar el error.',
      decisions: [
        { id: 'Q1', title: 'Ventana de agrupación', decision: 'Lotes fijos de 5 segundos por zona.' },
        { id: 'Q2', title: 'Granularidad en base de datos', decision: 'Una fila por sensor y marca temporal.' },
        { id: 'Q3', title: 'Fallo parcial en el lote', decision: 'Guardar parcial y registrar error por sensor.' },
        { id: 'Q4', title: 'Reintentos de bus serie', decision: 'Un único reintento a los 150 ms.' }
      ]
    }
  };
}
