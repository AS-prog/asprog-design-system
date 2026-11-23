(function () {
  var state = null;
  var draft = null;
  var selectedNodeId = null;
  var activeRailTab = 'tree';
  var confirmCancelOpen = false;
  var adjustModeOpen = false;
  var adjustComment = '';
  var pendingMissingIds = {};
  var baseTitle = '';
  var unseenUpdate = false;
  var eventSource = null;
  var pollTimer = null;
  var toastTimer = null;

  var token = new URLSearchParams(window.location.search).get('token') || '';
  var isDemo = !!(window.__GRILL_BOOTSTRAP__ && window.__GRILL_BOOTSTRAP__.mode === 'demo');

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeHref(url) {
    var trimmed = String(url || '').trim();
    if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
    return '#';
  }

  function renderInline(text) {
    var codes = [];
    var escaped = escapeHtml(text).replace(/`([^`]+)`/g, function (_, code) {
      codes.push('<code>' + code + '</code>');
      return '\u0000CODE' + (codes.length - 1) + '\u0000';
    });
    escaped = escaped
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
        return '<a href="' + escapeHtml(safeHref(href)) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
      })
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[^\w*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/(^|[^\w_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');
    return escaped.replace(/\u0000CODE(\d+)\u0000/g, function (_, idx) {
      return codes[Number(idx)];
    });
  }

  function isTableDivider(line) {
    return /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line);
  }

  function splitTableRow(line) {
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (cell) {
      return cell.trim();
    });
  }

  function renderMarkdown(source) {
    var input = String(source == null ? '' : source).replace(/\r\n/g, '\n').trim();
    if (!input) return '';
    var lines = input.split('\n');
    var out = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (/^\s*```/.test(line)) {
        var buf = [];
        i += 1;
        while (i < lines.length && !/^\s*```/.test(lines[i])) {
          buf.push(lines[i]);
          i += 1;
        }
        if (i < lines.length) i += 1;
        out.push('<pre><code>' + escapeHtml(buf.join('\n')) + '</code></pre>');
        continue;
      }

      if (!line.trim()) {
        i += 1;
        continue;
      }

      if (i + 1 < lines.length && line.indexOf('|') !== -1 && isTableDivider(lines[i + 1])) {
        var headers = splitTableRow(line);
        i += 2;
        var rows = [];
        while (i < lines.length && lines[i].trim() && lines[i].indexOf('|') !== -1) {
          rows.push(splitTableRow(lines[i]));
          i += 1;
        }
        var thead = '<thead><tr>' + headers.map(function (h) { return '<th>' + renderInline(h) + '</th>'; }).join('') + '</tr></thead>';
        var tbody = '<tbody>' + rows.map(function (row) {
          return '<tr>' + headers.map(function (_, idx) {
            return '<td>' + renderInline(row[idx] || '') + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody>';
        out.push('<table>' + thead + tbody + '</table>');
        continue;
      }

      var heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        var level = Math.min(heading[1].length + 2, 6);
        out.push('<h' + level + '>' + renderInline(heading[2]) + '</h' + level + '>');
        i += 1;
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        var quoteLines = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
          i += 1;
        }
        out.push('<blockquote><p>' + renderInline(quoteLines.join(' ')) + '</p></blockquote>');
        continue;
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        var ulItems = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          ulItems.push('<li>' + renderInline(lines[i].replace(/^\s*[-*+]\s+/, '')) + '</li>');
          i += 1;
        }
        out.push('<ul>' + ulItems.join('') + '</ul>');
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        var olItems = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          olItems.push('<li>' + renderInline(lines[i].replace(/^\s*\d+\.\s+/, '')) + '</li>');
          i += 1;
        }
        out.push('<ol>' + olItems.join('') + '</ol>');
        continue;
      }

      var para = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^\s*```/.test(lines[i]) &&
        !/^(#{1,4})\s+/.test(lines[i]) &&
        !/^\s*>\s?/.test(lines[i]) &&
        !/^\s*[-*+]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !(i + 1 < lines.length && lines[i].indexOf('|') !== -1 && isTableDivider(lines[i + 1]))
      ) {
        para.push(lines[i].trim());
        i += 1;
      }
      out.push('<p>' + renderInline(para.join(' ')) + '</p>');
    }
    return out.join('');
  }

  function showToast(message) {
    var el = qs('#grill-toast');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.hidden = true;
    }, 3200);
  }

  function draftKey(sessionId, roundNum) {
    return 'delphos-grill:' + sessionId + ':r' + roundNum;
  }

  function emptyDraft(roundNum) {
    return {
      round: roundNum,
      answers: {},
      revisions: [],
      generalNote: ''
    };
  }

  function loadDraft(sessionId, roundNum) {
    try {
      var raw = localStorage.getItem(draftKey(sessionId, roundNum));
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.round === roundNum) {
          parsed.answers = parsed.answers || {};
          parsed.revisions = Array.isArray(parsed.revisions) ? parsed.revisions : [];
          parsed.generalNote = parsed.generalNote || '';
          return parsed;
        }
      }
    } catch (_) {}
    return emptyDraft(roundNum);
  }

  function saveDraft() {
    if (!state || !draft || !state.currentRound) return;
    try {
      localStorage.setItem(draftKey(state.sessionId, state.currentRound.round), JSON.stringify(draft));
    } catch (_) {}
  }

  function clearDraft(sessionId, roundNum) {
    try {
      localStorage.removeItem(draftKey(sessionId, roundNum));
    } catch (_) {}
  }

  function getAnswer(qId) {
    if (!draft.answers[qId]) {
      draft.answers[qId] = {
        mode: '',
        selectedOptions: [],
        note: ''
      };
    }
    return draft.answers[qId];
  }

  function isQuestionAnswered(q) {
    var ans = draft && draft.answers ? draft.answers[q.id] : null;
    if (!ans) return false;
    if (ans.mode === 'accept' || ans.mode === 'defer') return true;
    if (ans.selectedOptions && ans.selectedOptions.length > 0) return true;
    if (ans.note && ans.note.trim().length > 0) return true;
    return false;
  }

  function questionStatusLabel(q) {
    var ans = draft && draft.answers ? draft.answers[q.id] : null;
    if (!ans || !isQuestionAnswered(q)) {
      return pendingMissingIds[q.id] ? { text: 'Falta responder', cls: 'is-missing' } : { text: 'Pendiente', cls: '' };
    }
    if (ans.mode === 'defer') return { text: 'Investigar / posponer', cls: 'is-deferred' };
    if (ans.mode === 'accept') {
      return ans.note && ans.note.trim() ? { text: 'Aceptada con matiz', cls: 'is-answered' } : { text: 'Recomendación aceptada', cls: 'is-answered' };
    }
    if (ans.selectedOptions && ans.selectedOptions.length > 0) {
      return { text: 'Opción elegida', cls: 'is-answered' };
    }
    return { text: 'Respuesta libre', cls: 'is-answered' };
  }

  function countTreeStates(nodes, counts) {
    (nodes || []).forEach(function (node) {
      if (node.status === 'settled') counts.settled += 1;
      else if (node.status === 'frontier') counts.frontier += 1;
      else counts.pending += 1;
      if (node.children && node.children.length) countTreeStates(node.children, counts);
    });
    return counts;
  }

  function findTreeNode(nodes, id) {
    for (var i = 0; i < (nodes || []).length; i += 1) {
      if (nodes[i].id === id) return nodes[i];
      if (nodes[i].children) {
        var found = findTreeNode(nodes[i].children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function findHistoryEntry(qId) {
    if (!state || !state.history) return null;
    for (var i = state.history.length - 1; i >= 0; i -= 1) {
      var round = state.history[i];
      for (var j = 0; j < (round.questions || []).length; j += 1) {
        var q = round.questions[j];
        if (q.id === qId) {
          var ans = (round.submission && round.submission.answers) ? round.submission.answers.find(function (a) { return a.id === qId; }) : null;
          return { round: round.round, question: q, answer: ans };
        }
      }
    }
    return null;
  }

  function formatAnswerSummary(q, rawAns) {
    if (!rawAns) return 'Sin respuesta';
    var parts = [];
    if (rawAns.mode === 'accept') parts.push('Sí (recomendación aceptada)');
    else if (rawAns.mode === 'defer') parts.push('Investigar / posponer');
    if (rawAns.selectedOptions && rawAns.selectedOptions.length) {
      var labels = rawAns.selectedOptions.map(function (optId) {
        var found = (q.options || []).find(function (o) { return o.id === optId; });
        return found ? found.id + ' (' + found.label + ')' : optId;
      });
      parts.push('Opción: ' + labels.join(', '));
    }
    if (rawAns.note && rawAns.note.trim()) parts.push(rawAns.note.trim());
    return parts.join(' — ') || 'Sin respuesta';
  }

  function buildRoundPayload() {
    var round = state.currentRound;
    var answers = (round.questions || []).map(function (q) {
      var ans = getAnswer(q.id);
      var mode = ans.mode;
      if (!mode) {
        if (ans.selectedOptions && ans.selectedOptions.length > 0) mode = 'option';
        else if (ans.note && ans.note.trim()) mode = 'custom';
      }
      return {
        id: q.id,
        title: q.title,
        mode: mode,
        acceptedRecommendation: mode === 'accept',
        selectedOptions: ans.selectedOptions.slice(),
        note: (ans.note || '').trim(),
        summary: formatAnswerSummary(q, {
          mode: mode,
          selectedOptions: ans.selectedOptions,
          note: (ans.note || '').trim()
        })
      };
    });
    return {
      round: round.round,
      answers: answers,
      revisions: (draft.revisions || []).slice(),
      generalNote: (draft.generalNote || '').trim()
    };
  }

  function formatRoundMarkdown(payload) {
    var lines = ['### Respuestas — Ronda ' + payload.round, ''];
    payload.answers.forEach(function (a) {
      lines.push('- **' + a.id + ' (' + a.title + ')**: ' + a.summary);
    });
    if (payload.revisions && payload.revisions.length) {
      lines.push('', '#### Revisiones sobre decisiones anteriores');
      payload.revisions.forEach(function (rev) {
        lines.push('- **' + rev.targetId + ' (' + rev.label + ')**: ' + rev.note);
      });
    }
    if (payload.generalNote) {
      lines.push('', '#### Nota general', payload.generalNote);
    }
    return lines.join('\n');
  }

  function formatSessionMarkdown() {
    if (!state) return '';
    var lines = ['# ' + (state.title || 'Sesión grill-me'), ''];
    if (state.context) lines.push(state.context, '');

    function dumpTree(nodes, depth) {
      (nodes || []).forEach(function (n) {
        var indent = new Array(depth + 1).join('  ');
        var st = n.status === 'settled' ? 'resuelta' : n.status === 'frontier' ? 'en frontera' : 'pendiente';
        var extra = n.decision ? ' — ' + n.decision : '';
        lines.push(indent + '- **' + n.label + '** `[' + st + ']`' + extra);
        if (n.children && n.children.length) dumpTree(n.children, depth + 1);
      });
    }

    if (state.tree && state.tree.length) {
      lines.push('## Árbol de decisiones', '');
      dumpTree(state.tree, 0);
      lines.push('');
    }

    (state.history || []).forEach(function (round) {
      lines.push('## Ronda ' + round.round + (round.title ? ' — ' + round.title : ''), '');
      (round.questions || []).forEach(function (q) {
        var ans = round.submission && round.submission.answers
          ? round.submission.answers.find(function (a) { return a.id === q.id; })
          : null;
        lines.push('### ' + q.id + ' · ' + q.title);
        if (q.recommendation) lines.push('> Recomendación: ' + q.recommendation);
        lines.push('**Respuesta**: ' + (ans ? ans.summary : 'Sin respuesta'), '');
      });
      if (round.submission && round.submission.revisions && round.submission.revisions.length) {
        lines.push('**Revisiones**:');
        round.submission.revisions.forEach(function (rev) {
          lines.push('- ' + rev.targetId + ' (' + rev.label + '): ' + rev.note);
        });
        lines.push('');
      }
      if (round.submission && round.submission.generalNote) {
        lines.push('**Nota general**: ' + round.submission.generalNote, '');
      }
    });

    if (state.summary) {
      lines.push('## Entendimiento compartido', '', state.summary.summary || '', '');
      if (state.summary.decisions && state.summary.decisions.length) {
        lines.push('### Decisiones cerradas', '');
        state.summary.decisions.forEach(function (d) {
          lines.push('- **' + (d.id ? d.id + ' · ' : '') + d.title + '**: ' + d.decision);
        });
      }
    }
    return lines.join('\n').trim() + '\n';
  }

  function copyText(text, okMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(okMessage);
      }).catch(function () {
        fallbackCopy(text, okMessage);
      });
    } else {
      fallbackCopy(text, okMessage);
    }
  }

  function fallbackCopy(text, okMessage) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
      showToast(okMessage);
    } catch (_) {
      showToast('No se pudo copiar al portapapeles');
    }
    document.body.removeChild(area);
  }

  function downloadMarkdown(filename, text) {
    var blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function apiPost(endpoint, body) {
    if (isDemo) {
      return Promise.resolve({ ok: true, demo: true });
    }
    var sep = endpoint.indexOf('?') === -1 ? '?' : '&';
    return fetch(endpoint + sep + 'token=' + encodeURIComponent(token), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function updateThemeButton() {
    var html = document.documentElement;
    var btn = qs('#grill-theme-btn');
    if (!btn) return;
    var current = html.getAttribute('data-theme') || 'auto';
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = current === 'dark' || (current === 'auto' && prefersDark);
    btn.textContent = isDark ? 'Tema: Claro' : 'Tema: Oscuro';
    btn.setAttribute('aria-pressed', String(isDark));
  }

  function toggleTheme() {
    var html = document.documentElement;
    var current = html.getAttribute('data-theme') || 'auto';
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var next = (current === 'dark' || (current === 'auto' && prefersDark)) ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try { localStorage.setItem('delphos-grill-theme', next); } catch (_) {}
    updateThemeButton();
  }

  function initTheme() {
    try {
      var saved = localStorage.getItem('delphos-grill-theme');
      if (saved === 'light' || saved === 'dark') {
        document.documentElement.setAttribute('data-theme', saved);
      }
    } catch (_) {}
    updateThemeButton();
  }

  function renderTreeNodes(nodes) {
    if (!nodes || !nodes.length) return '';
    return '<ul class="grill-tree">' + nodes.map(function (node) {
      var st = node.status === 'settled' ? 'settled' : node.status === 'frontier' ? 'frontier' : 'pending';
      var stLabel = st === 'settled' ? 'Resuelta' : st === 'frontier' ? 'Frontera' : 'Pendiente';
      var sel = selectedNodeId === node.id ? ' is-selected' : '';
      return '<li>' +
        '<button type="button" class="grill-node is-' + st + sel + '" data-node-id="' + escapeHtml(node.id) + '">' +
        '<span class="grill-node-head">' +
        '<span class="grill-node-label">' + escapeHtml(node.label) + '</span>' +
        '</span>' +
        '<span class="grill-state is-' + st + '"><span class="grill-state-mark" aria-hidden="true"></span>' + stLabel +
        (node.round ? ' · R' + escapeHtml(node.round) : '') + '</span>' +
        '</button>' +
        (node.children && node.children.length ? renderTreeNodes(node.children) : '') +
        '</li>';
    }).join('') + '</ul>';
  }

  function renderHistoryList() {
    if (!state.history || !state.history.length) {
      return '<p class="metrics">Todavía no hay rondas cerradas.</p>';
    }
    return '<ul class="grill-history-list">' + state.history.map(function (round) {
      return '<li class="grill-history-round">' +
        '<h3>Ronda ' + escapeHtml(round.round) + (round.title ? ' · ' + escapeHtml(round.title) : '') + '</h3>' +
        '<ul class="grill-history-items">' + (round.questions || []).map(function (q) {
          var sel = selectedNodeId === q.id ? ' is-selected' : '';
          return '<li><button type="button" class="grill-node is-settled' + sel + '" data-node-id="' + escapeHtml(q.id) + '">' +
            '<span class="grill-node-label">' + escapeHtml(q.id) + ' · ' + escapeHtml(q.title) + '</span>' +
            '</button></li>';
        }).join('') + '</ul></li>';
    }).join('') + '</ul>';
  }

  function renderInspector() {
    if (!selectedNodeId) return '';
    var node = findTreeNode(state.tree || [], selectedNodeId);
    var hist = findHistoryEntry(selectedNodeId);
    if (!node && !hist) return '';
    var title = node ? node.label : (hist.question.id + ' · ' + hist.question.title);
    var targetId = hist ? hist.question.id : node.id;
    var decisionText = (node && node.decision) || (hist && hist.answer ? hist.answer.summary : '');
    var canRevise = (state.phase === 'round' || state.phase === 'summary') && (node ? node.status === 'settled' : !!hist);
    var existingRev = (draft && draft.revisions ? draft.revisions : []).find(function (r) { return r.targetId === targetId; });

    return '<div class="grill-inspector">' +
      '<div class="grill-inspector-head">' +
      '<strong>' + escapeHtml(title) + '</strong>' +
      '<button type="button" class="grill-inspector-close" data-action="close-inspector" aria-label="Cerrar detalle">×</button>' +
      '</div>' +
      '<dl>' +
      (node ? '<dt>Estado</dt><dd>' + (node.status === 'settled' ? 'Resuelta' : node.status === 'frontier' ? 'En frontera' : 'Pendiente') + '</dd>' : '') +
      (decisionText ? '<dt>Decisión</dt><dd>' + escapeHtml(decisionText) + '</dd>' : '') +
      (hist && hist.question.recommendation ? '<dt>Recomendación</dt><dd>' + escapeHtml(hist.question.recommendation) + '</dd>' : '') +
      '</dl>' +
      (canRevise ? (
        '<div class="grill-field">' +
        '<label for="grill-rev-input">Reabrir o cambiar decisión</label>' +
        '<textarea id="grill-rev-input" class="grill-textarea" placeholder="Indica qué quieres cambiar o matizar para que el agente recalcule la frontera…">' + escapeHtml(existingRev ? existingRev.note : '') + '</textarea>' +
        '</div>' +
        '<button type="button" class="grill-choice-btn" data-action="save-revision" data-target-id="' + escapeHtml(targetId) + '" data-target-label="' + escapeHtml(title) + '">' +
        (existingRev ? 'Actualizar revisión' : 'Añadir revisión a esta ronda') +
        '</button>'
      ) : '') +
      '</div>';
  }

  function renderRail() {
    var counts = countTreeStates(state.tree || [], { settled: 0, frontier: 0, pending: 0 });
    var isMobile = window.matchMedia && window.matchMedia('(max-width: 56rem)').matches;
    var railEl = qs('#grill-rail');
    var wasOpen = railEl && qs('.grill-rail-fold', railEl) ? qs('.grill-rail-fold', railEl).open : !isMobile;

    return '<details class="grill-rail-fold"' + (wasOpen ? ' open' : '') + '>' +
      '<summary>' +
      '<span class="grill-rail-title">Árbol e historial (' + counts.settled + ' resueltas)</span>' +
      '<span class="grill-rail-toggle">Mostrar / ocultar</span>' +
      '</summary>' +
      '<div class="grill-rail-tabs" role="tablist">' +
      '<button type="button" role="tab" aria-selected="' + (activeRailTab === 'tree') + '" data-rail-tab="tree">Árbol</button>' +
      '<button type="button" role="tab" aria-selected="' + (activeRailTab === 'history') + '" data-rail-tab="history">Historial</button>' +
      '</div>' +
      (activeRailTab === 'tree'
        ? (state.tree && state.tree.length ? renderTreeNodes(state.tree) : '<p class="metrics">El árbol aparecerá con la primera ronda.</p>')
        : renderHistoryList()) +
      renderInspector() +
      '</details>';
  }

  function renderQuestion(q, readonly) {
    var ans = readonly
      ? ((state.lastSubmission && state.lastSubmission.answers && state.lastSubmission.answers.find(function (a) { return a.id === q.id; })) || { mode: '', selectedOptions: [], note: '' })
      : getAnswer(q.id);
    var status = readonly
      ? { text: 'Enviada', cls: 'is-answered' }
      : questionStatusLabel(q);
    var missingCls = !readonly && pendingMissingIds[q.id] ? ' is-missing' : '';
    var roCls = readonly ? ' is-readonly' : '';
    var inputType = q.multiSelect ? 'checkbox' : 'radio';

    var optionsHtml = '';
    if (q.options && q.options.length) {
      optionsHtml = '<fieldset class="grill-options"' + (readonly ? ' disabled' : '') + '>' +
        '<legend>' + (q.multiSelect ? 'Opciones (puedes marcar varias)' : 'Opciones') + '</legend>' +
        q.options.map(function (opt) {
          var picked = (ans.selectedOptions || []).indexOf(opt.id) !== -1;
          return '<label class="grill-option' + (picked ? ' is-picked' : '') + '">' +
            '<input type="' + inputType + '" name="opt-' + escapeHtml(q.id) + '" value="' + escapeHtml(opt.id) + '" data-q-option="' + escapeHtml(q.id) + '"' + (picked ? ' checked' : '') + (readonly ? ' disabled' : '') + '>' +
            '<span class="grill-option-body">' +
            '<span class="grill-option-head">' +
            '<span class="grill-option-id">' + escapeHtml(opt.id) + '</span>' +
            '<span class="grill-option-label">' + escapeHtml(opt.label) + '</span>' +
            (opt.recommended ? '<span class="grill-option-rec">Recomendada</span>' : '') +
            '</span>' +
            (opt.description ? '<span class="grill-option-desc">' + renderInline(opt.description) + '</span>' : '') +
            '</span>' +
            '</label>';
        }).join('') +
        '</fieldset>';
    }

    return '<article class="grill-question' + missingCls + roCls + '" id="question-' + escapeHtml(q.id) + '">' +
      '<header class="grill-q-head">' +
      '<div class="grill-q-id-wrap">' +
      '<span class="grill-q-id">' + escapeHtml(q.id) + '</span>' +
      (q.branch ? '<span class="grill-q-branch">' + escapeHtml(q.branch) + '</span>' : '') +
      '</div>' +
      '<span class="grill-q-status ' + status.cls + '">' + escapeHtml(status.text) + '</span>' +
      '</header>' +
      '<h3 class="grill-q-title">' + escapeHtml(q.title) + '</h3>' +
      (q.body ? '<div class="grill-md">' + renderMarkdown(q.body) + '</div>' : '') +
      (q.recommendation ? (
        '<div class="grill-rec">' +
        '<span class="grill-rec-label">Recomendación</span>' +
        '<div class="grill-md">' + renderMarkdown(q.recommendation) + '</div>' +
        '</div>'
      ) : '') +
      optionsHtml +
      (!readonly ? (
        '<div class="grill-actions">' +
        (q.recommendation ? (
          '<button type="button" class="grill-choice-btn" data-q-accept="' + escapeHtml(q.id) + '" aria-pressed="' + (ans.mode === 'accept') + '">Sí, aceptar recomendación</button>'
        ) : '') +
        '<button type="button" class="grill-choice-btn is-defer" data-q-defer="' + escapeHtml(q.id) + '" aria-pressed="' + (ans.mode === 'defer') + '">Investigar / posponer</button>' +
        '</div>'
      ) : '') +
      '<div class="grill-field">' +
      '<label for="note-' + escapeHtml(q.id) + '">' + (ans.mode === 'defer' ? 'Qué debe investigar o verificar el agente' : 'Respuesta libre o matiz (opcional si ya elegiste arriba)') + '</label>' +
      '<textarea id="note-' + escapeHtml(q.id) + '" class="grill-textarea" data-q-note="' + escapeHtml(q.id) + '"' + (readonly ? ' readonly' : '') + ' placeholder="Escribe tu respuesta, condiciones o matices…">' + escapeHtml(ans.note || '') + '</textarea>' +
      '</div>' +
      '</article>';
  }

  function renderMain() {
    if (state.phase === 'waiting_first') {
      return '<section class="grill-banner" role="status">' +
        '<span class="grill-banner-title">Sesión iniciada</span>' +
        '<p>' + escapeHtml(state.statusMessage || 'El agente está preparando la primera ronda de preguntas…') + '</p>' +
        '</section>';
    }

    if (state.phase === 'confirmed') {
      return '<section class="grill-banner is-done" role="status">' +
        '<span class="grill-banner-title">Entendimiento compartido confirmado</span>' +
        '<p>La entrevista ha terminado. El agente tiene todas las decisiones listas para actuar y puedes exportar la transcripción completa en Markdown desde la barra superior.</p>' +
        '</section>' +
        (state.summary ? renderSummaryBody(true) : '');
    }

    if (state.phase === 'cancelled') {
      return '<section class="grill-banner is-warn" role="status">' +
        '<span class="grill-banner-title">Sesión cancelada</span>' +
        '<p>Se ha cerrado la entrevista sin confirmar el plan. Puedes consultar el árbol o exportar lo avanzado hasta ahora.</p>' +
        '</section>';
    }

    if (state.phase === 'summary' && state.summary) {
      return renderSummaryBody(false);
    }

    var round = state.currentRound;
    if (!round) {
      return '<section class="grill-banner" role="status">' +
        '<span class="grill-banner-title">En espera</span>' +
        '<p>' + escapeHtml(state.statusMessage || 'El agente está preparando la siguiente ronda…') + '</p>' +
        '</section>';
    }

    var isWaiting = state.phase === 'waiting';
    var questions = round.questions || [];
    var answeredCount = isWaiting ? questions.length : questions.filter(isQuestionAnswered).length;
    var remainingCount = questions.length - answeredCount;
    var hasRecommendedRemaining = !isWaiting && questions.some(function (q) { return q.recommendation && !isQuestionAnswered(q); });

    var html = '';
    if (isWaiting) {
      html += '<section class="grill-banner" role="status">' +
        '<span class="grill-banner-title">Ronda ' + escapeHtml(round.round) + ' enviada</span>' +
        '<p>' + escapeHtml(state.statusMessage || 'El agente está analizando tus respuestas y preparando la siguiente ronda…') + '</p>' +
        '</section>';
    }

    html += '<header class="grill-round-head">' +
      '<div class="grill-round-meta">' +
      '<span class="grill-progress">Ronda ' + escapeHtml(round.round) + ' · ' + answeredCount + ' / ' + questions.length + ' respondidas</span>' +
      '<h2>' + escapeHtml(round.title || ('Ronda ' + round.round)) + '</h2>' +
      '</div>' +
      (!isWaiting ? (
        '<div class="grill-round-controls">' +
        (hasRecommendedRemaining ? (
          '<button type="button" class="grill-choice-btn" data-action="accept-remaining">' +
          (answeredCount === 0 ? 'Aceptar todas las recomendaciones' : 'Aceptar las ' + remainingCount + ' pendientes') +
          '</button>'
        ) : '') +
        '</div>'
      ) : '') +
      '</header>';

    if (round.intro) {
      html += '<div class="grill-md">' + renderMarkdown(round.intro) + '</div>';
    }

    if (!isWaiting && draft.revisions && draft.revisions.length) {
      html += '<section class="grill-revisions">' +
        '<h3>Revisiones propuestas sobre rondas anteriores</h3>' +
        '<ul class="grill-revision-list">' + draft.revisions.map(function (rev, idx) {
          return '<li class="grill-revision-item">' +
            '<div><strong>' + escapeHtml(rev.targetId) + ' · ' + escapeHtml(rev.label) + '</strong><br>' + escapeHtml(rev.note) + '</div>' +
            '<button type="button" class="grill-inspector-close" data-remove-revision="' + idx + '" aria-label="Quitar revisión">×</button>' +
            '</li>';
        }).join('') + '</ul></section>';
    }

    html += '<div class="grill-questions">' + questions.map(function (q) {
      return renderQuestion(q, isWaiting);
    }).join('') + '</div>';

    if (!isWaiting) {
      html += '<section class="grill-submit-bar">' +
        '<div class="grill-field">' +
        '<label for="grill-general-note">Nota general de la ronda (opcional)</label>' +
        '<textarea id="grill-general-note" class="grill-textarea" placeholder="Contexto transversal, restricciones o comentarios que no encajen en una sola pregunta…">' + escapeHtml(draft.generalNote || '') + '</textarea>' +
        '</div>' +
        '<div class="grill-submit-actions">' +
        '<div class="grill-submit-group">' +
        '<button type="button" class="btn" data-action="submit-round">Enviar respuestas</button>' +
        '<button type="button" class="btn btn-quiet" data-action="copy-round">Copiar respuestas (Markdown)</button>' +
        '</div>' +
        '<div class="grill-submit-group">' +
        (confirmCancelOpen ? (
          '<button type="button" class="btn btn-quiet grill-btn-danger" data-action="confirm-cancel">Sí, cancelar sesión</button>' +
          '<button type="button" class="btn btn-quiet" data-action="abort-cancel">Seguir</button>'
        ) : (
          '<button type="button" class="btn btn-quiet" data-action="ask-cancel">Cancelar sesión</button>'
        )) +
        '</div>' +
        '</div>' +
        '</section>';
    }

    return html;
  }

  function renderSummaryBody(readonly) {
    var summary = state.summary;
    var html = '<section class="grill-summary">' +
      '<header class="grill-round-head">' +
      '<div class="grill-round-meta">' +
      '<span class="grill-progress">Frontera vacía · Cierre de entrevista</span>' +
      '<h2>' + escapeHtml(summary.title || 'Entendimiento compartido') + '</h2>' +
      '</div>' +
      '</header>' +
      '<div class="grill-summary-box">' +
      (summary.summary ? '<div class="grill-md">' + renderMarkdown(summary.summary) + '</div>' : '') +
      (summary.decisions && summary.decisions.length ? (
        '<div>' +
        '<p class="eyebrow">Decisiones cerradas</p>' +
        '<ul class="grill-decisions">' + summary.decisions.map(function (d) {
          return '<li>' +
            '<strong>' + (d.id ? escapeHtml(d.id) + ' · ' : '') + escapeHtml(d.title) + '</strong>' +
            '<span>' + renderInline(d.decision) + '</span>' +
            '</li>';
        }).join('') + '</ul></div>'
      ) : '') +
      '</div>';

    if (!readonly) {
      html += '<section class="grill-submit-bar">';
      if (adjustModeOpen) {
        html += '<div class="grill-field">' +
          '<label for="grill-adjust-note">Qué quieres ajustar o reabrir antes de confirmar</label>' +
          '<textarea id="grill-adjust-note" class="grill-textarea" placeholder="Indica los puntos a corregir o ampliar…">' + escapeHtml(adjustComment) + '</textarea>' +
          '</div>';
      }
      html += '<div class="grill-submit-actions">' +
        '<div class="grill-submit-group">' +
        '<button type="button" class="btn" data-action="confirm-summary">Confirmar entendimiento compartido</button>' +
        (adjustModeOpen
          ? '<button type="button" class="btn btn-quiet" data-action="submit-adjust">Enviar ajustes</button>'
          : '<button type="button" class="btn btn-quiet" data-action="open-adjust">Pedir ajustes</button>') +
        '</div>' +
        '<div class="grill-submit-group">' +
        '<button type="button" class="btn btn-quiet" data-action="open-export">Copiar resumen</button>' +
        '</div>' +
        '</div></section>';
    }

    html += '</section>';
    return html;
  }

  function renderHeader() {
    var counts = countTreeStates(state.tree || [], { settled: 0, frontier: 0, pending: 0 });
    var roundNumber = state.currentRound ? state.currentRound.round : (state.history ? state.history.length : 0);
    qs('#grill-title').textContent = state.title || 'Sesión grill-me';
    var contextEl = qs('#grill-context');
    if (state.context) {
      contextEl.textContent = state.context;
      contextEl.hidden = false;
    } else {
      contextEl.hidden = true;
    }
    qs('#grill-stats').innerHTML =
      '<div><dt>Ronda</dt><dd>' + escapeHtml(roundNumber || '—') + '</dd></div>' +
      '<div><dt>Resueltas</dt><dd>' + counts.settled + '</dd></div>' +
      '<div><dt>En frontera</dt><dd>' + counts.frontier + '</dd></div>' +
      '<div><dt>Pendientes</dt><dd>' + counts.pending + '</dd></div>';

    var conn = qs('#grill-conn');
    if (isDemo) {
      conn.textContent = 'Demo local';
      conn.className = 'grill-conn is-demo';
    } else if (state.phase === 'confirmed' || state.phase === 'cancelled') {
      conn.textContent = 'Cerrada';
      conn.className = 'grill-conn';
    } else {
      conn.textContent = 'Conectada';
      conn.className = 'grill-conn is-live';
    }
  }

  function renderAll() {
    if (!state) return;
    renderHeader();
    qs('#grill-rail').innerHTML = renderRail();
    qs('#grill-main').innerHTML = renderMain();
    updateTabTitle();
  }

  function updateTabTitle() {
    var title = (state && state.title) ? state.title + ' · grill-me' : 'grill-me · Delphos';
    baseTitle = title;
    if (unseenUpdate && document.hidden) {
      var prefix = state && state.phase === 'summary' ? '(Confirmación) ' : '(Nueva ronda) ';
      document.title = prefix + baseTitle;
    } else {
      document.title = baseTitle;
    }
  }

  function applyState(nextState) {
    var prevPhase = state ? state.phase : null;
    var prevRound = state && state.currentRound ? state.currentRound.round : null;
    state = nextState;

    if (state.palette) {
      document.documentElement.setAttribute('data-palette', state.palette);
    }

    if (state.currentRound) {
      if (!draft || draft.round !== state.currentRound.round) {
        draft = loadDraft(state.sessionId, state.currentRound.round);
        pendingMissingIds = {};
        confirmCancelOpen = false;
      }
    }

    var nextRound = state.currentRound ? state.currentRound.round : null;
    var arrivedNewRound = (prevRound !== null && nextRound !== null && nextRound !== prevRound) ||
      (prevPhase === 'waiting' && (state.phase === 'round' || state.phase === 'summary')) ||
      (prevPhase === 'waiting_first' && state.phase === 'round');

    if (arrivedNewRound) {
      if (document.hidden) unseenUpdate = true;
      adjustModeOpen = false;
      adjustComment = '';
    }

    renderAll();

    if (arrivedNewRound) {
      var firstQ = qs('.grill-question') || qs('.grill-summary');
      if (firstQ) firstQ.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleOptionChange(qId, optId, checked) {
    var q = (state.currentRound.questions || []).find(function (item) { return item.id === qId; });
    if (!q) return;
    var ans = getAnswer(qId);
    if (q.multiSelect) {
      var idx = ans.selectedOptions.indexOf(optId);
      if (checked && idx === -1) ans.selectedOptions.push(optId);
      if (!checked && idx !== -1) ans.selectedOptions.splice(idx, 1);
    } else {
      ans.selectedOptions = checked ? [optId] : [];
    }
    if (ans.selectedOptions.length > 0) {
      var recOpt = (q.options || []).find(function (o) { return o.recommended; });
      if (recOpt && ans.selectedOptions.length === 1 && ans.selectedOptions[0] === recOpt.id) {
        ans.mode = 'accept';
      } else {
        ans.mode = 'option';
      }
    } else if (ans.mode === 'option') {
      ans.mode = '';
    }
    delete pendingMissingIds[qId];
    saveDraft();
    renderAll();
  }

  function handleAccept(qId) {
    var q = (state.currentRound.questions || []).find(function (item) { return item.id === qId; });
    if (!q) return;
    var ans = getAnswer(qId);
    if (ans.mode === 'accept') {
      ans.mode = '';
      var recOpt = (q.options || []).find(function (o) { return o.recommended; });
      if (recOpt && ans.selectedOptions.length === 1 && ans.selectedOptions[0] === recOpt.id) {
        ans.selectedOptions = [];
      }
    } else {
      ans.mode = 'accept';
      var recommended = (q.options || []).filter(function (o) { return o.recommended; }).map(function (o) { return o.id; });
      if (recommended.length) ans.selectedOptions = recommended;
      else ans.selectedOptions = [];
    }
    delete pendingMissingIds[qId];
    saveDraft();
    renderAll();
  }

  function handleDefer(qId) {
    var ans = getAnswer(qId);
    if (ans.mode === 'defer') {
      ans.mode = '';
    } else {
      ans.mode = 'defer';
      ans.selectedOptions = [];
    }
    delete pendingMissingIds[qId];
    saveDraft();
    renderAll();
  }

  function handleAcceptRemaining() {
    var questions = state.currentRound ? (state.currentRound.questions || []) : [];
    questions.forEach(function (q) {
      if (!isQuestionAnswered(q) && q.recommendation) {
        var ans = getAnswer(q.id);
        ans.mode = 'accept';
        var recommended = (q.options || []).filter(function (o) { return o.recommended; }).map(function (o) { return o.id; });
        if (recommended.length) ans.selectedOptions = recommended;
        delete pendingMissingIds[q.id];
      }
    });
    saveDraft();
    renderAll();
    showToast('Recomendaciones pendientes aceptadas');
  }

  function handleSubmitRound() {
    var round = state.currentRound;
    if (!round) return;
    var missing = (round.questions || []).filter(function (q) { return !isQuestionAnswered(q); });
    pendingMissingIds = {};
    if (missing.length > 0) {
      missing.forEach(function (q) { pendingMissingIds[q.id] = true; });
      renderAll();
      var first = qs('#question-' + CSS.escape(missing[0].id));
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Faltan ' + missing.length + ' pregunta(s) por responder');
      return;
    }

    var payload = buildRoundPayload();
    if (isDemo) {
      state.history = state.history || [];
      state.history.push({
        round: round.round,
        title: round.title,
        questions: round.questions,
        submission: payload
      });
      state.lastSubmission = payload;
      state.phase = 'summary';
      state.summary = state.demoSummary || {
        title: 'Entendimiento compartido (demo)',
        summary: 'En modo demo, al enviar la ronda pasas directamente a la pantalla de confirmación final para inspeccionar todo el flujo.',
        decisions: payload.answers.map(function (a) {
          return { id: a.id, title: a.title, decision: a.summary };
        })
      };
      clearDraft(state.sessionId, round.round);
      renderAll();
      showToast('Ronda enviada (modo demo)');
      return;
    }

    apiPost('/api/submit', payload).then(function (next) {
      clearDraft(state.sessionId, round.round);
      applyState(next);
      showToast('Respuestas enviadas al agente');
    }).catch(function () {
      showToast('Sin conexión con el servidor: usa «Copiar respuestas»');
    });
  }

  function openExportDialog() {
    var dialog = qs('#grill-export-dialog');
    var pre = qs('#grill-export-content');
    if (!dialog || !pre) return;
    pre.textContent = formatSessionMarkdown();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeExportDialog() {
    var dialog = qs('#grill-export-dialog');
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function bindEvents() {
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && unseenUpdate) {
        unseenUpdate = false;
        updateTabTitle();
      }
    });

    document.addEventListener('click', function (event) {
      var target = event.target.closest('button');
      if (!target) return;

      if (target.id === 'grill-theme-btn') {
        toggleTheme();
        return;
      }

      if (target.id === 'grill-export-btn' || target.dataset.action === 'open-export') {
        openExportDialog();
        return;
      }

      if (target.dataset.action === 'close-export') {
        closeExportDialog();
        return;
      }

      if (target.dataset.action === 'copy-export') {
        copyText(formatSessionMarkdown(), 'Transcripción copiada en Markdown');
        return;
      }

      if (target.dataset.action === 'download-export') {
        var slug = String((state && state.title) || 'grill-me').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'grill-me';
        downloadMarkdown(slug + '.md', formatSessionMarkdown());
        showToast('Archivo Markdown descargado');
        return;
      }

      if (target.dataset.railTab) {
        activeRailTab = target.dataset.railTab;
        renderAll();
        return;
      }

      if (target.dataset.nodeId) {
        selectedNodeId = selectedNodeId === target.dataset.nodeId ? null : target.dataset.nodeId;
        renderAll();
        return;
      }

      if (target.dataset.action === 'close-inspector') {
        selectedNodeId = null;
        renderAll();
        return;
      }

      if (target.dataset.action === 'save-revision') {
        var revInput = qs('#grill-rev-input');
        var note = revInput ? revInput.value.trim() : '';
        if (!note) {
          showToast('Escribe el cambio antes de guardar la revisión');
          return;
        }
        var targetId = target.dataset.targetId;
        var label = target.dataset.targetLabel;
        draft.revisions = (draft.revisions || []).filter(function (r) { return r.targetId !== targetId; });
        draft.revisions.push({ targetId: targetId, label: label, note: note });
        saveDraft();
        selectedNodeId = null;
        renderAll();
        showToast('Revisión añadida a la ronda actual');
        return;
      }

      if (target.dataset.removeRevision !== undefined) {
        draft.revisions.splice(Number(target.dataset.removeRevision), 1);
        saveDraft();
        renderAll();
        return;
      }

      if (target.dataset.qAccept) {
        handleAccept(target.dataset.qAccept);
        return;
      }

      if (target.dataset.qDefer) {
        handleDefer(target.dataset.qDefer);
        return;
      }

      if (target.dataset.action === 'accept-remaining') {
        handleAcceptRemaining();
        return;
      }

      if (target.dataset.action === 'submit-round') {
        handleSubmitRound();
        return;
      }

      if (target.dataset.action === 'copy-round') {
        copyText(formatRoundMarkdown(buildRoundPayload()), 'Respuestas copiadas en Markdown');
        return;
      }

      if (target.dataset.action === 'ask-cancel') {
        confirmCancelOpen = true;
        renderAll();
        return;
      }

      if (target.dataset.action === 'abort-cancel') {
        confirmCancelOpen = false;
        renderAll();
        return;
      }

      if (target.dataset.action === 'confirm-cancel') {
        if (isDemo) {
          state.phase = 'cancelled';
          renderAll();
          return;
        }
        apiPost('/api/cancel', {}).then(function (next) {
          applyState(next);
          showToast('Sesión cancelada');
        }).catch(function () {
          showToast('No se pudo avisar al servidor');
        });
        return;
      }

      if (target.dataset.action === 'confirm-summary') {
        if (isDemo) {
          state.phase = 'confirmed';
          renderAll();
          showToast('Entendimiento compartido confirmado (demo)');
          return;
        }
        apiPost('/api/confirm', { confirmed: true }).then(function (next) {
          applyState(next);
          showToast('Entendimiento compartido confirmado');
        }).catch(function () {
          showToast('No se pudo conectar con el servidor');
        });
        return;
      }

      if (target.dataset.action === 'open-adjust') {
        adjustModeOpen = true;
        renderAll();
        var box = qs('#grill-adjust-note');
        if (box) box.focus();
        return;
      }

      if (target.dataset.action === 'submit-adjust') {
        if (!adjustComment.trim() && !(draft && draft.revisions && draft.revisions.length)) {
          showToast('Indica qué ajustes necesitas');
          return;
        }
        var payload = {
          confirmed: false,
          comment: adjustComment.trim(),
          revisions: draft && draft.revisions ? draft.revisions.slice() : []
        };
        if (isDemo) {
          showToast('Solicitud de ajustes registrada (demo)');
          return;
        }
        apiPost('/api/confirm', payload).then(function (next) {
          adjustModeOpen = false;
          adjustComment = '';
          applyState(next);
          showToast('Ajustes enviados al agente');
        }).catch(function () {
          showToast('No se pudo conectar con el servidor');
        });
      }
    });

    document.addEventListener('change', function (event) {
      var input = event.target;
      if (input && input.dataset && input.dataset.qOption) {
        handleOptionChange(input.dataset.qOption, input.value, input.checked);
      }
    });

    document.addEventListener('input', function (event) {
      var el = event.target;
      if (!el) return;
      if (el.dataset && el.dataset.qNote) {
        var qId = el.dataset.qNote;
        var ans = getAnswer(qId);
        ans.note = el.value;
        if (!ans.mode && el.value.trim()) delete pendingMissingIds[qId];
        saveDraft();
        var card = qs('#question-' + CSS.escape(qId));
        var badge = card ? qs('.grill-q-status', card) : null;
        var q = state && state.currentRound ? (state.currentRound.questions || []).find(function (item) { return item.id === qId; }) : null;
        if (badge && q) {
          var st = questionStatusLabel(q);
          badge.textContent = st.text;
          badge.className = 'grill-q-status ' + st.cls;
        }
        return;
      }
      if (el.id === 'grill-general-note' && draft) {
        draft.generalNote = el.value;
        saveDraft();
        return;
      }
      if (el.id === 'grill-adjust-note') {
        adjustComment = el.value;
      }
    });
  }

  function fetchLiveState() {
    return fetch('/api/state?token=' + encodeURIComponent(token))
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (next) {
        applyState(next);
      })
      .catch(function () {
        var conn = qs('#grill-conn');
        if (conn) {
          conn.textContent = 'Sin conexión';
          conn.className = 'grill-conn';
        }
      });
  }

  function connectLive() {
    if (isDemo) return;
    if (typeof EventSource !== 'undefined') {
      eventSource = new EventSource('/events?token=' + encodeURIComponent(token));
      eventSource.addEventListener('state', function (ev) {
        try {
          applyState(JSON.parse(ev.data));
        } catch (_) {}
      });
      eventSource.onerror = function () {
        var conn = qs('#grill-conn');
        if (conn && state && state.phase !== 'confirmed' && state.phase !== 'cancelled') {
          conn.textContent = 'Reconectando';
          conn.className = 'grill-conn';
        }
      };
    }
    pollTimer = setInterval(function () {
      if (state && (state.phase === 'waiting' || state.phase === 'waiting_first')) {
        fetchLiveState();
      }
    }, 4000);
  }

  function init() {
    initTheme();
    bindEvents();
    if (window.__GRILL_BOOTSTRAP__) {
      applyState(window.__GRILL_BOOTSTRAP__);
    } else {
      fetchLiveState();
    }
    connectLive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
