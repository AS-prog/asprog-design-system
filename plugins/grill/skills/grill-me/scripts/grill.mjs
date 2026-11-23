#!/usr/bin/env node
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const UI_PATH = fileURLToPath(new URL('../assets/ui.html', import.meta.url));
const STATE_DIR = join(tmpdir(), 'delphos-grill');
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const IDLE_TTL_MS = 6 * 60 * 60 * 1000;

function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    } else {
      positionals.push(arg);
    }
  }
  return { command: positionals[0] || '', positionals: positionals.slice(1), flags };
}

function stateFilePath(sessionId) {
  if (!/^[a-zA-Z0-9_-]{4,64}$/.test(sessionId)) {
    throw new Error(`Invalid session id: ${sessionId}`);
  }
  return join(STATE_DIR, `${sessionId}.json`);
}

function writeJsonAtomic(filePath, data) {
  mkdirSync(STATE_DIR, { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  renameSync(tmpPath, filePath);
}

function readSessionFile(sessionId) {
  const filePath = stateFilePath(sessionId);
  if (!existsSync(filePath)) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function readInputJson(inputFlag) {
  const raw = !inputFlag || inputFlag === '-'
    ? readFileSync(0, 'utf8')
    : readFileSync(inputFlag, 'utf8');
  return JSON.parse(raw);
}

function tokensMatch(expected, actual) {
  if (typeof expected !== 'string' || typeof actual !== 'string') return false;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(actual, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function openBrowser(url) {
  try {
    if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {}
}

function buildPublicUrl(host, port, token) {
  const displayHost = host === '0.0.0.0' ? '127.0.0.1' : host;
  return `http://${displayHost}:${port}/?token=${encodeURIComponent(token)}`;
}

function localApiCall(port, token, method, path, body = null, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const payload = body === null ? null : Buffer.from(JSON.stringify(body), 'utf8');
    const req = httpRequest(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'x-grill-token': token,
          ...(payload ? { 'content-type': 'application/json', 'content-length': payload.length } : {}),
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let parsed = null;
          try {
            parsed = text ? JSON.parse(text) : {};
          } catch {
            parsed = { raw: text };
          }
          if (res.statusCode >= 400) {
            reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
            return;
          }
          resolve(parsed);
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

function markTreeDecisions(nodes, answers) {
  const byId = new Map(answers.map((a) => [a.id, a]));
  function walk(list) {
    for (const node of list || []) {
      const hit = byId.get(node.id);
      if (hit) {
        node.status = hit.mode === 'defer' ? 'pending' : 'settled';
        node.decision = hit.summary;
      }
      if (node.children) walk(node.children);
    }
  }
  walk(nodes);
}

function demoSessionPayload(sessionId, palette) {
  return {
    mode: 'demo',
    sessionId,
    palette: palette || null,
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
            decision: 'Sí (recomendación aceptada) — Lotes fijos de 5 segundos por zona.',
          },
          {
            id: 'Q2',
            label: 'Formato de almacenamiento',
            status: 'settled',
            round: 1,
            decision: 'Opción: A (Una fila por lectura) — Mantener esquema actual.',
          },
          { id: 'Q3', label: 'Comportamiento ante fallo parcial', status: 'frontier', round: 2 },
          { id: 'Q4', label: 'Reintentos de bus serie', status: 'frontier', round: 2 },
          { id: 'alertas', label: 'Umbrales de alerta en tablero', status: 'pending' },
        ],
      },
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
            recommendation: 'Sí, agrupar en ventanas fijas de 5 segundos por zona.',
          },
          {
            id: 'Q2',
            branch: 'Lectura por lotes',
            title: 'Granularidad en base de datos',
            recommendation: 'Sí, mantener una fila por sensor y marca temporal.',
          },
        ],
        submission: {
          round: 1,
          answers: [
            { id: 'Q1', title: 'Ventana de agrupación por zona', mode: 'accept', summary: 'Sí (recomendación aceptada)' },
            { id: 'Q2', title: 'Granularidad en base de datos', mode: 'option', summary: 'Opción: A (Una fila por lectura)' },
          ],
          revisions: [],
          generalNote: '',
        },
      },
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
            { id: 'B', label: 'Descartar el lote completo', description: 'Mantiene atomicidad estricta de toda la zona a costa de huecos.' },
          ],
          multiSelect: false,
        },
        {
          id: 'Q4',
          branch: 'Bus serie',
          title: 'Política de reintentos dentro de la misma ventana',
          body: 'Cada lectura por bus tarda `~40 ms`. Dentro de una ventana de 5 s caben reintentos cortos sin solapar la siguiente lectura:\n\n```text\nintento 1 (0 ms) -> fallo -> espera 150 ms -> intento 2 -> marca error\n```\n\n¿Hacemos un único reintento inmediato a los `150 ms` antes de dar por fallida la lectura?',
          recommendation: 'Sí, un único reintento tras 150 ms: absorbe microcortes del bus sin bloquear la siguiente ventana.',
          options: [],
          multiSelect: false,
        },
      ],
    },
  };
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function renderHtml(template, session) {
  const palette = session.palette && /^[a-z][a-z0-9-]*$/.test(session.palette)
    ? ` data-palette="${session.palette}"`
    : '';
  const clientState = publicState(session);
  const bootstrap = `<script>window.__GRILL_BOOTSTRAP__ = ${JSON.stringify(clientState).replace(/</g, '\\u003c')};</script>`;
  return template
    .replace('<html lang="es" data-theme="auto">', `<html lang="es" data-theme="auto"${palette}>`)
    .replace('<!--GRILL_BOOTSTRAP-->', bootstrap);
}

