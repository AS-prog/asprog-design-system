import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const CLI = join(ROOT, 'plugins', 'grill', 'skills', 'grill-me', 'scripts', 'grill.mjs');

function runCli(args, stdinText = null) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const out = [];
    const err = [];
    child.stdout.on('data', (c) => out.push(c));
    child.stderr.on('data', (c) => err.push(c));
    child.on('close', (code) => {
      resolve({
        code,
        stdout: Buffer.concat(out).toString('utf8'),
        stderr: Buffer.concat(err).toString('utf8'),
      });
    });
    if (stdinText !== null) child.stdin.write(stdinText);
    child.stdin.end();
  });
}

function startCliAsync(args, stdinText = null) {
  const child = spawn(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const out = [];
  const err = [];
  child.stdout.on('data', (c) => out.push(c));
  child.stderr.on('data', (c) => err.push(c));
  if (stdinText !== null) child.stdin.write(stdinText);
  child.stdin.end();
  const done = new Promise((resolve) => {
    child.on('close', (code) => {
      resolve({
        code,
        stdout: Buffer.concat(out).toString('utf8'),
        stderr: Buffer.concat(err).toString('utf8'),
      });
    });
  });
  return { child, done };
}

async function waitForPhase(baseUrl, token, phase, timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${baseUrl}/api/state?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (data.phase === phase) return data;
    await new Promise((r) => setTimeout(r, 40));
  }
  throw new Error(`Timed out waiting for phase ${phase}`);
}