function publicState(session) {
  return {
    mode: session.mode || 'live',
    sessionId: session.sessionId,
    title: session.title,
    context: session.context,
    palette: session.palette,
    phase: session.phase,
    statusMessage: session.statusMessage,
    tree: session.tree,
    history: session.history,
    currentRound: session.currentRound,
    lastSubmission: session.lastSubmission,
    summary: session.summary,
  };
}

function runServer(flags) {
  const sessionId = String(flags.session || '');
  const host = String(flags.host || '127.0.0.1');
  const requestedPort = Number(flags.port || 0);
  const statePath = stateFilePath(sessionId);
  const uiTemplate = readFileSync(UI_PATH, 'utf8');
  const session = readSessionFile(sessionId);
  const sseClients = new Set();
  const waiters = new Set();
  let lastActivity = Date.now();

  function touch() {
    lastActivity = Date.now();
  }

  function persist() {
    writeJsonAtomic(statePath, session);
  }

  function broadcast() {
    const payload = `event: state\ndata: ${JSON.stringify(publicState(session))}\n\n`;
    for (const res of sseClients) {
      try {
        res.write(payload);
      } catch {
        sseClients.delete(res);
      }
    }
  }

  function notifyWaiters(result) {
    session.pendingResult = result;
    persist();
    for (const waiter of [...waiters]) {
      clearTimeout(waiter.timer);
      waiters.delete(waiter);
      waiter.resolve(result);
    }
  }

  function sendJson(res, status, data) {
    const body = Buffer.from(JSON.stringify(data), 'utf8');
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': body.length,
    });
    res.end(body);
  }

  function shutdown(removeFile = true) {
    for (const waiter of [...waiters]) {
      clearTimeout(waiter.timer);
      waiters.delete(waiter);
      waiter.resolve({ status: 'closed' });
    }
    for (const res of sseClients) {
      try {
        res.end();
      } catch {}
    }
    sseClients.clear();
    server.close(() => {
      if (removeFile) {
        try {
          unlinkSync(statePath);
        } catch {}
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 500).unref();
  }

  const server = createServer(async (req, res) => {
    touch();
    const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    const suppliedToken = req.headers['x-grill-token'] || url.searchParams.get('token') || '';
    if (!tokensMatch(session.token, suppliedToken)) {
      sendJson(res, 403, { error: 'Forbidden' });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/') {
      const html = Buffer.from(renderHtml(uiTemplate, session), 'utf8');
      res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'content-security-policy': "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; connect-src 'self'; img-src 'self' data:;",
        'content-length': html.length,
      });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/state') {
      sendJson(res, 200, publicState(session));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/events') {
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      });
      res.write(`event: state\ndata: ${JSON.stringify(publicState(session))}\n\n`);
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/round') {
      try {
        const body = await readRequestBody(req);
        const roundNum = Number(body.round || ((session.history ? session.history.length : 0) + 1));
        session.currentRound = {
          round: roundNum,
          title: body.title || `Ronda ${roundNum}`,
          intro: body.intro || '',
          questions: Array.isArray(body.questions) ? body.questions : [],
        };
        if (Array.isArray(body.tree)) session.tree = body.tree;
        if (body.context !== undefined) session.context = body.context;
        session.phase = 'round';
        session.statusMessage = '';
        session.pendingResult = null;
        persist();
        broadcast();
        sendJson(res, 200, { ok: true, round: roundNum });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/status') {
      try {
        const body = await readRequestBody(req);
        session.statusMessage = String(body.message || '');
        if (Array.isArray(body.tree)) session.tree = body.tree;
        persist();
        broadcast();
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/summary') {
      try {
        const body = await readRequestBody(req);
        session.summary = {
          title: body.title || 'Entendimiento compartido',
          summary: body.summary || '',
          decisions: Array.isArray(body.decisions) ? body.decisions : [],
        };
        if (Array.isArray(body.tree)) session.tree = body.tree;
        session.phase = 'summary';
        session.statusMessage = '';
        session.pendingResult = null;
        persist();
        broadcast();
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/submit') {
      try {
        const body = await readRequestBody(req);
        if (!session.currentRound) {
          sendJson(res, 409, { error: 'No active round' });
          return;
        }
        const submission = {
          round: session.currentRound.round,
          answers: Array.isArray(body.answers) ? body.answers : [],
          revisions: Array.isArray(body.revisions) ? body.revisions : [],
          generalNote: String(body.generalNote || ''),
        };
        session.history = (session.history || []).filter((h) => h.round !== session.currentRound.round);
        session.history.push({
          round: session.currentRound.round,
          title: session.currentRound.title,
          questions: session.currentRound.questions,
          submission,
        });
        markTreeDecisions(session.tree, submission.answers);
        session.lastSubmission = submission;
        session.phase = 'waiting';
        session.statusMessage = 'El agente está analizando tus respuestas y preparando la siguiente ronda…';
        persist();
        broadcast();
        notifyWaiters({ status: 'answered', ...submission });
        sendJson(res, 200, publicState(session));
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/confirm') {
      try {
        const body = await readRequestBody(req);
        if (body.confirmed) {
          session.phase = 'confirmed';
          session.statusMessage = '';
          persist();
          broadcast();
          notifyWaiters({ status: 'confirmed' });
        } else {
          const adjust = {
            status: 'adjust',
            comment: String(body.comment || ''),
            revisions: Array.isArray(body.revisions) ? body.revisions : [],
          };
          session.phase = 'waiting';
          session.statusMessage = 'El agente está revisando los ajustes solicitados…';
          persist();
          broadcast();
          notifyWaiters(adjust);
        }
        sendJson(res, 200, publicState(session));
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/cancel') {
      session.phase = 'cancelled';
      session.statusMessage = '';
      const roundNum = session.currentRound ? session.currentRound.round : null;
      persist();
      broadcast();
      notifyWaiters({ status: 'cancelled', round: roundNum });
      sendJson(res, 200, publicState(session));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/wait') {
      if (session.pendingResult) {
        sendJson(res, 200, session.pendingResult);
        return;
      }
      const timeoutSec = Math.max(1, Math.min(600, Number(url.searchParams.get('timeout') || 180)));
      const waiter = {
        resolve(result) {
          sendJson(res, 200, result);
        },
        timer: setTimeout(() => {
          waiters.delete(waiter);
          sendJson(res, 200, {
            status: 'pending',
            phase: session.phase,
            round: session.currentRound ? session.currentRound.round : null,
            url: session.url,
          });
        }, timeoutSec * 1000),
      };
      waiters.add(waiter);
      req.on('close', () => {
        if (waiters.has(waiter)) {
          clearTimeout(waiter.timer);
          waiters.delete(waiter);
        }
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/close') {
      sendJson(res, 200, { ok: true, status: 'closed' });
      shutdown(true);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  });

  const keepAlive = setInterval(() => {
    for (const res of sseClients) {
      try {
        res.write(': keepalive\n\n');
      } catch {
        sseClients.delete(res);
      }
    }
    if (Date.now() - lastActivity > IDLE_TTL_MS) {
      shutdown(true);
    }
  }, 25000);
  keepAlive.unref();

  process.on('SIGTERM', () => shutdown(true));
  process.on('SIGINT', () => shutdown(true));

  server.listen(requestedPort, host, () => {
    const addr = server.address();
    session.port = addr.port;
    session.host = host;
    session.pid = process.pid;
    session.url = buildPublicUrl(host, addr.port, session.token);
    session.ready = true;
    persist();
  });
}

async function waitForReady(sessionId, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const data = readSessionFile(sessionId);
      if (data.ready && data.port) return data;
    } catch {}
    await new Promise((r) => setTimeout(r, 60));
  }
  throw new Error('Timed out waiting for grill server to start');
}

async function cmdStart(flags, isDemo = false) {
  const sessionId = randomBytes(6).toString('hex');
  const token = randomBytes(24).toString('hex');
  const host = String(flags.host || '127.0.0.1');
  const port = Number(flags.port || 0);
  const palette = typeof flags.palette === 'string' && flags.palette.trim() ? flags.palette.trim() : null;

  const initial = isDemo
    ? {
        ...demoSessionPayload(sessionId, palette),
        token,
        host,
        port: 0,
        ready: false,
        pendingResult: null,
        lastSubmission: null,
        summary: null,
      }
    : {
        mode: 'live',
        sessionId,
        token,
        title: typeof flags.title === 'string' && flags.title.trim() ? flags.title.trim() : 'Sesión grill-me',
        context: typeof flags.context === 'string' ? flags.context.trim() : '',
        palette,
        host,
        port: 0,
        ready: false,
        phase: 'waiting_first',
        statusMessage: 'El agente está preparando la primera ronda de preguntas…',
        tree: [],
        history: [],
        currentRound: null,
        lastSubmission: null,
        summary: null,
        pendingResult: null,
      };

  const filePath = stateFilePath(sessionId);
  writeJsonAtomic(filePath, initial);

  const child = spawn(
    process.execPath,
    [SCRIPT_PATH, 'serve', '--session', sessionId, '--host', host, '--port', String(port)],
    { detached: true, stdio: 'ignore' },
  );
  child.unref();

  const ready = await waitForReady(sessionId);
  if (!flags['no-open']) openBrowser(ready.url);

  const out = {
    sessionId: ready.sessionId,
    url: ready.url,
    host: ready.host,
    port: ready.port,
    pid: ready.pid,
    stateFile: filePath,
  };
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}

async function waitAndReport(session, timeoutSec) {
  const res = await localApiCall(
    session.port,
    session.token,
    'GET',
    `/api/wait?timeout=${encodeURIComponent(timeoutSec)}`,
    null,
    (timeoutSec + 10) * 1000,
  );
  process.stdout.write(JSON.stringify(res, null, 2) + '\n');
  if (res.status === 'pending') process.exit(2);
}

async function cmdRound(flags) {
  const session = readSessionFile(String(flags.session || ''));
  const payload = readInputJson(flags.input);
  const timeoutSec = Number(flags.timeout || 180);
  await localApiCall(session.port, session.token, 'POST', '/api/round', payload);
  await waitAndReport(session, timeoutSec);
}

async function cmdWait(flags) {
  const session = readSessionFile(String(flags.session || ''));
  const timeoutSec = Number(flags.timeout || 180);
  await waitAndReport(session, timeoutSec);
}

async function cmdStatus(flags) {
  const session = readSessionFile(String(flags.session || ''));
  const body = { message: String(flags.message || '') };
  if (flags.input) Object.assign(body, readInputJson(flags.input));
  const res = await localApiCall(session.port, session.token, 'POST', '/api/status', body);
  process.stdout.write(JSON.stringify(res, null, 2) + '\n');
}

async function cmdSummary(flags) {
  const session = readSessionFile(String(flags.session || ''));
  const payload = readInputJson(flags.input);
  const timeoutSec = Number(flags.timeout || 180);
  await localApiCall(session.port, session.token, 'POST', '/api/summary', payload);
  await waitAndReport(session, timeoutSec);
}

async function cmdClose(flags) {
  const sessionId = String(flags.session || '');
  const session = readSessionFile(sessionId);
  try {
    const res = await localApiCall(session.port, session.token, 'POST', '/api/close', {});
    process.stdout.write(JSON.stringify(res, null, 2) + '\n');
  } catch {
    try {
      if (session.pid) process.kill(session.pid, 'SIGTERM');
    } catch {}
    try {
      unlinkSync(stateFilePath(sessionId));
    } catch {}
    process.stdout.write(JSON.stringify({ ok: true, status: 'closed' }, null, 2) + '\n');
  }
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command === 'serve') {
    runServer(flags);
    return;
  }
  if (command === 'start') {
    await cmdStart(flags, false);
    return;
  }
  if (command === 'demo') {
    await cmdStart(flags, true);
    return;
  }
  if (command === 'round') {
    await cmdRound(flags);
    return;
  }
  if (command === 'wait') {
    await cmdWait(flags);
    return;
  }
  if (command === 'status') {
    await cmdStatus(flags);
    return;
  }
  if (command === 'summary') {
    await cmdSummary(flags);
    return;
  }
  if (command === 'close') {
    await cmdClose(flags);
    return;
  }
  process.stderr.write(
    'Usage: grill.mjs <start|round|wait|status|summary|close|demo> [options]\n',
  );
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