test('full grill session lifecycle: auth, round, timeout, wait, revisions, summary, adjust, confirm, close', async () => {
  const started = await runCli([
    'start',
    '--title', 'Controlador de riego',
    '--context', 'Prueba de integración del servidor grill',
    '--palette', 'merkle',
    '--no-open',
  ]);
  assert.equal(started.code, 0, started.stderr);
  const info = JSON.parse(started.stdout);
  assert.ok(info.sessionId);
  assert.ok(info.port > 0);
  assert.ok(existsSync(info.stateFile));

  const baseUrl = `http://127.0.0.1:${info.port}`;
  const token = new URL(info.url).searchParams.get('token');

  try {
    const forbidden = await fetch(`${baseUrl}/`);
    assert.equal(forbidden.status, 403);

    const forbiddenApi = await fetch(`${baseUrl}/api/state?token=wrong`);
    assert.equal(forbiddenApi.status, 403);

    const pageRes = await fetch(info.url);
    assert.equal(pageRes.status, 200);
    const html = await pageRes.text();
    assert.ok(html.includes('data-palette="merkle"'));
    assert.ok(html.includes('data:font/woff2;base64,'));
    assert.ok(!html.includes('latin-ext'));
    assert.ok(!/<link[^>]+href="http/i.test(html));

    const round1Payload = {
      round: 1,
      title: 'Arquitectura',
      intro: 'Primera ronda de prueba.',
      tree: [
        {
          id: 'root',
          label: 'Diseño',
          status: 'frontier',
          children: [
            { id: 'Q1', label: 'Ventana', status: 'frontier', round: 1 },
          ],
        },
      ],
      questions: [
        {
          id: 'Q1',
          branch: 'Diseño',
          title: 'Ventana de 5 segundos',
          body: '¿Usamos ventanas de 5 segundos?',
          recommendation: 'Sí, 5 segundos.',
          options: [
            { id: 'A', label: '5 segundos', recommended: true },
            { id: 'B', label: '30 segundos' },
          ],
        },
      ],
    };

    const timedOut = await runCli(
      ['round', '--session', info.sessionId, '--input', '-', '--timeout', '1'],
      JSON.stringify(round1Payload),
    );
    assert.equal(timedOut.code, 2, timedOut.stderr);
    const pendingRes = JSON.parse(timedOut.stdout);
    assert.equal(pendingRes.status, 'pending');
    assert.equal(pendingRes.round, 1);

    const waiting = startCliAsync(['wait', '--session', info.sessionId, '--timeout', '10']);
    await new Promise((r) => setTimeout(r, 150));

    const submitRes = await fetch(`${baseUrl}/api/submit?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        round: 1,
        answers: [
          {
            id: 'Q1',
            title: 'Ventana de 5 segundos',
            mode: 'accept',
            acceptedRecommendation: true,
            selectedOptions: ['A'],
            note: 'Con margen de 100 ms',
            summary: 'Sí (recomendación aceptada) — Con margen de 100 ms',
          },
        ],
        revisions: [],
        generalNote: 'Sin Docker',
      }),
    });
    assert.equal(submitRes.status, 200);
    const afterSubmit = await submitRes.json();
    assert.equal(afterSubmit.phase, 'waiting');
    assert.equal(afterSubmit.tree[0].children[0].status, 'settled');

    const waitResult = await waiting.done;
    assert.equal(waitResult.code, 0, waitResult.stderr);
    const answered = JSON.parse(waitResult.stdout);
    assert.equal(answered.status, 'answered');
    assert.equal(answered.generalNote, 'Sin Docker');
    assert.equal(answered.answers[0].id, 'Q1');

    const statusRes = await runCli([
      'status',
      '--session', info.sessionId,
      '--message', 'Investigando esquema de sensores…',
    ]);
    assert.equal(statusRes.code, 0, statusRes.stderr);

    const liveStateRes = await fetch(`${baseUrl}/api/state?token=${encodeURIComponent(token)}`);
    const liveState = await liveStateRes.json();
    assert.equal(liveState.statusMessage, 'Investigando esquema de sensores…');

    const summaryWait = startCliAsync(
      ['summary', '--session', info.sessionId, '--input', '-', '--timeout', '10'],
      JSON.stringify({
        title: 'Entendimiento compartido',
        summary: 'Ventana de 5 s sin Docker.',
        decisions: [{ id: 'Q1', title: 'Ventana', decision: '5 s con margen de 100 ms' }],
      }),
    );
    await waitForPhase(baseUrl, token, 'summary');

    const adjustRes = await fetch(`${baseUrl}/api/confirm?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirmed: false,
        comment: 'Falta definir la retención de errores.',
        revisions: [{ targetId: 'Q1', label: 'Ventana', note: 'Subir a 10 s' }],
      }),
    });
    assert.equal(adjustRes.status, 200);

    const adjustOut = await summaryWait.done;
    assert.equal(adjustOut.code, 0, adjustOut.stderr);
    const adjustData = JSON.parse(adjustOut.stdout);
    assert.equal(adjustData.status, 'adjust');
    assert.equal(adjustData.comment, 'Falta definir la retención de errores.');
    assert.equal(adjustData.revisions.length, 1);

    const confirmWait = startCliAsync(
      ['summary', '--session', info.sessionId, '--input', '-', '--timeout', '10'],
      JSON.stringify({
        title: 'Entendimiento compartido final',
        summary: 'Ventana de 10 s y retención de 30 días.',
        decisions: [{ id: 'Q1', title: 'Ventana', decision: '10 s' }],
      }),
    );
    await waitForPhase(baseUrl, token, 'summary');

    const confirmRes = await fetch(`${baseUrl}/api/confirm?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirmed: true }),
    });
    assert.equal(confirmRes.status, 200);

    const confirmOut = await confirmWait.done;
    assert.equal(confirmOut.code, 0, confirmOut.stderr);
    assert.equal(JSON.parse(confirmOut.stdout).status, 'confirmed');
  } finally {
    const closed = await runCli(['close', '--session', info.sessionId]);
    assert.equal(closed.code, 0, closed.stderr);
  }
  await new Promise((r) => setTimeout(r, 150));
  assert.equal(existsSync(info.stateFile), false);
});

test('cancel flow returns cancelled status and closes cleanly', async () => {
  const started = await runCli(['start', '--title', 'Prueba cancelación', '--no-open']);
  assert.equal(started.code, 0, started.stderr);
  const info = JSON.parse(started.stdout);
  const baseUrl = `http://127.0.0.1:${info.port}`;
  const token = new URL(info.url).searchParams.get('token');

  try {
    const roundWait = startCliAsync(
      ['round', '--session', info.sessionId, '--input', '-', '--timeout', '10'],
      JSON.stringify({
        round: 1,
        questions: [{ id: 'Q1', title: 'Pregunta', recommendation: 'Sí.' }],
      }),
    );
    await waitForPhase(baseUrl, token, 'round');

    const cancelRes = await fetch(`${baseUrl}/api/cancel?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(cancelRes.status, 200);

    const out = await roundWait.done;
    assert.equal(out.code, 0, out.stderr);
    assert.equal(JSON.parse(out.stdout).status, 'cancelled');
  } finally {
    await runCli(['close', '--session', info.sessionId]);
  }
});
